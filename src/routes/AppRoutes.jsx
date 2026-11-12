import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout.jsx'
import Home from '../pages/Home.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import SignToText from '../pages/SignToText.jsx'
import TextToSpeech from '../pages/TextToSpeech.jsx'
import GestureTraining from '../pages/GestureTraining.jsx'
import History from '../pages/History.jsx'
import Settings from '../pages/Settings.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sign" element={<SignToText />} />
        <Route path="/speech" element={<TextToSpeech />} />
        <Route path="/training" element={<GestureTraining />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

