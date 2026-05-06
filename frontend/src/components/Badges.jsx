export function StatusBadge({ status }) {
  const MAP = {
    pending:     { cls: 'badge-pending',  label: 'Pending' },
    in_progress: { cls: 'badge-progress', label: 'Ditangani' },
    resolved:    { cls: 'badge-resolved', label: 'Selesai' },
    failed:      { cls: 'badge-failed',   label: 'Gagal' },
    queued:      { cls: 'badge-queued',   label: 'Antri' },
    processing:  { cls: 'badge-progress', label: 'Proses' },
    completed:   { cls: 'badge-resolved', label: 'Selesai' },
  }
  const s = MAP[status] || { cls: 'badge-queued', label: status }
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}

export function ConfBadge({ score }) {
  const pct = Math.round(score * 100)
  const cls = pct >= 80 ? 'conf-high' : pct >= 60 ? 'conf-medium' : 'conf-low'
  return <span className={`font-mono text-sm ${cls}`} style={{ fontWeight: 700 }}>{pct}%</span>
}
