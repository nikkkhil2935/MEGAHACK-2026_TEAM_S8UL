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
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-surface-900 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#c1ff72]/20 rounded-full blur-[100px] z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px] z-0" />

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-[#c1ff72] font-bold shadow-md">CB</div>
          <span className="font-display font-semibold text-xl text-foreground">CareerBridge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors">Log in</Link>
          <Link to="/register" className="px-5 py-2.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform">Sign up free</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-surface-700 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#c1ff72] animate-pulse" />
            AI-Powered Career OS
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-tight mb-6 tracking-tight">
            Master your career.
            <br />
            <span className="text-gray-400">Land your dream job.</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 font-medium">
            Import your LinkedIn profile, get matched to jobs with live scores,
            practice with an AI interviewer that speaks and cross-examines, and
            track your career growth — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-[#c1ff72] text-black rounded-2xl text-base font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all w-full sm:w-auto flex items-center justify-center gap-2">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="px-8 py-4 bg-white dark:bg-surface-800 text-black dark:text-white rounded-2xl text-base font-bold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all w-full sm:w-auto border border-gray-100 dark:border-white/5">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Showcase grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white dark:bg-surface-700/80 p-8 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-[16px] bg-[#f8f9fa] dark:bg-surface-900 border border-gray-100 dark:border-white/5 flex items-center justify-center mb-6 shadow-sm">
                <Icon size={22} className="text-black dark:text-white" />
              </div>
              <h3 className="text-foreground font-bold text-lg mb-3 tracking-tight">{title}</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CareerFit Widget Preview */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          className="bg-white dark:bg-surface-800 rounded-[40px] p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-white/5">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Target size={24} className="text-[#c1ff72]" />
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">CareerFit Score</h2>
              <span className="text-[10px] px-3 py-1 bg-[#c1ff72] text-black rounded-full font-bold ml-2">No Login Req.</span>
            </div>
            <p className="text-gray-500 font-medium">Paste any job description and instantly see what skills you need.</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <textarea value={jdText} onChange={e => setJdText(e.target.value)}
              placeholder="Paste a job description here..."
              rows={4}
              className="w-full bg-[#f8f9fa] dark:bg-surface-900 border-2 border-gray-100 dark:border-surface-600 rounded-[24px] p-5 text-sm text-foreground placeholder-gray-400 focus:border-[#c1ff72] dark:focus:border-[#c1ff72] focus:outline-none resize-none mb-4 transition-colors font-medium shadow-inner" />

            <button onClick={analyzeFit} disabled={analyzing || jdText.length < 20}
              className="w-full sm:w-auto px-8 py-4 bg-[#1a1a1a] dark:bg-white text-white dark:text-black rounded-2xl text-sm font-bold shadow-md hover:bg-black dark:hover:bg-gray-100 transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mx-auto">
              {analyzing ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><FileText size={16} /> Analyze Job</>}
            </button>
          </div>

          {fitResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-10 max-w-2xl mx-auto bg-[#f8f9fa] dark:bg-surface-900 border border-gray-100 dark:border-surface-600 rounded-[24px] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h3 className="text-lg font-bold text-foreground">{fitResult.title}</h3>
                <span className="text-xs px-3 py-1 font-bold bg-[#c1ff72] text-black rounded-full whitespace-nowrap self-start sm:self-auto">{fitResult.experience_level}</span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-widest">Core Skills Needed</div>
                  <div className="flex flex-wrap gap-2">
                    {fitResult.skills_needed?.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-white dark:bg-surface-700 text-foreground border border-gray-200 dark:border-surface-600 shadow-sm">{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-widest">Interview Topics</div>
                  <div className="flex flex-wrap gap-2">
                    {fitResult.interview_topics?.map((t, i) => (
                      <span key={i} className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-gray-100 dark:bg-surface-800 text-foreground border border-gray-200 dark:border-surface-600 shadow-sm">{t}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-widest">Prep Checklist</div>
                  <div className="space-y-2">
                    {fitResult.preparation_tips?.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                        <div className="w-5 h-5 rounded-full bg-[#c1ff72]/20 text-[#9add50] flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={10} strokeWidth={3} />
                        </div>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-surface-600">
                <p className="text-sm text-gray-500 font-medium italic mb-6 leading-relaxed">"{fitResult.career_fit_summary}"</p>

                <div className="flex justify-center">
                  <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] dark:bg-white text-white dark:text-black rounded-2xl text-sm font-bold shadow-md hover:bg-black dark:hover:bg-gray-100 transition-all hover:-translate-y-0.5">
                    Create free account to match with this job <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/5 py-8 text-center text-gray-400 dark:text-gray-500 text-xs font-medium">
        CareerBridge AI — Built for MEGAHACK 2026 by Team S8UL
      </footer>
    </div>
  )
}
