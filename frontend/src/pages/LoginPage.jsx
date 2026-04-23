import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email, password
      })
      if (error) throw error
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background font-body grain-overlay">
      {/* Left panel: Botanical Illustration */}
      <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
        <div className="relative z-10 text-center max-w-md">
          <div className="text-8xl mb-8">🌾</div>
          <h1 className="text-5xl font-display text-white mb-6 leading-tight">Advanced Grain Analytics</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Harnessing computer vision and deep learning for precise quality assessment of rice and wheat.
          </p>
          
          <div className="mt-12 pt-12 border-t border-white/20 grid grid-cols-2 gap-8 text-left">
            <div>
              <div className="text-3xl font-display text-white mb-2">99.8%</div>
              <div className="text-white/60 text-sm">Detection Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-display text-white mb-2">&lt; 2s</div>
              <div className="text-white/60 text-sm">Analysis Speed</div>
            </div>
          </div>
        </div>
        
        {/* Abstract botanical shapes */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right panel: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-10 lg:hidden flex items-center gap-3">
            <span className="text-3xl">🌾</span>
            <span className="text-2xl font-display font-bold text-primary">GrainScan AI</span>
          </div>

          <header className="mb-10">
            <h2 className="text-4xl font-display text-text-header mb-3">Welcome Back</h2>
            <p className="text-text-body">Login to access your analysis reports and history.</p>
          </header>

          <form onSubmit={handleLogin} className="space-y-6">
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

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-sm font-semibold text-text-header">Password</label>
                <Link to="/forgot-password" title="Coming soon!" className="text-xs text-primary hover:underline font-medium">Forgot Password?</Link>
              </div>
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

            <div className="flex items-center gap-2 px-1">
              <input type="checkbox" id="remember" className="rounded border-surface-border text-primary focus:ring-primary/20 cursor-pointer" />
              <label htmlFor="remember" className="text-sm text-text-body cursor-pointer">Remember me for 30 days</label>
            </div>

            {error && (
              <div className="p-3 bg-status-discolored/10 border border-status-discolored/20 rounded-xl text-status-discolored text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  Sign In to Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-10 text-center">
            <p className="text-text-body text-sm">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline transition-all underline-offset-4">Create dynamic account</Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
