const { groqJSON } = require('./client');

async function matchCandidateToJob(candidateProfile, jobParsed) {
  // Extract skills handling both string[] and {name: string}[] formats
  const candidateSkills = (candidateProfile.skills || []).map(s => s.name || s).filter(Boolean);
  const projectTech = (candidateProfile.projects || []).flatMap(p => p.tech || p.technologies || []).map(t => t.name || t).filter(Boolean);
  const requiredSkills = (jobParsed.required_skills || []).map(s => s.name || s).filter(Boolean);
  const niceToHave = (jobParsed.nice_to_have || []).map(s => s.name || s).filter(Boolean);

  // Guard: if both sides are empty, return a sensible default
  if (candidateSkills.length === 0 && requiredSkills.length === 0) {
    return {
      match_score: 0,
      matched_skills: [],
      missing_skills: [],
      partial_matches: [],
      experience_fit: 'unknown',
      explanation: 'Insufficient data to calculate match. Please complete your profile and ensure the job has requirements listed.',
      verdict: 'Incomplete Data',
      strengths: [],
      gaps: []
    };
  }

  return groqJSON(
    `You are a precise recruitment matching engine.
    Compare candidate skills vs job requirements carefully.
    Partial matches (React vs Vue) are noted but not counted as full matches.
    Consider experience level, not just skill presence.`,

    `CANDIDATE:
- Skills: ${JSON.stringify(candidateSkills)}
- Experience: ${candidateProfile.total_experience_months || 0} months
- Seniority: ${candidateProfile.seniority_level || 'unknown'}
- Projects tech stack: ${projectTech.join(', ') || 'none'}

JOB:
- Title: ${jobParsed.title || 'Unknown'}
- Required: ${JSON.stringify(requiredSkills)}
- Nice to have: ${JSON.stringify(niceToHave)}
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
