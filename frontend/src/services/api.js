/**
 * API service layer — all backend calls go through here.
 * Base URL reads from env var or defaults to localhost:8000
 */
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE })

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

  /** Health check */
  health: async () => {
    const { data } = await api.get('/health')
    return data
  },
}

export default grainApi
