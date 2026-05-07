import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Clock, Film, Zap, AlertTriangle, Eye } from 'lucide-react'
import api from '../api/client'
import { StatusBadge, ConfBadge } from '../components/Badges'
import EventDetailModal from '../components/EventDetailModal'
import SessionDetailModal from '../components/SessionDetailModal'
import logo from '../assets/logo.png'

function formatDuration(sec) {
  if (!sec) return '--'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatVideoTime(sec) {
  if (sec == null) return '--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ResultsPage() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedSessionModal, setSelectedSessionModal] = useState(false)

  useEffect(() => {
    api.get(`/sessions/${sessionId}`)
      .then((r) => setSession(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleStatusUpdate = (updated) => {
    setSession((prev) => ({
      ...prev,
      events: prev.events.map((e) => e.id === updated.id ? { ...e, ...updated } : e)
    }))
  }

  const handleSessionStatusUpdate = (updated) => {
    setSession((prev) => ({ ...prev, ...updated }))
  }

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rivereye_report_session_${sessionId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Memuat hasil...</span></div>
  if (!session) return <div className="empty-state"><span className="empty-state-icon">❌</span><span className="empty-state-title">Sesi tidak ditemukan</span></div>

  const events = session.events || []
  const duration = session.video_duration_sec || 1

  const avgConfidence = events.length > 0
    ? events.reduce((sum, e) => sum + e.confidence_score, 0) / events.length
    : 0

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Link to="/upload" className="btn btn-secondary btn-sm"><ArrowLeft size={14} /></Link>
          <div>
            <h1 className="page-title">Hasil Analisis</h1>
            <p className="page-subtitle">{session.original_filename} · {session.location_name || 'Lokasi tidak disebutkan'}</p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={downloadReport}>
          <Download size={14} /> Unduh Laporan
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: '🗑️', label: 'Total Event',    value: session.total_events ?? events.length,  color: 'var(--color-warning)' },
          { icon: '🎬', label: 'Durasi Video',   value: formatDuration(session.video_duration_sec), color: 'var(--color-primary)' },
          { icon: '⚡', label: 'Waktu Proses',   value: '--',  color: 'var(--color-accent)' },
          { icon: '📊', label: 'Frame Diproses', value: session.total_frames?.toLocaleString() || '--', color: 'var(--color-success)' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: `${color}22` }}>
              <span>{icon}</span>
            </div>
            <div className="stat-info">
              <span className="stat-value" style={{ color }}>{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">✅</span>
            <span className="empty-state-title">Tidak ada sampah terdeteksi</span>
            <span className="text-sm text-muted">Model tidak menemukan objek dengan confidence ≥ {session.confidence_threshold * 100}% dalam video ini.</span>
          </div>
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
              Timeline Event ({events.length} titik)
            </h2>
            <div className="timeline" title="Klik event untuk detail">
              <div className="timeline-track" />
              {events.map((e) => {
                const pct = duration > 0 ? ((e.video_timestamp_sec || 0) / duration) * 100 : 0
                return (
                  <div
                    key={e.id}
                    className="timeline-event"
                    style={{ left: `${Math.min(98, Math.max(2, pct))}%` }}
                    title={`${formatVideoTime(e.video_timestamp_sec)} — conf ${Math.round(e.confidence_score * 100)}%`}
                    onClick={() => setSelectedEvent(e)}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
              <span>0:00</span><span>{formatVideoTime(duration)}</span>
            </div>
          </div>

          {/* Screenshot Gallery */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Gallery Screenshot</h2>
            <div className="screenshot-grid">
              {events.map((e) => {
                const url = e.screenshot_path
                  ? `/screenshots/${e.screenshot_path.split('/').pop()}`
                  : null
                return (
                  <div key={e.id} className="screenshot-card" onClick={() => setSelectedEvent(e)}>
                    {url ? (
                      <img src={url} alt={`Event ${e.id}`} loading="lazy" />
                    ) : (
                      <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-3)', color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>
                        No image
                      </div>
                    )}
                    <div className="screenshot-card-info">
                      <span className="screenshot-timestamp">{formatVideoTime(e.video_timestamp_sec)}</span>
                      <span className="screenshot-conf">{Math.round(e.confidence_score * 100)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Kesimpulan / Tabel Hasil Analisa */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Tabel Hasil Analisa (Kesimpulan Video)</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Total Deteksi</th>
                    <th>Rata-rata Confidence</th>
                    <th>Status Video</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{events.length} Event</td>
                    <td><ConfBadge score={avgConfidence} /></td>
                    <td><StatusBadge status={session.status} /></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setSelectedSessionModal(true)}>
                        Update Status
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Event Table */}
          <div className="card">
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Tabel Event Detail</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Waktu Video</th>
                    <th>Kategori</th>
                    <th>Confidence</th>
                    <th style={{ width: 60, textAlign: 'center' }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, i) => (
                    <tr key={e.id} className="clickable-row" onClick={() => setSelectedEvent(e)}>
                      <td style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td>
                      <td><span className="font-mono">{formatVideoTime(e.video_timestamp_sec)}</span></td>
                      <td>{e.category}</td>
                      <td><ConfBadge score={e.confidence_score} /></td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem', width: '100%', display: 'flex', justifyContent: 'center' }}
                          onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e) }}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {selectedSessionModal && (
        <SessionDetailModal
          session={session}
          avgConfidence={avgConfidence}
          onClose={() => setSelectedSessionModal(false)}
          onStatusUpdate={handleSessionStatusUpdate}
        />
      )}
    </div>
  )
}
