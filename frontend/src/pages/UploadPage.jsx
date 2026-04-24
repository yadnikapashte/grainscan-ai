import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, ImageIcon, Loader2, CheckCircle, AlertCircle, X, Microscope, ArrowRight } from 'lucide-react'
import grainApi from '../services/api'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

export default function UploadPage() {
  const { user, profile } = useAuth()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus]   = useState('idle') // idle | analyzing | saving | done | error
  const [error, setError]     = useState('')

  const onDrop = useCallback((accepted) => {
    if (!accepted.length) return
    const f = accepted[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStatus('idle')
    setError('')
  }, [])

  if (profile?.role === 'Quality Inspector') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center animate-fade-in relative">
        <div className="w-24 h-24 bg-status-discolored/10 rounded-3xl flex items-center justify-center mx-auto mb-10 text-status-discolored">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-4xl font-display text-text-header mb-4">Access Restricted</h2>
        <p className="text-text-body text-lg mb-10 max-w-lg mx-auto">
          Experimental sample processing is restricted to <b>Laboratory Technicians</b> and <b>Farm Managers</b>. 
          As an Inspector, you are authorized to verify and audit existing records in the Dashboard.
        </p>
        <button onClick={() => nav('/dashboard')} className="btn-primary px-10">
          {t('common.back')} {t('nav.dashboard')}
        </button>
      </div>
    )
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  const handleAnalyze = async () => {
    if (!file || !user) return
    setStatus('analyzing')
    setError('')
    try {
      const result = await grainApi.upload(file)
      setStatus('saving')
      const { data: dbData, error: dbError } = await supabase
        .from('scan_results')
        .insert([{
          user_id: user.id,
          grain_type: result.grain_type,
          total_grains: result.total_grains,
          quality_counts: result.quality_counts,
          quality_percentages: result.quality_percentages,
          source: 'Upload',
          timestamp: new Date().toISOString(),
          annotated_image_url: result.annotated_image, 
          raw_data: result
        }])
        .select('id')
        .single()

      if (dbError) throw dbError
      const resultWithId = { ...result, id: dbData?.id }
      sessionStorage.setItem('grain_result', JSON.stringify(resultWithId))
      setStatus('done')
      setTimeout(() => nav('/dashboard'), 800)
    } catch (e) {
      console.error(e)
      setStatus('error')
      setError(e?.message || t('common.error'))
    }
  }

  const clear = () => {
    setFile(null)
    setPreview(null)
    setStatus('idle')
    setError('')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-fade-in transition-all">
      <header className="mb-12">
        <h1 className="text-4xl font-display text-text-header mb-4 leading-tight">{t('upload.title')}</h1>
        <p className="text-text-body text-lg max-w-2xl">
          {t('upload.subtitle')}
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div
            {...getRootProps()}
            className={`
              relative rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer
              transition-all duration-500 card-premium
              ${isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : preview ? 'border-surface-border bg-white' : 'border-surface-border hover:border-primary/50 hover:bg-primary/5 bg-white'}
            `}
          >
            <input {...getInputProps()} />
            {preview ? (
              <div className="relative group">
                <img src={preview} alt="Preview" className="max-h-96 mx-auto rounded-2xl object-contain shadow-premium" />
                <button onClick={(e) => { e.stopPropagation(); clear() }} className="absolute top-4 right-4 p-2 rounded-full bg-white/90 text-text-body hover:text-status-discolored hover:bg-white shadow-premium transition-all">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="space-y-6 py-12">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Upload size={40} />
                </div>
                <div>
                  <p className="text-xl font-display text-text-header mb-2">{isDragActive ? t('upload.dropzone.active') : t('upload.dropzone.idle')}</p>
                  <p className="text-text-body text-sm font-medium">JPG, PNG, or BMP (Max 20MB)</p>
                </div>
                <button className="btn-secondary px-8">{t('common.next')}</button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleAnalyze}
              disabled={!file || status === 'analyzing' || status === 'saving' || status === 'done'}
              className={`flex-1 w-full flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-display font-bold text-lg transition-all duration-300 ${!file || status === 'analyzing' || status === 'saving' || status === 'done' ? 'bg-surface-border text-text-body/40 cursor-not-allowed' : 'btn-primary shadow-lg shadow-primary/20'}`}
            >
              {(status === 'analyzing' || status === 'saving') ? <Loader2 size={24} className="animate-spin" /> : status === 'done' ? <CheckCircle size={24} /> : <Microscope size={24} />}
              {status === 'analyzing' || status === 'saving' ? t('common.loading') : status === 'done' ? t('common.finish') : t('upload.button')}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-status-discolored/10 border border-status-discolored/20 text-status-discolored animate-shake">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm font-semibold">{error}</div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-premium p-8">
            <h3 className="text-lg font-display text-text-header mb-4">{t('upload.specs.title')}</h3>
            <ul className="space-y-4">
              {[
                { label: t('upload.specs.lighting'), value: t('upload.specs.lighting_val') },
                { label: t('upload.specs.bg'), value: t('upload.specs.bg_val') },
                { label: t('upload.specs.spacing'), value: t('upload.specs.spacing_val') },
                { label: t('upload.specs.resolution'), value: t('upload.specs.resolution_val') }
              ].map(spec => (
                <li key={spec.label} className="flex justify-between items-center border-b border-surface-border/50 pb-3">
                  <span className="text-xs font-bold text-text-body/60 uppercase tracking-wider">{spec.label}</span>
                  <span className="text-sm font-bold text-primary">{spec.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
