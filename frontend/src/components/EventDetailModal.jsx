import { useState } from 'react'
import { X } from 'lucide-react'
import { ConfBadge, StatusBadge } from './Badges'
import api from '../api/client'
import logo from '../assets/logo.png'

function formatTime(sec) {
  if (sec == null) return '--'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function EventDetailModal({ event, onClose, onStatusUpdate }) {
  const [status, setStatus] = useState(event.status)
  const [notes, setNotes] = useState(event.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.patch(`/events/${event.id}/status`, { status, notes })
      onStatusUpdate?.(res.data)
      onClose()
    } catch (e) {
      alert('Gagal update status.')
    } finally {
      setSaving(false)
    }
  }

  const screenshotUrl = event.screenshot_path
    ? `/screenshots/${event.screenshot_path.split('/').pop()}`
    : null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Detail Event #{event.id}</h3>
            <p className="text-xs text-muted" style={{ marginTop: 4 }}>
              {event.occurred_at ? new Date(event.occurred_at).toLocaleString('id-ID') : '--'}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Screenshot */}
          {screenshotUrl ? (
            <img
              src={screenshotUrl}
              alt="Screenshot deteksi"
              style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
            />
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <span className="empty-state-icon">🖼️</span>
              <span>Screenshot tidak tersedia</span>
            </div>
          )}

          {/* Info grid */}
          <div className="grid-2" style={{ gap: '0.75rem' }}>
            {[
              ['Kategori',    event.category],
              ['Confidence',  <ConfBadge score={event.confidence_score} />],
              ['Waktu Video', formatTime(event.video_timestamp_sec)],
              ['Status',      <StatusBadge status={event.status} />],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'var(--color-surface-2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs text-muted" style={{ marginBottom: 4 }}>{label}</p>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Deteksi objects */}
          {event.detected_objects?.length > 0 && (
            <div>
              <p className="text-xs text-muted" style={{ marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Objek Terdeteksi</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {event.detected_objects.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--color-surface-2)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <span>{obj.class_name}</span>
                    <ConfBadge score={obj.confidence} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update status form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Update Status</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">Sedang Ditangani</option>
                <option value="resolved">Selesai Ditangani</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Catatan Tindakan</label>
              <textarea
                className="form-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tulis catatan tindakan..."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
