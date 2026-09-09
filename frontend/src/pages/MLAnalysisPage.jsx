import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Brain, Zap, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, ShieldCheck, AlertCircle, Loader2,
  Target, Activity, TrendingUp, BarChart3, Info, Eye, Sparkles,
  Upload, ImageIcon, X
} from 'lucide-react'
import grainApi, { BASE_URL } from '../services/api'
import { useTranslation } from 'react-i18next'
// ── Confidence Helper ─────────────────────────────────────────────────────────
function getConfidenceMeta(conf) {
  if (conf >= 0.80) return { level: 'High', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500', note: null }
  if (conf >= 0.60) return { level: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', bar: 'bg-amber-400', note: null }
  return { level: 'Low', color: 'text-red-600', bg: 'bg-red-50 border-red-200', bar: 'bg-red-500', note: null }
}

// ── Action Helper ─────────────────────────────────────────────────────────────
const REMEDY_ICONS = {
  Normal: <CheckCircle2 size={20} />,
  Broken: <AlertTriangle size={20} />,
  Chalky: <AlertTriangle size={20} />,
  Discolored: <AlertCircle size={20} />
}
const REMEDY_COLORS = {
  Normal: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Broken: 'text-amber-700 bg-amber-50 border-amber-200',
  Chalky: 'text-amber-700 bg-amber-50 border-amber-200',
  Discolored: 'text-red-700 bg-red-50 border-red-200'
}

function getRemedies(grain, t) {
  if (!grain) return null
  const conf = grain.confidence || 0
  const quality = grain.quality || 'Normal'
  const base = t(`ml_analysis_new.remedies.${quality}`, { returnObjects: true }) || t(`ml_analysis_new.remedies.Normal`, { returnObjects: true })
  const icon = REMEDY_ICONS[quality] || REMEDY_ICONS.Normal
  const color = REMEDY_COLORS[quality] || REMEDY_COLORS.Normal
  const lowConfNote = conf < 0.60 ? t('ml_analysis_new.confidence.low_note') : null
  return { ...base, icon, color, lowConfNote }
}

// ── Dynamic AI Summary ────────────────────────────────────────────────────────
function buildSummary(result, t) {
  if (!result) return ''
  const { total_grains, quality_counts, grain_type } = result
  const normal = quality_counts?.Normal || 0
  const pct = total_grains > 0 ? Math.round((normal / total_grains) * 100) : 0
  const defects = total_grains - normal

  if (pct === 100) return t('ml_analysis_new.summary.pct_100', { count: total_grains, type: grain_type })
  if (pct >= 80) return t('ml_analysis_new.summary.pct_80', { pct, count: total_grains, type: grain_type, defects })
  if (pct >= 50) return t('ml_analysis_new.summary.pct_50', { pct, count: total_grains, type: grain_type, defects })
  return t('ml_analysis_new.summary.pct_bad', { pct, count: total_grains, type: grain_type })
}

// ── Upload Panel ──────────────────────────────────────────────────────────────
function UploadPanel({ onResult }) {
  const { t } = useTranslation()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError(t('ml_analysis_new.upload.err_invalid'))
      return
    }
    setError(null)
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const result = await grainApi.upload(file)
      onResult(result)
    } catch (e) {
      setError(t('ml_analysis_new.upload.err_fail'))
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div className="card-premium p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Upload size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-display text-text-header">{t('ml_analysis_new.upload.title')}</h2>
          <p className="text-xs text-text-body/50">{t('ml_analysis_new.upload.desc')}</p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${dragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-surface-border bg-background-soft hover:border-primary/50 hover:bg-primary/5'
          }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {uploading ? (
          <>
            <Loader2 size={40} className="text-primary animate-spin" />
            <p className="text-sm font-bold text-text-header">{t('ml_analysis_new.upload.analyzing')}</p>
            <p className="text-xs text-text-body/40">{t('ml_analysis_new.upload.analyzing_sub')}</p>
          </>
        ) : preview ? (
          <>
            <img src={preview} alt="Preview" className="max-h-32 rounded-2xl shadow-lg object-contain" />
            <p className="text-xs text-text-body/40">{t('ml_analysis_new.upload.processing')}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-surface-border flex items-center justify-center">
              <ImageIcon size={28} className="text-primary/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-text-header">{t('ml_analysis_new.upload.drop_title')}</p>
              <p className="text-xs text-text-body/40 mt-1">{t('ml_analysis_new.upload.drop_desc')}</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

// ── Grad-CAM Panel ────────────────────────────────────────────────────────────
function GradCamPanel({ resultId, grain, grainIdx }) {
  const { t } = useTranslation()
  const [xai, setXai] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchExplanation = useCallback(async () => {
    if (!resultId || grainIdx === null) return
    setLoading(true)
    setError(null)
    try {
      const data = await grainApi.getExplanation(resultId, grainIdx)
      setXai(data)
    } catch (e) {
      setError(t('ml_analysis_new.xai.error'))
    } finally {
      setLoading(false)
    }
  }, [resultId, grainIdx])

  useEffect(() => { fetchExplanation() }, [fetchExplanation])

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-text-body/50">
      <Loader2 size={24} className="animate-spin text-primary" />
      <span className="text-sm font-medium">{t('ml_analysis_new.xai.generating')}</span>
    </div>
  )

  if (error) return (
    <div className="text-center py-10 text-sm text-text-body/60">
      <AlertCircle size={32} className="mx-auto mb-3 text-amber-400" />
      {error}
    </div>
  )

  if (!xai) return null

  const panels = [
    { label: t('ml_analysis_new.xai.original.title'), src: xai.original, desc: t('ml_analysis_new.xai.original.desc') },
    { label: t('ml_analysis_new.xai.heatmap.title'), src: xai.heatmap, desc: t('ml_analysis_new.xai.heatmap.desc') },
    { label: t('ml_analysis_new.xai.overlay.title'), src: xai.overlay, desc: t('ml_analysis_new.xai.overlay.desc') },
  ]

  return (
    <div className="space-y-4">
      {xai.error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
          <AlertTriangle size={14} className="shrink-0" />
          {xai.error}
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        {panels.map((p, i) => (
          <div key={i} className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-body/40 text-center">{p.label}</p>
            {p.src ? (
              <div className="bg-[#F5F3EE] rounded-2xl p-2 border border-surface-border">
                <img
                  src={p.src}
                  alt={p.label}
                  className="w-full rounded-xl object-contain max-h-44 cursor-zoom-in hover:scale-105 transition-transform"
                  onClick={() => window.open(p.src, '_blank')}
                />
              </div>
            ) : (
              <div className="bg-surface-alt rounded-2xl p-2 border border-dashed border-surface-border flex items-center justify-center h-44 text-xs text-text-body/40">
                {t('ml_analysis_new.xai.not_avail')}
              </div>
            )}
            <p className="text-[9px] text-text-body/40 text-center italic">{p.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 text-xs text-text-body/60">
        <Info size={14} className="text-primary mt-0.5 shrink-0" />
        <span>
          {t('ml_analysis_new.xai.prediction_note')} <strong className="text-text-header">{xai.label}</strong> {t('ml_analysis_new.xai.prediction_confidence', { conf: (xai.confidence * 100).toFixed(1) })}
          {' '}{t('ml_analysis_new.xai.prediction_disclaimer')}
        </span>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MLAnalysisPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const resultId = searchParams.get('result')

  const [scanResult, setScanResult] = useState(null)
  const [loadingScan, setLoadingScan] = useState(false)

  const [mlData, setMlData] = useState(null)
  const [loadingMl, setLoadingMl] = useState(true)

  const [selectedGrainIdx, setSelectedGrainIdx] = useState(0)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Fetch ML metrics (for advanced section)
  useEffect(() => {
    grainApi.getMlMetrics()
      .then(setMlData)
      .catch(() => setMlData(null))
      .finally(() => setLoadingMl(false))
  }, [])

  // Fetch scan result if result ID is in URL
  useEffect(() => {
    if (!resultId) { setScanResult(null); return }
    setLoadingScan(true)
    grainApi.getResult(resultId)
      .then(setScanResult)
      .catch(() => setScanResult(null))
      .finally(() => setLoadingScan(false))
  }, [resultId])

  // Handle a freshly uploaded result (from the UploadPanel on this page)
  const handleUploadResult = (result) => {
    setScanResult(result)
    setSelectedGrainIdx(0)
    // Keep the URL in sync so the page is shareable / refreshable
    setSearchParams({ result: result.id })
  }

  const clearResult = () => {
    setScanResult(null)
    setSearchParams({})
  }

  const selectedGrain = scanResult?.grains?.[selectedGrainIdx] || null
  const confMeta = selectedGrain ? getConfidenceMeta(selectedGrain.confidence) : null
  const summary = buildSummary(scanResult, t)

  // Chart data
  const COLORS = { train: '#2D6A4F', val: '#FFB800' }
  const chartData = mlData
    ? (mlData.history?.train_loss || []).map((_, i) => ({
      epoch: i + 1,
      train_loss: mlData.history.train_loss?.[i],
      val_loss: mlData.history.val_loss?.[i],
      train_acc: mlData.history.train_acc?.[i],
      val_acc: mlData.history.val_acc?.[i],
    }))
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-fade-in space-y-10">

      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
            <Sparkles size={13} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('ml_analysis_new.header.badge')}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-display text-text-header leading-tight">
            {t('ml_analysis_new.header.title')}
          </h1>
          <p className="text-text-body text-base max-w-2xl">
            {t('ml_analysis_new.header.desc')}
          </p>
        </div>
        {scanResult && (
          <button
            onClick={clearResult}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-surface-border text-sm text-text-body/60 hover:border-primary/30 hover:text-primary transition-all"
          >
            <X size={16} />
            {t('ml_analysis_new.header.analyze_diff')}
          </button>
        )}
      </header>

      {/* ── Upload Panel (shown when no scan is loaded) ── */}
      {!scanResult && !loadingScan && (
        <>
          <UploadPanel onResult={handleUploadResult} />
          <div className="flex items-center gap-4 text-text-body/30 text-xs font-bold uppercase tracking-widest">
            <div className="flex-1 h-px bg-surface-border" />
            {t('ml_analysis_new.header.or_dashboard')}
            <div className="flex-1 h-px bg-surface-border" />
          </div>
        </>
      )}

      {/* ── Scan Loading ── */}
      {loadingScan && (
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <span className="text-sm text-text-body/50">Loading scan data…</span>
        </div>
      )}

      {/* ── Main Insight Sections ── */}
      {scanResult && (
        <div className="space-y-8">

          {/* ── 1. AI Summary ── */}
          <section className="card-premium p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Brain size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display text-text-header">{t('ml_analysis_new.summary.title')}</h2>
                <p className="text-xs text-text-body/50">{t('ml_analysis_new.summary.subtitle')}</p>
              </div>
            </div>
            <div className="px-5 py-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-sm leading-relaxed text-text-header font-medium">{summary}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(scanResult.quality_percentages || {}).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-background-soft border border-surface-border text-center">
                  <p className="text-xs text-text-body/50 mb-1">{k}</p>
                  <p className="text-xl font-display font-bold text-text-header">{v}%</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 2. AI Confidence ── */}
          <section className="card-premium p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display text-text-header">{t('ml_analysis_new.confidence.title')}</h2>
                <p className="text-xs text-text-body/50">{t('ml_analysis_new.confidence.subtitle')}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-text-body/40 uppercase tracking-widest mb-3">{t('ml_analysis_new.confidence.select_grain', { count: scanResult.grains?.length || 0 })}</p>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                {(scanResult.grains || []).map((g, i) => {
                  const isSelected = i === selectedGrainIdx
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedGrainIdx(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSelected
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background-soft border-surface-border text-text-body hover:border-primary/40'
                        }`}
                    >
                      #{i + 1} · {g.quality}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedGrain && confMeta && (
              <div className={`rounded-2xl p-6 border ${confMeta.bg} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-body/50 mb-1">{t('ml_analysis_new.confidence.prediction')}</p>
                    <p className="text-lg font-display font-bold text-text-header">{t(`quality.${selectedGrain.quality.toLowerCase()}`, { defaultValue: selectedGrain.quality })} · {selectedGrain.grain_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-body/50 mb-1">{t('ml_analysis_new.confidence.score')}</p>
                    <p className={`text-3xl font-display font-bold ${confMeta.color}`}>
                      {(selectedGrain.confidence * 100).toFixed(1)}%
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${confMeta.color}`}>{confMeta.level}</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${confMeta.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${(selectedGrain.confidence * 100).toFixed(1)}%` }}
                  />
                </div>
                {confMeta.note && (
                  <p className={`text-xs ${confMeta.color} font-medium`}>{confMeta.note}</p>
                )}
                <p className="text-[10px] text-text-body/40 italic">
                  {t('ml_analysis_new.confidence.disclaimer')}
                </p>
              </div>
            )}
          </section>

          {/* ── 3. Grad-CAM Explanation ── */}
          <section className="card-premium p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Eye size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display text-text-header">Where the AI Was Looking</h2>
                <p className="text-xs text-text-body/50">Grad-CAM visual explanation for Grain #{selectedGrainIdx + 1}</p>
              </div>
            </div>
            <GradCamPanel
              key={`${scanResult.id}-${selectedGrainIdx}`}
              resultId={scanResult.id}
              grain={selectedGrain}
              grainIdx={selectedGrainIdx}
            />
          </section>

          {/* ── 4. Remedies ── */}
          {(() => {
            const remedies = getRemedies(selectedGrain, t)
            if (!remedies) return null
            return (
              <section className={`card-premium p-8 border ${remedies.color}`}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0 mt-0.5">
                    {remedies.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{t('ml_analysis_new.remedies.section_title')}</p>
                    <p className="text-xl font-display font-bold">{remedies.headline}</p>
                  </div>
                </div>

                {remedies.lowConfNote && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/60 border border-current/20 mb-5 text-xs font-medium">
                    <AlertCircle size={14} className="shrink-0 mt-0.5 opacity-70" />
                    {remedies.lowConfNote}
                  </div>
                )}

                <ol className="space-y-3">
                  {remedies.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white/70 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )
          })()}

        </div>
      )}

      {/* ── 5. Advanced Model Information (always visible, collapsible) ── */}
      <section className="card-premium overflow-hidden">
        <button
          onClick={() => setAdvancedOpen(o => !o)}
          className="w-full flex items-center justify-between p-6 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <BarChart3 size={18} className="text-primary" />
            </div>
            <div className="text-left">
              <h2 className="text-base font-display text-text-header">{t('ml_analysis_new.advanced.title')}</h2>
              <p className="text-xs text-text-body/40">{t('ml_analysis_new.advanced.subtitle')}</p>
            </div>
          </div>
          {advancedOpen ? <ChevronUp size={20} className="text-text-body/40" /> : <ChevronDown size={20} className="text-text-body/40" />}
        </button>

        {advancedOpen && (
          <div className="px-6 pb-8 border-t border-surface-border space-y-8 pt-6">
            {loadingMl ? (
              <div className="flex items-center justify-center py-12 gap-3 text-text-body/50">
                <Loader2 size={22} className="animate-spin text-primary" />
                <span className="text-sm">{t('ml_analysis_new.advanced.loading')}</span>
              </div>
            ) : !mlData ? (
              <div className="text-center py-10 text-sm text-text-body/60">
                <AlertCircle size={32} className="mx-auto mb-3 text-amber-400" />
                {t('ml_analysis_new.advanced.empty')}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: t('ml_analysis_new.advanced.metrics.accuracy'), value: `${(mlData.summary.accuracy * 100).toFixed(1)}%`, icon: <Target size={18} className="text-primary" /> },
                    { label: t('ml_analysis_new.advanced.metrics.score'), value: (mlData.summary.weighted_f1 || mlData.summary.macro_f1)?.toFixed(3), icon: <ShieldCheck size={18} className="text-primary" /> },
                    { label: t('ml_analysis_new.advanced.metrics.trust'), value: mlData.summary.macro_precision?.toFixed(3), icon: <Activity size={18} className="text-primary" /> },
                    { label: t('ml_analysis_new.advanced.metrics.catch'), value: mlData.summary.macro_recall?.toFixed(3), icon: <TrendingUp size={18} className="text-primary" /> },
                  ].map((s, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-background-soft border border-surface-border flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">{s.icon}</div>
                      <div>
                        <p className="text-[10px] text-text-body/40 font-bold uppercase tracking-widest leading-none mb-1">{s.label}</p>
                        <p className="text-lg font-bold text-text-header">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {mlData.class_metrics?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-text-body/40 uppercase tracking-widest mb-3">{t('ml_analysis_new.advanced.category_title')}</p>
                    <div className="space-y-4">
                      {mlData.class_metrics.map((m) => (
                        <div key={m.class} className="space-y-1.5">
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-text-header uppercase tracking-widest">{m.class}</span>
                            <span className="text-[10px] text-text-body/40">{t('ml_analysis_new.advanced.category_score', { score: (parseFloat(m.f1_score) * 100).toFixed(1) })}</span>
                          </div>
                          <div className="w-full h-5 bg-background-soft rounded-lg overflow-hidden flex gap-0.5">
                            <div className="h-full bg-primary/70 relative group" style={{ width: `${parseFloat(m.precision) * 100}%` }} title={`${t('ml_analysis_new.advanced.metrics.trust')}: ${(parseFloat(m.precision) * 100).toFixed(1)}%`}>
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase opacity-0 group-hover:opacity-100 transition-opacity">Trust</span>
                            </div>
                            <div className="h-full bg-secondary/70 relative group" style={{ width: `${parseFloat(m.recall) * 100}%` }} title={`${t('ml_analysis_new.advanced.metrics.catch')}: ${(parseFloat(m.recall) * 100).toFixed(1)}%`}>
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase opacity-0 group-hover:opacity-100 transition-opacity">Catch</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {chartData.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-body/40 text-center">{t('ml_analysis_new.advanced.learning_title')}</p>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="epoch" hide />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="train_acc" name="Practice Score" stroke={COLORS.train} strokeWidth={3} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="val_acc" name="Final Score" stroke={COLORS.val} strokeWidth={3} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-body/40 text-center">{t('ml_analysis_new.advanced.mistakes_title')}</p>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="epoch" hide />
                            <YAxis hide />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="train_loss" name="Practice Mistakes" stroke={COLORS.train} fill={COLORS.train} fillOpacity={0.1} strokeWidth={2} />
                            <Area type="monotone" dataKey="val_loss" name="Final Mistakes" stroke={COLORS.val} fill={COLORS.val} fillOpacity={0.1} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {mlData.confusion_matrix_url && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-body/40 mb-3">{t('ml_analysis_new.advanced.confusion_title')}</p>
                    <div className="flex justify-center bg-[#F5F3EE] p-6 rounded-3xl border border-surface-border shadow-inner">
                      <img
                        src={`${BASE_URL}${mlData.confusion_matrix_url}`}
                        alt={t('ml_analysis_new.advanced.confusion_title')}
                        className="max-w-full rounded-2xl shadow-premium hover:scale-[1.02] transition-transform duration-500 cursor-zoom-in"
                        onClick={() => window.open(`${BASE_URL}${mlData.confusion_matrix_url}`, '_blank')}
                      />
                    </div>
                    <p className="text-xs text-center text-text-body/40 mt-2 italic">{t('ml_analysis_new.advanced.confusion_desc')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
