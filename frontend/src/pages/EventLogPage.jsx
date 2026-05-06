import { useEffect, useState } from 'react'
import { Filter, Search } from 'lucide-react'
import api from '../api/client'
import { StatusBadge, ConfBadge } from '../components/Badges'
import EventDetailModal from '../components/EventDetailModal'

export default function EventLogPage() {
  const [events, setEvents] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)

  const loadEvents = () => {
    setLoading(true)
    api.get('/events', { params: { page, per_page: 20, status: statusFilter || undefined } })
      .then(res => {
        setEvents(res.data.items)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadEvents()
  }, [page, statusFilter])

  const handleStatusUpdate = (updated) => {
    setEvents(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e))
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Log</h1>
          <p className="page-subtitle">Riwayat seluruh deteksi sampah</p>
        </div>
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--color-text-muted)" />
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.75rem' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">Sedang Ditangani</option>
              <option value="resolved">Selesai</option>
            </select>
          </div>
          <div style={{ flex: 1 }} />
          <div className="text-sm text-muted">Total: {total} event</div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Waktu Kejadian</th>
                <th>Kategori</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <span className="empty-state-icon">📭</span>
                      <span>Tidak ada event yang ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                events.map(e => (
                  <tr key={e.id} className="clickable-row" onClick={() => setSelectedEvent(e)}>
                    <td className="font-mono text-muted">#{e.id}</td>
                    <td>{e.occurred_at ? new Date(e.occurred_at).toLocaleString('id-ID') : '--'}</td>
                    <td>{e.category}</td>
                    <td><ConfBadge score={e.confidence_score} /></td>
                    <td><StatusBadge status={e.status} /></td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Sebelumnya
          </button>
          <span style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}>Halaman {page}</span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={events.length < 20}
            onClick={() => setPage(p => p + 1)}
          >
            Selanjutnya
          </button>
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}
