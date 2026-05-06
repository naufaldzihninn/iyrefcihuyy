import { useState } from 'react'
import { X, Video } from 'lucide-react'
import api from '../api/client'
import { StatusBadge } from './Badges'

export default function SessionDetailModal({ session, avgConfidence, onClose, onStatusUpdate }) {
  const [status, setStatus] = useState(session.status)
  const [notes, setNotes] = useState(session.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.patch(`/sessions/${session.id}/status`, { status, notes })
      onStatusUpdate?.(res.data)
      onClose()
    } catch (e) {
      alert('Gagal update status sesi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Detail Hasil Analisa</h3>
            <p className="text-xs text-muted" style={{ marginTop: 4 }}>
              Sesi #{session.id} · {session.original_filename}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-surface-2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ padding: '0.75rem', background: 'var(--color-primary-glow)', borderRadius: 'var(--radius-sm)' }}>
              <Video color="var(--color-primary)" size={24} />
            </div>
            <div>
              <p style={{ fontWeight: 600 }}>{session.location_name || 'Lokasi tidak disebutkan'}</p>
              <p className="text-xs text-muted">
                Dianalisa pada {session.created_at ? new Date(session.created_at).toLocaleString('id-ID') : '--'}
              </p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid-2" style={{ gap: '0.75rem' }}>
            {[
              ['Total Deteksi', `${session.total_events} Event`],
              ['Rata-rata Confidence', `${Math.round(avgConfidence * 100)}%`],
              ['Total Frame', session.total_frames?.toLocaleString()],
              ['Status Saat Ini', <StatusBadge status={session.status} />],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'var(--color-surface-2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs text-muted" style={{ marginBottom: 4 }}>{label}</p>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Update status form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Update Status Analisa</label>
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
              <label className="form-label">Catatan Tindakan / Kesimpulan</label>
              <textarea
                className="form-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tulis kesimpulan atau catatan tindakan untuk video ini..."
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
