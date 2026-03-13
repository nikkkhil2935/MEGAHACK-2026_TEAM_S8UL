# 🚀 CareerBridge AI

> **Your AI-Powered Career Command Center** — AI Voice Interviews, Smart Job Matching, Personalized Learning Roadmaps, and more.

Built for **MEGAHACK 2026** by **Team S8UL**

[![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Powered by Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-orange)](https://groq.com)
[![Database](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8)](https://web.dev/progressive-web-apps/)

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [What Makes Us Different](#-what-makes-us-different)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Screenshots](#-screenshots)
- [Development Timeline](#-development-timeline)
- [Team](#-team)

---

## 🎯 Problem Statement

| Problem | Current Solutions | CareerBridge AI |
|---------|------------------|-----------------|
| Job matching uses keyword-only matching | LinkedIn, Naukri, Indeed | **Semantic AI matching** with live skill-gap % |
| Mock interviews are static & pre-recorded | Pramp, InterviewBit | **Live AI voice interview** with cross-examination |
| No cheating detection in online interviews | HireVue (paid) | **Eye tracking + tab switch detection** (free) |
| No skill gap → learning path connection | None | **AI roadmap generator** with weekly curriculum |
| Language barriers exclude non-English speakers | Most tools English-only | **8 languages** supported |
| Recruiter tools are separate from candidate tools | Separate platforms | **Unified platform** for both roles |

---

## ✨ What Makes Us Different

### 🎤 Live AI Voice Interview (Not Pre-recorded)
The AI **speaks questions aloud**, listens to your verbal answers via **Groq Whisper** server-side transcription, evaluates in real-time, and **cross-examines weak answers** with follow-up questions. It references your actual projects and skills by name.

### 👁️ Anti-Cheating Integrity Suite
- **Eye/Gaze Tracking** — Chrome FaceDetector API detects when you look away
- **Tab Switch Detection** — Flags every time you leave the interview tab
- **Face Detection** — Alerts when face is not visible in camera
- All violations logged with timestamps in the interview report

### 🧠 Questions Generated From YOUR Profile
Not generic template questions. The AI reads your resume, projects, skills, and the job description — then generates **Google/Meta-level personalized questions** that test depth, not surface awareness.

### 📊 Semantic Job Matching
Every job shows a **live match percentage** based on AI-powered skill comparison, not keyword overlap. See exactly which skills you have vs. which you're missing.

### 🗺️ AI Learning Roadmaps
Identify a skill gap? Get an **8-week personalized curriculum** with resources, projects, and quizzes — powered by Groq LLaMA 3.3 70B.

### 🎓 NotebookLM-Style AI Tutor
Upload PDFs or paste study material. The AI tutor answers questions **using your uploaded context** — like having a personal tutor who read all your notes.

---

## 🔥 Features

### For Candidates

| Feature | Description | Status |
|---------|-------------|--------|
| **AI Mock Interview** | Live voice-based interview with Groq Whisper STT & browser TTS | ✅ |
| **Eye Tracking** | Gaze detection using Chrome FaceDetector API | ✅ |
| **Tab Switch Detection** | Flags when candidate leaves interview tab | ✅ |
| **JD Upload** | Upload/paste job description to tailor interview questions | ✅ |
| **Interview Reports** | Detailed AI-generated report with scores, strengths, improvements | ✅ |
| **Interview History** | View all past interviews and reports | ✅ |
| **Profile Import** | Paste LinkedIn text or upload PDF resume → AI parses everything | ✅ |
| **Resume Parsing** | Upload PDF → AI extracts skills, experience, projects, education | ✅ |
| **Job Browsing** | Browse all posted jobs with live match scores | ✅ |
| **Job Detail** | See full JD + your match %, missing skills, matching skills | ✅ |
| **Job Applications** | One-click apply to jobs | ✅ |
| **Learning Roadmaps** | AI generates 8-week personalized learning paths | ✅ |
| **AI Tutor** | NotebookLM-style chat with document upload context | ✅ |
| **Quizzes** | AI-generated quizzes per roadmap week | ✅ |
| **Dark/Light Theme** | Toggle with Sun/Moon button, persisted in localStorage | ✅ |
| **PWA** | Installable as a Progressive Web App | ✅ |
| **Responsive** | Mobile-first design, works on all screen sizes | ✅ |
| **Multilingual** | 8 languages (EN, HI, ES, FR, DE, AR, ZH, PT) | ✅ |

### For Recruiters

| Feature | Description | Status |
|---------|-------------|--------|
| **Recruiter Dashboard** | Overview stats, posted jobs, applicant counts | ✅ |
| **Post Jobs** | Create job postings with skills, tech stack, requirements | ✅ |
| **View Applicants** | See all applicants per job, sorted by AI match score | ✅ |
| **Role-Based Auth** | Separate flows for candidates vs recruiters | ✅ |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite 8** | Build tool (sub-second HMR) |
| **Tailwind CSS v4** | Utility-first styling with custom theme variables |
| **Zustand** | State management (auth + theme stores, persisted) |
| **Framer Motion** | Animations & transitions |
| **React Router v7** | Client-side routing |
| **Recharts** | Charts for interview reports |
| **Lucide React** | Icon library |
| **i18next** | Internationalization (8 languages) |
| **react-hot-toast** | Toast notifications |
| **vite-plugin-pwa** | PWA with Workbox service worker |
| **Axios** | HTTP client with auth interceptors |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express 5** | API server |
| **Supabase** | PostgreSQL database + Auth |
| **Groq SDK** | LLaMA 3.3 70B for all AI features |
| **Groq Whisper** | `whisper-large-v3` for speech-to-text |
| **ElevenLabs** | Text-to-speech (with browser fallback) |
| **JWT + bcryptjs** | Authentication |
| **Multer** | File upload handling (resume PDFs, audio blobs) |
| **pdf-parse v2** | PDF text extraction |
| **Zod** | Request validation |
| **Helmet** | Security headers |
| **express-rate-limit** | API rate limiting |
| **Socket.io** | Real-time communication |
| **Morgan** | HTTP request logging |

### AI Models
| Model | Usage |
|-------|-------|
| **LLaMA 3.3 70B Versatile** | Question generation, answer evaluation, resume parsing, job matching, roadmap generation, tutor chat, quiz generation |
| **Whisper Large v3** | Audio transcription (server-side, ~95% accuracy) |
| **ElevenLabs TTS** | Voice synthesis for AI interviewer (optional) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  Pages   │ │Components│ │  Stores  │ │Services│ │
│  │ 17 pages │ │  Navbar  │ │  Auth    │ │  API   │ │
│  │          │ │          │ │  Theme   │ │ Axios  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                      │
│  MediaRecorder → Audio Blob → FormData               │
│  FaceDetector API → Gaze Tracking                    │
│  Visibility API → Tab Switch Detection               │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼───────────────────────────────┐
│                   BACKEND (Express)                   │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │              10 Route Modules                   │  │
│  │  auth · jobs · resume · interview · quiz       │  │
│  │  linkedin · tutor · roadmap · tts · dashboard  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │              AI Services (Groq)                 │  │
│  │  interviewEngine · resumeParser · matchingEngine│  │
│  │  roadmapGenerator · quizGenerator · client      │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  JWT Auth Middleware · Multer · Rate Limiting         │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│              EXTERNAL SERVICES                        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Supabase │  │   Groq   │  │   ElevenLabs     │   │
│  │PostgreSQL│  │LLaMA 3.3 │  │   TTS (opt.)     │   │
│  │  + Auth  │  │Whisper v3│  │                   │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
CareerBridge-AI/
├── backend/
│   ├── server.js                    # Express app entry point
│   ├── .env                         # Environment variables
│   ├── package.json
│   ├── db/
│   │   ├── supabase.js              # Supabase client init
│   │   └── schema.sql               # Database schema
│   ├── middleware/
│   │   └── auth.js                  # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js                  # Register, Login, Get User
│   │   ├── jobs.js                  # CRUD jobs, apply, match scores
│   │   ├── resume.js                # Upload & parse resume PDF
│   │   ├── interview.js             # Start, answer (text/audio), end
│   │   ├── quiz.js                  # Generate & submit quizzes
│   │   ├── linkedin.js              # Profile text → AI parsing
│   │   ├── tutor.js                 # AI chat + document upload
│   │   ├── roadmap.js               # Generate & manage roadmaps
│   │   ├── tts.js                   # ElevenLabs text-to-speech
│   │   └── dashboard.js             # Candidate stats aggregation
│   └── services/
│       ├── groq/
│       │   ├── client.js            # Groq SDK: groqJSON, groqChat, transcribeAudio
│       │   ├── interviewEngine.js   # Question generation + answer evaluation
│       │   ├── resumeParser.js      # PDF → structured profile data
│       │   ├── matchingEngine.js    # Candidate ↔ Job semantic matching
│       │   ├── roadmapGenerator.js  # 8-week learning path generation
│       │   └── quizGenerator.js     # Quiz question generation
│       ├── linkedin/
│       │   ├── scraper.js           # (Legacy) LinkedIn scraper
│       │   └── parser.js            # Profile text → structured data
│       └── youtube/
│           └── scraper.js           # YouTube resource fetcher
│
├── frontend/
│   ├── index.html                   # HTML entry + theme init script
│   ├── vite.config.js               # Vite + PWA + Tailwind config
│   ├── package.json
│   ├── public/
│   │   ├── icon-192.svg             # PWA icon
│   │   └── icon-512.svg             # PWA icon large
│   └── src/
│       ├── main.jsx                 # React root + BrowserRouter
│       ├── App.jsx                  # Routes + theme init + Toaster
│       ├── index.css                # Tailwind v4 theme + components
│       ├── i18n.js                  # 8-language translations
│       ├── components/
│       │   └── layout/
│       │       └── Navbar.jsx       # Role-aware nav + theme toggle
│       ├── pages/
│       │   ├── Landing.jsx          # Public landing page
│       │   ├── Login.jsx            # Login form
│       │   ├── Register.jsx         # Register (candidate/recruiter)
│       │   ├── Dashboard.jsx        # Candidate dashboard + stats
│       │   ├── Profile.jsx          # Resume upload + profile display
│       │   ├── Jobs.jsx             # Job listings with match %
│       │   ├── JobDetail.jsx        # Full JD + skill comparison
│       │   ├── Interview.jsx        # 🎤 Live AI interview room
│       │   ├── InterviewReport.jsx  # Detailed evaluation report
│       │   ├── InterviewHistory.jsx # Past interviews list
│       │   ├── Roadmap.jsx          # Learning roadmap list
│       │   ├── RoadmapDetail.jsx    # Weekly roadmap breakdown
│       │   ├── Quiz.jsx             # Interactive quiz per week
│       │   ├── Tutor.jsx            # AI tutor chat + doc upload
│       │   ├── RecruiterDashboard.jsx # Recruiter overview
│       │   ├── PostJob.jsx          # Job posting form
│       │   └── ViewJobApplications.jsx # Applicant list per job
│       ├── services/
│       │   └── api.js               # Axios instance + interceptors
│       └── store/
│           ├── auth.js              # Zustand auth store (persisted)
│           └── theme.js             # Zustand theme store (persisted)
│
├── implementation.md                # Full implementation guide & PRD
└── README.md                        # ← You are here
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Create account (candidate/recruiter) | ❌ |
| `POST` | `/api/auth/login` | Login → JWT token | ❌ |
| `GET` | `/api/auth/me` | Get current user profile | ✅ |

### Resume & Profile
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/resume/upload` | Upload PDF → AI-parsed profile | ✅ |
| `GET` | `/api/resume/parsed` | Get parsed profile data | ✅ |
| `GET` | `/api/resume/completeness` | Profile completeness score | ✅ |
| `PUT` | `/api/resume/update` | Update profile fields | ✅ |
| `POST` | `/api/linkedin/import` | Paste text → AI profile parsing | ✅ |

### Jobs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/jobs` | List all jobs with match scores | ✅ |
| `GET` | `/api/jobs/:id` | Job detail + skill comparison | ✅ |
| `POST` | `/api/jobs` | Create job posting (recruiter) | ✅ |
| `POST` | `/api/jobs/:id/apply` | Apply to job | ✅ |
| `GET` | `/api/jobs/match/:id` | Detailed match analysis | ✅ |
| `GET` | `/api/jobs/recruiter/my-jobs` | Recruiter's posted jobs | ✅ |
| `GET` | `/api/jobs/:id/applicants` | Applicants for a job | ✅ |

### AI Interview
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/interview/start` | Start session → 10 dynamic questions | ✅ |
| `POST` | `/api/interview/answer` | Submit text answer → evaluation | ✅ |
| `POST` | `/api/interview/answer/audio` | Submit audio → Whisper STT → evaluation | ✅ |
| `POST` | `/api/interview/integrity` | Log integrity violation (eye/tab) | ✅ |
| `POST` | `/api/interview/end` | End session → generate report | ✅ |
| `GET` | `/api/interview/report/:id` | Get interview report | ✅ |
| `GET` | `/api/interview/history` | List past interviews | ✅ |

### Learning
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/roadmap/generate` | Generate 8-week learning path | ✅ |
| `GET` | `/api/roadmap` | List user's roadmaps | ✅ |
| `GET` | `/api/roadmap/:id` | Roadmap detail with weeks | ✅ |
| `POST` | `/api/quiz/generate` | Generate quiz for a topic | ✅ |
| `POST` | `/api/quiz/submit` | Submit quiz answers → score | ✅ |

### AI Tutor
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/tutor/chat` | Chat with AI tutor | ✅ |
| `POST` | `/api/tutor/upload-doc` | Upload PDF/text for context | ✅ |
| `GET` | `/api/tutor/sessions` | List chat sessions | ✅ |
| `POST` | `/api/tutor/sessions` | Create new session | ✅ |
| `DELETE` | `/api/tutor/sessions/:id` | Delete session | ✅ |

### Other
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/tts/speak` | Text-to-speech (ElevenLabs) | ✅ |
| `GET` | `/api/dashboard/candidate` | Candidate stats overview | ✅ |

---

## 🗄️ Database Schema

### Core Tables (Supabase PostgreSQL)

```sql
profiles          — User profiles (name, role, skills, experience, projects, education)
job_postings      — Job listings (title, company, skills, description, recruiter_id)
applications      — Job applications (user_id, job_id, match_score, status)
interview_sessions — Interview data (questions, answers, scores, integrity_events)
learning_roadmaps — AI-generated learning paths (skill, weeks, progress)
tutor_chats       — AI tutor chat sessions (messages, context documents)
quiz_attempts     — Quiz results (score, answers, feedback)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **Supabase** account (free tier)
- **Groq** API key (free tier — 30 req/min)
- *(Optional)* ElevenLabs API key for premium TTS

### 1. Clone the repository
```bash
git clone https://github.com/nikkkhil2935/MEGAHACK-2026_TEAM_S8UL.git
cd MEGAHACK-2026_TEAM_S8UL
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env   # Then fill in your keys (see below)
node server.js
```

### 3. Frontend setup
```bash
cd frontend
npm install --legacy-peer-deps
npx vite --host
```

### 4. Open in browser
```
http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# AI
GROQ_API_KEY=your_groq_api_key

# Auth
JWT_SECRET=your_jwt_secret_here

# Optional
YOUTUBE_API_KEY=your_youtube_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GMAIL_USER=your_email
GMAIL_PASS=your_app_password
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🎨 Design System

### Theme
- **Light mode** (default): White backgrounds, black text, black buttons with white text
- **Dark mode**: Black backgrounds, white text, white buttons with black text
- Toggle via Sun/Moon button in navbar — persisted in localStorage

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

## 🎤 How the AI Interview Works

```
1. SETUP
   └─ User selects: type (technical/behavioral/HR/mixed),
      difficulty (fresher/mid/senior), language, optional JD

2. QUESTION GENERATION (Groq LLaMA 3.3 70B)
   └─ AI reads user's resume (skills, projects, experience)
   └─ AI reads JD (if provided)
   └─ Generates 10 personalized questions referencing specific
      projects by name, probing skill gaps vs job requirements

3. LIVE INTERVIEW LOOP
   ┌─ AI speaks question (ElevenLabs TTS / browser fallback)
   │  User answers via:
   │    • Voice: MediaRecorder → audio blob → Groq Whisper STT
   │    • Text: Direct typing
   │  AI evaluates answer (STAR framework, filler detection)
   │  If score < 6: AI generates follow-up cross-examination
   └─ Repeat for all 10 questions

4. INTEGRITY MONITORING (during loop)
   ├─ FaceDetector API → gaze tracking (green/yellow/red)
   ├─ Visibility API → tab switch detection
   └─ All violations logged with timestamps

5. REPORT GENERATION
   └─ Overall score, per-question scores, strengths,
      improvements, communication analysis, recommended resources
```

---

## 📸 Screenshots

> Screenshots will be added after final UI polish.

| Page | Description |
|------|-------------|
| Landing | Hero + feature cards |
| Dashboard | Stats + quick actions + recent interviews |
| AI Interview | 70/30 camera/chat split, live voice |
| Interview Report | Scores, charts, detailed feedback |
| Profile | Parsed resume display |
| Jobs | Job cards with match percentages |
| AI Tutor | Chat with document context |
| Roadmap | Weekly learning curriculum |
| Recruiter Dashboard | Job management + applicant stats |

---

## 📈 Development Timeline

| Phase | What Was Built |
|-------|----------------|
| **Phase 1** | Foundation: Auth, Supabase schema, Express API, React app scaffold |
| **Phase 2** | Resume upload + AI parsing, profile management, LinkedIn import |
| **Phase 3** | Job browsing, detail pages, semantic matching, applications |
| **Phase 4** | AI Tutor (NotebookLM-style), Learning Roadmaps, YouTube scraper, Quizzes |
| **Phase 5** | Recruiter Dashboard, Post Jobs, View Applicants, role-based routing |
| **Phase 6** | AI Interview overhaul: Groq Whisper STT, JD upload, ElevenLabs TTS, B&W UI, PWA, responsive, i18n |
| **Phase 7** | Eye tracking (FaceDetector API), tab switch detection, theme toggle (light/dark), UI polish, micro-interactions |
| **Phase 8** | Color system fix (`text-foreground`), navbar light mode, responsive layout fixes, border/bg theme overrides |

---

## 🏆 Key Technical Decisions

| Decision | Why |
|----------|-----|
| **Groq over OpenAI** | Free tier, ultra-fast inference (~200ms), LLaMA 3.3 70B quality |
| **Server-side Whisper** | Browser SpeechRecognition is unreliable; Groq Whisper gives ~95% accuracy |
| **Tailwind v4 `@theme`** | CSS custom properties enable runtime theme switching without JS |
| **Zustand over Redux** | Minimal boilerplate, persist middleware, < 1KB |
| **Chrome FaceDetector** | Zero dependencies, runs at 2fps for gaze tracking, graceful fallback |
| **PWA** | Installable on mobile, offline caching with Workbox |
| **Supabase** | Free PostgreSQL + Auth + instant REST API |

---

## 👥 Team

**Team S8UL** — MEGAHACK 2026

---

## 📄 License

This project was built for MEGAHACK 2026 hackathon.

---

<p align="center">
  <b>CareerBridge AI</b> — Where AI meets your career journey.
</p>
