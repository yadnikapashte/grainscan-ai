import { useState, useEffect } from 'react'
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell
} from 'recharts'
import { 
  Brain, TrendingUp, Target, Activity, Zap, 
  ShieldCheck, Info, Loader2, AlertCircle, RefreshCcw,
  BarChart3, Microscope, FileText
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import grainApi, { BASE_URL } from '../services/api'

export default function MLAnalysisPage() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('history')

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await grainApi.getMlMetrics()
      setData(res)
    } catch (err) {
      console.error('Failed to fetch ML metrics:', err)
      setError(t('ml_analysis.empty'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-xs font-bold text-text-body/40 uppercase tracking-widest">{t('common.loading')}</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center animate-fade-in relative">
        <div className="w-24 h-24 bg-status-discolored/10 rounded-3xl flex items-center justify-center mx-auto mb-10 text-status-discolored">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-4xl font-display text-text-header mb-4">No Data Found</h2>
        <p className="text-text-body text-lg mb-10 max-w-lg mx-auto">
          {error || "ML Training reports could not be found. Ensure you have run the training pipeline."}
        </p>
        <button onClick={fetchMetrics} className="btn-primary px-10">
          Try Again
        </button>
      </div>
    )
  }

  const { summary, history, class_metrics, confusion_matrix_url } = data

  // Transform history data for Recharts
  const chartData = (history.train_loss || []).map((_, i) => ({
    epoch: i + 1,
    train_loss: history.train_loss[i],
    val_loss: history.val_loss[i],
    train_acc: history.train_acc[i],
    val_acc: history.val_acc[i],
  }))

  const COLORS = {
    train: '#2D6A4F',
    val: '#FFB800',
    Broken: '#D00000',
    Chalky: '#3AB7BF',
    Discolored: '#FFB800',
    Normal: '#2D6A4F',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-fade-in space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
            <Brain size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Repository</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-display text-text-header leading-tight">
            {t('ml_analysis.title')}
          </h1>
          <p className="text-text-body text-lg max-w-2xl">
            {t('ml_analysis.subtitle')}
          </p>
        </div>

        <button 
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-surface-border text-text-header font-bold text-sm hover:border-primary/30 hover:bg-primary/5 transition-all"
        >
          <RefreshCcw size={18} />
          <span>Sync Real-time Metrics</span>
        </button>
      </header>

      {/* Global Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('ml_analysis.summary.accuracy'), value: `${(summary.accuracy * 100).toFixed(1)}%`, icon: <Target className="text-primary" size={24} /> },
          { label: t('ml_analysis.summary.f1'), value: (summary.weighted_f1 || summary.macro_f1).toFixed(3), icon: <ShieldCheck className="text-primary" size={24} /> },
          { label: t('ml_analysis.summary.precision'), value: summary.macro_precision.toFixed(3), icon: <Activity className="text-primary" size={24} /> },
          { label: t('ml_analysis.summary.recall'), value: summary.macro_recall.toFixed(3), icon: <TrendingUp className="text-primary" size={24} /> },
        ].map((stat, i) => (
          <div key={i} className="card-premium p-6 flex items-center gap-6">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-body/40 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-display text-text-header font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Charts area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Training Curves Section */}
          <div className="card-premium p-8">
            <div className="mb-8">
              <h3 className="text-xl font-display text-text-header mb-2">{t('ml_analysis.history.title')}</h3>
              <p className="text-sm text-text-body/60">{t('ml_analysis.history.subtitle')}</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-text-body/40 text-center">{t('ml_analysis.history.accuracy')}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="epoch" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="train_acc" name="Train Acc" stroke={COLORS.train} strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="val_acc" name="Val Acc" stroke={COLORS.val} strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-text-body/40 text-center">{t('ml_analysis.history.loss')}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="epoch" hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="train_loss" name="Train Loss" stroke={COLORS.train} fill={COLORS.train} fillOpacity={0.1} strokeWidth={2} />
                      <Area type="monotone" dataKey="val_loss" name="Val Loss" stroke={COLORS.val} fill={COLORS.val} fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Confusion Matrix Section */}
          <div className="card-premium p-8 animate-fade-in">
            <div className="mb-8">
              <h3 className="text-xl font-display text-text-header mb-2">{t('ml_analysis.confusion.title')}</h3>
              <p className="text-sm text-text-body/60">{t('ml_analysis.confusion.subtitle')}</p>
            </div>
            <div className="flex justify-center bg-[#F5F3EE] p-8 rounded-3xl border border-surface-border shadow-inner">
              <img 
                src={`${BASE_URL}${confusion_matrix_url}`} 
                alt="Confusion Matrix" 
                className="max-w-full rounded-2xl shadow-premium hover:scale-[1.02] transition-transform duration-500 cursor-zoom-in"
                onClick={() => window.open(`${BASE_URL}${confusion_matrix_url}`, '_blank')}
              />
            </div>
          </div>
        </div>

        {/* Sidebar: Per-Class Metrics */}
        <div className="lg:col-span-1">
          <div className="card-premium p-8 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-surface-border">
              <BarChart3 size={18} className="text-primary" />
              <h3 className="text-lg font-display text-text-header">{t('ml_analysis.classification.title')}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-premium">
              {class_metrics.map((m) => (
                <div key={m.class} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-text-header uppercase tracking-widest">{t(`quality.${m.class.toLowerCase()}`)}</span>
                    <span className="text-[10px] font-bold text-text-body/40">F1 Score: {(parseFloat(m.f1_score) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-8 bg-background-soft rounded-lg overflow-hidden flex gap-0.5">
                    <div 
                      className="h-full bg-primary/70 relative group" 
                      style={{ width: `${parseFloat(m.precision) * 100}%` }}
                      title={`Precision: ${(parseFloat(m.precision) * 100).toFixed(1)}%`}
                    >
                       <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-[8px] font-black text-white uppercase opacity-0 group-hover:opacity-100 transition-opacity">Precision</span>
                       </div>
                    </div>
                    <div 
                      className="h-full bg-secondary/70 relative group" 
                      style={{ width: `${parseFloat(m.recall) * 100}%` }}
                      title={`Recall: ${(parseFloat(m.recall) * 100).toFixed(1)}%`}
                    >
                       <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-[8px] font-black text-white uppercase opacity-0 group-hover:opacity-100 transition-opacity">Recall</span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-surface-border space-y-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <Info size={16} className="text-primary mt-1 shrink-0" />
                <p className="text-[10px] leading-relaxed text-text-body/60 italic">
                  Model architecture validated on ResNet50 framework with customized categorical cross-entropy optimization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
