import { useState } from 'react'
import { AppProvider } from './context/AppContext.jsx'
import { ShieldCheck } from 'lucide-react'

import Sidebar from './components/layout/Sidebar.jsx'
import Header from './components/layout/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import SignToText from './pages/SignToText.jsx'
import TextToSpeech from './pages/TextToSpeech.jsx'
import GestureTraining from './pages/GestureTraining.jsx'
import AvatarPage from './pages/AvatarPage.jsx'
import HistoryPage from './pages/History.jsx'
import SettingsPage from './pages/Settings.jsx'

const pageInfo = {
  dashboard: ['Good morning', 'Your communication workspace'],
  sign: ['Sign to Text', 'Live gesture recognition'],
  speech: ['Text to Speech', 'Turn your words into voice'],
  training: ['Gesture Training', 'Personalize your communication'],
  avatar: ['Speech to Sign', '3D signing avatar'],
  history: ['Communication History', 'Your recent conversations'],
  settings: ['Settings', 'Preferences and accessibility'],
}

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  const [title, description] = pageInfo[active]

  return (
    <AppProvider>
      <div className="app-shell">
        <Sidebar active={active} setActive={setActive} open={menuOpen} setOpen={setMenuOpen} />
        <main className="main">
          <Header title={title} description={description} setOpen={setMenuOpen} />
          <div className="content">
            {active === 'dashboard' && <Dashboard setActive={setActive} />}
            {active === 'sign' && <SignToText />}
            {active === 'speech' && <TextToSpeech />}
            {active === 'training' && <GestureTraining />}
            {active === 'avatar' && <AvatarPage />}
            {active === 'history' && <HistoryPage />}
            {active === 'settings' && <SettingsPage />}
          </div>
          <footer>
            <span>SignBridge</span>
            <span>Communication without barriers.</span>
          </footer>
        </main>
      </div>
    </AppProvider>
  )
}
