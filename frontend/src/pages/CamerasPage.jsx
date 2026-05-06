import { useEffect, useState } from 'react'
import { Camera, Plus, Trash2 } from 'lucide-react'
import api from '../api/client'

export default function CamerasPage() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/cameras')
      .then(res => setCameras(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Kamera</h1>
          <p className="page-subtitle">Daftar kamera stream aktif (Mode RTSP)</p>
        </div>
        <button className="btn btn-primary" disabled>
          <Plus size={16} /> Tambah Kamera
        </button>
      </div>

      <div className="card">
        {/* Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Lokasi</th>
                <th>URL Stream</th>
                <th>Koordinat</th>
                <th>Threshold</th>
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
              ) : cameras.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <span className="empty-state-icon">🎥</span>
                      <span>Belum ada kamera yang ditambahkan</span>
                      <span className="text-sm">Klik "Tambah Kamera" untuk memasukkan data CCTV.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                cameras.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td className="font-mono text-muted text-xs">{c.stream_url || '--'}</td>
                    <td className="font-mono text-muted text-xs">{c.latitude}, {c.longitude}</td>
                    <td><span className="badge badge-queued">{c.confidence_threshold}</span></td>
                    <td>
                      {c.is_active ? (
                        <span className="badge badge-resolved">Aktif</span>
                      ) : (
                        <span className="badge badge-failed">Nonaktif</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" disabled>Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
