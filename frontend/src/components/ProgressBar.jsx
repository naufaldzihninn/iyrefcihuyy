export default function ProgressBar({ percent, label, sublabel }) {
  return (
    <div className="progress-wrapper">
      <div className="progress-label">
        <span>{label || 'Memproses...'}</span>
        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
          {Math.round(percent)}%
        </span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      {sublabel && (
        <p className="text-xs text-muted" style={{ textAlign: 'right' }}>{sublabel}</p>
      )}
    </div>
  )
}
