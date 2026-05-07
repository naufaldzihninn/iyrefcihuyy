import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Video, Camera } from 'lucide-react'
import api from '../api/client'
import { StatusBadge } from '../components/Badges'

export default function DashboardPage() {
  const [stats, setStats] = useState({ total_events: 0, pending: 0 })
  const [recentSessions, setRecentSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/events', { params: { per_page: 1 } }),
      api.get('/events', { params: { status: 'pending', per_page: 1 } }),
      api.get('/sessions', { params: { limit: 5 } }),
    ]).then(([evRes, pendingRes, sessRes]) => {
      setStats({
        total_events: evRes.data.total,
        pending: pendingRes.data.total,
      })
      setRecentSessions(sessRes.data.items)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Ringkasan aktivitas pemantauan sungai</p>
        </div>
        <Link to="/upload" className="btn btn-primary">
          <Video size={16} /> Analisis Video Baru
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-primary-glow)' }}>
            <Activity color="var(--color-primary)" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total_events}</span>
            <span className="stat-label">Total Deteksi Anomali</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-warning-bg)' }}>
            <AlertTriangle color="var(--color-warning)" />
          </div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: stats.pending > 0 ? 'var(--color-warning)' : 'inherit' }}>
              {stats.pending}
            </span>
            <span className="stat-label">Perlu Penanganan (Pending)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-success-bg)' }}>
            <Camera color="var(--color-success)" />
          </div>
          <div className="stat-info">
            <span className="stat-value">Mode A</span>
            <span className="stat-label">Sistem Aktif (Video Upload)</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Sessions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Sesi Analisis Terakhir</h2>
          </div>
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><span className="spinner" /></div>
          ) : recentSessions.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              Belum ada video yang dianalisis
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentSessions.map(s => (
                <Link key={s.id} to={`/results/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: 'var(--color-surface-2)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', border: '1px solid var(--color-border)' }} className="card-hover-fx">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{s.original_filename}</p>
                      <p className="text-xs text-muted">
                        {s.created_at ? new Date(s.created_at).toLocaleString('id-ID') : ''}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <StatusBadge status={s.status} />
                      {s.status === 'completed' && (
                        <p className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>{s.total_events} event</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Status Sistem</h2>
          <div style={{ background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>Info Mode MVP</h3>
            <p className="text-sm text-muted">
              Sistem saat ini berjalan dalam <strong>Mode A (Video Upload)</strong>. Mode RTSP Stream dapat diaktifkan jika infrastruktur kamera fisik telah terhubung.
            </p>
          </div>
          <div style={{ background: 'var(--color-surface-2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="text-muted">Model Terpasang</span>
              <span className="font-mono" style={{ color: 'var(--color-success)' }}>yolov8s.pt</span>
            </p>
            <p className="text-sm" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Kelas Deteksi</span>
              <span className="font-mono">garbage (waste_surface)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
