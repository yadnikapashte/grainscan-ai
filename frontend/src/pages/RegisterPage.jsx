import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { User, Mail, Lock, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [role, setRole]         = useState('Laboratory Technician')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      })
      if (error) throw error
      alert('Registration successful! Please check your email for confirmation.')
      navigate('/login')
    } catch (err) {
      console.error('Registration error detail:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background font-body grain-overlay">
      {/* Left panel: Info */}
      <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
        <div className="relative z-10 text-center max-w-md">
          <div className="text-8xl mb-8">🌾</div>
          <h1 className="text-5xl font-display text-white mb-6 leading-tight">Join GrainScan AI</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            The world's leading quality analysis system for rice and wheat crops.
          </p>

          <div className="mt-12 space-y-6 text-left">
            {[
              'Real-time grain feature extraction',
              'Advanced quality grading benchmarks',
              'Secure cloud storage for all scan reports',
              'Collaborative management across roles'
            ].map(feat => (
              <div key={feat} className="flex items-center gap-3 text-white">
                <ShieldCheck className="text-secondary" size={20} />
                <span className="text-white/90">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right panel: Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in py-12">
          <header className="mb-10 text-center lg:text-left">
            <div className="mb-6 lg:hidden flex items-center justify-center gap-3">
              <span className="text-3xl">🌾</span>
              <span className="text-2xl font-display font-bold text-primary">GrainScan AI</span>
            </div>
            <h2 className="text-4xl font-display text-text-header mb-3">Create Account</h2>
            <p className="text-text-body">Register for access to advanced grain analysis tools.</p>
          </header>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-text-header mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="John Smith"
                  className="input-field pl-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-body/50" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-header mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="input-field pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-body/50" size={18} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-header mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="input-field pl-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-body/50" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-header mb-1.5 ml-1">Confirm</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="input-field pl-11"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-body/50" size={18} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-header mb-1.5 ml-1">Professional Role</label>
              <select
                className="input-field appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Laboratory Technician">Laboratory Technician</option>
                <option value="Farm Manager">Farm Manager</option>
                <option value="Quality Inspector">Quality Inspector</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-status-discolored/10 border border-status-discolored/20 rounded-xl text-status-discolored text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 group mt-6"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  Register Securely
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-8 text-center sm:text-left">
            <p className="text-text-body text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline transition-all underline-offset-4">Log in here</Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
