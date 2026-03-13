import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, Brain, Target, Shield, Sparkles, ArrowRight } from 'lucide-react'

const features = [
  { icon: Mic, title: 'AI Voice Interview', desc: 'AI speaks questions. You answer verbally. Weak answers get cross-examined.' },
  { icon: Shield, title: 'Integrity Suite', desc: 'Camera + eye tracking + tab detection. Full anti-cheating during mock interviews.' },
  { icon: Target, title: 'Smart Job Matching', desc: 'Every job shows your live match %. See exactly which skills you need.' },
  { icon: Brain, title: 'AI-Powered Parsing', desc: 'Paste LinkedIn URL or upload resume. AI extracts and structures everything.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-900">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-8">
            <Sparkles size={14} />
            Powered by Groq LLaMA 3.3 70B
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight mb-6">
            Your AI Career
            <br />
            <span className="text-white">
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
              className="glass-card p-6 hover:border-brand-500/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-brand-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-gray-600 text-xs">
        CareerBridge AI — Built for MEGAHACK 2026 by Team S8UL
      </footer>
    </div>
  )
}
