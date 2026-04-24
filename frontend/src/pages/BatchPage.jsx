import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Layers, Upload, FileText, CheckCircle, AlertCircle, 
  Loader2, Download, Trash2, ArrowRight
} from 'lucide-react'
import { grainApi, BASE_URL } from '../services/api'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

export default function BatchPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [files, setFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] }
  })

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleProcess = async () => {
    if (files.length === 0) return
    setProcessing(true)
    setError(null)
    console.log('Sending batch request to server...')
    try {
      const data = await grainApi.uploadBatch(files)
      console.log('Results received:', data)
      if (data && data.results) {
        setResults(data.results)
        
        // Save each success result to Supabase
        if (user) {
          const toSafe = data.results.filter(r => !r.error).map(r => ({
            user_id: user.id,
            grain_type: r.grain_type,
            total_grains: r.total_grains,
            quality_counts: r.quality_counts,
            quality_percentages: r.quality_percentages,
            source: 'Batch',
            timestamp: new Date().toISOString(),
            annotated_image_url: r.annotated_url, 
            raw_data: r
          }))
          
          if (toSafe.length > 0) {
            await supabase.from('scan_results').insert(toSafe)
          }
        }
      } else {
        throw new Error('Invalid server response format')
      }
    } catch (err) {
      console.error('Batch error:', err)
      const msg = err.response?.data?.detail || err.message || 'Unknown network error'
      setError(`Critical Error: ${msg}. Backend URL: ${BASE_URL}`)
    } finally {
      setProcessing(false)
    }
  }

  const exportCSV = () => {
    if (!results) return
    const headers = ['Filename', 'Grain Type', 'Total Grains', 'Normal%', 'Broken%', 'Chalky%', 'Discolored%']
    const rows = results.map(r => [
      r.filename,
      r.grain_type,
      r.total_grains,
      r.quality_percentages?.Normal || 0,
      r.quality_percentages?.Broken || 0,
      r.quality_percentages?.Chalky || 0,
      r.quality_percentages?.Discolored || 0
    ])

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `grain_batch_report_${new Date().getTime()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-fade-in space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-4">
            <Layers size={14} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-text-body/40">{t('batch.mode')}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-display text-text-header">{t('batch.title')}</h1>
          <p className="text-text-body mt-2 flex items-center gap-2 text-sm font-medium">
            {t('batch.subtitle')}
          </p>
        </div>
        {results && (
          <div className="flex items-center gap-3">
            <button onClick={exportCSV} className="btn-secondary py-3 px-8 flex items-center gap-2">
              <Download size={18} />
              {t('batch.download_csv')}
            </button>
            <button 
              onClick={() => grainApi.downloadBatchReport(results)} 
              className="btn-primary py-3 px-8 flex items-center gap-2"
            >
              <Download size={18} />
              {t('batch.download_pdf')}
            </button>
          </div>
        )}
      </div>

      {!results ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Uploader Left */}
          <div className="lg:col-span-2 space-y-6">
            <div 
              {...getRootProps()} 
              className={`
                relative h-80 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-12 overflow-hidden
                ${isDragActive ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-surface-border bg-background-soft/50 hover:bg-background-soft hover:border-primary/30'}
              `}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                <Upload size={32} />
              </div>
              <p className="text-lg font-display text-text-header font-bold mb-2">
                {t('batch.dropzone.idle')}
              </p>
              <p className="text-text-body/60 text-sm">
                {t('batch.dropzone.sub')}
              </p>
            </div>

            {files.length > 0 && (
              <div className="card-premium p-8 animate-slide-up">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-border">
                  <h3 className="font-display text-lg text-text-header flex items-center gap-3">
                    {t('batch.selected')}
                    <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{files.length}</span>
                  </h3>
                  <button 
                    onClick={() => setFiles([])}
                    className="text-text-body/40 hover:text-status-discolored text-xs font-bold uppercase transition-all"
                  >
                    {t('batch.clear')}
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2 scrollbar-premium">
                  {files.map((file, idx) => (
                    <div key={idx} className="group relative bg-background-soft p-4 rounded-2xl border border-surface-border flex items-center gap-3 transition-all hover:border-primary/30">
                      <div className="w-10 h-10 rounded-xl bg-white border border-surface-border flex items-center justify-center text-text-body/40">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-text-header truncate">{file.name}</p>
                        <p className="text-[9px] text-text-body/40 uppercase tracking-tighter">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-status-discolored hover:bg-status-discolored/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-surface-border flex justify-end">
                  <button 
                    onClick={handleProcess}
                    disabled={processing}
                    className="btn-primary py-4 px-12 text-sm flex flex-col items-center gap-1 min-w-[280px]"
                  >
                    {processing ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Loader2 className="animate-spin" size={18} />
                          <span>{t('batch.processing')}</span>
                        </div>
                        <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest text-center">{t('batch.processing_sub')}</span>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span>{t('batch.button')}</span>
                        <ArrowRight size={18} />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines Right */}
          <div className="lg:col-span-1 space-y-6 opacity-60">
            <div className="card-premium p-8 bg-background-soft/50">
              <h3 className="font-display text-sm text-text-header uppercase tracking-widest mb-6">{t('batch.guidelines')}</h3>
              <ul className="space-y-4">
                {[
                  'Ensure consistent lighting across all files',
                  'Spread grains evenly in each sample image',
                  'Supported formats: JPG, PNG, TIFF',
                  'Max file size per image: 50MB'
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-xs leading-relaxed text-text-body">
                    <CheckCircle size={14} className="text-primary shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            {error && (
              <div className="p-4 rounded-2xl bg-status-discolored/10 border border-status-discolored/20 text-status-discolored text-xs font-medium flex items-start gap-3">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          <div className="card-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background-soft border-b border-surface-border">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-body/40">{t('batch.table.id')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-body/40">{t('batch.table.type')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-body/40">{t('batch.table.count')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-status-normal font-bold">{t('batch.table.normal')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-status-discolored font-bold">{t('batch.table.broken')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-status-chalky font-bold">{t('batch.table.chalky')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-status-discolored opacity-70 font-bold tracking-tighter">{t('batch.table.discolor')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-body/40">{t('batch.table.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-background-soft/50 transition-all">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                            {i + 1}
                          </div>
                          <span className="text-xs font-bold text-text-header">{r.filename}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs text-text-body font-medium">{r.grain_type}</td>
                      <td className="px-6 py-5 text-xs text-text-body font-bold">{r.total_grains}</td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-status-normal">{r.quality_percentages?.Normal || 0}%</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-status-discolored">{r.quality_percentages?.Broken || 0}%</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-status-chalky">{r.quality_percentages?.Chalky || 0}%</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-status-discolored opacity-70">{r.quality_percentages?.Discolored || 0}%</span>
                      </td>
                      <td className="px-6 py-5">
                        {r.error ? (
                          <span className="px-2 py-1 bg-status-discolored/10 text-status-discolored rounded text-[10px] font-bold uppercase">{t('batch.status.failed')}</span>
                        ) : (
                          <span className="px-2 py-1 bg-status-normal/10 text-status-normal rounded text-[10px] font-bold uppercase tracking-tight">{t('batch.status.analyzed')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setResults(null)
                setFiles([])
              }}
              className="btn-secondary py-3 px-8 text-sm"
            >
              {t('batch.new')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
