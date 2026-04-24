/**
 * Clean API service layer — all backend calls go through here.
 */
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ 
  baseURL: BASE,
  timeout: 60000 // 60 second timeout for large batches
})

export const grainApi = {
  /** Upload an image file for analysis */
  upload: async (file) => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  /** Upload multiple images for batch analysis */
  uploadBatch: async (files) => {
    const form = new FormData()
    files.forEach(file => form.append('files', file))
    const { data } = await api.post('/upload-batch', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  /** Simulate a hardware scanner scan */
  simulateScan: async () => {
    const { data } = await api.post('/simulate-scan')
    return data
  },

  /** Start live scanner polling */
  startScanner: async () => {
    const { data } = await api.post('/scanner-start')
    return data
  },

  /** Stop live scanner polling */
  stopScanner: async () => {
    const { data } = await api.post('/scanner-stop')
    return data
  },

  /** Get scanner status + latest result */
  scannerStatus: async () => {
    const { data } = await api.get('/scanner-status')
    return data
  },

  /** Download a PDF report for a scan */
  downloadReport: async (resultData) => {
    try {
      const response = await api.post('/report', resultData, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `GrainScan_Report_${resultData.id || 'export'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Could not generate PDF report. Please try again.')
    }
  },

  /** Download a consolidated PDF report for a batch */
  downloadBatchReport: async (results) => {
    const response = await api.post('/report-batch', results, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `GrainScan_Batch_Protocol_${new Date().getTime()}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
  },

  /** Health check */
  health: async () => {
    const { data } = await api.get('/health')
    return data
  }
}

export const BASE_URL = BASE
export default grainApi
