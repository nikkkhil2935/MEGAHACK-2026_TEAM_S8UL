const { groqJSON } = require('./client');
const { PDFParse } = require('pdf-parse');

const PARSE_SYSTEM = `You are an expert resume parser and career analyst.
Extract ALL information from the resume text.
Normalize skill names: React.js→React, JS→JavaScript, k8s→Kubernetes, ML→Machine Learning.
Categorize skills: Frontend|Backend|DevOps|Database|AI/ML|Mobile|Tools|Soft Skills.
Estimate seniority from experience duration and responsibilities.
Calculate total_experience_months from all roles.
Return ONLY valid JSON — no extra text.`;

async function extractText(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    const uint8 = new Uint8Array(buffer);
    const parser = new PDFParse(uint8);
    const result = await parser.getText();
    return result.text || '';
  }
  return buffer.toString('utf-8');
}

async function parseResume(buffer, mimetype) {
  const rawText = await extractText(buffer, mimetype);

  const parsed = await groqJSON(PARSE_SYSTEM, `Parse this resume:\n\n${rawText}\n\nReturn JSON schema:
{
  name, email, phone, linkedin, github, website, location, summary,
  skills: [{name, category, level:"beginner"|"intermediate"|"expert"}],
  experience: [{company, role, start, end, duration_months, bullets:[], tech_used:[]}],
  education: [{degree, institution, year, grade}],
  projects: [{name, tech:[], description, url, github_url}],
  certifications: [{name, issuer, year}],
  total_experience_months: number,
  seniority_level: "fresher"|"junior"|"mid"|"senior"|"lead",
  languages_spoken: []
}`);

  const checks = [
    parsed.name, parsed.email, parsed.phone, parsed.summary,
    parsed.skills?.length > 3,
    parsed.experience?.length > 0,
    parsed.education?.length > 0,
    parsed.projects?.length > 0,
    parsed.linkedin || parsed.github
  ];
  const completeness = Math.round(checks.filter(Boolean).length / checks.length * 100);

  return { ...parsed, completeness_score: completeness, raw_text: rawText };
}

async function abTestResumes(resumeABuffer, resumeAType, resumeBBuffer, resumeBType, jdText) {
  const [parsedA, parsedB] = await Promise.all([
    parseResume(resumeABuffer, resumeAType),
    parseResume(resumeBBuffer, resumeBType),
  ]);

  const comparison = await groqJSON(
    `You are a senior recruiter comparing two resumes for a specific job.
    Be specific, reference actual content from each resume. Be constructive.`,
    `JOB DESCRIPTION:\n${jdText}\n\nRESUME A:\n${JSON.stringify(parsedA)}\n\nRESUME B:\n${JSON.stringify(parsedB)}

Return JSON:
{
  winner: "A"|"B"|"tie",
  score_a: 0-100, score_b: 0-100,
  a_strengths: [], b_strengths: [],
  a_weaknesses: [], b_weaknesses: [],
  recommendation: "2-3 sentence recommendation",
  key_differences: []
}`
  );

  return { comparison, parsed_a: parsedA, parsed_b: parsedB };
}

module.exports = { parseResume, abTestResumes };
