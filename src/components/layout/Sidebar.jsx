import {
  Hand,
  History,
  Home,
  MessageSquareText,
  MoreHorizontal,
  Settings,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react'

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'sign', label: 'Sign to Text', icon: Hand },
  { key: 'speech', label: 'Text to Speech', icon: Volume2 },
  { key: 'training', label: 'Gesture Training', icon: Sparkles },
  { key: 'avatar', label: 'Speech to Sign', icon: MessageSquareText },
  { key: 'history', label: 'Communication History', icon: History },
]

export default function Sidebar({ active, setActive, open, setOpen }) {
  return (
    <>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark">
              <Hand size={19} strokeWidth={2.5} />
            </div>
            <span>Sign<span>Bridge</span></span>
          </div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={19} />
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`nav-item ${active === key ? 'active' : ''}`}
              onClick={() => { setActive(key); setOpen(false) }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {key === 'sign' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={`nav-item ${active === 'settings' ? 'active' : ''}`}
            onClick={() => { setActive('settings'); setOpen(false) }}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <div className="profile">
            <div className="avatar">SB</div>
            <div className="profile-copy">
              <strong>SignBridge</strong>
            </div>
            <MoreHorizontal size={18} className="muted-icon" />
          </div>
        </div>
      </aside>
    </>
  )
}
