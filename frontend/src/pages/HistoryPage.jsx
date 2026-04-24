import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  History, Search, Filter, ArrowRight, Download, 
  ChevronRight, Calendar, Wheat, Database, Loader2,
  CheckCircle, AlertTriangle, Clock, RefreshCcw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import grainApi from '../services/api'

export default function HistoryPage() {
  const { user, profile } = useAuth()
  const { t } = useTranslation()
  const nav = useNavigate()
  
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('All')
  
  useEffect(() => {
    fetchHistory()
  }, [user, profile])

  const fetchHistory = async () => {
    if (!user) return
    setLoading(true)
    try {
      let query = supabase
        .from('scan_results')
        .select('*')
        .order('timestamp', { ascending: false })

      // If NOT an inspector, only show own results
      if (profile?.role !== 'Quality Inspector') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      setHistory(data || [])
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (item) => {
    const resultData = item.raw_data || item
    // Ensure ID is consistent
    const dataWithId = { ...resultData, id: item.id, status: item.status }
    sessionStorage.setItem('grain_result', JSON.stringify(dataWithId))
    nav('/dashboard')
  }

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.grain_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'All' || item.grain_type === filterType
    return matchesSearch && matchesType
  })

  const grainTypes = ['All', ...new Set(history.map(item => item.grain_type))]

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-xs font-bold text-text-body/40 uppercase tracking-widest">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-fade-in space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
            <History size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('nav.history')}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-display text-text-header leading-tight">
            {t('history.title')}
          </h1>
          <p className="text-text-body text-lg max-w-2xl">
            {t('history.subtitle')}
          </p>
        </div>

        <button 
          onClick={fetchHistory}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-surface-border text-text-header font-bold text-sm hover:border-primary/30 hover:bg-primary/5 transition-all"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Filters & Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-body/40" size={20} />
          <input 
            type="text" 
            placeholder="Search by ID or grain type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-surface-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
          />
        </div>
        
        <div className="relative group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-body/40" size={20} />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-12 pr-10 py-4 rounded-2xl bg-white border border-surface-border appearance-none focus:border-primary/50 transition-all text-sm font-bold text-text-header cursor-pointer"
          >
            {grainTypes.map(type => (
              <option key={type} value={type}>{type === 'All' ? 'All Grain Types' : type}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-body/40 pointer-events-none" size={16} />
        </div>

        <div className="flex items-center justify-center px-6 py-4 rounded-2xl bg-background-soft border border-surface-border">
          <span className="text-xs font-bold text-text-header uppercase tracking-widest flex items-center gap-2">
            <Database size={16} className="text-primary" />
            {filteredHistory.length} {t('history.table.samples')}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden border border-surface-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background-soft/50 border-b border-surface-border">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-text-body/50">{t('history.table.date')}</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-text-body/50">{t('history.table.type')}</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-text-body/50 text-center">{t('history.table.samples')}</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-text-body/50 text-center">{t('history.table.purity')}</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-text-body/50 text-center">{t('history.table.status')}</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-text-body/50 text-right">{t('history.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border bg-white">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center opacity-40">
                    <History size={48} className="mx-auto mb-4 stroke-1" />
                    <p className="text-sm font-bold uppercase tracking-wider">{t('history.empty')}</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const purity = item.quality_percentages?.Normal || 0
                  const date = new Date(item.timestamp)
                  
                  return (
                    <tr key={item.id} className="group hover:bg-primary/[0.02] transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-text-header">{date.toLocaleDateString()}</span>
                          <span className="text-[10px] text-text-body/40 font-bold uppercase tracking-tight">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-background-soft flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                            <Wheat size={16} />
                          </div>
                          <span className="text-sm font-bold text-text-header">{item.grain_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-background-soft text-xs font-bold text-text-header">
                          {item.total_grains}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`text-sm font-bold ${purity >= 85 ? 'text-status-normal' : purity >= 70 ? 'text-status-discolored' : 'text-status-broken'}`}>
                            {purity}%
                          </span>
                          <div className="w-20 h-1 rounded-full bg-background-soft overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${purity >= 85 ? 'bg-status-normal' : purity >= 70 ? 'bg-status-discolored' : 'bg-status-broken'}`}
                              style={{ width: `${purity}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          item.status === 'Verified' 
                            ? 'bg-status-normal/10 text-status-normal border-status-normal/20' 
                            : item.status === 'Flagged'
                            ? 'bg-status-discolored/10 text-status-discolored border-status-discolored/20'
                            : 'bg-background-soft text-text-body/40 border-surface-border'
                        }`}>
                          {item.status === 'Verified' && <CheckCircle size={10} />}
                          {item.status === 'Flagged' && <AlertTriangle size={10} />}
                          {item.status === 'Pending' && <Clock size={10} />}
                          {item.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => grainApi.downloadReport(item.raw_data || item)}
                            className="p-2.5 rounded-xl text-text-body/40 hover:text-primary hover:bg-primary/5 transition-all"
                            title="Download Report"
                          >
                            <Download size={18} />
                          </button>
                          <button 
                            onClick={() => handleViewDetails(item)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all active:scale-95"
                          >
                            {t('history.table.view')}
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
