import { useEffect, useState, useCallback } from 'react'
import { ArrowRight, Mic, Sparkles } from 'lucide-react'
import * as avatarService from '../services/avatar.service.js'
import SignAvatar from '../components/avatar/SignAvatar.jsx'
import AvatarControls from '../components/avatar/AvatarControls.jsx'

const SAMPLE_SENTENCES = [
  'Hello, how are you?',
  'What is your name?',
  'Good morning',
  'Nice to meet you',
  'I am fine',
  'I need water',
  'I need help',
  'Where is the bathroom?',
  'I want to go home',
  'Do you understand?',
  'Thank you very much',
  'I love you',
  'See you tomorrow',
  'Goodbye',
]

export default function AvatarPage() {
  const [text, setText] = useState('')
  const [speed, setSpeed] = useState(1)
  const [gloss, setGloss] = useState([])
  const [error, setError] = useState('')
  const [usingSR, setUsingSR] = useState(false)
  const [avatarState, setAvatarState] = useState(avatarService.getState())

  useEffect(() => {
    const unsub = avatarService.subscribeAvatarState((s) => {
      setAvatarState(s)
    })
    return () => unsub()
  }, [])

  const handleSign = () => {
    if (!avatarState.isLoaded || !text.trim()) return
    try {
      const g = avatarService.signText(text, speed)
      setGloss(g)
      setError('')
    } catch (e) {
      setError('Avatar error: ' + e.message)
    }
  }

  const handleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition requires Chrome or Edge. You can type instead.')
      return
    }
    const r = new SR()
    r.lang = 'en-US'
    r.interimResults = false
    r.onresult = (e) => {
      const t = e.results[0][0].transcript
      setText(t)
      if (avatarState.isLoaded) {
        const g = avatarService.signText(t, speed)
        setGloss(g)
      }
    }
    r.onerror = (e) => setError('Microphone error: ' + e.error + '. Type your sentence instead.')
    setUsingSR(true)
    r.start()
    r.onend = () => setUsingSR(false)
  }

  const handleSampleClick = (sentence) => {
    setText(sentence)
    if (avatarState.isLoaded) {
      const g = avatarService.signText(sentence, speed)
      setGloss(g)
      setError('')
    }
  }

  const handleAvatarError = useCallback((err) => {
    setError('Could not load 3D avatar: ' + (err.message || err))
  }, [])

  return (
    <>
      <div className="page-intro feature-intro">
        <div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ArrowRight size={13} />
            Speech to Sign
          </div>
          <h2>Speak or type, watch it sign.</h2>
          <p>
            A realistic 3D human avatar signs your sentence in American Sign Language with articulated
            fingers and natural movements.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 12,
            color: '#c53030',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div className="card" style={{ padding: '20px 24px', marginBottom: 18 }}>
        {/* Realistic 3D Human Avatar Viewport */}
        <div style={{ marginBottom: 12 }}>
          <SignAvatar
            height="min(64vh, 540px)"
            onError={handleAvatarError}
          />

          {/* Interactive Avatar Controls Bar */}
          <AvatarControls
            state={avatarState}
            speed={speed}
            onSpeedChange={setSpeed}
            onPlay={handleSign}
            canPlay={avatarState.isLoaded && Boolean(text.trim())}
          />
        </div>

        {/* Gloss Sequence Chips with Active Highlighting */}
        {gloss.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              margin: '14px 0',
              padding: '10px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginRight: 4 }}>
              Sign Sequence:
            </span>
            {gloss.map((w, i) => {
              const isActive = avatarState.currentGloss === w && avatarState.currentIndex === i
              const isUnsupported = avatarState.unsupported && avatarState.unsupported.includes(w)
              return (
                <span
                  key={i}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : isUnsupported ? '#ef4444' : '#1e293b',
                    background: isActive ? '#0284c7' : isUnsupported ? '#fee2e2' : '#ffffff',
                    border: `1px solid ${isActive ? '#0284c7' : isUnsupported ? '#fca5a5' : '#cbd5e1'}`,
                    boxShadow: isActive ? '0 2px 6px rgba(2, 132, 199, 0.35)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {w[0] === '#' ? w.slice(1).toUpperCase().split('').join('-') : w}
                </span>
              )
            })}
          </div>
        )}

        {/* Text Input Area */}
        <textarea
          rows={2}
          placeholder="Type or speak an English sentence to convert into ASL signs..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            background: '#f8fafc',
            color: '#0f172a',
            fontSize: 14,
            resize: 'none',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Action Buttons Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 12,
            alignItems: 'center',
          }}
        >
          <button
            onClick={handleMic}
            disabled={usingSR}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Mic size={15} color={usingSR ? '#ef4444' : '#0284c7'} />
            {usingSR ? 'Listening...' : 'Speak'}
          </button>

          <button
            onClick={handleSign}
            disabled={!avatarState.isLoaded || !text.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: avatarState.isLoaded && text.trim() ? '#0284c7' : '#94a3b8',
              color: '#ffffff',
              cursor: avatarState.isLoaded && text.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              fontSize: 13,
              boxShadow:
                avatarState.isLoaded && text.trim() ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={15} />
            {avatarState.isLoaded ? 'Sign It' : 'Loading Avatar...'}
          </button>
        </div>

        {/* Sample Sentences Quick Buttons */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
            Sample Sentences:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SAMPLE_SENTENCES.map((s) => (
              <button
                key={s}
                onClick={() => handleSampleClick(s)}
                style={{
                  fontSize: 11,
                  padding: '5px 12px',
                  borderRadius: 99,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#0284c7'
                  e.currentTarget.style.color = '#0284c7'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.color = '#334155'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 18, lineHeight: 1.5 }}>
          Supports authentic ASL signs with individual finger articulation, arm kinematics, and letter-by-letter
          fingerspelling for names and unmapped words. Intended for assistive communication and learning; not for
          medical, legal, or emergency certification.
        </p>
      </div>
    </>
  )
}
