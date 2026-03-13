-- CareerBridge AI — Fix RLS (Run in Supabase SQL Editor)
-- Enables RLS on ALL public tables and adds missing policies

-- ═══ STEP 1: Enable RLS on every public table ═══
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_chats         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_roadmaps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_slots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gap_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_pulse        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_templates  ENABLE ROW LEVEL SECURITY;

-- ═══ STEP 2: Recreate existing policies (IF NOT EXISTS not supported, use DROP IF EXISTS + CREATE) ═══

-- profiles: users see/manage own profile
DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;
CREATE POLICY "Users see own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- candidate_profiles: candidates see own data
DROP POLICY IF EXISTS "Candidates see own data" ON public.candidate_profiles;
CREATE POLICY "Candidates see own data" ON public.candidate_profiles
  FOR ALL USING (auth.uid() = user_id);

-- interview_sessions: users see own interviews
DROP POLICY IF EXISTS "Users see own interviews" ON public.interview_sessions;
CREATE POLICY "Users see own interviews" ON public.interview_sessions
  FOR ALL USING (auth.uid() = candidate_id);

-- ═══ STEP 3: Add missing policies for tables that had none ═══

-- recruiter_profiles: recruiters see own profile
DROP POLICY IF EXISTS "Recruiters see own profile" ON public.recruiter_profiles;
CREATE POLICY "Recruiters see own profile" ON public.recruiter_profiles
  FOR ALL USING (auth.uid() = user_id);

-- job_postings: recruiters manage own posts, everyone can read active jobs
DROP POLICY IF EXISTS "Recruiters manage own jobs" ON public.job_postings;
CREATE POLICY "Recruiters manage own jobs" ON public.job_postings
  FOR ALL USING (auth.uid() = recruiter_id);

DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.job_postings;
CREATE POLICY "Anyone can view active jobs" ON public.job_postings
  FOR SELECT USING (is_active = true);

-- applications: candidates see own, recruiters see apps for their jobs
DROP POLICY IF EXISTS "Candidates see own applications" ON public.applications;
CREATE POLICY "Candidates see own applications" ON public.applications
  FOR ALL USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Recruiters see applications for their jobs" ON public.applications;
CREATE POLICY "Recruiters see applications for their jobs" ON public.applications
  FOR SELECT USING (
    job_id IN (SELECT id FROM public.job_postings WHERE recruiter_id = auth.uid())
  );

DROP POLICY IF EXISTS "Recruiters update applications for their jobs" ON public.applications;
CREATE POLICY "Recruiters update applications for their jobs" ON public.applications
  FOR UPDATE USING (
    job_id IN (SELECT id FROM public.job_postings WHERE recruiter_id = auth.uid())
  );

-- tutor_chats: users see own chats
DROP POLICY IF EXISTS "Users see own tutor chats" ON public.tutor_chats;
CREATE POLICY "Users see own tutor chats" ON public.tutor_chats
  FOR ALL USING (auth.uid() = user_id);

-- quiz_attempts: candidates see own attempts
DROP POLICY IF EXISTS "Candidates see own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Candidates see own quiz attempts" ON public.quiz_attempts
  FOR ALL USING (auth.uid() = candidate_id);

-- learning_roadmaps: candidates see own roadmaps
DROP POLICY IF EXISTS "Candidates see own roadmaps" ON public.learning_roadmaps;
CREATE POLICY "Candidates see own roadmaps" ON public.learning_roadmaps
  FOR ALL USING (auth.uid() = candidate_id);

-- scheduling_slots: recruiters manage own slots, candidates can view
DROP POLICY IF EXISTS "Recruiters manage own slots" ON public.scheduling_slots;
CREATE POLICY "Recruiters manage own slots" ON public.scheduling_slots
  FOR ALL USING (auth.uid() = recruiter_id);

DROP POLICY IF EXISTS "Candidates view available slots" ON public.scheduling_slots;
CREATE POLICY "Candidates view available slots" ON public.scheduling_slots
  FOR SELECT USING (true);

-- scheduled_interviews: both parties can see their interviews
DROP POLICY IF EXISTS "Users see own scheduled interviews" ON public.scheduled_interviews;
CREATE POLICY "Users see own scheduled interviews" ON public.scheduled_interviews
  FOR ALL USING (auth.uid() = candidate_id OR auth.uid() = recruiter_id);

-- skill_gap_reports: candidates see own reports
DROP POLICY IF EXISTS "Candidates see own skill reports" ON public.skill_gap_reports;
CREATE POLICY "Candidates see own skill reports" ON public.skill_gap_reports
  FOR ALL USING (auth.uid() = candidate_id);

-- market_pulse: public read-only
DROP POLICY IF EXISTS "Anyone can view market pulse" ON public.market_pulse;
CREATE POLICY "Anyone can view market pulse" ON public.market_pulse
  FOR SELECT USING (true);

-- outreach_templates: candidates see own templates
DROP POLICY IF EXISTS "Candidates see own templates" ON public.outreach_templates;
CREATE POLICY "Candidates see own templates" ON public.outreach_templates
  FOR ALL USING (auth.uid() = candidate_id);
