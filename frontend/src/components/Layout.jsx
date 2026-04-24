import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Wheat, Upload, Scan, BarChart3, LogOut, Languages, Globe, Layers } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const NAV = [
    { to: '/',         label: t('nav.home'),      Icon: Wheat },
    { to: '/upload',   label: t('nav.upload'),    Icon: Upload },
    { to: '/scanner',  label: t('nav.scanner'),   Icon: Scan },
    { to: '/batch',    label: t('nav.batch'),     Icon: Layers },
    { to: '/dashboard',label: t('nav.dashboard'), Icon: BarChart3 },
  ]

  const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' }
  ]

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleRoleSwitch = async (newRole) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id)
    
    if (error) {
      console.error('Error switching role:', error)
      alert(`Failed to switch role: ${error.message}`)
    } else {
      window.location.reload()
    }
  }

  const filteredNav = NAV.filter(item => {
    if (profile?.role === 'Quality Inspector') {
      return !['/upload', '/scanner'].includes(item.to)
    }
    return true
  })

  return (
    <div className="min-h-screen flex flex-col bg-background grain-overlay">
      {/* Top nav */}
      <header className="border-b border-surface-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🌾</span>
            <div>
              <span className="font-display font-bold text-xl text-primary tracking-tight">
                GrainScan
              </span>
              <span className="font-display text-xl text-text-body/40 ml-0.5">AI</span>
            </div>
          </NavLink>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {filteredNav.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                  ${isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                    : 'text-text-body hover:text-primary hover:bg-primary/5'
                  }`
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Section: Language + Profile */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative group/lang px-2 py-2">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-surface-border bg-background-soft/50 text-text-body hover:bg-white hover:border-primary/30 transition-all text-xs font-bold uppercase tracking-wider">
                <Globe size={14} className="text-primary/70" />
                <span className="hidden sm:inline">{LANGUAGES.find(l => l.code === i18n.language.split('-')[0])?.label || 'Language'}</span>
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-surface-border rounded-2xl shadow-premium opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all z-[60] p-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all
                      ${(i18n.language.startsWith(lang.code)) 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-text-body hover:bg-background-soft'
                      }
                    `}
                  >
                    <span>{lang.label}</span>
                    <span className="opacity-60">{lang.flag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-3 pl-4 border-l border-surface-border">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm font-bold text-text-header leading-none">{profile?.full_name || 'User'}</span>
                <span className="text-[10px] uppercase tracking-wider text-text-body font-bold mt-1 bg-background px-1.5 py-0.5 rounded border border-surface-border">
                  {profile?.role || 'Member'}
                </span>
              </div>
              
              <div className="relative group">
                <button className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-sm hover:bg-secondary/20 transition-all">
                  {getInitials(profile?.full_name)}
                </button>
                
                {/* Tooltip/Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-surface-border rounded-2xl shadow-premium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                  <div className="p-3 border-b border-surface-border mb-1">
                    <p className="text-xs text-text-body">{t('common.loading') !== 'Loading...' ? t('nav.profile') : 'Logged in as'}</p>
                    <p className="text-sm font-bold text-text-header truncate">{profile?.full_name}</p>
                  </div>
                  
                  {/* Role Switcher (Dev Mode) */}
                  <div className="py-1 border-b border-surface-border mb-1">
                    <p className="px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-text-body/40">{t('nav.switch_role')}</p>
                    {['Laboratory Technician', 'Quality Inspector', 'Farm Manager'].map(r => (
                      <button
                        key={r}
                        onClick={() => handleRoleSwitch(r)}
                        disabled={profile?.role === r}
                        className={`w-full text-left px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${profile?.role === r ? 'bg-primary/5 text-primary' : 'hover:bg-background-soft text-text-body'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-status-discolored hover:bg-status-discolored/5 transition-all"
                  >
                    <LogOut size={16} />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border py-6 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-text-body/40 tracking-widest uppercase mb-1">
          <Wheat size={12} />
          GrainScan AI — {t('upload.specs.title')}
        </div>
        <p className="text-[10px] text-text-body/30">
          Powered by Advanced Computer Vision • Precision Lab Standards
        </p>
      </footer>
      
      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border flex items-center justify-around py-3 px-4 z-50 animate-fade-in shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {filteredNav.map(({ to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `p-3 rounded-2xl transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-text-body'}`
            }
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </nav>
      {/* Mobile nav spacing */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
