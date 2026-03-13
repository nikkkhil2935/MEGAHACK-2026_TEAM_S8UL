const { groqJSON } = require('./client');

async function matchCandidateToJob(candidateProfile, jobParsed) {
  return groqJSON(
    `You are a precise recruitment matching engine.
    Compare candidate skills vs job requirements carefully.
    Partial matches (React vs Vue) are noted but not counted as full matches.
    Consider experience level, not just skill presence.`,

    `CANDIDATE:
- Skills: ${JSON.stringify(candidateProfile.skills?.map(s => s.name) || [])}
- Experience: ${candidateProfile.total_experience_months || 0} months
- Seniority: ${candidateProfile.seniority_level || 'unknown'}
- Projects tech stack: ${candidateProfile.projects?.flatMap(p => p.tech || []).join(', ') || 'none'}

JOB:
- Title: ${jobParsed.title || 'Unknown'}
- Required: ${JSON.stringify(jobParsed.required_skills?.map(s => s.name || s) || [])}
- Nice to have: ${JSON.stringify(jobParsed.nice_to_have?.map(s => s.name || s) || [])}
- Min experience: ${jobParsed.experience_years?.min || 0} years

Return JSON:
{
  match_score: 0-100,
  matched_skills: ["skill1", "skill2"],
  missing_skills: [{ name: "skill", priority: "critical"|"important"|"optional" }],
  partial_matches: [{ candidate_skill: "x", job_skill: "y", similarity: 0-100 }],
  experience_fit: "over"|"under"|"match",
  explanation: "2 honest sentences",
  verdict: "Strong Fit"|"Good Fit"|"Moderate Fit"|"Weak Fit",
  strengths: [],
  gaps: []
}`
  );
}

module.exports = { matchCandidateToJob };
