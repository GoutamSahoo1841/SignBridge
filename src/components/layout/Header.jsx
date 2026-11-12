import { Bell, Menu } from 'lucide-react'

export default function Header({ title, description, setOpen }) {
  return (
    <header className="header">
      <div className="header-title">
        <button className="icon-button menu-button" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu size={21} />
        </button>
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="header-actions">
        <div className="system-status">
          <span className="status-pulse" /> System ready
        </div>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <div className="mini-avatar">SB</div>
      </div>
    </header>
  )
}
