# CareerBridge AI

> **Your AI-Powered Career Command Center** -- Live AI Voice Interviews, Semantic Job Matching, Personalized Learning Roadmaps, Gamification, Real-Time Messaging, and more.
>
> Built for **MEGAHACK 2026** by **Team S8UL**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&style=flat-square)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&style=flat-square)](https://nodejs.org)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-orange?logo=groq&style=flat-square)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&style=flat-square)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwind-css&style=flat-square)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square)](https://web.dev/progressive-web-apps/)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [What Makes Us Different](#what-makes-us-different)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Architecture](#architecture)
6. [Project Structure](#project-structure)
7. [Complete API Reference (62 Endpoints)](#complete-api-reference)
8. [Database Schema (15 Tables)](#database-schema)
9. [AI Services & Workflows](#ai-services--workflows)
10. [Frontend Pages & Workflows](#frontend-pages--workflows)
11. [Real-Time Features (Socket.io)](#real-time-features)
12. [Gamification System](#gamification-system)
13. [Getting Started](#getting-started)
14. [Environment Variables](#environment-variables)
15. [Deployment Guide](#deployment-guide)
16. [Design System](#design-system)
17. [Key Technical Decisions](#key-technical-decisions)
18. [Team](#team)

---

## Problem Statement

| Problem | Current Solutions | CareerBridge AI |
|---------|-------------------|-----------------|
| Job matching uses keyword-only matching | LinkedIn, Naukri, Indeed | **Semantic AI matching** with live skill-gap % |
| Mock interviews are static & pre-recorded | Pramp, InterviewBit | **Live AI voice interview** with cross-examination & panel mode |
| No cheating detection in online interviews | HireVue (paid) | **Eye tracking + tab switch detection** (free) |
| No skill gap to learning path connection | None | **AI roadmap generator** with weekly curriculum & quizzes |
| Language barriers exclude non-English speakers | Most tools English-only | **8 languages** supported end-to-end |
| Recruiter tools are separate from candidate tools | Separate platforms | **Unified platform** for both roles |
| No resume quality feedback | Manual review | **AI resume analyzer** with ATS scoring & rewrite suggestions |
| Salary negotiation is guesswork | Glassdoor (crowdsourced) | **AI salary predictor** with skill premiums & city comparisons |

---

## What Makes Us Different

### Live AI Voice Interview (Not Pre-recorded)
The AI **speaks questions aloud** via ElevenLabs TTS, listens to your verbal answers via **Groq Whisper** server-side transcription, evaluates in real-time, and **cross-examines weak answers** with follow-up questions. It references your actual projects and skills by name. Supports **panel mode** with 3 distinct AI interviewers.

### Anti-Cheating Integrity Suite
- **Eye/Gaze Tracking** -- Chrome FaceDetector API detects when you look away
- **Tab Switch Detection** -- Flags every time you leave the interview tab (15-point penalty each)
- **Face Detection** -- Alerts when face is not visible in camera
- All violations logged with timestamps in the interview report

### Questions Generated From YOUR Profile
Not generic template questions. The AI reads your resume, projects, GitHub repos, skills, and the job description -- then generates **personalized questions** that test depth, not surface awareness.

### Semantic Job Matching
Every job shows a **live match percentage** based on AI-powered skill comparison. See exactly which skills you match, which you're missing, and get a verdict (Strong Fit / Good Fit / Partial Fit / Weak Fit).

### AI Learning Roadmaps with Real Resources
Identify a skill gap? Get a **4-week personalized curriculum** with real YouTube videos, mini-projects, practice projects, interview prep questions, and weekly AI-generated quizzes.

### NotebookLM-Style AI Tutor
Upload PDFs or paste study material. The AI tutor answers questions **using your uploaded context** across 7 specialized modes (Career Coach, Resume Review, Interview Prep, Salary Negotiation, Career Advice, DSA Tutor, System Design).

### GitHub Portfolio Analyzer
Input your GitHub username to get an AI-powered portfolio audit with verified skills, repo-by-repo analysis, complexity ratings, and resume-worthy project descriptions.

---

## Features

### For Candidates

| Feature | Description |
|---------|-------------|
| **AI Mock Interview** | Live voice-based interview with Groq Whisper STT & ElevenLabs TTS |
| **Panel Interview Mode** | 3 AI panelists (Tech Lead, HR Manager, Behavioral Analyst) with individual verdicts |
| **Eye Tracking** | Gaze detection using Chrome FaceDetector API |
| **Tab Switch Detection** | Flags when candidate leaves the interview tab |
| **JD Upload** | Upload/paste job description to tailor interview questions |
| **Interview Reports** | Radar charts, per-question scores, strengths, improvements, hire recommendation |
| **Interview History & Analytics** | Activity heatmap, score trends, skill matrix breakdown |
| **Profile Import** | Paste LinkedIn text or upload PDF resume -- AI parses everything |
| **Resume Improver** | AI audit with ATS score, section scores, rewrite suggestions, missing keywords |
| **Resume A/B Testing** | Upload two resumes, compare against a JD |
| **GitHub Analyzer** | Repo-by-repo analysis, verified skills, portfolio score, merge into profile |
| **Job Browsing** | Browse all posted jobs with live AI match scores |
| **Job Detail** | Full JD + match %, missing skills, matching skills, roadmap link |
| **Job Applications** | One-click apply with AI-generated match report |
| **Learning Roadmaps** | 4-week personalized learning paths with YouTube resources |
| **Weekly Quizzes** | AI-generated quizzes per roadmap week (MCQ, T/F, fill-in, short answer) |
| **AI Tutor** | 7-mode chat with document upload context and AI-suggested questions |
| **Salary Predictor** | Salary range, skill premiums, city comparisons, experience bands |
| **Real-Time Messaging** | Direct messaging with recruiters, read receipts, emoji support |
| **Gamification** | XP, levels, badges, streaks, and celebrations |
| **Dark/Light Theme** | Persisted in localStorage |
| **PWA** | Installable as a Progressive Web App |
| **Multilingual** | 8 languages (EN, HI, ES, FR, DE, AR, ZH, PT) |
| **Calendar Integration** | Schedule interviews with .ics download, Google Calendar widget |

### For Recruiters

| Feature | Description |
|---------|-------------|
| **Recruiter Dashboard** | Stats overview, active jobs, applicant counts, activity feed |
| **Post Jobs** | AI-powered JD health scoring, auto-extraction of skills/tech stack |
| **View Applicants** | Enriched applicant profiles with match scores, interview data, skills |
| **AI Candidate Ranking** | 6-dimension AI ranking with auto-shortlisting |
| **AI Shortlisting** | AI-generated shortlist with reasons, strengths, concerns |
| **Recruiter Analytics** | Applications per job charts, tech stack demand pie chart, job performance table |
| **AI Calling System** | AI-powered call scripts, simulated calls, post-call intelligence reports |
| **Messaging** | Direct messaging with candidates |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite 6** | Build tool with HMR |
| **Tailwind CSS v4** | Utility-first styling with `@theme` custom properties |
| **Zustand v5** | State management (auth, theme, gamification stores) |
| **Framer Motion** | Page transitions & animations |
| **GSAP** | Scroll-based animations |
| **React Router v7** | Client-side routing (22 routes) |
| **Recharts v3** | Charts (radar, bar, line, pie) |
| **Lucide React** | Icon library |
| **i18next** | Internationalization (8 languages) |
| **react-hot-toast** | Toast notifications |
| **vite-plugin-pwa** | PWA with Workbox service worker |
| **Axios** | HTTP client with auth interceptors |
| **Supabase JS** | Google OAuth client-side flow |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js + Express 5** | API server (62 endpoints) |
| **Supabase** | PostgreSQL database + Auth + Storage |
| **Groq SDK** | LLaMA 3.3 70B for all AI features |
| **Groq Whisper** | `whisper-large-v3` for speech-to-text |
| **ElevenLabs** | `eleven_multilingual_v2` for text-to-speech |
| **Socket.io** | Real-time messaging & interview events |
| **JWT** | Authentication tokens (7-day expiry) |
| **Multer** | File uploads (resume, avatar, audio, documents) |
| **pdf-parse** | PDF text extraction |
| **Helmet** | Security headers |
| **express-rate-limit** | 300 req/15min global rate limit |
| **Morgan** | HTTP request logging |
| **Puppeteer + Stealth** | LinkedIn profile scraping |
| **YouTube Data API v3** | Learning resource discovery |

### AI Models

| Model | Usage |
|-------|-------|
| **LLaMA 3.3 70B Versatile** | Question generation, evaluation, resume parsing, job matching, roadmaps, quizzes, tutor chat, salary prediction, GitHub analysis, ranking |
| **Whisper Large v3** | Audio transcription (server-side) |
| **ElevenLabs TTS** | Voice synthesis for AI interviewer (with browser SpeechSynthesis fallback) |

---

## Architecture

```
+-----------------------------------------------------+
|                    FRONTEND (React 19)               |
|                                                      |
|  +----------+ +----------+ +----------+ +----------+ |
|  |  Pages   | |Components| |  Stores  | | Services | |
|  | 22 routes| |  Navbar  | |  Auth    | |  Axios   | |
|  |          | | Calendar | |  Theme   | |  API     | |
|  |          | | Gamify   | | Gamify   | |          | |
|  +----------+ +----------+ +----------+ +----------+ |
|                                                      |
|  MediaRecorder --> Audio Blob --> POST /answer/audio  |
|  FaceDetector API --> Gaze Tracking --> POST /integrity|
|  Visibility API --> Tab Switch Detection              |
+-------------------------+----------------------------+
                          | HTTP / WebSocket (Socket.io)
+-------------------------v----------------------------+
|                   BACKEND (Express 5)                |
|                                                      |
|  +------------------------------------------------+  |
|  |            16 Route Modules (62 endpoints)      |  |
|  |  auth . jobs . resume . interview . quiz        |  |
|  |  linkedin . tutor . roadmap . tts . dashboard   |  |
|  |  github . ranking . resumeImprover . salary     |  |
|  |  messages . health                              |  |
|  +------------------------------------------------+  |
|                                                      |
|  +------------------------------------------------+  |
|  |            AI Services (Groq LLaMA 3.3)         |  |
|  |  interviewEngine . resumeParser . matchingEngine|  |
|  |  roadmapGenerator . quizGenerator . client      |  |
|  +------------------------------------------------+  |
|                                                      |
|  JWT Auth Middleware . Multer . Rate Limiting . CORS  |
+-------------------------+----------------------------+
                          |
+-------------------------v----------------------------+
|              EXTERNAL SERVICES                        |
|                                                      |
|  +----------+  +----------+  +---------+  +--------+ |
|  | Supabase |  |   Groq   |  |Eleven   |  |YouTube | |
|  |PostgreSQL|  |LLaMA 3.3 |  |Labs TTS |  |Data API| |
|  | + Auth   |  |Whisper v3|  |(opt.)   |  |(opt.)  | |
|  | + Storage|  |          |  |         |  |        | |
|  +----------+  +----------+  +---------+  +--------+ |
+------------------------------------------------------+
```

---

## Project Structure

```
CareerBridge-AI/
|-- backend/
|   |-- server.js                    # Express app + Socket.io + CORS + rate limiting
|   |-- package.json
|   |-- render.yaml                  # Render deployment config
|   |-- constants/
|   |   |-- index.js                 # ROLES, INTEGRITY_EVENT_TYPES
|   |   |-- integrity.js             # Scoring weights (tab switch: -15, eye drift: -5)
|   |   +-- panelists.js             # 3 panel interviewers (Alex, Sarah, David)
|   |-- db/
|   |   |-- supabase.js              # Supabase client (service key, bypasses RLS)
|   |   |-- schema.sql               # Full schema (15 tables + RLS policies)
|   |   |-- add-messages-table.sql   # Migration: messages table
|   |   |-- add-panel-mode.sql       # Migration: panel_mode column
|   |   +-- fix-rls.sql              # Idempotent RLS repair script
|   |-- middleware/
|   |   +-- auth.js                  # JWT verify + requireRole() + recruiterMiddleware
|   |-- routes/
|   |   |-- auth.js                  # Register, Login, OAuth, Profile, Avatar (6 endpoints)
|   |   |-- dashboard.js             # Candidate stats aggregation (1 endpoint)
|   |   |-- github.js                # GitHub analysis & merge (4 endpoints)
|   |   |-- interview.js             # Start, Answer, Audio, Integrity, End, Report (8 endpoints)
|   |   |-- jobs.js                  # CRUD, Apply, Match, Shortlist, Health (11 endpoints)
|   |   |-- linkedin.js              # LinkedIn text import (1 endpoint)
|   |   |-- messages.js              # Conversations, Search, Send, Read (4 endpoints)
|   |   |-- quiz.js                  # Dashboard, Generate, Submit (3 endpoints)
|   |   |-- ranking.js               # AI candidate ranking (2 endpoints)
|   |   |-- resume.js                # Upload, Parse, Update, Completeness, A/B Test (5 endpoints)
|   |   |-- resumeImprover.js        # Deep resume analysis (2 endpoints)
|   |   |-- roadmap.js               # Generate, List, Detail, Complete, Next-Week (5 endpoints)
|   |   |-- salary.js                # Predict, History (2 endpoints)
|   |   |-- tts.js                   # ElevenLabs text-to-speech (1 endpoint)
|   |   +-- tutor.js                 # Chat, Sessions, Doc Upload, Suggest (6 endpoints)
|   +-- services/
|       |-- authService.js           # createOrGetUserProfile, generateAuthToken, JWT
|       |-- groq/
|       |   |-- client.js            # groqJSON(), groqChat(), transcribeAudio()
|       |   |-- interviewEngine.js   # Questions, Evaluation, Reports, Panel Mode
|       |   |-- matchingEngine.js    # Candidate-to-Job semantic matching
|       |   |-- quizGenerator.js     # Quiz generation & grading
|       |   |-- resumeParser.js      # PDF/text to structured profile + A/B testing
|       |   +-- roadmapGenerator.js  # 4-week roadmap + YouTube resources
|       |-- linkedin/
|       |   |-- parser.js            # AI profile normalization
|       |   +-- scraper.js           # Puppeteer + Stealth LinkedIn scraping
|       +-- youtube/
|           +-- scraper.js           # YouTube Data API v3 search
|
|-- frontend/
|   |-- index.html                   # HTML entry + theme init script
|   |-- package.json
|   |-- eslint.config.js
|   |-- .env.example                 # Template for frontend env vars
|   |-- .npmrc                       # npm config
|   |-- public/
|   |   |-- favicon.svg
|   |   |-- icon-192.svg             # PWA icon
|   |   |-- icon-512.svg             # PWA icon large
|   |   |-- icons.svg                # SVG sprite
|   |   +-- manifest.webmanifest     # PWA manifest
|   +-- src/
|       |-- main.jsx                 # React root + BrowserRouter
|       |-- App.jsx                  # 22 routes + PrivateRoute + GuestRoute + theme init
|       |-- index.css                # Tailwind v4 @theme + component classes
|       |-- i18n.js                  # 8-language translations
|       |-- constants/
|       |   +-- index.js             # Frontend constants
|       |-- components/
|       |   |-- auth/
|       |   |   +-- FormLabel.jsx
|       |   |-- common/
|       |   |   |-- Logo.jsx
|       |   |   |-- ScrollReveal.jsx + .css
|       |   |   +-- ScrollVelocity.jsx + .css
|       |   |-- dashboard/
|       |   |   +-- GoogleCalendarWidget.jsx
|       |   |-- gamification/
|       |   |   |-- BadgesDisplay.jsx
|       |   |   |-- LevelUpCelebration.jsx
|       |   |   +-- XPProgressCard.jsx
|       |   |-- interview/
|       |   |   |-- ActivityHeatmap.jsx
|       |   |   +-- SkillMatrix.jsx
|       |   |-- layout/
|       |   |   +-- Navbar.jsx       # Role-aware sidebar + theme toggle + language selector
|       |   +-- roadmap/
|       |       +-- RoadmapTimeline.jsx
|       +-- pages/
|           |-- Landing.jsx          # Public landing (bento grid, CareerFit widget, testimonials)
|           |-- Login.jsx            # Email + Google OAuth login
|           |-- Register.jsx         # Candidate/Recruiter registration
|           |-- AuthCallback.jsx     # OAuth redirect handler
|           |-- Dashboard.jsx        # Candidate dashboard (XP, stats, calendar, badges)
|           |-- Profile.jsx          # Resume upload, LinkedIn import, GitHub skills
|           |-- Interview.jsx        # Live AI interview room (voice + text + camera)
|           |-- InterviewHistory.jsx # Past interviews + analytics (heatmap, charts)
|           |-- InterviewReport.jsx  # 5-tab report (overview, panel, Q&A, replay, integrity)
|           |-- Jobs.jsx             # Job listings with match scores
|           |-- JobDetail.jsx        # Full JD + skill comparison + apply
|           |-- PostJob.jsx          # Job posting form + AI health score
|           |-- Roadmap.jsx          # Learning roadmap list + generator
|           |-- RoadmapDetail.jsx    # Week-by-week view + resources + quizzes
|           |-- Quiz.jsx             # AI quiz flow (MCQ, T/F, fill-in, short answer)
|           |-- Tutor.jsx            # 7-mode AI chat + document upload
|           |-- ResumeImprover.jsx   # AI resume audit (5 tabs: overview, issues, rewrites, ATS, quick wins)
|           |-- SalaryPredictor.jsx  # Salary estimation + charts
|           |-- GitHubAnalyzer.jsx   # GitHub portfolio analysis + merge
|           |-- AICallingSystem.jsx  # AI calling (recruiter scripts, candidate consent)
|           |-- MessagingSchedulerGamified.jsx  # Real-time messaging (3-panel layout)
|           |-- RecruiterDashboard.jsx          # Recruiter home + stats
|           +-- RecruiterAnalytics.jsx          # Charts + tables + insights
|
+-- .gitignore
```

---

## Complete API Reference

**Base URL:** `http://localhost:5000/api`
**Auth:** Endpoints marked with `Auth` require `Authorization: Bearer <JWT>` header.
**Total: 62 REST endpoints + Socket.io events**

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Returns status + env variable diagnostics |

### Authentication (`/api/auth`) -- 6 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Register a new user. Body: `{ email, password, full_name?, role?, company_name? }`. Returns `{ token, user }` |
| `POST` | `/api/auth/login` | No | Login with email/password. Body: `{ email, password }`. Returns `{ token, user }` |
| `GET` | `/api/auth/me` | Yes | Get current authenticated user's profile |
| `POST` | `/api/auth/oauth-callback` | No | Handle Google OAuth callback. Body: `{ access_token }`. Returns `{ token, user }` |
| `PUT` | `/api/auth/profile` | Yes | Update name and/or language. Body: `{ full_name?, preferred_language? }` |
| `POST` | `/api/auth/avatar` | Yes | Upload avatar photo. Multipart: `avatar` field (max 5MB) |

### Dashboard (`/api/dashboard`) -- 1 endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/dashboard/candidate` | Yes | Returns aggregated stats: applications, interviews, match scores, profile strength, nudges, streak |

### Resume & Profile (`/api/resume`) -- 5 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/resume/upload` | Yes | Upload PDF/text resume (max 10MB). AI parses into structured profile. Returns `{ parsed, resume_url }` |
| `GET` | `/api/resume/parsed` | Yes | Get full parsed candidate profile data |
| `PUT` | `/api/resume/update` | Yes | Manually update parsed resume data. Body: `{ parsed_data }` |
| `GET` | `/api/resume/completeness` | Yes | Get completeness score (0-100) and tips |
| `POST` | `/api/resume/ab-test` | Yes | Compare two resumes against a JD. Multipart: `resume_a`, `resume_b`, `job_description` |

### Resume Improver (`/api/resume-improver`) -- 2 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/resume-improver/analyze` | Yes | Deep AI audit: overall score, ATS score, section scores, issues with fixes, rewritten bullets, missing keywords, quick wins. Body: `{ jobDescription? }` |
| `GET` | `/api/resume-improver/latest` | Yes | Get most recent analysis |

### LinkedIn (`/api/linkedin`) -- 1 endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/linkedin/import` | Yes | Import profile from pasted text (min 20 chars). AI parses into structured fields. Returns `{ parsed, completeness }` |

### GitHub (`/api/github`) -- 4 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/github/analyze` | Yes | Analyze GitHub profile. Body: `{ githubUsername }`. Returns portfolio score, repo evaluations, verified skills, recommendations |
| `POST` | `/api/github/merge-projects` | Yes | Merge extracted GitHub projects into candidate profile (deduplicates) |
| `GET` | `/api/github/latest` | Yes | Get most recent GitHub analysis |
| `GET` | `/api/github/verified-skills` | Yes | Get skills verified against actual GitHub code |

### Jobs (`/api/jobs`) -- 11 endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/jobs/careerfit` | No | Any | Public CareerFit analysis from JD text. Returns title, skills, tips, interview topics |
| `GET` | `/api/jobs` | Yes | Any | Job feed with live match scores. Filters: `category`, `remote`, `search`, `page`, `limit` |
| `GET` | `/api/jobs/:id` | Yes | Any | Get single job posting |
| `POST` | `/api/jobs` | Yes | Recruiter | Create job posting. AI extracts skills/tech_stack/salary from description |
| `POST` | `/api/jobs/:id/apply` | Yes | Candidate | Apply to job with AI match scoring. Emits `new_application` socket event |
| `GET` | `/api/jobs/match/:id` | Yes | Any | Get detailed AI match score against a specific job |
| `GET` | `/api/jobs/recruiter/my-jobs` | Yes | Recruiter | Get all posted jobs with `applicant_count` |
| `GET` | `/api/jobs/:id/applicants` | Yes | Recruiter | Get enriched applicants (profile, skills, interview data, match score) |
| `GET` | `/api/jobs/almost/qualified` | Yes | Any | Jobs where match is 55-74% with `missing_skills` |
| `POST` | `/api/jobs/:id/shortlist` | Yes | Recruiter | AI-generated shortlist with rank, reasons, strengths, concerns |
| `POST` | `/api/jobs/health-score` | Yes | Recruiter | AI job post quality analysis. Returns score, grade, issues, suggestions |

### AI Interview (`/api/interview`) -- 8 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/interview/start` | Yes | Start session. Body: `{ job_id?, interview_type?, difficulty?, language?, jd_text?, panel_mode? }`. Returns `{ session_id, questions }` |
| `POST` | `/api/interview/answer` | Yes | Submit text answer. Body: `{ session_id, question_index, transcript }`. Returns `{ evaluation, followup_question }` |
| `POST` | `/api/interview/answer/audio` | Yes | Submit audio (max 25MB). Multipart: `audio` + `session_id`, `question_index`, `language?`. Returns `{ transcript, evaluation, followup_question }` |
| `POST` | `/api/interview/integrity` | Yes | Log integrity event. Body: `{ session_id, event_type, duration? }` |
| `POST` | `/api/interview/end` | Yes | End session and generate full AI report. Body: `{ session_id }`. Returns `{ report, session_id }` |
| `GET` | `/api/interview/report/:id` | Yes | Get full interview report with job posting details |
| `GET` | `/api/interview/history` | Yes | Get all completed interviews (most recent first) |
| `GET` | `/api/interview/analytics` | Yes | Get activity heatmap, score trend, and skill matrix |

### Learning Roadmaps (`/api/roadmap`) -- 5 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/roadmap/generate` | Yes | Generate 4-week roadmap. Body: `{ skill, candidate_level?, target_level?, weekly_hours? }`. Caches duplicates |
| `GET` | `/api/roadmap` | Yes | List all user's roadmaps |
| `GET` | `/api/roadmap/:id` | Yes | Get roadmap detail with weekly content |
| `POST` | `/api/roadmap/:id/complete` | Yes | Mark resource completed. Body: `{ resource_url, week }`. Returns `{ progress }` |
| `POST` | `/api/roadmap/:id/next-week` | Yes | Advance to next week (max week 4) |

### Quizzes (`/api/quiz`) -- 3 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/quiz/dashboard` | Yes | Quiz dashboard: roadmaps with quiz history + recent attempts |
| `POST` | `/api/quiz/generate` | Yes | Generate quiz for roadmap week. Body: `{ roadmap_id, week }`. Returns MCQ, T/F, fill-in, short answer |
| `POST` | `/api/quiz/submit` | Yes | Submit answers for grading. Body: `{ roadmap_id, week, questions, candidate_answers }`. Returns `{ score_percent, feedback }` |

### AI Tutor (`/api/tutor`) -- 6 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/tutor/chat` | Yes | Chat with AI tutor. Body: `{ messages, mode?, session_id?, language? }`. 7 modes: general, resume, interview, salary, career, dsa, system |
| `GET` | `/api/tutor/sessions` | Yes | List all chat sessions |
| `POST` | `/api/tutor/sessions` | Yes | Create new session. Body: `{ name?, mode?, language? }` |
| `DELETE` | `/api/tutor/sessions/:id` | Yes | Delete a session |
| `POST` | `/api/tutor/upload-doc` | Yes | Upload document (PDF/TXT, max 10MB) to session. Multipart: `document` + `session_id` |
| `POST` | `/api/tutor/suggest` | Yes | Generate 5 AI-suggested questions from session document. Body: `{ chat_id }` |

### Salary Prediction (`/api/salary`) -- 2 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/salary/predict` | Yes | AI salary prediction. Body: `{ targetRole, industry, country?, employmentType? }`. Returns range, confidence, skill premiums, city comparisons |
| `GET` | `/api/salary/history` | Yes | Last 10 salary predictions |

### Candidate Ranking (`/api/ranking`) -- 2 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/ranking/job/:jobId` | Yes (Recruiter) | AI-rank all applicants on 6 dimensions. Top 3 auto-shortlisted |
| `GET` | `/api/ranking/job/:jobId` | Yes (Recruiter) | Get existing ranking |

### Text-to-Speech (`/api/tts`) -- 1 endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/tts/speak` | Yes | ElevenLabs TTS. Body: `{ text, language? }`. Returns binary `audio/mpeg` |

### Messaging (`/api/messages`) -- 4 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/messages/conversations` | Yes | Get all conversations with unread counts, last message, partner info |
| `GET` | `/api/messages/users/search` | Yes | Search users by name/email. Query: `?q=` (min 2 chars) |
| `POST` | `/api/messages/send` | Yes | Send message. Body: `{ receiver_id, content }`. Emits `new_message` via Socket.io |
| `GET` | `/api/messages/:userId` | Yes | Get message thread. Auto-marks received messages as read |

---

## Database Schema

**15 tables** in Supabase PostgreSQL with Row Level Security (RLS) enabled on all tables.

### Tables Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **profiles** | User accounts | `id` (FK auth.users), `email`, `role` (candidate/recruiter), `full_name`, `avatar_url`, `preferred_language` |
| **candidate_profiles** | Parsed resume data | `user_id`, `parsed_data` (JSONB), `raw_text`, `linkedin_data`, `resume_url`, `completeness_score` |
| **recruiter_profiles** | Company info | `user_id`, `company_name`, `company_size`, `industry`, `verified` |
| **job_postings** | Job listings | `recruiter_id`, `title`, `company`, `description`, `parsed_data`, `required_skills`, `tech_stack`, `salary_range`, `remote_policy`, `job_category` |
| **applications** | Job applications | `candidate_id`, `job_id`, `status`, `match_score`, `match_data` (JSONB), `cover_letter`. Unique on (candidate_id, job_id) |
| **interview_sessions** | Interview data | `candidate_id`, `job_id`, `questions` (JSONB), `answers` (JSONB), `integrity_events` (JSONB), `overall_score`, `integrity_score`, `report` (JSONB), `panel_mode`, `language` |
| **scheduling_slots** | Recruiter availability | `recruiter_id`, `slot_datetime`, `duration_minutes`, `is_booked` |
| **scheduled_interviews** | Booked interviews | `slot_id`, `candidate_id`, `recruiter_id`, `job_id`, `meet_link`, `status` |
| **tutor_chats** | AI tutor sessions | `user_id`, `session_name`, `messages` (JSONB), `mode`, `language`, `context_docs` |
| **skill_gap_reports** | Matching analysis | `candidate_id`, `job_id`, `match_score`, `matched_skills`, `missing_skills`, `learning_paths` |
| **learning_roadmaps** | Learning paths | `candidate_id`, `skill_name`, `path_data` (JSONB), `youtube_resources`, `completed_resources`, `quiz_history`, `current_week`, `progress_percent` |
| **quiz_attempts** | Quiz results | `candidate_id`, `roadmap_id`, `week`, `questions`, `answers`, `score`, `feedback` |
| **market_pulse** | Market data | `skill`, `demand_count`, `avg_salary_min`, `avg_salary_max`, `location`, `week_of` |
| **outreach_templates** | Email/LinkedIn templates | `candidate_id`, `job_id`, `type`, `content` |
| **messages** | Direct messages | `sender_id`, `receiver_id`, `content`, `read`, `created_at`. Indexes on sender, receiver, and created_at DESC |

### RLS Policies Summary

- Users can only read/update their own profiles
- Anyone can view active job postings
- Recruiters manage their own jobs and view their applicants
- Candidates see their own applications, interviews, roadmaps, quizzes
- Messages visible only to sender or receiver
- Market pulse is publicly readable

---

## AI Services & Workflows

### 1. Interview Engine (`interviewEngine.js`)

```
Candidate Profile + Job Data + GitHub Context
                |
                v
    +---------------------------+
    | generateQuestions()        |  --> 10 personalized questions
    | (or generatePanelQuestions)|      referencing actual projects/skills
    +---------------------------+
                |
                v (for each question)
    +---------------------------+
    | evaluateAnswer()          |  --> Score on 5 dimensions (0-10 each)
    | (or evaluatePanelAnswer)  |      Filler word count, STAR check
    +---------------------------+      Follow-up if score < 6
                |
                v (after all questions)
    +---------------------------+
    | generateReport()          |  --> Hire recommendation, radar scores,
    | (or generatePanelReport)  |      strengths, improvements, next steps
    +---------------------------+      Per-panelist verdicts (panel mode)
```

**Panel Mode Panelists:**
- **Alex Chen** (Technical Lead) -- 4 technical questions, rigorous style
- **Sarah Miller** (HR Manager) -- 3 behavioral questions, warm style
- **David Park** (Behavioral Analyst) -- 3 situational questions, STAR expert

### 2. Matching Engine (`matchingEngine.js`)

```
Candidate Skills + Experience + Projects
            +
Job Required Skills + Nice-to-Have + Tech Stack
            |
            v
    +---------------------------+
    | matchCandidateToJob()     |  --> match_score (0-100)
    +---------------------------+      matched_skills, missing_skills
                                       partial_matches, experience_fit
                                       verdict, strengths, gaps
```

### 3. Resume Parser (`resumeParser.js`)

```
PDF/Text File --> pdf-parse extraction --> Raw Text
                                            |
                                            v
                                    +------------------+
                                    | parseResume()    |  --> Structured profile
                                    +------------------+      (name, skills, experience,
                                                              education, projects, certifications,
                                                              seniority_level, completeness_score)

Two PDFs + JD --> abTestResumes() --> Winner, scores, comparison
```

### 4. Roadmap Generator (`roadmapGenerator.js`)

```
Skill + Level + Target + Hours
            |
            v
    +---------------------------+
    | generateSkillRoadmap()    |  --> 4-week curriculum
    +---------------------------+      |-- Weekly themes, goals, topics
                |                      |-- Resources (with URLs, hours, type)
                v                      |-- Mini-projects per week
    +---------------------------+      |-- Practice projects (3 difficulty levels)
    | searchYouTubeCourses()    |      |-- Interview prep questions
    +---------------------------+      +-- YouTube videos (2 per week)
```

### 5. Quiz Generator (`quizGenerator.js`)

```
Skill + Week + Topics
        |
        v
+---------------------------+
| generateWeeklyQuiz()      |  --> 10 questions (MCQ, T/F, fill-in, short answer)
+---------------------------+      with correct answers and explanations

Answers + Questions
        |
        v
+---------------------------+
| evaluateQuizAnswers()     |  --> score_percent, weak_areas,
+---------------------------+      readiness, review resources
```

### 6. Groq Client (`client.js`)

| Function | Model | Purpose |
|----------|-------|---------|
| `groqJSON(system, user)` | `llama-3.3-70b-versatile` | Structured JSON responses (auto-retry on parse failure) |
| `groqChat(messages, system)` | `llama-3.3-70b-versatile` | Freeform text responses |
| `transcribeAudio(buffer, lang)` | `whisper-large-v3` | Audio-to-text transcription |

---

## Frontend Pages & Workflows

### Public Pages

| Page | Route | Description |
|------|-------|-------------|
| **Landing** | `/` | Hero with rotating word carousel, scroll velocity text, bento grid features, live CareerFit widget (no login needed), testimonials |
| **Login** | `/login` | Email/password + Google OAuth, role-based redirect |
| **Register** | `/register` | Role selector (Job Seeker / Recruiter), conditional company field |
| **Auth Callback** | `/auth/callback` | Google OAuth redirect handler |

### Candidate Pages

| Page | Route | Key Workflow |
|------|-------|-------------|
| **Dashboard** | `/dashboard` | XP/level display, profile strength, recommendations, recent interviews, Google Calendar widget, badges |
| **Profile** | `/profile` | Upload resume PDF or paste LinkedIn text --> AI parses --> editable sections with GitHub verified skill badges |
| **Interview** | `/interview` | Setup (type, difficulty, language, JD, panel mode) --> AI generates questions --> voice/text answers --> real-time evaluation --> follow-ups --> report |
| **Interview History** | `/interviews` | List of past sessions + Analytics tab (heatmap, score trend, skill matrix) |
| **Interview Report** | `/interview/report/:id` | 5 tabs: Overview (radar + bar charts), Panel verdicts, Q&A review, Timeline replay, Integrity analysis |
| **Jobs** | `/jobs` | Browse with search, AI match scores, 25 fallback mock jobs |
| **Job Detail** | `/jobs/:id` | Match score + verdict, matched/missing skills, apply button, "Build Roadmap" for gaps |
| **Roadmap** | `/roadmap` | List roadmaps + generator form (auto-fills from missing skills query param) |
| **Roadmap Detail** | `/roadmap/:id` | Week-by-week content, resources with completion tracking, YouTube videos, quizzes, practice projects |
| **Quiz** | `/quiz` | Dashboard showing roadmap quiz status --> active quiz flow (MCQ, T/F, fill-in, short answer) --> results with AI feedback |
| **Tutor** | `/tutor` | 7-mode AI chat, session management, document upload, suggested questions |
| **Resume Improver** | `/resume-improver` | AI audit with 5 tabs: Overview, Issues, Rewrites, ATS Analysis, Quick Wins |
| **Salary Predictor** | `/salary` | Form (role, industry, country, type) --> salary range, experience bands, skill premiums, city chart |
| **GitHub Analyzer** | `/github` | Username input --> portfolio score rings, verified skills, repo cards, recommendations, merge to profile |
| **Messaging** | `/messages` | 3-panel: conversation list, chat area with read receipts, contact info sidebar |

### Recruiter Pages

| Page | Route | Key Workflow |
|------|-------|-------------|
| **Recruiter Dashboard** | `/recruiter` | Stats cards, active job cards with applicant counts, activity feed |
| **Post Job** | `/recruiter/post-job` | Form with AI JD health score checker (score/100, grade, suggestions) |
| **Recruiter Analytics** | `/recruiter/analytics` | Bar chart (apps/job), pie chart (tech demand), performance table |
| **AI Calling** | `/ai-calling` | Recruiter: candidate roster, AI script generator, live call simulator, post-call intelligence. Candidate: consent management |

---

## Real-Time Features

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_interview(sessionId)` | Client --> Server | Join interview room |
| `join_user(userId)` | Client --> Server | Join user's messaging room |
| `eye_drift({ sessionId, duration })` | Client --> Server | Report eye drift, broadcasts `integrity_event` |
| `tab_switch({ sessionId })` | Client --> Server | Report tab switch, broadcasts `integrity_event` |
| `answer_submitted({ sessionId })` | Client --> Server | Broadcasting that answer is being processed |
| `evaluation_done(data)` | Client --> Server | Broadcasts `next_question` with evaluation |
| `new_message` | Server --> Client | Real-time message delivery to receiver |
| `new_application` | Server --> Client | Notify recruiter of new application |
| `integrity_event` | Server --> Room | Broadcast integrity violation to interview room |
| `processing` | Server --> Room | Signal processing state during interview |
| `next_question` | Server --> Room | Deliver next question/evaluation |

---

## Gamification System

XP-based progression system integrated across the platform:

| Action | XP Awarded |
|--------|-----------|
| Apply to a job | +20 XP |
| Post a job (recruiter) | +50 XP |
| Complete a quiz | Variable |
| Analyze resume | +30 XP |
| Predict salary | +25 XP |
| Send tutor message | +5 XP |
| Analyze GitHub | +30 XP |
| Merge GitHub projects | +20 XP |

**Features:**
- Level progression with named tiers and emojis
- Badge system (displayed on dashboard, compact mode)
- Day streak tracking with flame icon
- Level-up celebration animations
- XP progress bar with percentage

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Supabase** account (free tier works)
- **Groq** API key (free tier: 30 req/min)
- *(Optional)* ElevenLabs API key for premium TTS
- *(Optional)* YouTube Data API key for learning resources

### 1. Clone the repository

```bash
git clone https://github.com/nikkkhil2935/MEGAHACK-2026_TEAM_S8UL.git
cd MEGAHACK-2026_TEAM_S8UL
```

### 2. Set up the database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the files in order:
   ```
   backend/db/schema.sql          # Creates all 15 tables + RLS policies
   backend/db/add-messages-table.sql  # (if not already in schema)
   backend/db/add-panel-mode.sql      # Adds panel_mode column
   ```

### 3. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env` with your keys (see [Environment Variables](#environment-variables)).

```bash
node server.js
```

Server starts at `http://localhost:5000`.

### 4. Frontend setup

```bash
cd frontend
npm install --legacy-peer-deps
npx vite --host
```

App opens at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# AI (Required)
GROQ_API_KEY=your_groq_api_key

# Auth (Required)
JWT_SECRET=your_jwt_secret_here

# Optional Services
YOUTUBE_API_KEY=your_youtube_api_key        # For roadmap video resources
ELEVENLABS_API_KEY=your_elevenlabs_api_key  # For premium TTS (falls back to browser TTS)
GMAIL_USER=your_email                       # For email notifications
GMAIL_PASS=your_app_password                # Gmail app password
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENV=development
```

---

## Deployment Guide

### Google OAuth Setup

1. **Supabase Dashboard** --> Authentication --> Providers --> Google --> Enable
2. **Google Cloud Console** --> Create OAuth 2.0 Client ID
3. Set authorized origins: `https://your-frontend-url`, `http://localhost:5173`
4. Set redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   https://your-frontend-url/auth/callback
   ```
5. Copy Client ID and Secret into Supabase Google provider settings

### Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variables (`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Deploy

### Backend (Render)

1. Connect GitHub repo to Render
2. Set root directory to `backend`, start command: `node server.js`
3. Add all backend environment variables
4. Set `FRONTEND_URL` to your Vercel deployment URL
5. Deploy

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Google login doesn't work | Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct |
| Redirect loop after OAuth | Ensure redirect URI matches exactly in both Supabase and Google Cloud |
| CORS errors | Set `FRONTEND_URL` in backend to match your deployed frontend URL |
| TTS not working | ElevenLabs key is optional; app falls back to browser SpeechSynthesis |
| No YouTube videos in roadmaps | `YOUTUBE_API_KEY` is optional; roadmaps still generate without videos |

---

## Design System

### Theme

- **Light mode** (default): White backgrounds, dark text, solid buttons
- **Dark mode**: Dark backgrounds, white text, inverted buttons
- Toggle via Sun/Moon button in navbar, persisted in localStorage

### CSS Architecture

- **Tailwind CSS v4** with `@theme` custom properties
- `--color-foreground`: Adapts to theme (#171717 light / #ffffff dark)
- `--color-surface-*`: Background scale (900=page, 800=card, 700=input)
- `--color-brand-*`: Brand colors that invert per theme
- Component classes: `.glass-card`, `.btn-primary`, `.btn-ghost`, `.input-field`

### Typography

- **Display**: Inter + Plus Jakarta Sans
- **Body**: Inter
- **Mono**: JetBrains Mono

---

## Key Technical Decisions

| Decision | Why |
|----------|-----|
| **Groq over OpenAI** | Free tier, ultra-fast inference (~200ms), LLaMA 3.3 70B quality |
| **Server-side Whisper** | Browser SpeechRecognition is unreliable; Groq Whisper gives consistent accuracy |
| **Tailwind v4 `@theme`** | CSS custom properties enable runtime theme switching without JS overhead |
| **Zustand over Redux** | Minimal boilerplate, persist middleware, < 1KB bundle |
| **Chrome FaceDetector** | Zero dependencies, runs at low FPS for gaze tracking, graceful fallback |
| **PWA** | Installable on mobile, offline caching with Workbox |
| **Supabase** | Free PostgreSQL + Auth + Storage + RLS security |
| **Socket.io** | Real-time messaging and interview integrity events |
| **Express 5** | Latest async error handling, built-in body parsing |
| **Panel mode interviews** | Simulates real-world multi-interviewer experience |

---

## Team

**Team S8UL** -- MEGAHACK 2026

---

## License

This project was built for the MEGAHACK 2026 hackathon.

---

<p align="center">
  <b>CareerBridge AI</b> -- Where AI meets your career journey.
</p>
