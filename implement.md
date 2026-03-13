# CareerBridge AI — New Features Implementation Plan

> **Team S8UL | MEGAHACK 2026**
> This document covers the full implementation plan for 4 new features:
> 1. Salary Predictor
> 2. AI Candidate Ranking
> 3. AI Resume Improver
> 4. GitHub Project Analyzer

---

## Table of Contents

- [Feature 1: Salary Predictor](#feature-1-salary-predictor)
- [Feature 2: AI Candidate Ranking](#feature-2-ai-candidate-ranking)
- [Feature 3: AI Resume Improver](#feature-3-ai-resume-improver)
- [Feature 4: GitHub Project Analyzer](#feature-4-github-project-analyzer)
- [Database Schema Additions](#database-schema-additions)
- [Integration Checklist](#integration-checklist)

---

## Feature 1: Salary Predictor

### Overview

The Salary Predictor uses the candidate's parsed profile (skills, experience, education, location) along with a target job role to generate a realistic salary range estimate powered by Groq LLaMA 3.3 70B. It shows a breakdown by experience band, city/country, and skill premium multipliers.

---

### 1.1 User Flow

```
Candidate opens Salary Predictor page
    │
    ├─ Fields auto-filled from parsed profile:
    │     • Skills list
    │     • Years of experience
    │     • Education level
    │     • Current location (user provides)
    │
    ├─ User selects:
    │     • Target Job Role (e.g., "Backend Engineer")
    │     • Industry (e.g., "Fintech", "SaaS", "Healthcare")
    │     • Country / Region
    │     • Employment Type (Full-time / Contract / Remote)
    │
    ├─ Clicks "Predict Salary"
    │
    └─ AI returns:
          • Salary range: ₹X – ₹Y per annum (or USD equivalent)
          • Confidence score
          • Breakdown table: Fresher / Mid / Senior bands
          • Skill premium list (e.g., "Kubernetes adds ~15%")
          • City-wise comparison chart
          • Actionable tip: "Adding Docker certification could raise floor by 12%"
```

---

### 1.2 Backend Implementation

#### New Route File: `backend/routes/salary.js`

```javascript
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { groqJSON } from '../services/groq/client.js';
import { supabase } from '../db/supabase.js';

const router = express.Router();

// POST /api/salary/predict
router.post('/predict', authMiddleware, async (req, res) => {
  try {
    const { targetRole, industry, country, employmentType } = req.body;
    const userId = req.user.id;

    // Fetch candidate's parsed profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, experience, education, projects')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.status(400).json({ error: 'Profile not found. Please upload your resume first.' });
    }

    const prompt = `
You are a compensation expert with deep knowledge of global tech hiring markets.

CANDIDATE PROFILE:
- Skills: ${JSON.stringify(profile.skills)}
- Experience: ${JSON.stringify(profile.experience)}
- Education: ${JSON.stringify(profile.education)}
- Projects: ${JSON.stringify(profile.projects)}

TARGET:
- Role: ${targetRole}
- Industry: ${industry}
- Country/Region: ${country}
- Employment Type: ${employmentType}

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
    { "city": "Mumbai", "avgSalary": 1100000 },
    { "city": "Hyderabad", "avgSalary": 1050000 },
    { "city": "Pune", "avgSalary": 950000 },
    { "city": "Delhi NCR", "avgSalary": 1150000 }
  ],
  "actionableTip": "Adding a cloud certification (AWS/GCP) could raise your salary floor by approximately 12-18%.",
  "marketDemand": "High",
  "candidatePosition": "Mid range for your experience level"
}
`;

    const result = await groqJSON(prompt);

    // Save to DB for history
    await supabase.from('salary_predictions').insert({
      user_id: userId,
      target_role: targetRole,
      industry,
      country,
      employment_type: employmentType,
      prediction: result,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, prediction: result });
  } catch (err) {
    console.error('Salary predict error:', err);
    res.status(500).json({ error: 'Failed to predict salary' });
  }
});

// GET /api/salary/history  — past predictions for the candidate
router.get('/history', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('salary_predictions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ predictions: data });
});

export default router;
```

#### Register route in `backend/server.js`

```javascript
import salaryRoutes from './routes/salary.js';
app.use('/api/salary', salaryRoutes);
```

---

### 1.3 Frontend Implementation

#### New Page: `frontend/src/pages/SalaryPredictor.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Award, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'DevOps Engineer', 'Data Scientist',
  'Machine Learning Engineer', 'Product Manager', 'UI/UX Designer',
  'Cloud Architect', 'Mobile Developer', 'Security Engineer'
];

const INDUSTRIES = ['SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'EdTech', 'Gaming', 'Consulting', 'Startup'];

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Germany', 'Canada', 'Australia', 'Singapore'];

export default function SalaryPredictor() {
  const [form, setForm] = useState({
    targetRole: '',
    industry: '',
    country: 'India',
    employmentType: 'Full-time'
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!form.targetRole || !form.industry) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/salary/predict', form);
      setPrediction(data.prediction);
      toast.success('Salary prediction ready!');
    } catch (err) {
      toast.error('Prediction failed. Make sure your profile is complete.');
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (val, currency) => {
    if (currency === 'INR') {
      return val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val.toLocaleString()}`;
    }
    return `$${(val / 1000).toFixed(0)}K`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="w-8 h-8" /> Salary Predictor
        </h1>
        <p className="text-foreground/60 mt-1">
          AI-powered compensation analysis based on your profile and market data.
        </p>
      </div>

      {/* Input Form */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Configure Prediction</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-foreground/70 mb-1 block">Target Role *</label>
            <select
              className="input-field w-full"
              value={form.targetRole}
              onChange={e => setForm({ ...form, targetRole: e.target.value })}
            >
              <option value="">Select a role</option>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-foreground/70 mb-1 block">Industry *</label>
            <select
              className="input-field w-full"
              value={form.industry}
              onChange={e => setForm({ ...form, industry: e.target.value })}
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-foreground/70 mb-1 block">Country / Region</label>
            <select
              className="input-field w-full"
              value={form.country}
              onChange={e => setForm({ ...form, country: e.target.value })}
            >
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-foreground/70 mb-1 block">Employment Type</label>
            <select
              className="input-field w-full"
              value={form.employmentType}
              onChange={e => setForm({ ...form, employmentType: e.target.value })}
            >
              {['Full-time', 'Contract', 'Remote', 'Part-time'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button
          className="btn-primary w-full py-3"
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? 'Analyzing market data...' : 'Predict My Salary Range'}
        </button>
      </div>

      {/* Results */}
      {prediction && (
        <div className="space-y-6">
          {/* Main Range Card */}
          <div className="glass-card p-6 text-center">
            <p className="text-foreground/60 text-sm mb-2">Estimated Salary Range</p>
            <p className="text-4xl font-bold text-foreground">
              {formatSalary(prediction.salaryRange.min, prediction.salaryRange.currency)}
              {' — '}
              {formatSalary(prediction.salaryRange.max, prediction.salaryRange.currency)}
            </p>
            <p className="text-foreground/60 text-sm mt-1">per annum · {prediction.salaryRange.currency}</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{prediction.confidenceScore}%</p>
                <p className="text-xs text-foreground/60">Confidence</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{prediction.marketDemand}</p>
                <p className="text-xs text-foreground/60">Market Demand</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{prediction.candidatePosition}</p>
                <p className="text-xs text-foreground/60">Your Position</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Experience Bands */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Experience Bands
              </h3>
              <div className="space-y-3">
                {prediction.experienceBands.map((b, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground/70">{b.band}</span>
                      <span className="font-medium">
                        {formatSalary(b.min, prediction.salaryRange.currency)} – {formatSalary(b.max, prediction.salaryRange.currency)}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-700 rounded-full">
                      <div
                        className="h-2 bg-foreground rounded-full"
                        style={{ width: `${(i + 1) * 33}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Premiums */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-4 h-4" /> Skill Premiums
              </h3>
              <div className="space-y-2">
                {prediction.skillPremiums.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-foreground/70">{s.skill}</span>
                    <span className="text-sm font-semibold text-green-500">+{s.premiumPercent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* City Comparison Chart */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> City-wise Salary Comparison
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={prediction.cityComparisons}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `${(v/100000).toFixed(0)}L`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => [`₹${(v/100000).toFixed(1)}L`, 'Avg Salary']} />
                <Bar dataKey="avgSalary" fill="var(--color-foreground)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Actionable Tip */}
          <div className="glass-card p-5 border border-foreground/20">
            <p className="text-sm font-semibold text-foreground mb-1">💡 AI Insight</p>
            <p className="text-sm text-foreground/70">{prediction.actionableTip}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Add route in `frontend/src/App.jsx`

```jsx
import SalaryPredictor from './pages/SalaryPredictor';
// Inside <Routes>:
<Route path="/salary" element={<ProtectedRoute><SalaryPredictor /></ProtectedRoute>} />
```

#### Add to Navbar links (candidate nav)

```jsx
{ path: '/salary', label: 'Salary Predictor', icon: DollarSign }
```

---

### 1.4 Database Table

```sql
CREATE TABLE salary_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  industry TEXT,
  country TEXT,
  employment_type TEXT,
  prediction JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_salary_predictions_user ON salary_predictions(user_id);
```

---

### 1.5 Groq Prompt Engineering Notes

The prompt tells LLaMA 3.3 70B to act as a "compensation expert." Key design choices:
- Inject the full parsed profile so salary is profile-specific, not generic.
- Request `skillPremiums` to give candidates concrete upgrade targets.
- Request `cityComparisons` array so the frontend can render a bar chart without a second API call.
- `confidenceScore` helps users calibrate trust (lower confidence when profile is sparse).

---

---

## Feature 2: AI Candidate Ranking

### Overview

Recruiters post jobs and receive applicants. Currently, applicants are listed with a basic match score. This feature upgrades that by using Groq LLaMA 3.3 70B to deeply rank ALL applicants for a job, producing a ranked leaderboard with per-dimension scores, shortlist recommendations, and red flags.

---

### 2.1 User Flow

```
Recruiter opens "View Applicants" for a job
    │
    ├─ Sees existing applicant list (basic match score)
    │
    ├─ Clicks "Run AI Ranking" button
    │
    ├─ Backend pulls all applicant profiles for this job
    │
    ├─ Groq evaluates each candidate across 6 dimensions:
    │     • Technical Skill Match (%)
    │     • Experience Relevance (%)
    │     • Project Portfolio Strength (%)
    │     • Education Fit (%)
    │     • Culture/Role Fit (%)
    │     • Communication (from interview score if available)
    │
    ├─ Returns ranked list with:
    │     • Overall rank (#1, #2, #3 ...)
    │     • Composite score (0–100)
    │     • Radar chart per candidate
    │     • Shortlist badge (Top 3 recommended)
    │     • Red flags (e.g., "Skill gap in Kubernetes")
    │     • AI hiring recommendation (1-2 sentences)
    │
    └─ Recruiter can export as PDF or download CSV
```

---

### 2.2 Backend Implementation

#### New Route: `backend/routes/ranking.js`

```javascript
import express from 'express';
import { authMiddleware, recruiterMiddleware } from '../middleware/auth.js';
import { groqJSON } from '../services/groq/client.js';
import { supabase } from '../db/supabase.js';

const router = express.Router();

// POST /api/ranking/job/:jobId  — trigger AI ranking for a job
router.post('/job/:jobId', authMiddleware, recruiterMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify recruiter owns this job
    const { data: job } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', jobId)
      .eq('recruiter_id', req.user.id)
      .single();

    if (!job) return res.status(403).json({ error: 'Job not found or access denied' });

    // Fetch all applicants with their profiles
    const { data: applications } = await supabase
      .from('applications')
      .select(`
        id,
        user_id,
        match_score,
        applied_at,
        profiles (
          name, skills, experience, education, projects
        ),
        interview_sessions (
          overall_score
        )
      `)
      .eq('job_id', jobId);

    if (!applications || applications.length === 0) {
      return res.status(400).json({ error: 'No applicants found for this job' });
    }

    // Build prompt with all candidates
    const candidatesSummary = applications.map((app, idx) => ({
      index: idx + 1,
      applicationId: app.id,
      userId: app.user_id,
      name: app.profiles?.name || 'Anonymous',
      skills: app.profiles?.skills || [],
      experience: app.profiles?.experience || [],
      education: app.profiles?.education || [],
      projects: app.profiles?.projects || [],
      existingMatchScore: app.match_score || 0,
      interviewScore: app.interview_sessions?.[0]?.overall_score || null
    }));

    const prompt = `
You are a senior technical recruiter and hiring manager.

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Required Skills: ${JSON.stringify(job.required_skills)}
Description: ${job.description}
Tech Stack: ${JSON.stringify(job.tech_stack)}
Experience Required: ${job.experience_required || 'Not specified'}

APPLICANTS (${candidatesSummary.length} total):
${JSON.stringify(candidatesSummary, null, 2)}

Rank ALL ${candidatesSummary.length} candidates from best to worst fit for this job.

For each candidate, evaluate these 6 dimensions (0–100):
1. technicalSkillMatch — how well their skills match the job requirements
2. experienceRelevance — is their experience in relevant domains
3. projectPortfolioStrength — quality and relevance of their projects
4. educationFit — does education align with role expectations
5. roleCultureFit — seniority, communication, overall alignment
6. interviewPerformance — use interviewScore if available, else estimate from profile

Respond ONLY with a JSON array (no markdown, no backticks):
[
  {
    "applicationId": "uuid-here",
    "userId": "uuid-here",
    "name": "Candidate Name",
    "rank": 1,
    "compositeScore": 87,
    "dimensions": {
      "technicalSkillMatch": 90,
      "experienceRelevance": 85,
      "projectPortfolioStrength": 88,
      "educationFit": 80,
      "roleCultureFit": 82,
      "interviewPerformance": 78
    },
    "strengths": ["Strong Python background", "Relevant fintech project"],
    "redFlags": ["No cloud experience", "Short tenure at previous companies"],
    "hiringRecommendation": "Strong candidate for senior role. Recommend fast-track interview.",
    "shortlist": true
  }
]

Sort the array by rank (1 = best). Mark top 3 as shortlist: true. Be honest about red flags.
`;

    const ranked = await groqJSON(prompt);

    // Persist ranking result
    await supabase.from('candidate_rankings').upsert({
      job_id: jobId,
      recruiter_id: req.user.id,
      ranking: ranked,
      generated_at: new Date().toISOString()
    }, { onConflict: 'job_id' });

    res.json({ success: true, ranking: ranked, totalCandidates: ranked.length });

  } catch (err) {
    console.error('Ranking error:', err);
    res.status(500).json({ error: 'Failed to rank candidates' });
  }
});

// GET /api/ranking/job/:jobId  — get existing ranking
router.get('/job/:jobId', authMiddleware, recruiterMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('candidate_rankings')
    .select('*')
    .eq('job_id', req.params.jobId)
    .single();

  if (error) return res.json({ ranking: null });
  res.json({ ranking: data.ranking, generatedAt: data.generated_at });
});

export default router;
```

#### Recruiter Middleware: `backend/middleware/auth.js` (add)

```javascript
export const recruiterMiddleware = (req, res, next) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Recruiter access only' });
  }
  next();
};
```

---

### 2.3 Frontend Implementation

#### Update: `frontend/src/pages/ViewJobApplications.jsx`

Add this section at the top of the applicant list:

```jsx
import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Trophy, AlertTriangle, Star, Zap } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Inside component:
const [ranking, setRanking] = useState(null);
const [rankLoading, setRankLoading] = useState(false);
const [selectedCandidate, setSelectedCandidate] = useState(null);

const runRanking = async () => {
  setRankLoading(true);
  try {
    const { data } = await api.post(`/ranking/job/${jobId}`);
    setRanking(data.ranking);
    toast.success(`Ranked ${data.totalCandidates} candidates!`);
  } catch {
    toast.error('Ranking failed');
  } finally {
    setRankLoading(false);
  }
};

// Load existing ranking on mount
useEffect(() => {
  api.get(`/ranking/job/${jobId}`)
    .then(({ data }) => { if (data.ranking) setRanking(data.ranking); })
    .catch(() => {});
}, [jobId]);
```

#### RankedCandidateCard Component

```jsx
// Add inside ViewJobApplications.jsx or as a separate component file

function RankedCandidateCard({ candidate, onClick, isSelected }) {
  const medalColors = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div
      className={`glass-card p-4 cursor-pointer transition-all border-2 
        ${isSelected ? 'border-foreground' : 'border-transparent'}`}
      onClick={() => onClick(candidate)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{medalColors[candidate.rank] || `#${candidate.rank}`}</span>
          <div>
            <p className="font-semibold text-foreground">{candidate.name}</p>
            <p className="text-xs text-foreground/60">Composite Score: {candidate.compositeScore}/100</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {candidate.shortlist && (
            <span className="text-xs px-2 py-1 bg-foreground text-surface-900 rounded-full font-semibold">
              ⭐ Shortlisted
            </span>
          )}
          <span className="text-lg font-bold text-foreground">{candidate.compositeScore}</span>
        </div>
      </div>

      {/* Dimension mini bars */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Object.entries(candidate.dimensions).map(([key, val]) => (
          <div key={key}>
            <p className="text-xs text-foreground/50 truncate capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </p>
            <div className="h-1.5 bg-surface-700 rounded-full mt-0.5">
              <div className="h-1.5 bg-foreground rounded-full" style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Red flags */}
      {candidate.redFlags?.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-yellow-500 text-xs">
          <AlertTriangle className="w-3 h-3" />
          {candidate.redFlags[0]}
          {candidate.redFlags.length > 1 && ` +${candidate.redFlags.length - 1} more`}
        </div>
      )}
    </div>
  );
}
```

#### Candidate Detail Modal/Panel (radar chart + recommendation)

```jsx
function CandidateDetailPanel({ candidate, onClose }) {
  if (!candidate) return null;

  const radarData = Object.entries(candidate.dimensions).map(([key, val]) => ({
    subject: key.replace(/([A-Z])/g, ' $1').trim(),
    value: val
  }));

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            #{candidate.rank} — {candidate.name}
          </h3>
          <p className="text-foreground/60 text-sm">Composite Score: {candidate.compositeScore}/100</p>
        </div>
        <button onClick={onClose} className="btn-ghost px-3 py-1 text-sm">✕ Close</button>
      </div>

      {/* Radar Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
          <Radar dataKey="value" fill="var(--color-foreground)" fillOpacity={0.25}
            stroke="var(--color-foreground)" />
        </RadarChart>
      </ResponsiveContainer>

      {/* Strengths & Red Flags */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">✅ Strengths</p>
          <ul className="space-y-1">
            {candidate.strengths.map((s, i) => (
              <li key={i} className="text-xs text-foreground/70">• {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">⚠️ Red Flags</p>
          <ul className="space-y-1">
            {candidate.redFlags.length > 0
              ? candidate.redFlags.map((f, i) => (
                <li key={i} className="text-xs text-yellow-500">• {f}</li>
              ))
              : <li className="text-xs text-foreground/50">None identified</li>
            }
          </ul>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="p-3 border border-foreground/20 rounded-lg">
        <p className="text-xs font-semibold text-foreground mb-1">🤖 AI Hiring Recommendation</p>
        <p className="text-sm text-foreground/70">{candidate.hiringRecommendation}</p>
      </div>
    </div>
  );
}
```

---

### 2.4 Database Table

```sql
CREATE TABLE candidate_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE UNIQUE,
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ranking JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

---

## Feature 3: AI Resume Improver

### Overview

Candidates upload or view their parsed resume. The AI Resume Improver gives targeted, line-by-line suggestions to strengthen impact, fix weak phrasing, add quantification, and align the resume to ATS keyword requirements. It outputs a fully improved version section-by-section.

---

### 3.1 User Flow

```
Candidate navigates to Profile page
    │
    ├─ New "Improve Resume" button appears if profile is parsed
    │
    ├─ Optional: paste a Job Description to tailor improvements
    │
    ├─ Clicks "Analyze & Improve"
    │
    ├─ AI returns:
    │     • Overall resume score (0–100)
    │     • Section-by-section scores (Summary, Skills, Experience, Projects, Education)
    │     • Issue list with severity (critical / moderate / low)
    │     • Before/After rewrites for each experience bullet
    │     • Missing keywords (ATS analysis vs JD)
    │     • Improved summary paragraph
    │     • Skill recommendations ("Add these 5 skills to pass ATS")
    │
    └─ Candidate can copy improved sections or download improved resume as PDF
```

---

### 3.2 Backend Implementation

#### New Route: `backend/routes/resumeImprover.js`

```javascript
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { groqJSON } from '../services/groq/client.js';
import { supabase } from '../db/supabase.js';

const router = express.Router();

// POST /api/resume-improver/analyze
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { jobDescription } = req.body; // optional
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, summary, skills, experience, projects, education')
      .eq('user_id', userId)
      .single();

    if (!profile) return res.status(400).json({ error: 'No profile found. Upload your resume first.' });

    const prompt = `
You are an expert resume writer and ATS optimization specialist with 15 years of experience 
at top tech companies like Google, Meta, and Amazon.

CANDIDATE RESUME:
Name: ${profile.name}
Summary: ${profile.summary || 'Not provided'}
Skills: ${JSON.stringify(profile.skills)}
Experience: ${JSON.stringify(profile.experience)}
Projects: ${JSON.stringify(profile.projects)}
Education: ${JSON.stringify(profile.education)}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}` : '(No specific job description provided — give general improvements)'}

Perform a deep resume audit. Respond ONLY with a JSON object (no markdown, no backticks):
{
  "overallScore": 68,
  "sectionScores": {
    "summary": 55,
    "skills": 72,
    "experience": 65,
    "projects": 70,
    "education": 80
  },
  "issues": [
    {
      "severity": "critical",
      "section": "experience",
      "issue": "No quantifiable achievements — all bullets describe duties, not impact",
      "fix": "Add metrics: 'Reduced API latency by 40%', 'Handled 10K+ daily active users'"
    },
    {
      "severity": "moderate",
      "section": "summary",
      "issue": "Summary is generic and passive",
      "fix": "Lead with a strong value proposition tied to the target role"
    }
  ],
  "improvedSummary": "Full-stack engineer with 3 years of experience building scalable Node.js and React applications serving 50K+ users. Passionate about clean architecture and reducing system complexity.",
  "experienceImprovements": [
    {
      "company": "Company Name",
      "original": "Worked on backend APIs",
      "improved": "Architected and shipped 15+ RESTful APIs using Node.js/Express, reducing average response time by 35% through query optimization and Redis caching"
    }
  ],
  "missingKeywords": ["Docker", "CI/CD", "System Design", "AWS Lambda"],
  "skillsToAdd": ["Docker", "Terraform", "Redis"],
  "atsScore": 61,
  "atsIssues": [
    "Missing 4 keywords from job description",
    "Experience section lacks role-specific terminology"
  ],
  "quickWins": [
    "Add your GitHub URL to the contact section",
    "Move Skills section above Experience for tech roles",
    "Add a 'Tech Stack' line to each project"
  ]
}
`;

    const analysis = await groqJSON(prompt);

    // Save analysis
    await supabase.from('resume_improvements').upsert({
      user_id: userId,
      analysis,
      job_description: jobDescription || null,
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('Resume improver error:', err);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

// GET /api/resume-improver/latest
router.get('/latest', authMiddleware, async (req, res) => {
  const { data } = await supabase
    .from('resume_improvements')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  res.json({ analysis: data?.analysis || null, createdAt: data?.created_at || null });
});

export default router;
```

---

### 3.3 Frontend Implementation

#### New Page: `frontend/src/pages/ResumeImprover.jsx`

```jsx
import { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, AlertTriangle, Copy, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const SEVERITY_STYLES = {
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  moderate: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  low: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' }
};

export default function ResumeImprover() {
  const [jd, setJd] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get('/resume-improver/latest').then(({ data }) => {
      if (data.analysis) setAnalysis(data.analysis);
    }).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/resume-improver/analyze', { jobDescription: jd });
      setAnalysis(data.analysis);
      toast.success('Resume analysis complete!');
    } catch {
      toast.error('Analysis failed. Make sure your profile is complete.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const ScoreGauge = ({ score, label }) => {
    const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
    return (
      <div className="text-center">
        <p className={`text-2xl font-bold ${color}`}>{score}</p>
        <p className="text-xs text-foreground/60">{label}</p>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-8 h-8" /> AI Resume Improver
        </h1>
        <p className="text-foreground/60 mt-1">
          Get expert-level improvements, ATS optimization, and before/after rewrites.
        </p>
      </div>

      {/* Setup */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Optional: Paste Job Description</h2>
        <textarea
          className="input-field w-full h-28 resize-none text-sm"
          placeholder="Paste the job description here to get role-tailored improvements and ATS keyword matching..."
          value={jd}
          onChange={e => setJd(e.target.value)}
        />
        <button className="btn-primary w-full py-3" onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing your resume...' : '🔍 Analyze & Improve My Resume'}
        </button>
      </div>

      {analysis && (
        <>
          {/* Scores overview */}
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-around gap-4">
              <ScoreGauge score={analysis.overallScore} label="Overall Score" />
              <ScoreGauge score={analysis.atsScore} label="ATS Score" />
              {Object.entries(analysis.sectionScores).map(([k, v]) => (
                <ScoreGauge key={k} score={v} label={k.charAt(0).toUpperCase() + k.slice(1)} />
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {['overview', 'issues', 'rewrites', 'ats', 'quickwins'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
              >
                {{ overview: '📊 Overview', issues: '⚠️ Issues', rewrites: '✏️ Rewrites',
                   ats: '🤖 ATS Analysis', quickwins: '⚡ Quick Wins' }[tab]}
              </button>
            ))}
          </div>

          {/* Tab: Issues */}
          {activeTab === 'issues' && (
            <div className="space-y-3">
              {analysis.issues.map((issue, i) => {
                const { icon: Icon, color, bg } = SEVERITY_STYLES[issue.severity];
                return (
                  <div key={i} className={`glass-card p-4 ${bg} border border-foreground/10`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color}`} />
                      <div>
                        <p className="text-sm font-semibold text-foreground capitalize">
                          [{issue.severity}] {issue.section} — {issue.issue}
                        </p>
                        <p className="text-sm text-foreground/70 mt-1">💡 {issue.fix}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: Overview — Improved Summary */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-foreground">✨ Improved Summary</h3>
                  <button onClick={() => copyText(analysis.improvedSummary)} className="btn-ghost px-2 py-1 text-xs flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{analysis.improvedSummary}</p>
              </div>
              <div className="glass-card p-5">
                <h3 className="font-semibold text-foreground mb-3">🎯 Recommended Skills to Add</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.skillsToAdd.map(skill => (
                    <span key={skill} className="px-3 py-1 border border-foreground/30 rounded-full text-sm text-foreground/80">
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Rewrites */}
          {activeTab === 'rewrites' && (
            <div className="space-y-4">
              {analysis.experienceImprovements.map((item, i) => (
                <div key={i} className="glass-card p-5 space-y-3">
                  <p className="text-xs text-foreground/50 font-semibold uppercase">{item.company}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <p className="text-xs font-semibold text-red-400 mb-1">❌ Before</p>
                      <p className="text-sm text-foreground/70">{item.original}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-xs font-semibold text-green-400 mb-1">✅ After</p>
                      <p className="text-sm text-foreground/80">{item.improved}</p>
                      <button onClick={() => copyText(item.improved)} className="mt-2 text-xs text-foreground/50 hover:text-foreground flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copy improved
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: ATS */}
          {activeTab === 'ats' && (
            <div className="space-y-4">
              <div className="glass-card p-5">
                <h3 className="font-semibold text-foreground mb-3">🔴 Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map(kw => (
                    <span key={kw} className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-sm text-red-400">{kw}</span>
                  ))}
                </div>
              </div>
              <div className="glass-card p-5">
                <h3 className="font-semibold text-foreground mb-3">⚠️ ATS Issues</h3>
                <ul className="space-y-2">
                  {analysis.atsIssues.map((issue, i) => (
                    <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                      <span>•</span> {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab: Quick Wins */}
          {activeTab === 'quickwins' && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Quick Wins — Do These First
              </h3>
              <ol className="space-y-3">
                {analysis.quickWins.map((win, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground text-surface-900 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-sm text-foreground/80">{win}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

### 3.4 Database Table

```sql
CREATE TABLE resume_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  analysis JSONB NOT NULL,
  job_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

---

## Feature 4: GitHub Project Analyzer

### Overview

Candidates connect their GitHub username. The AI fetches their top repositories via the GitHub REST API, analyzes README content, languages, complexity, and stars, then generates a portfolio quality score, detailed per-repo feedback, and recommendations for improvement. This data is also used to enhance the interview question generation and salary prediction.

---

### 4.1 User Flow

```
Candidate goes to Profile page → "GitHub Analyzer" tab
    │
    ├─ Enters GitHub username
    │
    ├─ Backend calls GitHub API (no auth required for public repos)
    │     • Fetches top 6 repos (by stars + recent activity)
    │     • Fetches README for each repo
    │     • Fetches language breakdown
    │
    ├─ Groq analyzes each repo:
    │     • Code Quality Indicators (README quality, structure, tests mentioned)
    │     • Project Complexity (size, language diversity)
    │     • Relevance to career goals
    │     • Impact (stars, forks, last commit recency)
    │
    ├─ Returns:
    │     • Portfolio Score (0–100)
    │     • Per-repo scorecards
    │     • "Best repo to highlight in resume" recommendation
    │     • Missing portfolio elements ("No ML project detected")
    │     • Improvement suggestions per repo
    │     • Updated profile.projects array (auto-merge into profile)
    │
    └─ Candidate saves — GitHub data enriches future interview questions
```

---

### 4.2 Backend Implementation

#### New Route: `backend/routes/github.js`

```javascript
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { groqJSON } from '../services/groq/client.js';
import { supabase } from '../db/supabase.js';

const router = express.Router();

const GH_API = 'https://api.github.com';

// Helper: fetch from GitHub
async function ghFetch(path) {
  const headers = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'CareerBridgeAI' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
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
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { githubUsername } = req.body;
    if (!githubUsername) return res.status(400).json({ error: 'GitHub username is required' });

    // 1. Fetch user info
    const userInfo = await ghFetch(`/users/${githubUsername}`);

    // 2. Fetch top repos (sorted by stars, updated recently)
    const allRepos = await ghFetch(`/users/${githubUsername}/repos?sort=updated&per_page=30&type=owner`);
    const publicRepos = allRepos.filter(r => !r.private && !r.fork);

    // Score repos by stars + recency
    const now = Date.now();
    const scored = publicRepos
      .map(r => ({
        ...r,
        score: r.stargazers_count * 3 + r.forks_count * 2 +
          (now - new Date(r.updated_at).getTime() < 90 * 86400000 ? 10 : 0)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // 3. Fetch README for each top repo
    const repoDetails = await Promise.all(scored.map(async (repo) => {
      let readme = 'No README';
      let languages = {};
      try {
        const [readmeData, langData] = await Promise.all([
          ghFetch(`/repos/${githubUsername}/${repo.name}/readme`).catch(() => null),
          ghFetch(`/repos/${githubUsername}/${repo.name}/languages`).catch(() => ({}))
        ]);
        readme = decodeReadme(readmeData);
        languages = langData;
      } catch {}

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
        size: repo.size
      };
    }));

    // 4. AI Analysis via Groq
    const prompt = `
You are a senior software engineer and open source contributor reviewing a developer's GitHub portfolio.

GITHUB USER: ${githubUsername}
Public Repos: ${userInfo.public_repos}
Followers: ${userInfo.followers}
Bio: ${userInfo.bio || 'Not set'}

TOP ${repoDetails.length} REPOSITORIES:
${JSON.stringify(repoDetails, null, 2)}

Analyze this portfolio as if you're preparing feedback for a Google interview panel.

Respond ONLY with a JSON object (no markdown, no backticks):
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
      "highlights": ["Well-documented README", "Active maintenance", "50+ stars"],
      "weaknesses": ["No tests mentioned", "Missing contributing guide"],
      "complexity": "Intermediate",
      "resumeWorthy": true,
      "improvedDescription": "A production-ready REST API built with Node.js and PostgreSQL, handling 10K+ daily requests with Redis caching — improved from 'backend project'"
    }
  ],
  "bestRepoToHighlight": "repo-name",
  "bestRepoReason": "Strong README, active stars, and demonstrates full-stack skills directly relevant to backend engineering roles",
  "portfolioGaps": [
    "No machine learning or data science project",
    "No contribution to open source projects",
    "No system design or architecture showcase"
  ],
  "topRecommendations": [
    "Pin your top 6 repos on your GitHub profile",
    "Add demo GIFs/screenshots to top project READMEs",
    "Add unit tests to your top 2 repos to signal engineering maturity"
  ],
  "extractedProjects": [
    {
      "name": "Project Name",
      "description": "Improved description for resume",
      "techStack": ["React", "Node.js", "PostgreSQL"],
      "url": "https://github.com/..."
    }
  ]
}
`;

    const analysis = await groqJSON(prompt);

    // 5. Auto-update profile projects if user wants
    await supabase.from('github_analyses').upsert({
      user_id: req.user.id,
      github_username: githubUsername,
      analysis,
      analyzed_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    res.json({ success: true, analysis, githubUsername });

  } catch (err) {
    console.error('GitHub analyze error:', err);
    if (err.message?.includes('404')) {
      return res.status(404).json({ error: 'GitHub user not found' });
    }
    if (err.message?.includes('403')) {
      return res.status(429).json({ error: 'GitHub API rate limit reached. Try again in an hour.' });
    }
    res.status(500).json({ error: 'Failed to analyze GitHub profile' });
  }
});

// POST /api/github/merge-projects  — merge GitHub projects into profile
router.post('/merge-projects', authMiddleware, async (req, res) => {
  try {
    const { data: ghData } = await supabase
      .from('github_analyses')
      .select('analysis')
      .eq('user_id', req.user.id)
      .single();

    if (!ghData) return res.status(400).json({ error: 'No GitHub analysis found' });

    const newProjects = ghData.analysis.extractedProjects || [];

    const { data: profile } = await supabase
      .from('profiles')
      .select('projects')
      .eq('user_id', req.user.id)
      .single();

    const existingProjects = profile?.projects || [];
    const mergedProjects = [...existingProjects, ...newProjects]
      .filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i);

    await supabase
      .from('profiles')
      .update({ projects: mergedProjects })
      .eq('user_id', req.user.id);

    res.json({ success: true, totalProjects: mergedProjects.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to merge projects' });
  }
});

// GET /api/github/latest
router.get('/latest', authMiddleware, async (req, res) => {
  const { data } = await supabase
    .from('github_analyses')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  res.json({
    analysis: data?.analysis || null,
    githubUsername: data?.github_username || null,
    analyzedAt: data?.analyzed_at || null
  });
});

export default router;
```

#### Add to `backend/server.js`

```javascript
import githubRoutes from './routes/github.js';
app.use('/api/github', githubRoutes);
```

#### Add to `.env`

```env
# Optional: increases GitHub API rate limit from 60/hr to 5000/hr
GITHUB_TOKEN=your_github_personal_access_token
```

---

### 4.3 Frontend Implementation

#### New Page: `frontend/src/pages/GitHubAnalyzer.jsx`

```jsx
import { useState, useEffect } from 'react';
import { Github, Star, GitFork, ExternalLink, Trophy, AlertCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const COMPLEXITY_COLORS = {
  Beginner: 'text-green-500',
  Intermediate: 'text-yellow-500',
  Advanced: 'text-red-400',
  Expert: 'text-purple-400'
};

export default function GitHubAnalyzer() {
  const [username, setUsername] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [activeRepo, setActiveRepo] = useState(null);

  useEffect(() => {
    api.get('/github/latest').then(({ data }) => {
      if (data.analysis) {
        setAnalysis(data.analysis);
        setGithubUsername(data.githubUsername);
      }
    }).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!username.trim()) return toast.error('Enter a GitHub username');
    setLoading(true);
    try {
      const { data } = await api.post('/github/analyze', { githubUsername: username.trim() });
      setAnalysis(data.analysis);
      setGithubUsername(data.githubUsername);
      toast.success('GitHub portfolio analyzed!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Analysis failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMergeProjects = async () => {
    setMerging(true);
    try {
      const { data } = await api.post('/github/merge-projects');
      toast.success(`✅ ${data.totalProjects} projects merged into your profile!`);
    } catch {
      toast.error('Merge failed');
    } finally {
      setMerging(false);
    }
  };

  const ScoreRing = ({ score }) => {
    const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
    const r = 36, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="currentColor" strokeWidth="8" opacity="0.1" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" transform="rotate(-90 45 45)" />
        <text x="45" y="49" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>{score}</text>
      </svg>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Github className="w-8 h-8" /> GitHub Project Analyzer
        </h1>
        <p className="text-foreground/60 mt-1">
          AI-powered analysis of your GitHub portfolio. Get scored, get feedback, get hired.
        </p>
      </div>

      {/* Input */}
      <div className="glass-card p-6">
        <div className="flex gap-3">
          <input
            className="input-field flex-1"
            placeholder="Enter GitHub username (e.g., torvalds)"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          />
          <button className="btn-primary px-6" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {githubUsername && (
          <p className="text-xs text-foreground/50 mt-2">
            Last analyzed: <strong>@{githubUsername}</strong>
          </p>
        )}
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* Portfolio Score */}
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-around gap-6">
              <div className="text-center">
                <ScoreRing score={analysis.portfolioScore} />
                <p className="text-sm font-semibold text-foreground mt-1">Portfolio Score</p>
              </div>
              <div className="text-center">
                <ScoreRing score={analysis.profileCompleteness} />
                <p className="text-sm font-semibold text-foreground mt-1">Profile Completeness</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-foreground/60" />
                  <span className="text-sm text-foreground">{analysis.totalPublicRepos} public repos</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {analysis.languageDiversity.map(lang => (
                    <span key={lang} className="px-2 py-0.5 bg-surface-700 rounded text-xs text-foreground/80">{lang}</span>
                  ))}
                </div>
              </div>
              <button className="btn-primary flex items-center gap-2" onClick={handleMergeProjects} disabled={merging}>
                {merging ? 'Merging...' : '🔗 Merge into Profile'}
              </button>
            </div>
          </div>

          {/* Best repo highlight */}
          {analysis.bestRepoToHighlight && (
            <div className="glass-card p-5 border border-foreground/20 flex items-start gap-3">
              <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">⭐ Best Repo to Highlight: <code className="text-sm">{analysis.bestRepoToHighlight}</code></p>
                <p className="text-sm text-foreground/70 mt-1">{analysis.bestRepoReason}</p>
              </div>
            </div>
          )}

          {/* Repository Cards */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Repository Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.repositories.map((repo, i) => (
                <div
                  key={i}
                  className={`glass-card p-4 cursor-pointer transition-all border-2
                    ${activeRepo?.name === repo.name ? 'border-foreground' : 'border-transparent'}`}
                  onClick={() => setActiveRepo(activeRepo?.name === repo.name ? null : repo)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        {repo.name}
                        {repo.resumeWorthy && <span className="text-xs px-1.5 py-0.5 bg-foreground text-surface-900 rounded ml-1">Resume ✓</span>}
                      </p>
                      <p className={`text-xs font-medium ${COMPLEXITY_COLORS[repo.complexity] || 'text-foreground/60'}`}>
                        {repo.complexity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">{repo.score}</p>
                      <p className="text-xs text-foreground/50">Score</p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-foreground/60 mb-3">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stars || 0}</span>
                    <span className="flex items-center gap-1"><GitFork className="w-3 h-3" /> {repo.forks || 0}</span>
                    <a href={repo.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 hover:text-foreground">
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  </div>

                  {/* Expanded detail */}
                  {activeRepo?.name === repo.name && (
                    <div className="mt-3 pt-3 border-t border-foreground/10 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-green-400 mb-1">✅ Highlights</p>
                        <ul className="space-y-0.5">
                          {repo.highlights.map((h, j) => (
                            <li key={j} className="text-xs text-foreground/70">• {h}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-yellow-400 mb-1">⚠️ Weaknesses</p>
                        <ul className="space-y-0.5">
                          {repo.weaknesses.map((w, j) => (
                            <li key={j} className="text-xs text-foreground/70">• {w}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-2 bg-surface-700 rounded">
                        <p className="text-xs font-semibold text-foreground mb-1">📝 Improved Resume Description</p>
                        <p className="text-xs text-foreground/70">{repo.improvedDescription}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" /> Portfolio Gaps
              </h3>
              <ul className="space-y-2">
                {analysis.portfolioGaps.map((gap, i) => (
                  <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">◆</span> {gap}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Top Recommendations
              </h3>
              <ol className="space-y-2">
                {analysis.topRecommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                    <span className="font-bold text-foreground">{i + 1}.</span> {rec}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 4.4 Database Table

```sql
CREATE TABLE github_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  github_username TEXT NOT NULL,
  analysis JSONB NOT NULL,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_github_analyses_user ON github_analyses(user_id);
```

---

### 4.5 Integration with Existing Features

The GitHub analysis enriches two existing CareerBridge AI features automatically:

**Interview Question Generation** — In `backend/services/groq/interviewEngine.js`, before generating questions, fetch the GitHub analysis if it exists and inject repo names + tech stacks into the prompt:

```javascript
// In generateQuestions() function, add:
const { data: ghData } = await supabase
  .from('github_analyses')
  .select('analysis')
  .eq('user_id', userId)
  .single();

const githubContext = ghData?.analysis?.repositories
  ?.slice(0, 3)
  .map(r => `- ${r.name}: ${r.improvedDescription}`)
  .join('\n') || '';

// Inject into prompt:
`GITHUB PROJECTS (ask about these specifically):
${githubContext}`
```

**Salary Prediction** — In `backend/routes/salary.js`, fetch GitHub portfolio score and add to the prompt to increase prediction accuracy:

```javascript
const { data: ghData } = await supabase
  .from('github_analyses')
  .select('analysis')
  .eq('user_id', userId)
  .single();

// Add to prompt:
`GitHub Portfolio Score: ${ghData?.analysis?.portfolioScore || 'N/A'}/100
Top Projects: ${ghData?.analysis?.repositories?.slice(0,2).map(r => r.name).join(', ') || 'None'}`
```

---

---

## Database Schema Additions

Here is the complete SQL for all 4 new features. Run this in your Supabase SQL Editor:

```sql
-- ================================================
-- Feature 1: Salary Predictor
-- ================================================
CREATE TABLE IF NOT EXISTS salary_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  industry TEXT,
  country TEXT,
  employment_type TEXT,
  prediction JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_salary_user ON salary_predictions(user_id);

-- ================================================
-- Feature 2: Candidate Ranking
-- ================================================
CREATE TABLE IF NOT EXISTS candidate_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE UNIQUE,
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ranking JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ranking_job ON candidate_rankings(job_id);
CREATE INDEX IF NOT EXISTS idx_ranking_recruiter ON candidate_rankings(recruiter_id);

-- ================================================
-- Feature 3: Resume Improver
-- ================================================
CREATE TABLE IF NOT EXISTS resume_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  analysis JSONB NOT NULL,
  job_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resume_imp_user ON resume_improvements(user_id);

-- ================================================
-- Feature 4: GitHub Analyzer
-- ================================================
CREATE TABLE IF NOT EXISTS github_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  github_username TEXT NOT NULL,
  analysis JSONB NOT NULL,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_github_user ON github_analyses(user_id);
```

---

## Integration Checklist

### Backend

- [ ] Add `backend/routes/salary.js` and register in `server.js`
- [ ] Add `backend/routes/ranking.js` and register in `server.js`
- [ ] Add `backend/routes/resumeImprover.js` and register in `server.js`
- [ ] Add `backend/routes/github.js` and register in `server.js`
- [ ] Add `recruiterMiddleware` to `backend/middleware/auth.js`
- [ ] Add `GITHUB_TOKEN` (optional) to `.env`
- [ ] Run the 4 new SQL tables in Supabase

### Frontend

- [ ] Add `SalaryPredictor.jsx` to `src/pages/`
- [ ] Add `ResumeImprover.jsx` to `src/pages/`
- [ ] Add `GitHubAnalyzer.jsx` to `src/pages/`
- [ ] Update `ViewJobApplications.jsx` with ranking UI
- [ ] Add all 3 new routes to `App.jsx`
- [ ] Add new nav links in `Navbar.jsx` (candidate nav)

### Cross-Feature Integrations

- [ ] GitHub data → Interview question personalization
- [ ] GitHub data → Salary prediction accuracy
- [ ] Resume score → Dashboard stat card
- [ ] Candidate ranking → Recruiter Dashboard summary

### Navbar Links to Add (Candidate)

```jsx
{ path: '/salary',    label: 'Salary Predictor', icon: DollarSign }
{ path: '/resume-improver', label: 'Resume AI', icon: FileText   }
{ path: '/github',    label: 'GitHub Analyzer',  icon: Github    }
```

---

## Summary

| Feature | New Backend Routes | New DB Table | AI Model Used | Effort |
|---|---|---|---|---|
| Salary Predictor | `POST /salary/predict`, `GET /salary/history` | `salary_predictions` | LLaMA 3.3 70B | Medium |
| AI Candidate Ranking | `POST /ranking/job/:id`, `GET /ranking/job/:id` | `candidate_rankings` | LLaMA 3.3 70B | Medium |
| AI Resume Improver | `POST /resume-improver/analyze`, `GET /resume-improver/latest` | `resume_improvements` | LLaMA 3.3 70B | Medium |
| GitHub Analyzer | `POST /github/analyze`, `POST /github/merge-projects`, `GET /github/latest` | `github_analyses` | LLaMA 3.3 70B + GitHub REST API | High |

All 4 features reuse the existing `groqJSON` helper, `authMiddleware`, `supabase` client, and the existing Tailwind theme system — meaning zero new dependencies are required except an optional GitHub Personal Access Token.

---

*CareerBridge AI — MEGAHACK 2026 | Team S8UL*
