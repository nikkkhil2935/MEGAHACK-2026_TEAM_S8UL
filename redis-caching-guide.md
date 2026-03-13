# ⚡ Redis Caching — CareerBridge AI

> Protect your Groq rate limits and make your app feel instant during the demo.

---

## 📦 Step 1 — Install Redis Client

```bash
cd backend
npm install redis
```

---

## 🔐 Step 2 — Add Redis URL to Your .env

```env
# backend/.env — add this line
REDIS_URL=redis://localhost:6379
```

> We'll replace this with your Upstash URL before deployment. For now this works locally.

---

## 🛠️ Step 3 — Create the Cache Helper

Create a new file `backend/services/cache.js`:

```javascript
import { createClient } from 'redis'

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

// Log connection status
redis.on('connect', () => {
  console.log('✅ Redis connected — caching is ON')
})

redis.on('error', (err) => {
  console.warn('⚠️  Redis not available — caching is OFF:', err.message)
})

// Connect to Redis
// Even if this fails, your app will still work — just without caching
redis.connect().catch((err) => {
  console.warn('Redis unavailable, running without cache:', err.message)
})

/**
 * GET a value from cache
 * Returns the cached value, or null if not found
 */
export const cacheGet = async (key) => {
  try {
    const value = await redis.get(key)
    if (value) {
      console.log(`📦 Cache HIT → ${key}`)
      return JSON.parse(value)
    }
    console.log(`❌ Cache MISS → ${key}`)
    return null
  } catch {
    return null  // if Redis is down, just return null — app keeps working
  }
}

/**
 * SET a value in cache
 * ttlSeconds = how long to keep it (default: 1 hour)
 */
export const cacheSet = async (key, value, ttlSeconds = 3600) => {
  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value))
    console.log(`💾 Cached → ${key} (expires in ${ttlSeconds}s)`)
  } catch {
    // if Redis is down, silently skip — never crash the app
  }
}

/**
 * DELETE a value from cache
 * Use this when underlying data changes
 */
export const cacheDel = async (key) => {
  try {
    await redis.del(key)
    console.log(`🗑️  Cache cleared → ${key}`)
  } catch {
    // silently skip
  }
}

export default redis
```

> **Important:** Every function has a try/catch. If Redis goes down during your demo, your app continues working normally — it just won't be cached. Redis failure will **never** crash your app.

---

## 🔧 Step 4 — Add Caching to Your Routes

### 4a. Job Listings — `backend/routes/jobs.js`

This is your **biggest win**. Every user who opens the Jobs page triggers Groq to calculate match scores. Cache it so only the first call hits Groq.

```javascript
// Add this import at the top of jobs.js
import { cacheGet, cacheSet, cacheDel } from '../services/cache.js'


// ─── GET /api/jobs — List all jobs with match scores ───────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // 1. Check cache first
    const cacheKey = `jobs:list:${userId}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return res.json({ jobs: cached })  // instant response ⚡
    }

    // 2. Cache miss — call Groq as usual
    // ... your existing job fetching + match scoring code here ...
    const jobsWithScores = await getJobsWithMatchScores(userId)  // your existing function

    // 3. Save to cache for 30 minutes
    await cacheSet(cacheKey, jobsWithScores, 1800)

    res.json({ jobs: jobsWithScores })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// ─── GET /api/jobs/:id — Single job detail with match analysis ──────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // 1. Check cache first
    const cacheKey = `job:detail:${id}:${userId}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return res.json(cached)  // instant response ⚡
    }

    // 2. Cache miss — run your existing logic
    // ... your existing job detail + skill comparison code here ...
    const result = await getJobDetailWithMatch(id, userId)  // your existing function

    // 3. Cache for 1 hour
    await cacheSet(cacheKey, result, 3600)

    res.json(result)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

---

### 4b. Learning Roadmaps — `backend/routes/roadmap.js`

Roadmap generation is one of the heaviest Groq calls (8-week curriculum). Same input always gives same output — perfect for caching.

```javascript
// Add this import at the top of roadmap.js
import { cacheGet, cacheSet } from '../services/cache.js'


// ─── POST /api/roadmap/generate — Generate 8-week learning path ─────────────
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { skill, currentLevel } = req.body
    const userId = req.user.id

    // 1. Check cache first
    // Same user + same skill + same level = same roadmap, safe to cache
    const cacheKey = `roadmap:${userId}:${skill}:${currentLevel}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return res.json({ roadmap: cached })  // instant response ⚡
    }

    // 2. Cache miss — call Groq as usual
    // ... your existing roadmap generation code here ...
    const roadmap = await generateRoadmap(skill, currentLevel, userId)  // your existing function

    // 3. Cache for 24 hours — roadmaps don't change
    await cacheSet(cacheKey, roadmap, 86400)

    res.json({ roadmap })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// ─── GET /api/roadmap/:id — Get roadmap detail ──────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // 1. Check cache
    const cacheKey = `roadmap:detail:${id}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return res.json(cached)  // instant response ⚡
    }

    // 2. Cache miss — fetch from DB
    // ... your existing roadmap fetch code here ...
    const roadmap = await getRoadmapById(id)  // your existing function

    // 3. Cache for 24 hours
    await cacheSet(cacheKey, roadmap, 86400)

    res.json(roadmap)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

---

### 4c. Quiz Questions — `backend/routes/quiz.js`

Quiz questions for the same topic are reusable across all users. One Groq call serves everyone.

```javascript
// Add this import at the top of quiz.js
import { cacheGet, cacheSet } from '../services/cache.js'


// ─── POST /api/quiz/generate — Generate quiz questions ──────────────────────
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { topic, week, difficulty } = req.body

    // 1. Check cache
    // Note: no userId here — quiz questions are same for everyone on same topic
    const cacheKey = `quiz:${topic}:week${week}:${difficulty}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return res.json({ questions: cached })  // instant response ⚡
    }

    // 2. Cache miss — call Groq
    // ... your existing quiz generation code here ...
    const questions = await generateQuizQuestions(topic, week, difficulty)  // your existing function

    // 3. Cache for 12 hours
    await cacheSet(cacheKey, questions, 43200)

    res.json({ questions })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

---

### 4d. Resume Parsed Data — `backend/routes/resume.js`

Parsed resume data doesn't change unless the user uploads a new resume. Safe to cache heavily.

```javascript
// Add this import at the top of resume.js
import { cacheGet, cacheSet, cacheDel } from '../services/cache.js'


// ─── GET /api/resume/parsed — Get user's parsed profile ─────────────────────
router.get('/parsed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // 1. Check cache
    const cacheKey = `resume:parsed:${userId}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return res.json(cached)  // instant response ⚡
    }

    // 2. Cache miss — fetch from Supabase
    // ... your existing resume fetch code here ...
    const profile = await getParsedProfile(userId)  // your existing function

    // 3. Cache for 6 hours
    await cacheSet(cacheKey, profile, 21600)

    res.json(profile)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// ─── POST /api/resume/upload — Upload new resume ────────────────────────────
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // ... your existing resume upload + parse code here ...
    const parsedProfile = await parseResume(req.file)  // your existing function

    // Clear old cached resume — user uploaded a new one
    await cacheDel(`resume:parsed:${userId}`)

    // Also clear job match cache — skills may have changed
    await cacheDel(`jobs:list:${userId}`)

    res.json({ profile: parsedProfile })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

> **Why clear cache on upload?** If a user uploads a new resume with new skills, their old job match scores are now wrong. Clearing the cache forces a fresh Groq calculation next time they view jobs.

---

## 📊 Step 5 — Add Cache Stats to Dashboard

Add this to `backend/routes/dashboard.js` so you can show a live cache hit rate during your demo:

```javascript
// Add this import at the top of dashboard.js
import redis from '../services/cache.js'


// ─── GET /api/dashboard/cache-stats ─────────────────────────────────────────
router.get('/cache-stats', authenticateToken, async (req, res) => {
  try {
    const info = await redis.info('stats')

    const hits   = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1]   || 0)
    const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || 0)
    const total  = hits + misses

    res.json({
      cache_hits:   hits,
      cache_misses: misses,
      hit_rate:     total > 0 ? `${Math.round((hits / total) * 100)}%` : '0%',
      status:       'Redis connected ✅'
    })

  } catch {
    res.json({
      status:   'Redis unavailable ⚠️',
      hit_rate: 'N/A'
    })
  }
})
```

During your demo, open this endpoint and show judges the hit rate going up as they use the app. 🎯

---

## 🌐 Step 6 — Set Up Free Redis on Upstash (For Render)

Your Render backend needs a Redis URL that works in production. Use **Upstash** — it's completely free.

### Setup (5 minutes)

1. Go to [upstash.com](https://upstash.com) and sign up free
2. Click **Create Database**
3. Name it `careerbridge-redis`
4. Select the region **closest to your Render server** (usually US East)
5. Click **Create**
6. On the database page, copy the **Redis URL** — looks like:
   ```
   redis://default:xxxxxxxxxxxx@us1-xxxxx.upstash.io:6379
   ```

### Add to Render

1. Go to your [Render Dashboard](https://render.com)
2. Select your backend service
3. Click **Environment** tab
4. Add new variable:
   ```
   Key:   REDIS_URL
   Value: redis://default:xxxx@us1-xxxx.upstash.io:6379
   ```
5. Click **Save Changes** → Render auto-redeploys

That's it. Your production backend now has Redis caching. ✅

---

## 🧪 Step 7 — Test It Locally

### Install Redis on your machine

**Mac:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Download from [github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)

**Ubuntu/Linux:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

### Verify Redis is running
```bash
redis-cli ping
# Should print: PONG
```

### Start your backend and watch the logs
```bash
cd backend
node server.js
```

You should see:
```
✅ Redis connected — caching is ON
```

### Test caching in action

1. Open your app → go to Jobs page
2. Check your backend terminal — you'll see:
   ```
   ❌ Cache MISS → jobs:list:user123   (first time, calls Groq)
   ```
3. Refresh the Jobs page
4. Check terminal again — you'll see:
   ```
   📦 Cache HIT → jobs:list:user123   (instant, no Groq call!)
   ```

---

## 📋 Complete Summary — What Gets Cached

| Route | Cache Key | Expires | Groq Calls Saved |
|-------|-----------|---------|-----------------|
| `GET /api/jobs` | `jobs:list:{userId}` | 30 min | Every page refresh |
| `GET /api/jobs/:id` | `job:detail:{id}:{userId}` | 1 hour | Every job detail view |
| `POST /api/roadmap/generate` | `roadmap:{userId}:{skill}:{level}` | 24 hours | Every roadmap generation |
| `GET /api/roadmap/:id` | `roadmap:detail:{id}` | 24 hours | Every roadmap view |
| `POST /api/quiz/generate` | `quiz:{topic}:{week}:{difficulty}` | 12 hours | Every quiz load |
| `GET /api/resume/parsed` | `resume:parsed:{userId}` | 6 hours | Every profile view |

---

## ⚠️ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `Cannot find module 'redis'` | Run `npm install redis` in `/backend` |
| `Redis connected` but no caching | Make sure you imported `cacheGet`/`cacheSet` correctly |
| Old data showing after resume upload | Make sure `cacheDel` is called in your upload route |
| Upstash URL not working on Render | Double-check `REDIS_URL` environment variable is saved in Render |
| App crashes when Redis is down | All cache functions have try/catch — app should never crash from Redis |

---

## 🏁 Final Checklist

```
□ npm install redis  (in /backend)
□ Created backend/services/cache.js
□ Added caching to jobs.js
□ Added caching to roadmap.js
□ Added caching to quiz.js
□ Added cache invalidation to resume.js (upload route)
□ Added /cache-stats endpoint to dashboard.js
□ Created free Upstash Redis database
□ Added REDIS_URL to Render environment variables
□ Tested locally — seeing Cache HIT logs in terminal
```
