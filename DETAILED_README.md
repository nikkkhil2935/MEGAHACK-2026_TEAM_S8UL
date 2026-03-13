# 🚀 CareerBridge AI - Complete Documentation

> **Your AI-Powered Career Command Center** — Live AI Voice Interviews, Semantic Job Matching, Personalized Learning Roadmaps, Gamification, and Real-time Calendar Integration.
>
> Built for **MEGAHACK 2026** by **Team S8UL**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&style=flat-square)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&style=flat-square)](https://nodejs.org)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-orange?logo=groq&style=flat-square)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&style=flat-square)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwind-css&style=flat-square)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square)](https://web.dev/progressive-web-apps/)

---

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Statement & Solutions](#problem-statement--solutions)
3. [Features](#-features)
4. [Tech Stack](#-tech-stack-detailed)
5. [Architecture](#-architecture)
6. [Project Structure](#-project-structure)
7. [Installation & Setup](#-installation--setup)
8. [Configuration & Secrets](#-configuration--secrets)
9. [API Reference](#-api-reference)
10. [Database Schema](#-database-schema)
11. [Frontend Components](#-frontend-components)
12. [State Management](#-state-management)
13. [Authentication System](#-authentication-system)
14. [Gamification System](#-gamification-system)
15. [Calendar Integration](#-calendar-integration)
16. [Roadmap Timeline](#-roadmap-timeline)
17. [Deployment Guide](#-deployment-guide)
18. [Development Workflow](#-development-workflow)
19. [Troubleshooting](#-troubleshooting)
20. [Contributing Guidelines](#-contributing-guidelines)

---

## Project Overview

**CareerBridge AI** is a unified platform that bridges the gap between job seekers and employers. It leverages advanced AI technology to provide:

- **For Candidates**: AI-powered mock interviews, job matching, personalized learning paths, and gamified learning
- **For Recruiters**: Job posting, applicant tracking, analytics, and AI-powered candidate evaluation

The platform uses **Groq's LLaMA 3.3 70B** model for high-speed AI inference and **Supabase** for secure data management.

### Key Innovations

✨ **Live AI Interview Engine** - Not pre-recorded; AI speaks and listens in real-time
🎯 **Semantic Job Matching** - AI-powered skill matching (not keyword-based)
📊 **Intelligent Roadmaps** - Personalized 2-12 week learning paths
🏆 **Gamification System** - 7 levels, 6 badges, persistent XP tracking
📅 **Calendar Integration** - Schedule interviews with ICS export, meeting links
🌍 **8 Languages** - English, Hindi, Spanish, French, German, Arabic, Mandarin, Portuguese

---

## Problem Statement & Solutions

### Current Market Gaps

| Problem | Today's Solutions | CareerBridge AI |
|---------|------------------|-----------------|
| **Keyword-Only Matching** | LinkedIn, Naukri, Indeed | **Semantic AI Analysis** - understands skill context |
| **Static Mock Interviews** | InterviewBit, Pramp | **Live AI Voice Interview** - real-time evaluation |
| **No Verification** | HireVue ($$$ expensive) | **Tab Switch Detection** (free, privacy-friendly) |
| **Generic Learning** | Udemy, Coursera | **Personalized AI Roadmaps** - tailored to gaps |
| **English-Only** | Most platforms | **8 languages** with native speech recognition |
| **Fragmented Tools** | LinkedIn ≠ Interview ≠ Learning | **Unified Platform** for all 3 |

### How We Solve It

1. **Interview System**
   - Candidate uploads resume → AI extracts skills, projects, experience
   - Candidate enters target job → AI reads JD and generates personalized questions
   - Interview starts → AI asks questions via TTS (ElevenLabs), listens via Groq Whisper
   - AI evaluates answers in real-time, asks follow-ups on weak areas
   - Report generated with breakdown: technical, behavioral, communication, culture fit

2. **Job Matching**
   - Uses Groq to do semantic matching (not keyword matching)
   - Calculates skill gaps: which skills candidate has vs. job requires
   - Shows match % on every job card
   - Users see exactly what they need to learn

3. **Learning Roadmaps**
   - User finds a skill gap → clicks "Create Roadmap"
   - AI generates 2-12 week curriculum (user-customizable)
   - Each week has: concepts, YouTube resources, mini-projects, quiz
   - Users earn XP for completing resources, quizzes
   - Visual timeline shows progress across weeks

4. **Gamification**
   - XP system incentivizes learning + interviewing
   - Badges for: 5 messages sent, meeting scheduled, interview completed, 500 XP reached
   - Streak tracking: maintain daily practice
   - Levels visible on dashboard encourage progression

---

## 🔥 Features

### For Candidates

#### 1. AI Mock Interview (`/interview`)
- **Setup Screen**: Select interview type (mixed/technical/behavioral/HR), difficulty (fresher/mid/senior), language
- **Upload JD**: Paste job description or PDF to tailor questions
- **Live Interview**:
  - AI speaks questions aloud (ElevenLabs TTS)
  - Record your answer (voice or type text)
  - Groq Whisper transcribes audio
  - AI evaluates in real-time (clarity, depth, confidence, structure)
  - Asks follow-up questions on weak answers
- **Calendar Integration**:
  - Schedule interview date/time
  - Generate meeting link (Jitsi)
  - Download `.ics` file for calendar import
  - Add to Google Calendar, Outlook, Apple Calendar
- **Report Generation**: Comprehensive evaluation with scores, strengths, gaps, next steps

#### 2. Job Browsing & Matching (`/jobs`)
- **Live Match %**: Every job shows skill match percentage
- **Semantic Analysis**: AI compares candidate skills vs job requirements
- **Skill Gap Display**: See which skills you have vs. missing
- **One-Click Apply**: Apply to jobs from job detail page
- **Smart Matching**: Based on semantic understanding, not keywords

#### 3. Learning Roadmaps (`/roadmap`, `/roadmap/:id`)
- **Generate Roadmaps**:
  - Enter skill to learn (React, Python, System Design, etc.)
  - Select duration (2-12 weeks, customizable)
  - Choose difficulty (beginner → intermediate → advanced → expert)
  - Set weekly hours available
- **Week-Based Curriculum**:
  - Each week has theme, goals, learning resources
  - YouTube videos with priorities (essential vs. regular)
  - Mini-projects to practice
  - Estimated hours per resource
  - Mark resources as complete
- **Weekly Quizzes** (`/quiz`):
  - AI-generated quizzes per week
  - Score tracked
  - Weak areas identified
  - Ready for next week indicator
- **Visual Timeline**:
  - See all weeks at a glance
  - Current week highlighted
  - Completed weeks show checkmarks
  - Click to jump between weeks
  - Progress % displayed

#### 4. AI Tutor (`/tutor`)
- **Upload Study Materials**: PDF or paste text
- **Ask Questions**: AI answers using YOUR uploaded context
- **NotebookLM-Style**: Like having a personal tutor who read all your notes
- **Multi-Round Conversation**: Build on previous answers

#### 5. Dashboard & Analytics (`/dashboard`)
- **XP Progress Card**: Current level, XP to next level, progress bar
- **Recent Badges**: Shows latest 3 unlocked achievements
- **Streak Tracker**: Current day streak for daily practice
- **Stats Cards**: Applications, interviews completed, avg match score, avg interview score
- **Profile Strength**: 0-100% with actionable nudges
- **Recent Interviews**: List of past interviews with scores

#### 6. Profile Management (`/profile`)
- **Resume Upload**: PDF parsing with AI extraction
- **LinkedIn Import**: Paste LinkedIn text → AI extracts structured data
- **Manual Entry**: Add skills, experience, projects, education
- **Display Format**: Shows profile strength, completeness score

#### 7. Interview History & Reports (`/interview/history`, `/interview/report/:id`)
- **All Interviews**: List of past interviews with dates, scores, types
- **Detailed Report**:
  - Overall score (0-100)
  - Score breakdown: technical, behavioral, communication, problem-solving, culture fit
  - Strengths identified
  - Areas to improve with specific advice
  - Next steps and practice recommendations
  - Estimated readiness for role

### For Recruiters

#### 1. Recruiter Dashboard (`/recruiter`)
- **Stats Overview**: Total jobs posted, applicants, interviews scheduled
- **Quick Actions**: Post new job, view applications, analytics
- **Active Jobs**: List of jobs with application counts

#### 2. Post Jobs (`/recruiter/post-job`)
- **Job Details**: Title, description, salary, location, job type
- **Required Skills**: Add multiple skills with proficiency levels
- **Tech Stack**: Select technologies
- **Responsibilities**: List key responsibilities
- **Benefits**: Add perks and benefits
- **Publication**: Jobs visible to candidates

#### 3. View Applications (`/recruiter/job/:id`)
- **Applicant List**: All candidates who applied
- **Sort/Filter**: By match %, name, date applied
- **Applicant Profile**: View resume, skills, projects
- **Take Actions**: Schedule interview, send message, reject

#### 4. Analytics (`/recruiter/analytics`)
- **Job Performance**: Applications per job, conversion rates
- **Candidate Metrics**: Match % distribution, skill gaps
- **Time to Hire**: Average time from apply to hire
- **Trends**: Most applied jobs, trending skills

### Gamification System

#### XP & Levels
```
Level 1: Fresher       (0-199 XP)      🌱
Level 2: Intern        (200-499 XP)    🎓
Level 3: Junior Dev    (500-999 XP)    💻
Level 4: Mid-level     (1000-1999 XP)  ⚡
Level 5: Senior Dev    (2000-3999 XP)  🚀
Level 6: Tech Lead     (4000-7999 XP)  🏆
Level 7: CTO          (8000+ XP)      👑
```

#### XP Rewards
- Interview completed: +150 XP
- Quiz completed: (score × 1.5) XP
- Roadmap week completed: +100 XP
- Roadmap fully completed: +500 XP
- Message sent: +10 XP
- Meeting scheduled: +50 XP

#### Badges
1. **Interview Master** 🎤 - Complete 5 interviews
2. **Quiz Wizard** 🧙 - Score 90%+ on 3 quizzes
3. **Roadmap Climber** 🏔️ - Complete 2 full roadmaps
4. **Speed Demon** ⚡ - Interview under 5 minutes
5. **Achievement Hunter** 🎯 - Earn 5 badges
6. **Rising Star** ⭐ - Reach Senior Dev level

#### Streak System
- **Daily Streak**: Maintained by visiting platform, taking interview, or completing quiz
- **Bonus XP**: Extra XP for every nth day (5, 10, 20 day milestones)
- **Streak Counter**: Shown on dashboard

### Calendar & Scheduling

#### Interview Scheduling
- **Date Picker**: Select interview date (minimum tomorrow)
- **Time Picker**: Select time (24-hour format)
- **Duration**: Fixed 45 minutes (customizable in future)
- **Meeting Link**: Auto-generated Jitsi Meet link
- **Copy Link**: One-click copy to clipboard
- **Download Calendar**: Export `.ics` file for import

#### Messaging Scheduler
- **Real Date/Time**: Not mocked - actual date/time selection
- **Meeting Types**: Video / Phone / In-person
- **Calendar Toggle**: Send calendar invite to both parties
- **Reminder Toggle**: Automated 30-min before reminder
- **Download `.ics`**: Import to any calendar app

---

## 🛠️ Tech Stack (Detailed)

### Frontend
```
React 19                    - UI library with hooks, concurrent rendering
TypeScript (optional)       - Type safety
Tailwind CSS v4            - Utility-first CSS with @theme support
Framer Motion v12          - Animation library for smooth transitions
Zustand v5                 - Lightweight state management
Zustand Persist            - Auto-persisting store to localStorage
React Router DOM v7        - Client-side routing
Lucide React               - 15-20px icon library
React Hot Toast            - Toast notifications with auto-dismiss
Recharts v3.8             - Chart library for analytics
Axios                      - HTTP client with interceptors
Supabase JS SDK           - Realtime database client
ElevenLabs SDK            - Text-to-speech (premium) with fallback
```

### Backend
```
Node.js (v20+)            - JavaScript runtime
Express v5.2              - Minimal web framework
Supabase Node SDK         - Database + auth client
Groq SDK v1.1             - LLaMA 3.3 70B LLM
Groq Whisper AI           - Server-side audio transcription
JWT (jsonwebtoken)        - Token generation & verification
Multer                    - File upload handling
pdf-parse                 - PDF text extraction
pdf2pic                   - PDF to image conversion
ElevenLabs Node SDK       - Text-to-speech API
Puppeteer                 - Browser automation (optional)
Morgan                    - HTTP request logging
Helmet                    - Security headers
CORS                      - Cross-origin resource sharing
Dotenv                    - Environment variable loading
Express Rate Limit        - Request rate limiting
```

### Database
```
Supabase (PostgreSQL)     - Full-stack platform with auth, realtime
PostgreSQL v14+           - Open-source relational DB
Supabase RLS              - Row-level security policies
Supabase Vector           - pgvector for semantic search (future)
```

### Deployment
```
Vercel (Frontend)         - Serverless hosting, auto-deployments
Render (Backend)          - Node.js hosting with auto-deploys
GitHub                    - Version control
```

---

## 🏗️ Architecture

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Components (Interview, Quiz, Roadmap, etc.)    │   │
│  │  Pages (Dashboard, Profile, Jobs, etc.)         │   │
│  │  Stores (Auth, Gamification, Theme)             │   │
│  │  Services (API, Calendar Utils)                 │   │
│  └──────────────────────────────────────────────────┘   │
│                     ↓ HTTP/JSON ↓                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Express)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Routes:                                         │   │
│  │  - /auth (register, login, oauth-callback)      │   │
│  │  - /interview (generate, answer, end)           │   │
│  │  - /jobs (list, match, apply)                   │   │
│  │  - /quiz (generate, submit)                     │   │
│  │  - /roadmap (generate, manage)                  │   │
│  │  - /dashboard (stats, analytics)                │   │
│  │  - /resume (upload, parse)                      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Services:                                       │   │
│  │  - Groq (interview Q generation, evaluation)    │   │
│  │  - Groq Whisper (audio transcription)           │   │
│  │  - Supabase Auth (user management)              │   │
│  │  - PDF Parser (resume extraction)               │   │
│  │  - ElevenLabs (text-to-speech)                  │   │
│  └──────────────────────────────────────────────────┘   │
│                     ↓ SQL/PWS ↓                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              DATABASE (Supabase/PostgreSQL)             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Tables:                                         │   │
│  │  - profiles (users, roles)                       │   │
│  │  - candidate_profiles (resume, skills)          │   │
│  │  - job_postings (jobs list)                      │   │
│  │  - job_applications (applications)               │   │
│  │  - interview_sessions (interviews)               │   │
│  │  - quiz_attempts (quiz scores)                   │   │
│  │  - learning_roadmaps (learning paths)            │   │
│  │  - messages (communications)                     │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Security:                                       │   │
│  │  - Row-Level Security (RLS) policies            │   │
│  │  - JWT-based auth                                │   │
│  │  - Encrypted passwords (bcrypt)                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow: Interview

```
1. SETUP PHASE
   User fills: type, difficulty, language, JD → localStorage

2. LOADING PHASE
   Backend requests Groq API:
   - POST /interview/start
   - Groq generates 10 personalized questions
   - Questions stored in session

3. ACTIVE PHASE
   User answers (voice or text):
   ┌─────────────┐
   │ Audio Input │ → Groq Whisper (STT) → Transcript
   └─────────────┘
                  ↓
            User Answer Received
                  ↓
           Groq Evaluation API
                  ↓
    ┌─────────────────────────────┐
    │ Score, strengths, gaps      │
    │ Follow-up question needed?  │
    └─────────────────────────────┘
                  ↓
    IF follow-up: AI asks follow-up (TTS)
    ELSE: Move to next question
                  ↓
    REPEAT for all 10 questions

4. ENDING PHASE
   POST /interview/end
   Backend calls Groq for report generation:
   - Technical assessment
   - Behavioral assessment
   - Communication analysis
   - Recommendations
   - Hire decision

5. REPORT DISPLAY
   User sees detailed breakdown + can download
```

---

## 📁 Project Structure

```
CareerBridge-AI/
│
├── 📄 README.md                          # Main documentation
├── 📄 DETAILED_README.md                 # This file!
├── 📄 package.json                        # Project metadata
├── 📄 .gitignore                          # Git ignore rules
│
├── 📂 frontend/                           # React + Vite
│   ├── 📄 vite.config.js                 # Vite configuration
│   ├── 📄 tailwind.config.js             # Tailwind CSS config
│   ├── 📄 index.html                     # HTML entry
│   ├── 📄 .env.example                   # Environment template
│   │
│   ├── 📂 src/
│   │   ├── 📄 main.jsx                   # Entry point
│   │   ├── 📄 App.jsx                    # Route definitions
│   │   ├── 📄 index.css                  # Global styles + theme vars
│   │   ├── 📄 i18n.js                    # 8-language translations
│   │   │
│   │   ├── 📂 pages/                     # Route-level components
│   │   │   ├── Landing.jsx               # Public landing page
│   │   │   ├── Login.jsx                 # Email/password + Google login
│   │   │   ├── Register.jsx              # Candidate/recruiter signup
│   │   │   ├── AuthCallback.jsx          # OAuth callback handler
│   │   │   ├── Dashboard.jsx             # Candidate dashboard + stats
│   │   │   ├── Profile.jsx               # Resume upload + editing
│   │   │   ├── Jobs.jsx                  # Job listing with live match %
│   │   │   ├── JobDetail.jsx             # Full job details + apply
│   │   │   ├── Interview.jsx             # 🎤 AI mock interview room
│   │   │   ├── InterviewReport.jsx       # Interview evaluation report
│   │   │   ├── InterviewHistory.jsx      # Past interviews list
│   │   │   ├── Roadmap.jsx               # Learning roadmap list + generator
│   │   │   ├── RoadmapDetail.jsx         # Week breakdown + timeline
│   │   │   ├── Quiz.jsx                  # Interactive weekly quiz
│   │   │   ├── Tutor.jsx                 # AI tutor with doc upload
│   │   │   ├── RecruiterDashboard.jsx    # Recruiter overview
│   │   │   ├── PostJob.jsx               # Job posting form
│   │   │   ├── ViewJobApplications.jsx   # Applicants list per job
│   │   │   ├── RecruiterAnalytics.jsx    # Recruiter analytics
│   │   │   ├── MessagingSchedulerGamified.jsx  # Messaging + scheduler
│   │   │   └── AICallingSystem.jsx       # AI calling features
│   │   │
│   │   ├── 📂 components/
│   │   │   ├── 📂 layout/
│   │   │   │   └── Navbar.jsx            # Navigation + theme toggle
│   │   │   │
│   │   │   ├── 📂 auth/
│   │   │   │   └── FormLabel.jsx         # Reusable form label component
│   │   │   │
│   │   │   ├── 📂 gamification/
│   │   │   │   ├── XPProgressCard.jsx    # Level + progress display
│   │   │   │   ├── BadgesDisplay.jsx     # Achievements grid
│   │   │   │   └── LevelUpCelebration.jsx # Level-up popup animation
│   │   │   │
│   │   │   └── 📂 roadmap/
│   │   │       └── RoadmapTimeline.jsx   # Visual week timeline
│   │   │
│   │   ├── 📂 store/
│   │   │   ├── auth.js                   # Authentication state (Zustand)
│   │   │   ├── theme.js                  # Dark/light mode toggle
│   │   │   └── gamification.js           # XP, badges, streaks
│   │   │
│   │   ├── 📂 services/
│   │   │   ├── api.js                    # Axios instance + interceptors
│   │   │   └── supabase.js               # Supabase client init
│   │   │
│   │   └── 📂 utils/
│   │       ├── calendarUtils.js          # ICS generation, meeting links
│   │       └── xpNotifications.js        # Toast notifications for XP
│   │
│   └── 📂 public/
│       ├── icon-192.svg                  # PWA icon (small)
│       └── icon-512.svg                  # PWA icon (large)
│
└── 📂 backend/                            # Node.js + Express
    ├── 📄 server.js                      # Main entry point
    ├── 📄 package.json                   # Dependencies
    ├── 📄 .env                           # Environment secrets
    │
    ├── 📂 routes/                        # API endpoints
    │   ├── auth.js                       # /auth (register, login, oauth)
    │   ├── jobs.js                       # /jobs (CRUD, matching)
    │   ├── resume.js                     # /resume (upload, parse)
    │   ├── interview.js                  # /interview (sessions, Q&A)
    │   ├── quiz.js                       # /quiz (generate, submit)
    │   ├── roadmap.js                    # /roadmap (generate, manage)
    │   ├── linkedin.js                   # /linkedin (profile import)
    │   ├── tutor.js                      # /tutor (AI chat)
    │   ├── tts.js                        # /tts (text-to-speech)
    │   ├── dashboard.js                  # /dashboard (stats)
    │   └── messaging.js                  # /messaging (messages, scheduler)
    │
    ├── 📂 services/
    │   ├── 📂 groq/
    │   │   ├── client.js                 # Groq SDK setup
    │   │   ├── interviewEngine.js        # Q generation, evaluation, reports
    │   │   ├── matchingEngine.js         # Semantic job matching
    │   │   ├── resumeParser.js           # PDF to structured data
    │   │   ├── roadmapGenerator.js       # Learning path generation
    │   │   └── quizGenerator.js          # Quiz generation
    │   │
    │   ├── 📂 youtube/
    │   │   └── scraper.js                # Fetch learning resources
    │   │
    │   └── 📂 linkedin/
    │       └── parser.js                 # LinkedIn text parsing
    │
    ├── 📂 middleware/
    │   └── auth.js                       # JWT verification middleware
    │
    ├── 📂 db/
    │   ├── supabase.js                   # Supabase client init
    │   └── schema.sql                    # Database schema
    │
    ├── 📂 constants/
    │   ├── index.js                      # ROLES constant
    │   └── integrity.js                  # Integrity scoring weights
    │
    └── 📂 utils/
        └── helpers.js                    # Utility functions

```

---

## ⚙️ Installation & Setup

### Prerequisites

```bash
# Check versions
node --version        # v20 or higher
npm --version         # v9 or higher
git --version         # latest
```

Required:
- **Node.js 20+**
- **npm 9+**
- **Git**
- **Supabase account** (free at supabase.com)
- **Groq API key** (free 30 req/min at console.groq.com)

### Step 1: Clone Repository

```bash
git clone https://github.com/nikkkhil2935/MEGAHACK-2026_TEAM_S8UL.git
cd MEGAHACK-2026_TEAM_S8UL
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file with secrets
cat > .env << 'EOF'
PORT=5000
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Groq AI
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# JWT Secret
JWT_SECRET=your_random_jwt_secret_here

# Optional: YouTube API for resource fetching
YOUTUBE_API_KEY=your_youtube_api_key

# Optional: ElevenLabs for premium TTS
ELEVENLABS_API_KEY=your_elevenlabs_key

# Optional: Email service
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password
EOF

# Start backend
node server.js

# Should see: "Server running on port 5000"
```

### Step 3: Frontend Setup

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies (legacy-peer-deps for compatibility)
npm install --legacy-peer-deps

# Create .env file
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
EOF

# Start dev server
npm run dev

# Should see: "Local: http://localhost:5173"
```

### Step 4: Open Application

```
Frontend:  http://localhost:5173
Backend:   http://localhost:5000
```

---

## 🔐 Configuration & Secrets

### Supabase Setup

**1. Create Supabase Project**
- Go to https://supabase.com
- Click "New Project"
- Name it "CareerBridge", set region
- Generate strong password

**2. Get API Keys**
- Go to Settings → API
- Copy Project URL → `VITE_SUPABASE_URL`
- Copy Anon Public Key → `VITE_SUPABASE_ANON_KEY`
- Copy Service Role Key → `SUPABASE_SERVICE_KEY` (KEEP SECRET!)

**3. Enable Google OAuth**
- Authentication → Providers → Google
- Click "Enable"
- Enter Google OAuth credentials (see Google Cloud setup below)
- Set Redirect URI: `https://your-domain/auth/callback`

**4. Create Database Tables**
Run the SQL in `backend/db/schema.sql`:
```bash
# Via Supabase dashboard: SQL Editor
# Paste entire schema.sql and run
```

### Google OAuth Setup

**1. Create Google Cloud Project**
- Go to https://console.cloud.google.com
- New Project → "CareerBridge"
- Wait for creation

**2. Create OAuth Credentials**
- APIs & Services → Credentials
- Create Credentials → OAuth 2.0 Client ID
- Application Type: Web application
- Name: "CareerBridge"

**3. Add OAuth URIs**
- Authorized JavaScript origins:
  ```
  http://localhost:5173
  http://localhost:3000
  https://your-domain.vercel.app
  ```
- Authorized redirect URIs:
  ```
  http://localhost:5173/auth/callback
  https://your-domain.vercel.app/auth/callback
  https://your-project.supabase.co/auth/v1/callback
  ```

**4. Copy Credentials**
- Client ID → Supabase Google Provider
- Client Secret → Supabase Google Provider

### Groq API Setup

**1. Get API Key**
- Go to https://console.groq.com
- Sign up with email
- API Keys → Create New Key
- Copy key → `GROQ_API_KEY`

**2. Pricing**
- Free tier: 30 requests/minute (LLaMA 3.3 70B)
- Sufficient for development
- Production: Consider paid plan

### ElevenLabs (Optional - for Premium TTS)

**1. Create Account**
- Go to https://elevenlabs.io
- Sign up
- API → Copy API Key

**2. Add Voices**
- Create custom voice or use default
- Use voice_id in backend TTS calls

---

## 🚀 API Reference

### Authentication Endpoints

#### POST `/api/auth/register`
Register new user (candidate or recruiter)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "John Doe",
  "role": "candidate",  // or "recruiter"
  "company_name": "Acme Corp"  // only if recruiter
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "candidate"
  }
}
```

---

#### POST `/api/auth/login`
Login with email/password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

#### POST `/api/auth/oauth-callback`
Handle Google OAuth callback

**Request:**
```json
{
  "access_token": "ya29.a0AXooCgxxx...",
  "provider": "google"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

### Interview Endpoints

#### POST `/api/interview/start`
Start new interview session

**Request:**
```json
{
  "type": "technical",  // mixed|technical|behavioral|hr
  "difficulty": "mid",  // fresher|mid|senior
  "language": "en",     // en|hi|es|fr|de|ar|zh|pt
  "job_description": "Optional JD text",
  "job_id": "optional-job-123"
}
```

**Response:**
```json
{
  "session_id": "session-456",
  "interview_type": "technical",
  "difficulty": "mid",
  "questions": [
    {
      "id": "q1",
      "question": "Tell me about your experience with...",
      "type": "technical",
      "difficulty": "medium",
      "expected_points": [...],
      "hints": [...]
    },
    ...
  ],
  "total_questions": 10
}
```

---

#### POST `/api/interview/answer`
Submit text answer

**Request:**
```json
{
  "session_id": "session-456",
  "question_index": 0,
  "transcript": "I have 5 years of experience with React..."
}
```

**Response:**
```json
{
  "scores": {
    "clarity": 8,
    "technical_depth": 9,
    "relevance": 9,
    "structure": 8,
    "confidence": 8
  },
  "overall_score": 8,
  "feedback": "Excellent answer with specific examples...",
  "needs_followup": true,
  "followup_question": "Can you elaborate on...",
  "strengths": ["Deep technical knowledge", "Clear communication"],
  "improvements": ["Could provide more real-world examples"]
}
```

---

#### POST `/api/interview/answer/audio`
Submit audio answer (transcribed via Groq Whisper)

**Request:** (FormData)
```
- audio: File (audio/webm or audio/mp4)
- session_id: "session-456"
- question_index: 0
- language: "en"
```

**Response:**
```json
{
  "transcript": "I have 5 years of experience...",
  "evaluation": { ... },  // Same as /answer response
  "confidence": 0.95
}
```

---

#### POST `/api/interview/end`
End interview and generate report

**Request:**
```json
{
  "session_id": "session-456"
}
```

**Response:**
```json
{
  "interview_id": "interview-789",
  "overall_score": 82,
  "overall_feedback": "Strong technical background...",
  "technical_assessment": "...",
  "behavioral_assessment": "...",
  "communication_assessment": "...",
  "strengths": [...],
  "areas_to_improve": [...],
  "hire_recommendation": "Strong Yes",
  "estimated_readiness": "Ready now",
  "score_breakdown": {
    "technical": 85,
    "behavioral": 78,
    "communication": 82,
    "problem_solving": 86,
    "culture_fit": 79
  }
}
```

---

### Job Endpoints

#### GET `/api/jobs`
Get all jobs with match scores

**Query Parameters:**
```
?page=1&limit=20&search=React&match_min=50
```

**Response:**
```json
{
  "jobs": [
    {
      "id": "job-123",
      "title": "Senior React Developer",
      "company": "Acme Corp",
      "match_percentage": 87,
      "missing_skills": ["GraphQL"],
      "salary_range": "$150k-$200k",
      "location": "San Francisco, CA"
    }
  ],
  "total": 145,
  "page": 1
}
```

---

#### GET `/api/jobs/:id`
Get full job details

**Response:**
```json
{
  "id": "job-123",
  "title": "Senior React Developer",
  "company": "Acme Corp",
  "description": "...",
  "required_skills": ["React", "Node.js", "TypeScript"],
  "tech_stack": ["JavaScript", "PostgreSQL", "AWS"],
  "salary_range": "$150k-$200k",
  "job_type": "Full-time",
  "location": "San Francisco, CA",
  "match_percentage": 87,
  "candidate_skills": ["React", "Node.js", "Python"],
  "missing_skills": ["GraphQL"],
  "matching_skills": ["React", "Node.js"]
}
```

---

#### POST `/api/jobs/:id/apply`
Apply to a job

**Request:**
```json
{
  "cover_letter": "Optional cover letter text"
}
```

**Response:**
```json
{
  "application_id": "app-456",
  "job_id": "job-123",
  "status": "applied",
  "applied_at": "2026-03-13T10:30:00Z"
}
```

---

### Roadmap Endpoints

#### POST `/api/roadmap/generate`
Generate AI-powered learning roadmap

**Request:**
```json
{
  "skill": "React",
  "candidate_level": "beginner",
  "target_level": "advanced",
  "weekly_hours": 10,
  "weeks": 8  // 2-12 weeks
}
```

**Response:**
```json
{
  "roadmap_id": "roadmap-789",
  "skill_name": "React",
  "duration_weeks": 8,
  "total_hours": 80,
  "weeks": [
    {
      "week": 1,
      "theme": "React Basics",
      "goal": "Understand JSX, components, and hooks",
      "resources": [
        {
          "title": "React Tutorial",
          "type": "video",
          "url": "https://youtube.com/...",
          "duration_minutes": 120,
          "priority": "essential",
          "completed": false
        }
      ],
      "projects": ["Todo App"],
      "quiz_link": "quiz?roadmap=roadmap-789&week=1"
    }
  ]
}
```

---

#### GET `/api/roadmap/:id`
Get roadmap details

**Response:** Same as above

---

#### POST `/api/roadmap/:id/complete`
Mark resource as complete

**Request:**
```json
{
  "resource_url": "https://youtube.com/...",
  "week": 1
}
```

**Response:**
```json
{
  "progress_percent": 25,
  "current_week": 1,
  "xp_earned": 50
}
```

---

### Quiz Endpoints

#### POST `/api/quiz/generate`
Generate quiz for roadmap week

**Request:**
```json
{
  "roadmap_id": "roadmap-789",
  "week": 1
}
```

**Response:**
```json
{
  "quiz_id": "quiz-123",
  "skill": "React",
  "week": 1,
  "questions": [
    {
      "id": "q1",
      "question": "What is JSX?",
      "options": ["A", "B", "C", "D"],
      "correct_option": "A"
    }
  ]
}
```

---

#### POST `/api/quiz/submit`
Submit quiz answers

**Request:**
```json
{
  "roadmap_id": "roadmap-789",
  "week": 1,
  "questions": [...],
  "candidate_answers": ["A", "B", "C", ...]
}
```

**Response:**
```json
{
  "score_percent": 87,
  "total_earned": 10,
  "total_possible": 12,
  "feedback": {
    "overall_message": "Great work!",
    "weak_areas": ["Topic X"],
    "ready_for_next_week": true
  },
  "results": [
    {
      "question": "...",
      "is_correct": true,
      "candidate_answer": "A",
      "correct_answer": "A",
      "explanation": "..."
    }
  ]
}
```

---

## 📊 Database Schema

### Core Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,  -- From Supabase Auth
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  role VARCHAR CHECK (role IN ('candidate', 'recruiter')),
  avatar_url VARCHAR,
  bio TEXT,
  preferred_language VARCHAR DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### `candidate_profiles`
```sql
CREATE TABLE candidate_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  headline VARCHAR,
  total_experience_months INT,
  resume_pdf_url VARCHAR,
  profile_strength_percent INT DEFAULT 0,
  skills JSONB,  -- [{name, level, years}]
  education JSONB,  -- [{degree, institution, year}]
  experience JSONB,  -- [{company, role, duration, achievements}]
  projects JSONB,  -- [{name, description, tech_stack, url}]
  linkedin_url VARCHAR,
  github_url VARCHAR,
  website_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### `job_postings`
```sql
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES profiles(id),
  title VARCHAR NOT NULL,
  description TEXT,
  company_name VARCHAR,
  job_type VARCHAR,  -- Full-time, Part-time, Contract
  salary_min INT,
  salary_max INT,
  location VARCHAR,
  required_skills JSONB,  -- [{name, level}]
  tech_stack TEXT[],
  responsibilities TEXT[],
  benefits JSONB,
  applications_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### `interview_sessions`
```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES profiles(id),
  job_posting_id UUID REFERENCES job_postings(id),
  interview_type VARCHAR,  -- mixed, technical, behavioral, hr
  difficulty VARCHAR,  -- fresher, mid, senior
  language VARCHAR DEFAULT 'en',
  status VARCHAR,  -- in_progress, completed, abandoned
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INT,
  overall_score INT,  -- 0-100
  score_breakdown JSONB,  -- {technical, behavioral, communication, ...}
  integrity_score INT DEFAULT 100,
  tab_switches INT DEFAULT 0,
  recording_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### `quiz_attempts`
```sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES profiles(id),
  roadmap_id UUID,
  week INT,
  score_percent INT,
  total_earned INT,
  total_possible INT,
  answers JSONB,
  feedback JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### `learning_roadmaps`
```sql
CREATE TABLE learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES profiles(id),
  skill_name VARCHAR,
  candidate_level VARCHAR,  -- beginner, intermediate, advanced
  target_level VARCHAR,
  weekly_hours INT,
  total_weeks INT,  -- 2-12
  current_week INT DEFAULT 1,
  path_data JSONB,  -- Full curriculum from Groq
  progress_percent INT DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### `scheduled_interviews`
```sql
CREATE TABLE scheduled_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES profiles(id),
  recruiter_id UUID REFERENCES profiles(id),
  scheduled_date DATE,
  scheduled_time TIME,
  duration_minutes INT DEFAULT 45,
  meet_link VARCHAR,
  calendar_event_id VARCHAR,  -- Google Calendar event ID
  status VARCHAR,  -- scheduled, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id),
  recipient_id UUID REFERENCES profiles(id),
  content TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 Frontend Components

### Page Components

#### Dashboard.jsx
- XP progress card with level display
- Recent badges section
- Streak counter
- Stats cards (applications, interviews, avg scores)
- Profile strength indicator
- Quick action links

**Key Features:**
- Gamification integration
- Real-time stat updates
- Responsive grid layout
- Dark mode support

---

#### Interview.jsx
- Setup phase: type/difficulty/language/JD selection
- Calendar scheduling: date/time picker, ICS download
- Active interview: video feed + chat + recording
- Phase management: setup → loading → active → ending
- TTS/STT integration

**Technologies:**
- MediaRecorder for audio capture
- Web Audio API for processing
- ElevenLabs for TTS
- Groq Whisper for STT

---

#### Roadmap.jsx & RoadmapDetail.jsx
- Roadmap list with progress bars
- Generator form: skill, duration, level selection
- Timeline component: visual week selector
- Resource list with completion tracking
- Quiz integration

**Timeline Features:**
- Horizontal scrollable on mobile
- Completed weeks show checkmarks
- Current week highlighted
- Future weeks locked
- Click to jump between weeks (if completed)

---

#### Quiz.jsx
- Question display with multiple choice
- Answer selection
- Score calculation
- Feedback display
- XP reward notification
- Weak areas identification

**Gamification:**
- XP awarded: score × 1.5
- Toast notification
- Badge unlock checking
- Progress to next level shown

---

### Gamification Components

#### XPProgressCard.jsx
```jsx
Display:
- Level emoji + name (e.g., 🌱 Fresher)
- Current XP (e.g., "340 XP")
- Progress bar (% to next level)
- Level name (e.g., "200 more XP to Intern")
```

---

#### BadgesDisplay.jsx
```jsx
Display:
- 3x2 grid of badges
- Locked badges (grayed out)
- Unlocked badges (colored)
- Hover shows description
- Count: "X/6 badges"
```

---

#### LevelUpCelebration.jsx
```jsx
Animation:
- Center modal popup
- Level emoji + name
- "+ XP Earned" text
- Confetti particles
- "Continue" button
```

---

## 🔄 State Management

### Auth Store (Zustand)

```javascript
useAuthStore = create(persist(
  {
    user: null,
    token: null,
    preferences: {},

    // Methods
    login(email, password),
    register(payload),
    loginWithGoogle(),
    handleOAuthCallback(),
    logout(),
    setUser(user),
    updateLanguage(lang)
  },
  { name: 'careerbridge-auth' }  // localStorage key
))
```

---

### Gamification Store (Zustand)

```javascript
useGamificationStore = create(persist(
  {
    xp: 0,
    totalXP: 0,
    badges: [],
    streakDays: 0,
    interviewsCompleted: 0,
    quizzesCompleted: 0,
    roadmapsStarted: 0,

    // Methods
    awardXP(amount, reason),
    unlockBadge(badgeId),
    recordInterview(),
    recordQuiz(score),
    completeRoadmap(),
    updateStreak(),
    getStats() // Returns computed stats
  },
  { name: 'careerbridge-gamification' }
))
```

---

### Theme Store (Zustand)

```javascript
useThemeStore = create(persist(
  {
    isDark: false,

    toggleTheme(),
    initTheme()  // Check localStorage or system preference
  },
  { name: 'careerbridge-theme' }
))
```

---

## 🔐 Authentication System

### Flow Diagram

```
REGISTRATION
└─ User enters email, password, name, role
└─ POST /api/auth/register
└─ Backend: bcrypt hash password
└─ Create profile in Supabase
└─ Return JWT token
└─ Store in Zustand + localStorage
└─ Set Authorization header
└─ Redirect to dashboard

LOGIN (EMAIL/PASSWORD)
└─ User enters email, password
└─ POST /api/auth/login
└─ Backend: verify password
└─ Return JWT token
└─ Store token, redirect

LOGIN (GOOGLE)
└─ User clicks "Continue with Google"
└─ Supabase OAuth redirect → Google login
└─ Google redirects → /auth/callback
└─ AuthCallback.jsx extracts session
└─ POST /api/auth/oauth-callback with access_token
└─ Backend: Verify token via Supabase
└─ Create profile if new user
└─ Return JWT token
└─ Store token, redirect

LOGOUT
└─ Clear localStorage
└─ Clear Authorization header
└─ Supabase signOut()
└─ Redirect to /login
```

---

## 🏆 Gamification System

### XP Flow

```
USER ACTION → XP AWARD → LEVEL CHECK → BADGE CHECK → NOTIFICATION

Example: User completes quiz with 85% score

1. QUIZ RESULT
   └─ score = 85%
   └─ xp_earned = 85 × 1.5 = 127 XP

2. AWARD XP
   └─ awardXP(127, "Quiz Completed (85%)")
   └─ oldLevel = "Intern" (340 XP)
   └─ newXP = 340 + 127 = 467 XP
   └─ newLevel = "Intern" (still under 500)
   └─ NO level up

3. BADGE CHECK
   └─ totalQuizzesCompleted++ = 2
   └─ Check all badges:
     └─ Quiz Wizard: need 3× 90%+ (only 1 so far) ❌
     └─ Rising Star: need 500 XP (467 so far) ❌

4. TOAST NOTIFICATION
   └─ Show: "+127 XP · Quiz Completed (85%)"
   └─ Auto-dismiss after 2.5 seconds

5. LEVEL UP CHECK (Future)
   └─ When XP reaches 500
   └─ LevelUpCelebration modal shows
   └─ "+50 XP bonus for leveling up"
   └─ Modal dismisses after 3 seconds
```

---

### Badge Unlocking

```
Sharp Shooter 🎯
└─ Condition: Schedule first meeting
└─ XP reward: 50
└─ Triggered: messagesScheduler.js when "Schedule" clicked

Conversation Pro 💬
└─ Condition: Send 5 total messages
└─ Triggered: messaging system counts messages

Speed Networker ⚡
└─ Condition: Send 3 messages in one chat
└─ Triggered: messaging system on 3rd message in same conversation

Deal Maker 🤝
└─ Condition: Mark meeting as complete
└─ Triggered: messagesScheduler.js when "Mark Complete" clicked

Ghost Protocol 👁️
└─ Condition: Open all 3 conversations
└─ Triggered: messaging system on 3rd conversation opened

Rising Star ⭐
└─ Condition: Reach 500 XP total
└─ Triggered: awardXP() when XP crosses 500 threshold
```

---

## 📅 Calendar Integration

### ICS Generation

```javascript
// Generate calendar file
generateICS({
  title: "AI Mock Interview - Technical",
  description: "CareerBridge AI Interview Session",
  start: new Date("2026-03-13T14:00"),
  duration: 45,  // minutes
  location: "https://meet.jit.si/CareerBridge-abc123"
})

// Returns ICS format string
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CareerBridge AI//Interview//EN
BEGIN:VEVENT
UID:unique-id@careerbridge.ai
DTSTART:20260313T140000Z
DTEND:20260313T144500Z
SUMMARY:AI Mock Interview - Technical
DESCRIPTION:CareerBridge AI Interview Session
LOCATION:https://meet.jit.si/CareerBridge-abc123
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR

// Download
downloadICS("interview-2026-03-13.ics", icsContent)
```

---

### Meeting Link Generation

```javascript
// Currently: Jitsi Meet
generateMeetingLink('jitsi')
→ "https://meet.jit.si/CareerBridge-xxxxx"

// Future support
generateMeetingLink('google')
→ "https://meet.google.com/xxxx-yyyy-zzzz"

generateMeetingLink('zoom')
→ "https://zoom.us/j/1234567890"
```

---

## 🚀 Deployment Guide

### Vercel (Frontend)

**1. Connect GitHub**
```bash
# Push to GitHub (already done)
git push origin main
```

**2. Deploy on Vercel**
- Go to https://vercel.com
- Import project from GitHub
- Select `/frontend` directory
- Add environment variables:
  ```
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  VITE_API_URL=https://...  # Backend API URL
  VITE_ENV=production
  ```
- Click Deploy
- Wait for build to complete
- Get live URL

---

### Render (Backend)

**1. Connect GitHub**
- Go to https://render.com
- New Web Service
- Connect GitHub repo
- Select root directory: `/backend`

**2. Configure Environment**
```
Runtime: Node
Build Command: npm install
Start Command: node server.js

Environment Variables:
- PORT=5000
- SUPABASE_URL=...
- SUPABASE_SERVICE_KEY=...
- GROQ_API_KEY=...
- JWT_SECRET=...
- FRONTEND_URL=https://your-vercel-url.vercel.app
```

**3. Deploy**
- Click Create Web Service
- Wait for build
- Get live URL (e.g., https://careerbridge-api.onrender.com)

---

### Update Supabase OAuth

**1. Vercel URL**
- Go to Supabase Dashboard
- Authentication → Providers → Google
- Update Redirect URI:
  ```
  https://your-domain.vercel.app/auth/callback
  https://your-project.supabase.co/auth/v1/callback
  ```

**2. Google Cloud Console**
- APIs & Services → Credentials
- OAuth 2.0 Client ID
- Update Authorized redirect URIs:
  ```
  https://your-domain.vercel.app/auth/callback
  https://your-project.supabase.co/auth/v1/callback
  ```

---

## 💻 Development Workflow

### Creating New Feature

**1. Create Feature Branch**
```bash
git checkout -b feat/feature-name
```

**2. Implement Feature**
- Follow folder structure
- Reuse existing components
- Use existing Zustand stores
- Follow DRY principles

**3. Test Locally**
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && node server.js

# Visit http://localhost:5173
```

**4. Commit Changes**
```bash
git add .
git commit -m "feat: add feature description"
```

**5. Push & Create PR**
```bash
git push origin feat/feature-name
# Open PR on GitHub
```

---

### Testing Checklist

- [ ] Feature works on localhost
- [ ] No console errors
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Dark mode works
- [ ] API calls succeed
- [ ] Data persists (localStorage)
- [ ] Error handling works
- [ ] Performance acceptable (< 3s load)

---

## 🐛 Troubleshooting

### Common Issues

#### "VITE_SUPABASE_URL is not defined"
**Solution:** Create `.env` file in `/frontend` with:
```
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

---

#### "Cannot find module 'groq-sdk'"
**Solution:** Install dependencies
```bash
cd backend && npm install
```

---

#### "Google OAuth redirect mismatch"
**Solution:** Check three places match:
1. Supabase → Authentication → Providers → Google → Redirect URI
2. Google Cloud → OAuth 2.0 Client ID → Authorized Redirect URIs
3. Frontend code: `redirectTo: window.location.origin/auth/callback`

---

#### "Interview questions not generating"
**Solution:**
1. Check `GROQ_API_KEY` is valid
2. Check Groq rate limit (30 req/min)
3. Check network tab for failed requests
4. Check backend logs

---

#### "Quiz scoring not showing"
**Solution:**
1. Check quiz endpoint returns `score_percent`
2. Check Quiz.jsx receiving response
3. Check Groq eval endpoint

---

## 🤝 Contributing Guidelines

### Code Style

- **JavaScript**: Follow Airbnb style guide
- **React**: Use hooks, functional components
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: Use `//' for single-line, `/** */` for functions
- **Indentation**: 2 spaces (configured in .prettierrc)

### Commit Messages

```
feat: add new feature
fix: fix bug
refactor: code refactoring
docs: documentation update
test: add tests
chore: dependency/tooling updates

Examples:
- feat: add Google OAuth integration
- fix: resolve interview scoring bug
- refactor: extract gamification logic to store
```

### Pull Request Process

1. Create feature branch from `main`
2. Keep commits clean and atomic
3. Write clear PR description
4. Request review from team members
5. Address feedback
6. Merge when approved

---

## 📱 Mobile Responsiveness

### Breakpoints (Tailwind)

```
sm: 640px      - Mobile landscape
md: 768px      - Tablet
lg: 1024px     - Laptop
xl: 1280px     - Desktop
2xl: 1536px    - Large desktop
```

### Mobile-First Approach

```jsx
// Mobile first
className="text-sm p-4 md:text-base md:p-6 lg:text-lg"
```

---

## 🔒 Security Best Practices

### Frontend

- ✅ Never store secrets in code
- ✅ Use environment variables
- ✅ Validate user input
- ✅ Sanitize HTML content
- ✅ Use HTTPS only

### Backend

- ✅ Validate all inputs
- ✅ Use JWT tokens with expiration
- ✅ Hash passwords (bcrypt)
- ✅ Implement rate limiting
- ✅ Use Supabase RLS policies

### API

- ✅ CORS configured properly
- ✅ Helmet security headers
- ✅ Request size limits
- ✅ Authentication middleware

---

## 📊 Performance Optimization

### Frontend
- Code splitting with React Router
- Image lazy loading
- CSS minification (Tailwind)
- Bundle size monitoring

### Backend
- Database query optimization
- Caching with Redis (future)
- Rate limiting to prevent abuse
- Async operations with async/await

---

## 🎓 Learning Resources

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Groq API](https://console.groq.com)
- [Supabase Docs](https://supabase.com/docs)
- [Express.js](https://expressjs.com)

---

## 📄 License

This project is built for MEGAHACK 2026 by Team S8UL.

---

## 👥 Team

**Team S8UL** - MEGAHACK 2026

---

## 💬 Support

For issues or questions:
1. Check Troubleshooting section
2. Review API Reference
3. Check existing GitHub issues
4. Create new GitHub issue

---

**Last Updated**: March 13, 2026

