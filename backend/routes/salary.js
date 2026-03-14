const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { groqJSON } = require('../services/groq/client');
const { callMLService } = require('../services/mlService');

// Map experience from parsed resume to ML model encoding
function inferExperienceLevel(parsed) {
  const exp = parsed?.experience || [];
  let totalYears = parsed?.total_experience_months ? parsed.total_experience_months / 12 : 0;
  if (!totalYears) {
    for (const e of exp) {
      if (e.duration) {
        const match = e.duration.match(/(\d+)/);
        if (match) totalYears += parseInt(match[1]);
      }
    }
  }
  if (totalYears >= 10) return 'EX';
  if (totalYears >= 5) return 'SE';
  if (totalYears >= 2) return 'MI';
  return 'EN';
}

const EMPLOYMENT_MAP = { 'Full-time': 'FT', 'Contract': 'CT', 'Part-time': 'PT', 'Remote': 'FT', 'Freelance': 'FL' };
const COUNTRY_ISO_MAP = {
  'India': 'IN', 'United States': 'US', 'United Kingdom': 'GB',
  'Germany': 'DE', 'Canada': 'CA', 'Australia': 'AU', 'Singapore': 'SG',
};

// POST /api/salary/predict
router.post('/predict', authenticate, async (req, res) => {
  try {
    const { targetRole, industry, country, employmentType } = req.body || {};
    const userId = req.user.id;

    if (!targetRole || !industry) {
      return res.status(400).json({ error: 'targetRole and industry are required' });
    }

    // Fetch candidate parsed profile
    const { data: candidateProfile, error: profileError } = await supabase
      .from('candidate_profiles')
      .select('parsed_data')
      .eq('user_id', userId)
      .single();

    if (profileError || !candidateProfile?.parsed_data) {
      return res.status(400).json({ error: 'Profile not found. Please upload your resume first.' });
    }

    const parsed = candidateProfile.parsed_data;

    // Optional GitHub portfolio context
    const { data: ghData } = await supabase
      .from('github_analyses')
      .select('analysis')
      .eq('user_id', userId)
      .maybeSingle?.()
      // fallback for older supabase-js versions
      || { data: null };

    const githubAnalysis = ghData?.analysis || null;

    const systemPrompt = 'You are a compensation expert with deep knowledge of global tech hiring markets.';

    const userContent = `
CANDIDATE PROFILE (from parsed resume/LinkedIn JSON):
${JSON.stringify(parsed, null, 2)}

GITHUB PORTFOLIO (if available):
Portfolio Score: ${githubAnalysis?.portfolioScore ?? 'N/A'}/100
Top Projects: ${(githubAnalysis?.repositories || [])
  .slice(0, 2)
  .map((r) => r.name)
  .join(', ') || 'None'}

TARGET:
- Role: ${targetRole}
- Industry: ${industry}
- Country/Region: ${country || 'Not specified'}
- Employment Type: ${employmentType || 'Not specified'}

Respond ONLY with a JSON object (no markdown, no backticks) in this exact structure:
{
  "salaryRange": {
    "min": 800000,
    "max": 1400000,
    "currency": "INR",
    "period": "annual"
  },
  "confidenceScore": 82,
  "experienceBands": [
    { "band": "Fresher (0-2 yrs)", "min": 500000, "max": 800000 },
    { "band": "Mid (2-5 yrs)", "min": 900000, "max": 1400000 },
    { "band": "Senior (5+ yrs)", "min": 1500000, "max": 2500000 }
  ],
  "skillPremiums": [
    { "skill": "Kubernetes", "premiumPercent": 15 },
    { "skill": "System Design", "premiumPercent": 20 }
  ],
  "cityComparisons": [
    { "city": "Bangalore", "avgSalary": 1200000 },
    { "city": "Mumbai", "avgSalary": 1100000 }
  ],
  "actionableTip": "Adding a cloud certification (AWS/GCP) could raise your salary floor by approximately 12-18%.",
  "marketDemand": "High",
  "candidatePosition": "Mid range for your experience level"
}
`;

    // Run ML model and Groq AI in parallel
    const [mlResult, aiResult] = await Promise.allSettled([
      callMLService('/predict/salary', {
        experience_level: inferExperienceLevel(parsed),
        employment_type: EMPLOYMENT_MAP[employmentType] || 'FT',
        job_title: targetRole,
        company_location: COUNTRY_ISO_MAP[country] || country || 'US',
        company_size: 'M',
      }),
      groqJSON(systemPrompt, userContent),
    ]);

    const modelPrediction = mlResult.status === 'fulfilled' ? mlResult.value : null;
    const prediction = aiResult.status === 'fulfilled' ? aiResult.value : null;

    if (!prediction && !modelPrediction) {
      throw new Error('Both AI and ML model failed');
    }

    // Persist prediction history
    await supabase.from('salary_predictions').insert({
      user_id: userId,
      target_role: targetRole,
      industry,
      country,
      employment_type: employmentType,
      prediction,
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, prediction, modelPrediction });
  } catch (err) {
    console.error('Salary predict error:', err);
    res.status(500).json({ error: 'Failed to predict salary' });
  }
});

// GET /api/salary/history — last 10 predictions for the user
router.get('/history', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('salary_predictions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ predictions: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load salary history' });
  }
});

module.exports = router;

