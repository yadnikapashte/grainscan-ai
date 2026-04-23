import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scan, Play, Square, Zap, Radio, FolderOpen, AlertCircle, Loader2, ArrowRight, Microscope } from 'lucide-react'
import grainApi from '../services/api'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

export default function ScannerPage() {
  const { user, profile } = useAuth()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [mode, setMode]         = useState('idle')      // idle | live | simulating
  const [status, setStatus]     = useState('')
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [pollCount, setPollCount] = useState(0)
  const [isSaving, setIsSaving]   = useState(false)
  const pollRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      grainApi.stopScanner().catch(() => {})
    }
  }, [])

  if (profile?.role === 'Quality Inspector') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center animate-fade-in relative">
        <div className="w-24 h-24 bg-status-discolored/10 rounded-3xl flex items-center justify-center mx-auto mb-10 text-status-discolored">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-4xl font-display text-text-header mb-4">Access Restricted</h2>
        <p className="text-text-body text-lg mb-10 max-w-lg mx-auto">
          Experimental hardware controls are restricted to <b>Laboratory Technicians</b> and <b>Farm Managers</b>. 
          As an Inspector, your portal is focused on data verification and auditing.
        </p>
        <button onClick={() => nav('/dashboard')} className="btn-primary px-10">
          {t('common.back')} {t('nav.dashboard')}
        </button>
      </div>
    )
  }

  const saveToSupabase = async (scanData) => {
    if (!user) return null
    setIsSaving(true)
    try {
      const { data, error: dbError } = await supabase
        .from('scan_results')
        .insert([{
          user_id: user.id,
          grain_type: scanData.grain_type,
          total_grains: scanData.total_grains,
          quality_counts: scanData.quality_counts,
          quality_percentages: scanData.quality_percentages,
          source: 'Scanner',
          timestamp: new Date().toISOString(),
          annotated_image_url: scanData.annotated_image,
          raw_data: scanData
        }])
        .select('id')
        .single()
      
      if (dbError) throw dbError
      return data?.id
    } catch (err) {
      console.error('Error saving scan result:', err)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  // ── Live scanner mode ──────────────────────────────────────────────────────
  const startLive = async () => {
    setMode('live')
    setError('')
    setStatus(t('scanner.status.processing') + '...')
    try {
      await grainApi.startScanner()
      setStatus(t('scanner.status.live') + '...')

      pollRef.current = setInterval(async () => {
        try {
          const data = await grainApi.scannerStatus()
          setPollCount(c => c + 1)
          if (data.has_result && data.latest_result) {
            const dbId = await saveToSupabase(data.latest_result)
            const resultWithId = { ...data.latest_result, id: dbId }
            setResult(resultWithId)
            setStatus(`${t('scanner.status.live')}: ${new Date().toLocaleTimeString()}`)
          }
        } catch (e) { /* silent ignore */ }
      }, 3000)
    } catch (e) {
      setError(t('common.error'))
      setMode('idle')
    }
  }

  const stopLive = async () => {
    if (pollRef.current) clearInterval(pollRef.current)
    await grainApi.stopScanner().catch(() => {})
    setMode('idle')
    setStatus(t('scanner.status.standby'))
  }

  // ── Simulate scan ──────────────────────────────────────────────────────────
  const simulateScan = async () => {
    setMode('simulating')
    setError('')
    setStatus(t('scanner.status.processing') + '...')
    try {
      const data = await grainApi.simulateScan()
      const dbId = await saveToSupabase(data)
      const resultWithId = { ...data, id: dbId }
      setResult(resultWithId)
      setStatus(t('finish'))
      sessionStorage.setItem('grain_result', JSON.stringify(resultWithId))
    } catch (e) {
      setError(e?.response?.data?.detail || t('common.error'))
    } finally {
      setMode('idle')
    }
  }

  const viewDashboard = () => {
    if (result) {
      sessionStorage.setItem('grain_result', JSON.stringify(result))
      nav('/dashboard')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 animate-fade-in transition-all">
      <header className="mb-12">
        <h1 className="text-4xl font-display text-text-header mb-4 leading-tight">{t('scanner.title')}</h1>
        <p className="text-text-body text-lg max-w-2xl">
          {t('scanner.subtitle')}
        </p>
      </header>

      {/* Control Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <button
          onClick={simulateScan}
          disabled={mode !== 'idle'}
          className="group relative p-8 card-premium text-left disabled:opacity-50 disabled:cursor-not-allowed hover:border-secondary hover:bg-secondary/5"
        >
          <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
            <Zap size={28} />
          </div>
          <h3 className="text-2xl font-display text-text-header mb-2 leading-tight">{t('scanner.modes.simulation')}</h3>
          <div className="mt-6 flex items-center gap-2 text-secondary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            {t('common.next')} <ArrowRight size={16} />
          </div>
        </button>

        <button
          onClick={mode === 'live' ? stopLive : startLive}
          disabled={mode === 'simulating'}
          className={`group relative p-8 card-premium text-left transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
            ${mode === 'live'
              ? 'border-status-discolored/40 bg-status-discolored/5 hover:bg-status-discolored/10'
              : 'hover:border-primary hover:bg-primary/5'
            }
          `}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${mode === 'live' ? 'bg-status-discolored/10 text-status-discolored' : 'bg-primary/10 text-primary'}`}>
            {mode === 'live' ? <Square size={28} /> : <Scan size={28} />}
          </div>
          <h3 className="text-2xl font-display text-text-header mb-2 leading-tight">
            {mode === 'live' ? t('scanner.modes.stop') : t('scanner.modes.live')}
          </h3>
          <div className="mt-6 flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            {mode === 'live' ? <span className="text-status-discolored">{t('scanner.modes.stop')}</span> : <span className="text-primary">{t('scanner.modes.live')}</span>}
            <ArrowRight size={16} />
          </div>
        </button>

        <div className="p-8 card-premium text-left bg-background-soft/50">
          <div className="w-14 h-14 bg-text-body/10 rounded-2xl flex items-center justify-center text-text-body/60 mb-6 font-mono font-bold text-xs">DIR</div>
          <h3 className="text-2xl font-display text-text-header mb-2 leading-tight">Directory Watch</h3>
          <p className="text-text-body text-sm mb-4 font-mono leading-none py-2 px-3 bg-white border border-surface-border rounded-lg break-all">
            ./scanner_watch/
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-8 flex items-start gap-3 p-4 rounded-2xl bg-status-discolored/10 border border-status-discolored/20 text-status-discolored animate-shake">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm font-semibold">{error}</div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className={`
             rounded-3xl border-2 overflow-hidden bg-white shadow-premium transition-all duration-700
            ${mode !== 'idle' ? 'ring-8 ring-primary/5' : 'border-surface-border'}
            ${mode === 'live' ? 'border-primary' : mode === 'simulating' ? 'border-secondary' : ''}
          `}>
            {/* Viewport Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-surface-border bg-background-soft/30 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${mode !== 'idle' ? 'bg-status-normal animate-pulse shadow-[0_0_8px_var(--tw-shadow-color)] shadow-status-normal' : 'bg-text-body/20'}`} />
                <span className="font-display font-bold text-sm tracking-widest text-text-header uppercase">
                  {t('scanner.status.standby')}: {mode === 'live' ? t('scanner.status.live') : mode === 'simulating' ? t('scanner.status.processing') : t('scanner.status.standby')}
                </span>
              </div>
            </div>

            {/* Viewport Content */}
            <div className="aspect-[16/10] bg-[#0E0E0C] flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              
              {/* Scanline FX */}
              {mode !== 'idle' && (
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden h-full w-full">
                  <div className="absolute h-[1px] w-full bg-primary/40 shadow-[0_0_15_rgba(45,106,79,0.8)] animate-scan-line top-0 left-0" />
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-20 pointer-events-none" />
                </div>
              )}

              {result?.annotated_image ? (
                <img
                  src={result.annotated_image}
                  alt="Laboratory capture result"
                  className="max-h-full max-w-full object-contain relative z-10 animate-fade-in"
                />
              ) : (
                <div className="text-center space-y-4 px-12 relative z-20">
                  <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center mx-auto text-white/10 group-hover:text-white/30 transition-colors">
                    <Scan size={36} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-display text-xl">
                      {mode === 'live' ? t('common.loading') : t('scanner.status.standby')}
                    </p>
                  </div>
                </div>
              )}

              {/* Status bar inside viewport */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full z-30">
                 <span className="text-white/80 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                   {mode !== 'idle' && <Loader2 size={12} className="animate-spin text-primary" />}
                   {status || t('scanner.status.standby')}
                 </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Results */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-premium p-8 h-full flex flex-col">
            <h3 className="text-lg font-display text-text-header mb-8 pb-4 border-b border-surface-border">{t('dashboard.charts.quantity')}</h3>
            
            {result ? (
              <div className="flex-1 space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: t('dashboard.metrics.variant'),     value: result.grain_type, icon: <span className="mb-2 block">🌾</span> },
                    { label: t('dashboard.metrics.total'),     value: result.total_grains, icon: <span className="mb-2 block">🧪</span> },
                    { label: t('common.verified'),    value: `${result.quality_percentages?.Normal ?? 0}%`, icon: <span className="mb-2 block">✅</span> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="p-4 rounded-2xl bg-background-soft border border-surface-border text-center group hover:bg-white transition-all">
                      <div className="text-2xl group-hover:scale-110 transition-transform">{icon}</div>
                      <p className="text-2xl font-display font-bold text-primary mb-1 underline-offset-4 decoration-primary/30 group-hover:underline">{value}</p>
                      <p className="text-[10px] uppercase font-bold text-text-body tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-6 mt-auto">
                   <button
                    onClick={viewDashboard}
                    className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-2"
                  >
                    {t('nav.dashboard')}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-12">
                <Microscope size={48} className="mb-6 stroke-1" />
                <p className="text-sm font-display font-bold text-text-header uppercase tracking-wider mb-2">{t('scanner.status.standby')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
