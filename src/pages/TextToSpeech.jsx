import { useState } from 'react'
import { ArrowRight, Settings, Square, Trash2, Volume2, Zap } from 'lucide-react'
import { stopSpeech, isSpeechAvailable } from '../services/speech.service.js'

function StatusPill({ children, tone = 'teal' }) {
  return <span className={`status-pill ${tone}`}><span className="pill-dot" />{children}</span>
}

const SHORTCUTS = [
  'Hello!',
  'Thank you.',
  'I need help.',
  'Please wait.',
  'I am not feeling well.',
  'I need water.',
  'Where is the bathroom?',
  'I do not understand.',
  'Please repeat that.',
  'I am okay.',
]

export default function TextToSpeech() {
  const [text, setText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [status, setStatus] = useState('')
  const [statusOk, setStatusOk] = useState(true)
  const [rate, setRate] = useState(0.95)
  const [selectedVoice, setSelectedVoice] = useState('')
  const [voices, setVoices] = useState([])
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (voices.length === 0) {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) setVoices(v)
      else window.speechSynthesis.onvoiceschanged = () => setVoices(window.speechSynthesis.getVoices())
    }
  }

  const handleSpeak = () => {
    if (!text.trim()) {
      setStatus('Enter a message first.')
      setStatusOk(false)
      return
    }
    if (!isSpeechAvailable()) {
      setStatus('This browser does not support built-in speech. Try Chrome or Edge.')
      setStatusOk(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = rate
    if (selectedVoice) {
      const v = voices.find((v) => v.name === selectedVoice)
      if (v) utterance.voice = v
    } else {
      const v = voices.find((v) => /^en/i.test(v.lang))
      if (v) utterance.voice = v
    }

    utterance.onstart = () => { setIsSpeaking(true); setStatus('Speaking…'); setStatusOk(true) }
    utterance.onend = () => { setIsSpeaking(false); setStatus('') }
    utterance.onerror = (e) => { setIsSpeaking(false); setStatus('Speech error: ' + e.error); setStatusOk(false) }

    window.speechSynthesis.speak(utterance)
  }

  const handleStop = () => {
    stopSpeech()
    setIsSpeaking(false)
    setStatus('')
  }

  return (
    <>
      <div className="page-intro feature-intro">
        <div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ArrowRight size={13} />
            Text to Speech
          </div>
          <h2>Give your words a voice.</h2>
          <p>Type a message and let SignBridge speak clearly for you.</p>
        </div>
        <StatusPill tone={isSpeaking ? 'teal' : 'slate'}>
          {isSpeaking ? 'Speaking…' : 'Ready'}
        </StatusPill>
      </div>

      {status && (
        <div style={{
          background: statusOk ? '#f4fbf9' : '#fff5f5',
          border: `1px solid ${statusOk ? '#d8eee8' : '#fed7d7'}`,
          borderRadius: 8, padding: '10px 16px',
          fontSize: 12, color: statusOk ? '#146c61' : '#c53030',
          marginBottom: 16
        }}>
          {status}
        </div>
      )}

      <div className="speech-layout">
        <section className="card speech-editor">
          <div className="card-heading">
            <div>
              <span className="eyebrow">YOUR MESSAGE</span>
              <h2>What would you like to say?</h2>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            placeholder="Start typing your message here..."
          />

          <div className="speech-meta">
            <span>{text.length} / 500 characters</span>
            <button className="text-button" onClick={() => setText('')}>
              <Trash2 size={15} /> Clear
            </button>
          </div>

          <div className="speech-controls">
            <button
              className="button button-primary"
              onClick={handleSpeak}
              disabled={isSpeaking}
            >
              <Volume2 size={18} /> {isSpeaking ? 'Speaking…' : 'Speak message'}
            </button>
            <button
              className="button button-secondary"
              onClick={handleStop}
              disabled={!isSpeaking}
            >
              <Square size={16} fill="currentColor" /> Stop
            </button>
            <button
              className="button button-ghost"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            >
              <Settings size={17} /> Voice settings
            </button>
          </div>

          {showVoiceSettings && (
            <div style={{
              marginTop: 16, padding: 16, background: '#f7fafc',
              borderRadius: 8, border: '1px solid #e6edf1'
            }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#576e7c', marginBottom: 6 }}>
                  Speaking speed
                </label>
                <input
                  type="range" min="0.5" max="2" step="0.05"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: 10, color: '#8a9aa7' }}>{rate.toFixed(2)}×</span>
              </div>

              {voices.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#576e7c', marginBottom: 6 }}>
                    Voice
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    style={{
                      width: '100%', height: 36, border: '1px solid #dce7ea',
                      borderRadius: 6, padding: '0 11px', fontSize: 11, background: '#fff'
                    }}
                  >
                    <option value="">Default English voice</option>
                    {voices.filter((v) => /^en/i.test(v.lang)).map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </div>
              )}

              {!isSpeechAvailable() && (
                <p style={{ fontSize: 11, color: '#c53030', marginTop: 10 }}>
                  ⚠ Speech synthesis is not available in this browser. Please use Chrome or Edge.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="card shortcuts-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">QUICK ACCESS</span>
              <h2>Common messages</h2>
            </div>
            <Zap size={20} className="teal-icon" />
          </div>
          <div className="shortcut-list">
            {SHORTCUTS.map((item) => (
              <button
                key={item}
                onClick={() => { setText(item) }}
              >
                {item}
                <ArrowRight size={15} />
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: '14px 0', borderTop: '1px solid #e6edf1' }}>
            <div style={{ fontSize: 10, color: '#8a9aa7', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', color: '#576e7c', marginBottom: 6 }}>How it works</strong>
              Uses your browser's built-in speech synthesis — no internet required, no data leaves your device.
              Supported in Chrome and Edge. Voice quality varies by browser and operating system.
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
