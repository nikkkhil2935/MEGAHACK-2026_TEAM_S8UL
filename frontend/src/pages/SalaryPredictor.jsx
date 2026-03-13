import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, Award, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'DevOps Engineer', 'Data Scientist',
  'Machine Learning Engineer', 'Product Manager', 'UI/UX Designer',
  'Cloud Architect', 'Mobile Developer', 'Security Engineer'
]

const INDUSTRIES = ['SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'EdTech', 'Gaming', 'Consulting', 'Startup']

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Germany', 'Canada', 'Australia', 'Singapore']

export default function SalaryPredictor() {
  const [form, setForm] = useState({
    targetRole: '',
    industry: '',
    country: 'India',
    employmentType: 'Full-time'
  })
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)

  const handlePredict = async () => {
    if (!form.targetRole || !form.industry) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/salary/predict', form)
      setPrediction(data.prediction)
      toast.success('Salary prediction ready!')
    } catch (err) {
      const msg = err.response?.data?.error || 'Prediction failed. Make sure your profile is complete.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (val, currency) => {
    if (!val) return '-'
    if (currency === 'INR') {
      return val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val.toLocaleString()}`
    }
    return `$${(val / 1000).toFixed(0)}K`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="w-8 h-8" /> Salary Predictor
        </h1>
        <p className="text-foreground/60 mt-1">
          AI-powered compensation analysis based on your profile, GitHub portfolio, and market data.
        </p>
      </div>

      {/* Input Form */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Configure Prediction</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-foreground/70 mb-1 block">Target Role *</label>
            <select
              className="input-field w-full"
              value={form.targetRole}
              onChange={e => setForm({ ...form, targetRole: e.target.value })}
            >
              <option value="">Select a role</option>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-foreground/70 mb-1 block">Industry *</label>
            <select
              className="input-field w-full"
              value={form.industry}
              onChange={e => setForm({ ...form, industry: e.target.value })}
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-foreground/70 mb-1 block">Country / Region</label>
            <select
              className="input-field w-full"
              value={form.country}
              onChange={e => setForm({ ...form, country: e.target.value })}
            >
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-foreground/70 mb-1 block">Employment Type</label>
            <select
              className="input-field w-full"
              value={form.employmentType}
              onChange={e => setForm({ ...form, employmentType: e.target.value })}
            >
              {['Full-time', 'Contract', 'Remote', 'Part-time'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button
          className="btn-primary w-full py-3"
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? 'Analyzing market data...' : 'Predict My Salary Range'}
        </button>
      </div>

      {/* Results */}
      {prediction && (
        <div className="space-y-6">
          {/* Main Range Card */}
          <div className="glass-card p-6 text-center">
            <p className="text-foreground/60 text-sm mb-2">Estimated Salary Range</p>
            <p className="text-4xl font-bold text-foreground">
              {formatSalary(prediction.salaryRange?.min, prediction.salaryRange?.currency)}
              {' — '}
              {formatSalary(prediction.salaryRange?.max, prediction.salaryRange?.currency)}
            </p>
            <p className="text-foreground/60 text-sm mt-1">
              per annum · {prediction.salaryRange?.currency || 'INR'}
            </p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{prediction.confidenceScore}%</p>
                <p className="text-xs text-foreground/60">Confidence</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{prediction.marketDemand}</p>
                <p className="text-xs text-foreground/60">Market Demand</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{prediction.candidatePosition}</p>
                <p className="text-xs text-foreground/60">Your Position</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Experience Bands */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Experience Bands
              </h3>
              <div className="space-y-3">
                {(prediction.experienceBands || []).map((b, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground/70">{b.band}</span>
                      <span className="font-medium">
                        {formatSalary(b.min, prediction.salaryRange?.currency)}
                        {' – '}
                        {formatSalary(b.max, prediction.salaryRange?.currency)}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-700 rounded-full">
                      <div
                        className="h-2 bg-foreground rounded-full"
                        style={{ width: `${Math.min(100, (i + 1) * 33)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Premiums */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-4 h-4" /> Skill Premiums
              </h3>
              <div className="space-y-2">
                {(prediction.skillPremiums || []).map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-foreground/70">{s.skill}</span>
                    <span className="text-sm font-semibold text-green-500">
                      +{s.premiumPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* City Comparison Chart */}
          {(prediction.cityComparisons || []).length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> City-wise Salary Comparison
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={prediction.cityComparisons}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={v => `${(v / 100000).toFixed(0)}L`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={v => [`₹${(v / 100000).toFixed(1)}L`, 'Avg Salary']} />
                  <Bar
                    dataKey="avgSalary"
                    fill="var(--color-foreground)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Actionable Tip */}
          {prediction.actionableTip && (
            <div className="glass-card p-5 border border-foreground/20">
              <p className="text-sm font-semibold text-foreground mb-1">💡 AI Insight</p>
              <p className="text-sm text-foreground/70">{prediction.actionableTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

