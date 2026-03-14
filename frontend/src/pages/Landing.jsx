import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Brain, Target, Shield, Sparkles, ArrowRight, Loader2, FileText, Check, Trophy, Github, TrendingUp, Quote } from 'lucide-react'
import Logo from '../components/common/Logo'
import ScrollReveal from '../components/common/ScrollReveal'
import ScrollVelocity from '../components/common/ScrollVelocity'

const words = ["Engineers", "Designers", "Product Managers", "Leaders", "Innovators"]

const features = [
  { icon: Mic, size: "large", title: 'AI Voice Interview', desc: 'AI speaks questions. You answer verbally. Weak answers get cross-examined in real-time. It feels indistinguishable from a real human interviewer.' },
  { icon: Target, size: "tall", title: 'Smart Job Matching', desc: 'Every job shows your live match %. See exactly which skills you need and where your gaps are before you apply.' },
  { icon: Shield, size: "small", title: 'Integrity Suite', desc: 'Camera + eye tracking + tab switch detection.' },
  { icon: Brain, size: "small", title: 'AI Parsing', desc: 'Extract and structure data from LinkedIn instantly.' },
  { icon: Github, size: "wide", title: 'GitHub Analyzer', desc: 'Deep dive into your open-source impact. Evaluates commit quality, tech stack breadth, and generates actionable improvements.' },
  { icon: TrendingUp, size: "small", title: 'Salary Predictor', desc: 'Accurate dynamic base estimates.' },
  { icon: Trophy, size: "small", title: 'Gamified XP', desc: 'Earn badges and level up as you grow.' },
]

const testimonials = [
  { name: "Sarah J.", role: "Software Engineer", company: "Google", text: "CareerBridge's AI interviews felt incredibly realistic. It properly grilled me on my system design answers." },
  { name: "David M.", role: "Product Designer", company: "Meta", text: "The Smart Match feature is a lifesaver. I finally stop wasting time on jobs where I don't fit the core requirements." },
  { name: "Emily R.", role: "Recent Grad", company: "Spotify", text: "The gamified XP and GitHub analyzer turned my job hunt from a depressing chore into an actual game I wanted to play." },
]

export default function Landing() {
  const [jdText, setJdText] = useState('')
  const [fitResult, setFitResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

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
      <header className="relative z-50 max-w-6xl mx-auto px-6 py-4 flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <span className="font-display font-bold text-xl text-foreground tracking-tight">CareerBridge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors">Sign in</Link>
          <Link to="/register" className="px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-full text-sm font-semibold shadow-md hover:scale-105 transition-transform flex items-center gap-2">
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero Section (Attio Style with Rolling Text) */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-100 dark:bg-surface-800 border border-black/5 dark:border-white/5 text-foreground text-xs font-bold mb-8 shadow-sm">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-black">
              <Sparkles size={10} />
            </span>
            CareerBridge AI — Powered by LLaMA 3.3
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[84px] font-display font-medium text-foreground leading-[1.1] mb-8 tracking-[-0.04em] flex flex-col items-center">
            <span>The career OS for</span>
            <span className="relative overflow-hidden h-[1.3em] w-full text-brand-500 font-bold mt-1">
              <AnimatePresence>
                <motion.span
                  key={wordIndex}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex items-center justify-center w-full"
                >
                  {words[wordIndex]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed tracking-tight">
            AI mock interviews, GitHub code analysis, salary predictions, smart job matching, and gamified progress tracking. Welcome to the future of hiring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-black text-white dark:bg-white dark:text-black rounded-full text-base font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all w-full sm:w-auto flex items-center justify-center">
              Start building for free
            </Link>
            <button onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-white dark:bg-surface-900 text-foreground rounded-full text-base font-semibold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all w-full sm:w-auto border border-black/5 dark:border-white/5 flex items-center justify-center gap-2 group">
              <ArrowRight size={16} className="text-gray-400 group-hover:text-brand-500 transition-colors" /> Explore features
            </button>
          </div>
        </motion.div>
      </section>

      {/* Scrolling Text Layer */}
      <section className="relative z-0 py-10 opacity-40 dark:opacity-20 pointer-events-none">
        <ScrollVelocity
          texts={['AI MOCK INTERVIEWS', 'SMART JOB MATCHING', 'RESUME PARSING']} 
          velocity={40}
          className="text-5xl md:text-8xl font-display font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter"
        />
        <ScrollVelocity
          texts={['GITHUB ANALYZER', 'SALARY PREDICTOR', 'GAMIFIED PROGRESS']} 
          velocity={-40}
          className="text-5xl md:text-8xl font-display font-black text-gray-400 dark:text-gray-500 mt-4 uppercase tracking-tighter"
        />
      </section>

      {/* Revealing Text Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <ScrollReveal
          baseOpacity={0.1}
          enableBlur={true}
          baseRotation={3}
          blurStrength={4}
        >
          The old way of hiring is broken. Resumes get ignored. Candidates feel invisible. Interviews lack depth. What if AI could change everything? Enter CareerBridge.
        </ScrollReveal>
      </section>

      {/* Attio-Style Bento Grid */}
      <section id="features-section" className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-medium text-foreground tracking-tight mb-4">A complete toolkit.</h2>
          <p className="text-lg text-gray-500">Everything you need to showcase your skills and get hired.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[240px]">
          {features.map(({ icon: Icon, size, title, desc }, i) => {
            let spanClass = "md:col-span-1 md:row-span-1"
            if (size === "large") spanClass = "md:col-span-2 md:row-span-2"
            if (size === "tall") spanClass = "md:col-span-1 md:row-span-2"
            if (size === "wide") spanClass = "md:col-span-2 md:row-span-1"

            return (
              <motion.div key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`${spanClass} bg-white dark:bg-[#1f1f1f] rounded-[32px] p-8 relative overflow-hidden group cursor-pointer border border-black/5 dark:border-white/5 hover:shadow-xl transition-all duration-500`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className={`w-12 h-12 rounded-2xl bg-[#f3f4f6] dark:bg-[#2d2d2d] flex items-center justify-center mb-auto shadow-sm text-foreground`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  
                  <div className="mt-8">
                    <h3 className={`font-display font-bold text-xl mb-2 ${size !== 'small' ? 'md:text-2xl' : ''} text-foreground`}>{title}</h3>
                    <p className={`text-gray-600 dark:text-gray-400 font-medium ${size === 'large' ? 'text-lg' : 'text-sm'}`}>{desc}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CareerFit Widget Preview */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-[#1a1a1a] rounded-[48px] p-8 md:p-16 shadow-2xl border border-black/5 dark:border-white/5 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="text-center mb-10 relative z-10">
            <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-bold">
              <Target size={16} /> Instant CareerFit Score
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-medium text-foreground tracking-tight mb-4">Paste a job, discover your gaps.</h2>
            <p className="text-lg text-gray-500 font-medium">No account required. Try our AI matching engine right now.</p>
          </div>

          <div className="max-w-2xl mx-auto relative z-10">
            <div className="relative group">
              <textarea value={jdText} onChange={e => setJdText(e.target.value)}
                placeholder="Paste any job description here (minimum 20 characters)..."
                rows={5}
                className="w-full bg-[#f8f9fa] dark:bg-[#252525] border border-black/5 dark:border-white/10 rounded-[32px] p-8 text-base text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none transition-all font-medium shadow-inner" />
            </div>

            <button onClick={analyzeFit} disabled={analyzing || jdText.length < 20}
              className="mt-6 w-full sm:w-auto px-8 py-4 bg-black text-white dark:bg-white dark:text-black rounded-full text-base font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mx-auto">
              {analyzing ? <><Loader2 size={18} className="animate-spin" /> Processing with AI...</> : <><FileText size={18} /> Analyze Match Potential</>}
            </button>
          </div>

          {fitResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 max-w-3xl mx-auto bg-white dark:bg-[#252525] border border-black/5 dark:border-white/5 rounded-[32px] p-8 shadow-xl relative z-10">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-8 border-b border-black/5 dark:border-white/5">
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground tracking-tight">{fitResult.title}</h3>
                  <div className="text-gray-500 text-sm mt-1">{fitResult.experience_level}</div>
                </div>
                <div className="px-4 py-2 bg-brand-500 text-black text-sm font-bold rounded-xl shadow-sm">
                  Found Matches
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="text-[11px] text-gray-400 mb-3 font-bold uppercase tracking-widest">Required Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {fitResult.skills_needed?.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#f0f1f3] dark:bg-[#333] text-foreground border border-black/5 dark:border-white/5">{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-gray-400 mb-3 font-bold uppercase tracking-widest">Expected Interview Topics</div>
                  <div className="flex flex-wrap gap-2">
                    {fitResult.interview_topics?.map((t, i) => (
                      <span key={i} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="text-[11px] text-gray-400 mb-3 font-bold uppercase tracking-widest">Prep Checklist</div>
                <div className="space-y-3">
                  {fitResult.preparation_tips?.map((tip, i) => (
                    <div key={i} className="flex items-start gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="pt-0.5 leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 p-6 bg-[#f8f9fa] dark:bg-[#1e1e1e] rounded-2xl border border-black/5 dark:border-white/5">
                <p className="text-base text-gray-600 dark:text-gray-400 font-medium italic mb-6">"{fitResult.career_fit_summary}"</p>

                <div className="flex justify-center">
                  <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-full text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    Create account to unlock roadmap <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-medium text-foreground tracking-tight mb-4">Loved by candidates.</h2>
          <p className="text-lg text-gray-500">Don't just take our word for it.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, company, text }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-[32px] p-8 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-xl transition-all"
            >
              <Quote className="text-brand-500 mb-6" size={32} />
              <p className="text-gray-600 dark:text-gray-300 font-medium mb-8 leading-relaxed">"{text}"</p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center font-bold text-foreground">
                  {name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-foreground">{name}</div>
                  <div className="text-xs text-gray-500 font-medium">{role} at {company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/5 py-8 text-center text-gray-400 dark:text-gray-500 text-xs font-medium">
        CareerBridge AI — Built for MEGAHACK 2026 by Team S8UL
      </footer>
    </div>
  )
}
