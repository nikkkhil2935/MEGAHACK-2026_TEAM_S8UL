const { groqJSON } = require('../groq/client');

async function parseLinkedInData(rawData) {
  return groqJSON(
    `You are a professional LinkedIn profile parser.
    Take raw scraped LinkedIn data and structure it into a clean profile.
    Normalize skill names (React.js→React, k8s→Kubernetes).
    Categorize skills: Frontend|Backend|DevOps|Database|AI/ML|Mobile|Tools|Soft.
    Calculate total experience in months.
    Return ONLY valid JSON.`,

    `Raw LinkedIn data:\n${JSON.stringify(rawData)}\n\n
Return JSON schema:
{
  name, headline, location, summary,
  skills: [{name, category, inferred_level:"beginner"|"intermediate"|"expert"}],
  experience: [{company, role, start_date, end_date, duration_months, description}],
  education: [{institution, degree, field, year}],
  certifications: [{name, issuer, year}],
  total_experience_months: number,
  seniority_level: "fresher"|"junior"|"mid"|"senior"|"lead",
  estimated_current_salary_range: {min, max, currency},
  profile_strength: "weak"|"moderate"|"strong"
}`
  );
}

module.exports = { parseLinkedInData };
