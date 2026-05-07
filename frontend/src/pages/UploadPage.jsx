import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, FileVideo, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '../api/client'
import ProgressBar from '../components/ProgressBar'
import logo from '../assets/logo.png'

const ACCEPTED = { 'video/mp4': ['.mp4'], 'video/avi': ['.avi'], 'video/quicktime': ['.mov'], 'video/x-matroska': ['.mkv'] }
const MAX_MB = 200

export default function UploadPage() {
  const navigate = useNavigate()
  const wsRef = useRef(null)

  const [file, setFile] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [threshold, setThreshold] = useState(0.25)

  const [phase, setPhase] = useState('idle') // idle | uploading | processing | done | error
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [eventsFound, setEventsFound] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [previewFrame, setPreviewFrame] = useState(null)

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_MB * 1024 * 1024,
    multiple: false,
    onDropRejected: (rejects) => {
      setErrorMsg(rejects[0]?.errors[0]?.message || 'File ditolak.')
    }
  })

  const startAnalysis = async () => {
    if (!file) return
    setPhase('uploading')
    setProgress(0)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('location_name', locationName)
    formData.append('confidence_threshold', threshold)

    try {
      const res = await api.post('/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = (e.loaded / e.total) * 100
          setProgress(pct)
          setProgressLabel(`Mengunggah... ${Math.round(pct)}%`)
        },
      })

      const { session_id } = res.data
      setPhase('processing')
      setProgress(0)
      setPreviewFrame(null)
      setProgressLabel('Menghubungkan ke server...')

      // Open WebSocket
      const wsProto = location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(`${wsProto}://${location.host}/ws/${session_id}`)
      wsRef.current = ws

      ws.onopen = () => setProgressLabel('Memulai analisis...')

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data)

        if (data.type === 'progress') {
          setProgress(data.percent)
          setEventsFound(data.events_found)
          setProgressLabel(`Frame ${data.frames_done.toLocaleString()} / ${data.total_frames.toLocaleString()}`)
          if (data.frame_b64) {
            setPreviewFrame(data.frame_b64)
          }
        }

        if (data.type === 'event') {
          setEventsFound((n) => n + 1)
        }

        if (data.type === 'complete') {
          ws.close()
          setPhase('done')
          setProgress(100)
          setTimeout(() => navigate(`/results/${session_id}`), 800)
        }

        if (data.type === 'error') {
          ws.close()
          setPhase('error')
          setErrorMsg(data.message)
        }
      }

      ws.onerror = () => {
        setPhase('error')
        setErrorMsg('Koneksi WebSocket gagal. Pastikan backend berjalan.')
      }
    } catch (err) {
      setPhase('error')
      setErrorMsg(err.response?.data?.detail || err.message)
    }
  }

  const reset = () => {
    wsRef.current?.close()
    setFile(null)
    setPhase('idle')
    setProgress(0)
    setEventsFound(0)
    setErrorMsg('')
    setPreviewFrame(null)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analisis Video</h1>
          <p className="page-subtitle">Upload rekaman sungai untuk deteksi sampah otomatis</p>
        </div>
      </div>

      {/* ── Idle: upload form ── */}
      {phase === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Dropzone */}
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon">
              {file ? '🎬' : '📁'}
            </div>
            {file ? (
              <>
                <p className="dropzone-title" style={{ color: 'var(--color-primary)' }}>{file.name}</p>
                <p className="dropzone-hint">{(file.size / 1024 / 1024).toFixed(1)} MB — klik untuk ganti</p>
              </>
            ) : (
              <>
                <p className="dropzone-title">Drag & drop video di sini</p>
                <p className="dropzone-hint">atau klik untuk pilih file · MP4, AVI, MOV, MKV · maks {MAX_MB} MB</p>
              </>
            )}
          </div>

          {errorMsg && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: 'var(--color-danger)', background: 'var(--color-danger-bg)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              {errorMsg}
            </div>
          )}

          {/* Config */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Konfigurasi Analisis</h2>
            <div className="form-group">
              <label className="form-label">Nama Lokasi (opsional)</label>
              <input
                id="location-name"
                className="form-input"
                type="text"
                placeholder="contoh: Kali Tebu Titik 3"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Confidence Threshold: <strong style={{ color: 'var(--color-primary)' }}>{Math.round(threshold * 100)}%</strong>
              </label>
              <input
                id="threshold-slider"
                type="range"
                min="0.2" max="0.95" step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                <span>20% (sensitif)</span><span>95% (ketat)</span>
              </div>
            </div>
          </div>

          <button
            id="start-analysis-btn"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!file}
            onClick={startAnalysis}
          >
            <Upload size={18} />
            Mulai Analisis
          </button>
        </div>
      )}

      {/* ── Uploading / Processing ── */}
      {(phase === 'uploading' || phase === 'processing') && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {phase === 'uploading' ? '📤' : '🔍'}
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {phase === 'uploading' ? 'Mengunggah Video...' : 'Menganalisis Video...'}
            </h2>
            <p className="text-sm text-muted">
              {phase === 'uploading' ? 'Jangan tutup halaman ini' : 'YOLOv8 sedang mendeteksi sampah per frame'}
            </p>
          </div>

          <ProgressBar
            percent={progress}
            label={progressLabel}
            sublabel={phase === 'processing' ? `${eventsFound} event terdeteksi` : null}
          />

          {phase === 'processing' && eventsFound > 0 && (
            <div style={{ textAlign: 'center', background: 'var(--color-warning-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <p style={{ color: 'var(--color-warning)', fontWeight: 700, fontSize: '1.25rem' }}>{eventsFound}</p>
              <p className="text-xs text-muted">event sampah terdeteksi sejauh ini</p>
            </div>
          )}

          {phase === 'processing' && previewFrame && (
            <div style={{ marginTop: '0.5rem', textAlign: 'center', background: 'var(--color-surface-2)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs text-muted" style={{ marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Live View</p>
              <img src={`data:image/jpeg;base64,${previewFrame}`} alt="Live preview" style={{ maxWidth: '100%', borderRadius: 'calc(var(--radius-md) - 4px)' }} />
            </div>
          )}
        </div>
      )}

      {/* ── Done ── */}
      {phase === 'done' && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Analisis Selesai!</h2>
          <p className="text-sm text-muted mt-1">Mengalihkan ke halaman hasil...</p>
        </div>
      )}

      {/* ── Error ── */}
      {phase === 'error' && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <AlertCircle size={48} color="var(--color-danger)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Terjadi Kesalahan</h2>
          <p className="text-sm text-muted">{errorMsg}</p>
          <button className="btn btn-secondary" onClick={reset}>Coba Lagi</button>
        </div>
      )}
    </div>
  )
}
