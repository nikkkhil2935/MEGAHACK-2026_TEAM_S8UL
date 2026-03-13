-- Run this in Supabase SQL Editor to add panel_mode column
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS panel_mode BOOLEAN DEFAULT false;
