-- CareerBridge AI — Full Supabase Schema
-- Run this in Supabase SQL Editor

-- PROFILES
CREATE TABLE profiles (
  id           UUID REFERENCES auth.users(id) PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  role         TEXT CHECK (role IN ('candidate','recruiter','admin')) DEFAULT 'candidate',
  full_name    TEXT,
  avatar_url   TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- CANDIDATE PROFILES
CREATE TABLE candidate_profiles (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  raw_text             TEXT,
  parsed_data          JSONB,
  linkedin_url         TEXT,
  linkedin_data        JSONB,
  completeness_score   INTEGER DEFAULT 0,
  resume_url           TEXT,
  resume_version_a     JSONB,
  resume_version_b     JSONB,
  market_value_estimate JSONB,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- RECRUITER PROFILES
CREATE TABLE recruiter_profiles (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT,
  company_size TEXT,
  industry     TEXT,
  verified     BOOLEAN DEFAULT FALSE
);

-- JOB POSTINGS
CREATE TABLE job_postings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  company          TEXT,
  description      TEXT NOT NULL,
  parsed_data      JSONB,
  required_skills  JSONB DEFAULT '[]',
  nice_to_have     JSONB DEFAULT '[]',
  tech_stack       JSONB DEFAULT '[]',
  experience_years JSONB,
  salary_range     JSONB,
  location         TEXT,
  remote_policy    TEXT DEFAULT 'hybrid',
  job_category     TEXT,
  language         TEXT DEFAULT 'en',
  is_active        BOOLEAN DEFAULT TRUE,
  views_count      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- APPLICATIONS
CREATE TABLE applications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id       UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'applied' CHECK (
    status IN ('applied','screening','interview','offer','rejected')
  ),
  match_score  INTEGER,
  match_data   JSONB,
  cover_letter TEXT,
  applied_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, job_id)
);

-- INTERVIEW SESSIONS
CREATE TABLE interview_sessions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id           UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  interview_type   TEXT DEFAULT 'mixed',
  difficulty       TEXT DEFAULT 'mid',
  language         TEXT DEFAULT 'en',
  questions        JSONB DEFAULT '[]',
  answers          JSONB DEFAULT '[]',
  integrity_events JSONB DEFAULT '[]',
  overall_score    INTEGER,
  integrity_score  INTEGER,
  report           JSONB,
  status           TEXT DEFAULT 'pending' CHECK (
    status IN ('pending','active','completed','abandoned')
  ),
  duration_seconds INTEGER,
  started_at       TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- SCHEDULING SLOTS
CREATE TABLE scheduling_slots (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slot_datetime    TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 45,
  is_booked        BOOLEAN DEFAULT FALSE
);

-- SCHEDULED INTERVIEWS
CREATE TABLE scheduled_interviews (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id          UUID REFERENCES scheduling_slots(id) ON DELETE CASCADE,
  candidate_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id           UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  meet_link        TEXT,
  calendar_event_id TEXT,
  status           TEXT DEFAULT 'confirmed' CHECK (
    status IN ('confirmed','cancelled','rescheduled','completed')
  ),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- TUTOR CHATS
CREATE TABLE tutor_chats (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_name TEXT DEFAULT 'New Chat',
  messages     JSONB DEFAULT '[]',
  mode         TEXT DEFAULT 'general',
  language     TEXT DEFAULT 'en',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- SKILL GAP REPORTS
CREATE TABLE skill_gap_reports (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id          UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  match_score     INTEGER,
  matched_skills  JSONB DEFAULT '[]',
  missing_skills  JSONB DEFAULT '[]',
  learning_paths  JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- LEARNING ROADMAPS
CREATE TABLE learning_roadmaps (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name          TEXT NOT NULL,
  path_data           JSONB,
  youtube_resources   JSONB DEFAULT '[]',
  completed_resources JSONB DEFAULT '[]',
  quiz_history        JSONB DEFAULT '[]',
  current_week        INTEGER DEFAULT 1,
  progress_percent    INTEGER DEFAULT 0,
  started_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- QUIZ ATTEMPTS
CREATE TABLE quiz_attempts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_id   UUID REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  week         INTEGER,
  skill        TEXT,
  questions    JSONB DEFAULT '[]',
  answers      JSONB DEFAULT '[]',
  score        INTEGER,
  feedback     JSONB DEFAULT '[]',
  taken_at     TIMESTAMPTZ DEFAULT NOW()
);

-- MARKET PULSE
CREATE TABLE market_pulse (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill          TEXT,
  demand_count   INTEGER DEFAULT 0,
  avg_salary_min INTEGER,
  avg_salary_max INTEGER,
  location       TEXT,
  week_of        DATE DEFAULT CURRENT_DATE,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- OUTREACH TEMPLATES
CREATE TABLE outreach_templates (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id       UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  type         TEXT CHECK (type IN ('email','linkedin','followup')),
  content      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_chats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_roadmaps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Candidates see own data" ON candidate_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own interviews" ON interview_sessions
  FOR ALL USING (auth.uid() = candidate_id);
