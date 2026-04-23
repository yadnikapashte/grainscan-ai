import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'
import {
  BarChart3, ArrowLeft, Download, Wheat, CircleDot,
  TrendingUp, AlertTriangle, CheckCircle, Info, History, Calendar, LayoutDashboard, Microscope, ShieldCheck, Database, Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import DefectHeatmap from '../components/DefectHeatmap'
import { grainApi } from '../services/api'

// Quality color palette
const QUALITY_COLORS = {
  Normal: '#2D6A4F',
  Discolored: '#FFB800',
  Broken: '#D00000',
  Chalky: '#3AB7BF',
  Immature: '#74C365',
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('grain_result')
    if (raw) {
      try {
        setResult(JSON.parse(raw))
      } catch (e) {
        console.error('Session data parse error:', e)
      }
    }
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('scan_results')
      .select('*')
      .order('timestamp', { ascending: false })

    // If NOT an inspector, only show own results
    if (profile?.role !== 'Quality Inspector') {
      query = query.eq('user_id', user.id)
    }

    try {
      const { data, error } = await query
      if (error) throw error
      setHistory(data || [])
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    if (!activeResult?.id || updating) return
    setUpdating(true)
    try {
      const { data, error } = await supabase
        .from('scan_results')
        .update({ status: newStatus })
        .eq('id', activeResult.id)
        .select()
      
      if (error) throw error

      if (!data || data.length === 0) {
        throw new Error('No records were updated. Check your permissions.')
      }
      
      // Update local state
      setHistory(prev => prev.map(item => 
        item.id === activeResult.id ? { ...item, status: newStatus } : item
      ))
      if (result?.id === activeResult.id) {
        setResult({ ...result, status: newStatus })
      }
    } catch (err) {
      console.error('Error updating status for ID:', activeResult.id, err)
      alert(`${t('common.error')}: ${err.message || 'Unknown error'}`)
    } finally {
      setUpdating(false)
    }
  }

  const selectHistoryItem = (item) => {
    setResult(item.raw_data || item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Safely find the latest result to display
  const getActiveResult = () => {
    if (!result && (!history || history.length === 0)) return null
    if (result) {
      const officialVersion = history.find(h => h.id === result.id || (h.raw_data && h.raw_data.id === result.id))
      if (officialVersion) return { ...officialVersion.raw_data, id: officialVersion.id, status: officialVersion.status }
      return result
    }
    const latest = history[0]
    return { ...latest.raw_data, id: latest.id, status: latest.status }
  }

  const activeResult = getActiveResult()

  if (loading && !activeResult) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-xs font-bold text-text-body/40 uppercase tracking-widest">{t('common.loading')}</p>
      </div>
    )
  }

  if (!activeResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center animate-fade-in relative">
        <div className="absolute inset-0 bg-radial-at-t from-primary/5 to-transparent pointer-events-none" />
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-10 text-primary">
          <Microscope size={48} />
        </div>
        <h2 className="text-4xl font-display text-text-header">{t('dashboard.history.empty')}</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          {(profile?.role === 'Laboratory Technician' || profile?.role === 'Farm Manager') && (
            <>
              <button onClick={() => nav('/scanner')} className="btn-primary px-10">
                {t('nav.scanner')}
              </button>
              <button onClick={() => nav('/upload')} className="btn-secondary px-10">
                {t('nav.upload')}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  const { 
    grain_type = 'Unknown', 
    total_grains = 0, 
    quality_counts = {}, 
    quality_percentages = {}, 
    source = 'Laboratory', 
    timestamp = new Date(),
    status = 'Pending'
  } = activeResult

  const pieData = Object.entries(quality_counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, pct: quality_percentages[name] ?? 0 }))

  const barData = Object.entries(quality_counts).map(([name, value]) => ({ name, value }))

  const normalPct = quality_percentages.Normal || 0
  const grade = normalPct >= 80 ? 'A+' : normalPct >= 60 ? 'B' : normalPct >= 40 ? 'C' : 'F'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-fade-in space-y-12 transition-all">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-body/40">
              <ShieldCheck size={14} className="text-primary" />
              {t('dashboard.subtitle')}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              status === 'Verified' ? 'bg-status-normal/10 text-status-normal border-status-normal/20' :
              status === 'Flagged' ? 'bg-status-discolored/10 text-status-discolored border-status-discolored/20' :
              'bg-background-soft text-text-body/40 border-surface-border'
            }`}>
              {t(`common.${status.toLowerCase()}`)}
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-display text-text-header">{t('dashboard.title')}</h1>
          <div className="flex items-center gap-6 mt-4">
            <p className="text-text-body flex items-center gap-2 text-sm font-medium">
              <Calendar size={14} className="text-primary/40" />
              {new Date(timestamp).toLocaleDateString()}
            </p>
            <div className="h-4 w-px bg-surface-border" />
            <p className="text-text-body flex items-center gap-2 text-sm font-bold">
              <Wheat size={14} className="text-primary" />
              {grain_type}
            </p>
            <div className="h-4 w-px bg-surface-border" />
            <p className="text-text-body flex items-center gap-2 text-sm font-bold">
              <Database size={14} className="text-primary" />
              {total_grains} Grains
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {profile?.role === 'Quality Inspector' && (
            <div className="flex items-center gap-2 p-1 bg-background-soft rounded-2xl border border-surface-border mr-2">
              <button 
                onClick={() => handleStatusUpdate('Verified')}
                disabled={status === 'Verified' || updating}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  status === 'Verified' ? 'bg-status-normal text-white' : 'hover:bg-status-normal/10 text-status-normal'
                }`}
              >
                <CheckCircle size={14} />
                {t('common.verify')}
              </button>
              <button 
                onClick={() => handleStatusUpdate('Flagged')}
                disabled={status === 'Flagged' || updating}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  status === 'Flagged' ? 'bg-status-discolored text-white' : 'hover:bg-status-discolored/10 text-status-discolored'
                }`}
              >
                <AlertTriangle size={14} />
                {t('common.flag')}
              </button>
            </div>
          )}
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(activeResult, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `grain-analysis-${activeResult.id || 'export'}.json`
              a.click()
            }}
            className="btn-secondary py-3 text-sm flex items-center gap-2"
          >
            <Download size={18} />
            Export JSON
          </button>
          
          <button
            onClick={() => grainApi.downloadReport(activeResult.id)}
            className="btn-primary py-3 text-sm flex items-center gap-2"
          >
            <Download size={18} />
            Laboratory PDF Report
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="grid sm:grid-cols-4 gap-6">
            <div className="card-premium p-6">
              <p className="text-[10px] font-bold text-text-body/40 uppercase tracking-widest mb-4">Purity Analysis</p>
              <div className="flex items-end justify-between mb-4">
                <h3 className="text-3xl font-display text-text-header font-bold">{normalPct}%</h3>
                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${grade === 'A+' ? 'bg-status-normal text-white' : 'bg-status-broken text-white'}`}>
                  Grade {grade}
                </div>
              </div>
              <div className="h-10 w-full opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.slice(0, 6).reverse().map(h => ({ val: (h.raw_data || h).quality_percentages?.Normal || 0 }))}>
                    <Area type="monotone" dataKey="val" stroke="#2D6A4F" fill="#2D6A4F" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-premium p-6">
              <p className="text-[10px] font-bold text-text-body/40 uppercase tracking-widest mb-4">Broken Grains</p>
              <div className="flex items-end justify-between mb-4">
                <h3 className="text-3xl font-display text-status-broken font-bold">{quality_percentages.Broken || 0}%</h3>
                <CircleDot size={16} className="text-status-broken" />
              </div>
              <div className="h-10 w-full opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.slice(0, 6).reverse().map(h => ({ val: (h.raw_data || h).quality_percentages?.Broken || 0 }))}>
                    <Area type="monotone" dataKey="val" stroke="#D4690A" fill="#D4690A" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-premium p-6">
              <p className="text-[10px] font-bold text-text-body/40 uppercase tracking-widest mb-4">Chalky Indices</p>
              <div className="flex items-end justify-between mb-4">
                <h3 className="text-3xl font-display text-status-chalky font-bold">{quality_percentages.Chalky || 0}%</h3>
                <Microscope size={16} className="text-status-chalky" />
              </div>
              <div className="h-10 w-full opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.slice(0, 6).reverse().map(h => ({ val: (h.raw_data || h).quality_percentages?.Chalky || 0 }))}>
                    <Area type="monotone" dataKey="val" stroke="#B8860B" fill="#B8860B" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-premium p-6">
              <p className="text-[10px] font-bold text-text-body/40 uppercase tracking-widest mb-4">Discoloration</p>
              <div className="flex items-end justify-between mb-4">
                <h3 className="text-3xl font-display text-status-discolored font-bold">{quality_percentages.Discolored || 0}%</h3>
                <AlertTriangle size={16} className="text-status-discolored" />
              </div>
              <div className="h-10 w-full opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.slice(0, 6).reverse().map(h => ({ val: (h.raw_data || h).quality_percentages?.Discolored || 0 }))}>
                    <Area type="monotone" dataKey="val" stroke="#C0392B" fill="#C0392B" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card-premium p-8">
              <h3 className="text-lg font-display text-text-header mb-8">{t('dashboard.charts.impurity')}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={100} innerRadius={60} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={QUALITY_COLORS[entry.name] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card-premium p-8">
              <h3 className="text-lg font-display text-text-header mb-8">{t('dashboard.charts.quantity')}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: 'rgba(45, 106, 79, 0.05)' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={QUALITY_COLORS[entry.name] || '#8884d8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-status-discolored/10 flex items-center justify-center text-status-discolored">
                <TrendingUp size={16} />
              </div>
              <h3 className="text-xl font-display text-text-header">Spatial Defect Analytics</h3>
            </div>
            <DefectHeatmap 
              grains={activeResult.grains || []} 
              imgWidth={activeResult.img_width || 800} 
              imgHeight={activeResult.img_height || 600} 
              imageUrl={activeResult.annotated_image}
              className="h-[460px]"
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="card-premium p-8 h-[calc(100vh-200px)] flex flex-col">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-surface-border">
              <History size={18} className="text-primary" />
              <h3 className="text-lg font-display text-text-header">{t('dashboard.history.title')}</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-premium">
              {history.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                  <p className="text-xs font-bold uppercase tracking-widest">{t('dashboard.history.empty')}</p>
                </div>
              ) : (
                history.map((item) => (
                  <button key={item.id} onClick={() => selectHistoryItem(item)} className={`w-full text-left p-4 rounded-xl border transition-all ${activeResult?.id === item.id ? 'border-primary bg-primary/5' : 'border-surface-border hover:bg-background-soft'}`}>
                    <div className="text-xs font-bold text-text-header truncate mb-1">{item.grain_type}</div>
                    <div className="text-[10px] text-text-body/40">{new Date(item.timestamp).toLocaleDateString()}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
