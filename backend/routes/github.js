const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { groqJSON } = require('../services/groq/client');
const { callMLService } = require('../services/mlService');

const GH_API = 'https://api.github.com';

// Helper: fetch from GitHub
async function ghFetch(path) {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'CareerBridgeAI',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(`${GH_API}${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

// Helper: decode base64 README
function decodeReadme(data) {
  if (!data?.content) return 'No README found';
  return Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 2000);
}

// POST /api/github/analyze
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { githubUsername } = req.body || {};
    if (!githubUsername) {
      return res.status(400).json({ error: 'GitHub username is required' });
    }

    // 1. Fetch user info + candidate's claimed skills
    const userInfo = await ghFetch(`/users/${githubUsername}`);

    const { data: profileData } = await supabase
      .from('candidate_profiles')
      .select('parsed_data')
      .eq('user_id', req.user.id)
      .maybeSingle();

    const claimedSkills = (profileData?.parsed_data?.skills || [])
      .map(s => s.name || s)
      .filter(Boolean);

    // 2. Fetch top repos (sorted by stars + recency)
    const allRepos = await ghFetch(
      `/users/${githubUsername}/repos?sort=updated&per_page=30&type=owner`
    );
    const publicRepos = allRepos.filter((r) => !r.private && !r.fork);

    const now = Date.now();
    const scored = publicRepos
      .map((r) => ({
        ...r,
        score:
          r.stargazers_count * 3 +
          r.forks_count * 2 +
          (now - new Date(r.updated_at).getTime() < 90 * 86400000 ? 10 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // 3. Fetch README + languages for each top repo
    const repoDetails = await Promise.all(
      scored.map(async (repo) => {
        let readme = 'No README';
        let languages = {};
        try {
          const [readmeData, langData] = await Promise.all([
            ghFetch(`/repos/${githubUsername}/${repo.name}/readme`).catch(
              () => null
            ),
            ghFetch(`/repos/${githubUsername}/${repo.name}/languages`).catch(
              () => ({})
            ),
          ]);
          readme = decodeReadme(readmeData);
          languages = langData;
        } catch {
          // ignore per-repo errors
        }

        return {
          name: repo.name,
          description: repo.description || 'No description',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          languages,
          topics: repo.topics || [],
          lastUpdated: repo.updated_at,
          readme: readme.slice(0, 1500),
          url: repo.html_url,
          openIssues: repo.open_issues_count,
          size: repo.size,
        };
      })
    );

    // 4. Aggregate features for ML model
    const totalStars = repoDetails.reduce((s, r) => s + (r.stars || 0), 0);
    const totalForks = repoDetails.reduce((s, r) => s + (r.forks || 0), 0);
    const totalIssues = repoDetails.reduce((s, r) => s + (r.openIssues || 0), 0);
    const avgReadmeLen = Math.round(
      repoDetails.reduce((s, r) => s + (r.readme?.length || 0), 0) / (repoDetails.length || 1)
    );

    // Estimate commit count from top repos
    let totalCommits = 0;
    await Promise.all(
      scored.slice(0, 6).map(async (repo) => {
        try {
          const commits = await ghFetch(
            `/repos/${githubUsername}/${repo.name}/commits?per_page=100`
          );
          totalCommits += Array.isArray(commits) ? commits.length : 0;
        } catch { /* ignore */ }
      })
    );

    // 5. AI analysis via Groq + ML model in parallel
    const systemPrompt =
      'You are a senior software engineer and open source contributor reviewing a developer\'s GitHub portfolio. You also verify claimed skills against actual code evidence.';

    const userContent = `
GITHUB USER: ${githubUsername}
Public Repos: ${userInfo.public_repos}
Followers: ${userInfo.followers}
Bio: ${userInfo.bio || 'Not set'}

TOP ${repoDetails.length} REPOSITORIES:
${JSON.stringify(repoDetails, null, 2)}

CANDIDATE'S CLAIMED SKILLS (from their resume/profile):
${claimedSkills.length > 0 ? claimedSkills.join(', ') : 'No skills listed yet'}

Analyze this portfolio as if you are preparing feedback for a Google interview panel.
Also verify each claimed skill against the repositories — check languages, topics, READMEs, and descriptions for evidence.

Respond ONLY with a JSON object (no markdown, no backticks) like:
{
  "portfolioScore": 72,
  "profileCompleteness": 65,
  "totalPublicRepos": ${userInfo.public_repos},
  "languageDiversity": ["JavaScript", "Python", "Go"],
  "repositories": [
    {
      "name": "repo-name",
      "url": "https://github.com/...",
      "score": 78,
      "highlights": ["Well-documented README"],
      "weaknesses": ["No tests mentioned"],
      "complexity": "Intermediate",
      "resumeWorthy": true,
      "improvedDescription": "Improved description for resume"
    }
  ],
  "bestRepoToHighlight": "repo-name",
  "bestRepoReason": "Reason...",
  "portfolioGaps": ["No ML project"],
  "topRecommendations": ["Pin your top repos"],
  "extractedProjects": [
    {
      "name": "Project Name",
      "description": "Improved description for resume",
      "techStack": ["React", "Node.js"],
      "url": "https://github.com/..."
    }
  ],
  "verifiedSkills": [
    {
      "skill": "React",
      "verified": true,
      "evidence": "Used as primary framework in 3 repos including project-x, with component architecture and hooks",
      "repos": ["repo1", "repo2"],
      "proficiencyLevel": "advanced"
    },
    {
      "skill": "Python",
      "verified": false,
      "evidence": "Not demonstrated in any analyzed repository",
      "repos": [],
      "proficiencyLevel": "unknown"
    }
  ]
}

IMPORTANT for verifiedSkills:
- Check EVERY claimed skill: ${claimedSkills.join(', ')}
- verified: true only if there is clear evidence in repo languages, topics, README, or description
- proficiencyLevel: "beginner", "intermediate", "advanced", or "expert" based on complexity and usage
- Also include any skills found in repos that are NOT in the claimed list with verified: true
`;

    // Run ML model and Groq AI in parallel
    const [mlResult, aiResult] = await Promise.allSettled([
      callMLService('/predict/github', {
        stars: totalStars,
        forks: totalForks,
        commits: totalCommits,
        issues: totalIssues,
        readme_length: avgReadmeLen,
      }),
      groqJSON(systemPrompt, userContent),
    ]);

    const modelPrediction = mlResult.status === 'fulfilled' ? mlResult.value : null;
    const analysis = aiResult.status === 'fulfilled' ? aiResult.value : null;

    if (!analysis && !modelPrediction) {
      throw new Error('Both AI and ML model failed');
    }

    await supabase
      .from('github_analyses')
      .upsert(
        {
          user_id: req.user.id,
          github_username: githubUsername,
          analysis: analysis || {},
          analyzed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    res.json({ success: true, analysis, modelPrediction, githubUsername });
  } catch (err) {
    console.error('GitHub analyze error:', err);
    if (err.message?.includes('404')) {
      return res.status(404).json({ error: 'GitHub user not found' });
    }
    if (err.message?.includes('403')) {
      return res
        .status(429)
        .json({ error: 'GitHub API rate limit reached. Try again later.' });
    }
    res.status(500).json({ error: 'Failed to analyze GitHub profile' });
  }
});

// POST /api/github/merge-projects — merge GitHub projects into profile
router.post('/merge-projects', authenticate, async (req, res) => {
  try {
    const { data: ghData } = await supabase
      .from('github_analyses')
      .select('analysis')
      .eq('user_id', req.user.id)
      .single();

    if (!ghData) {
      return res.status(400).json({ error: 'No GitHub analysis found' });
    }

    const newProjects = ghData.analysis.extractedProjects || [];

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('parsed_data')
      .eq('user_id', req.user.id)
      .single();

    const existingParsed = profile?.parsed_data || {};
    const existingProjects = existingParsed.projects || [];

    const mergedProjects = [...existingProjects, ...newProjects].filter(
      (p, i, arr) => arr.findIndex((x) => x.name === p.name) === i
    );

    await supabase
      .from('candidate_profiles')
      .update({
        parsed_data: { ...existingParsed, projects: mergedProjects },
        updated_at: new Date(),
      })
      .eq('user_id', req.user.id);

    res.json({ success: true, totalProjects: mergedProjects.length });
  } catch (err) {
    console.error('GitHub merge error:', err);
    res.status(500).json({ error: 'Failed to merge projects' });
  }
});

// GET /api/github/latest
router.get('/latest', authenticate, async (req, res) => {
  try {
    const { data } = await supabase
      .from('github_analyses')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    res.json({
      analysis: data?.analysis || null,
      githubUsername: data?.github_username || null,
      analyzedAt: data?.analyzed_at || null,
    });
  } catch {
    res.json({ analysis: null, githubUsername: null, analyzedAt: null });
  }
});

// GET /api/github/verified-skills
router.get('/verified-skills', authenticate, async (req, res) => {
  try {
    const { data } = await supabase
      .from('github_analyses')
      .select('analysis')
      .eq('user_id', req.user.id)
      .single();

    res.json({ verifiedSkills: data?.analysis?.verifiedSkills || [] });
  } catch {
    res.json({ verifiedSkills: [] });
  }
});

module.exports = router;

