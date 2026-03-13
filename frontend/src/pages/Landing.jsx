import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, Brain, Target, Shield, Sparkles, ArrowRight, Loader2, FileText, Check } from 'lucide-react'

const features = [
  { icon: Mic, title: 'AI Voice Interview', desc: 'AI speaks questions. You answer verbally. Weak answers get cross-examined.' },
  { icon: Shield, title: 'Integrity Suite', desc: 'Camera + eye tracking + tab detection. Full anti-cheating during mock interviews.' },
  { icon: Target, title: 'Smart Job Matching', desc: 'Every job shows your live match %. See exactly which skills you need.' },
  { icon: Brain, title: 'AI-Powered Parsing', desc: 'Paste LinkedIn URL or upload resume. AI extracts and structures everything.' },
]

export default function Landing() {
  const [jdText, setJdText] = useState('')
  const [fitResult, setFitResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  async function analyzeFit() {
    if (!jdText.trim() || jdText.length < 20) return
    setAnalyzing(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/jobs/careerfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jdText })
      })
      const data = await res.json()
      setFitResult(data)
    } catch { setFitResult(null) }
    finally { setAnalyzing(false) }
  }

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-8">
            <Sparkles size={14} />
            Powered by Groq LLaMA 3.3 70B
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-tight mb-6">
            Your AI Career
            <br />
            <span className="text-foreground">
              Command Center
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            Import your LinkedIn profile, get matched to jobs with live scores,
            practice with an AI interviewer that speaks and cross-examines, and
            track your career growth — all in one platform.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary flex items-center gap-2">
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-ghost">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-card p-6 hover:border-brand-500/20 transition-all hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-brand-400" />
              </div>
              <h3 className="text-foreground font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CareerFit Score */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-brand-400" />
            <h2 className="text-foreground font-display font-bold text-lg">CareerFit Score</h2>
            <span className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-full font-semibold">No Login</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">Paste any job description and instantly see what skills you need.</p>

          <textarea value={jdText} onChange={e => setJdText(e.target.value)}
            placeholder="Paste a job description here..."
            rows={4}
            className="w-full bg-surface-700 border border-white/5 rounded-lg px-4 py-3 text-sm text-foreground placeholder-gray-500 focus:border-brand-500 focus:outline-none resize-none mb-3" />

          <button onClick={analyzeFit} disabled={analyzing || jdText.length < 20}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {analyzing ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : <><FileText size={14} /> Analyze Job</>}
          </button>

          {fitResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-foreground font-semibold">{fitResult.title}</h3>
                <span className="text-xs px-2 py-0.5 bg-surface-700 text-gray-400 rounded">{fitResult.experience_level}</span>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Skills Needed</div>
                <div className="flex flex-wrap gap-1.5">
                  {fitResult.skills_needed?.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Interview Topics</div>
                <div className="flex flex-wrap gap-1.5">
                  {fitResult.interview_topics?.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-surface-700 text-foreground">{t}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Preparation Tips</div>
                <div className="space-y-1">
                  {fitResult.preparation_tips?.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check size={14} className="text-green-400 mt-0.5 shrink-0" /> {tip}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-400 italic">{fitResult.career_fit_summary}</p>

              <Link to="/register" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Create free account to match with this job <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-gray-600 text-xs">
        CareerBridge AI — Built for MEGAHACK 2026 by Team S8UL
      </footer>
    </div>
  )
}
