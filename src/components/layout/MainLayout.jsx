import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

export default function MainLayout({ title, description, active, setActive, children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} open={menuOpen} setOpen={setMenuOpen} />
      <main className="main">
        <Header title={title} description={description} setOpen={setMenuOpen} />
        <div className="content">
          {children}
        </div>
        <footer>
          <span>SignBridge</span>
          <span>Communication without barriers.</span>
          <span className="footer-right">
            <ShieldCheck size={13} /> Private &amp; secure · Local inference · No API key
          </span>
        </footer>
      </main>
    </div>
  )
}
