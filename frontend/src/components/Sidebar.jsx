import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Upload, List, Camera, Waves
} from 'lucide-react'
import logo from '../assets/logo.png'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/upload',   icon: Upload,          label: 'Analisis Video' },
  { to: '/events',   icon: List,            label: 'Event Log'  },
  { to: '/cameras',  icon: Camera,          label: 'Kamera'     },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="IYREF Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <span className="sidebar-logo-text">RiverEye AI</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', padding: '0.5rem 0.75rem' }}>
          IYREF 2026 · v1.0
        </p>
      </div>
    </aside>
  )
}
