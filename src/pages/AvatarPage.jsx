import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowRight, Mic, Play, RotateCcw } from 'lucide-react'
import * as avatarService from '../services/avatar.service.js'

function StatusPill({ children, tone = 'teal' }) {
  return (
    <span className={`status-pill ${tone}`}>
      <span className="pill-dot" />
      {children}
    </span>
  )
}

const SAMPLE_SENTENCES = [
  'Hello, how are you?',
  'What is your name?',
  'Good morning',
  'Nice to meet you',
  'I am hungry',
  'I need water',
  'I need help',
  'Where is the bathroom?',
  'I want to go home',
  'Do you understand?',
  'I do not know',
  'Thank you very much',
  'I love you',
  'See you tomorrow',
]

export default function AvatarPage() {
  const canvasRef = useRef(null)
  const [text, setText] = useState('')
  const [speed, setSpeed] = useState(1)
  const [gloss, setGloss] = useState([])
  const [activeGlossIndex, setActiveGlossIndex] = useState(-1)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [usingSR, setUsingSR] = useState(false)

  const handleGlossChange = useCallback((index) => {
    setActiveGlossIndex(index)
  }, [])

  useEffect(() => {
    try {
      if (canvasRef.current) {
        avatarService.initAvatar(canvasRef.current, handleGlossChange)
        setReady(true)
      }
    } catch (e) {
      setError('Avatar error: ' + e.message)
    }

    return () => {
      avatarService.destroyAvatar()
    }
  }, [handleGlossChange])

  const handleSign = () => {
    if (!ready || !text.trim()) return
    try {
      const g = avatarService.signText(text, speed)
      setGloss(g)
      setActiveGlossIndex(0)
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
      if (ready) {
        const g = avatarService.signText(t, speed)
        setGloss(g)
        setActiveGlossIndex(0)
      }
    }
    r.onerror = (e) =>
      setError('Microphone error: ' + e.error + '. Type your sentence instead.')
    setUsingSR(true)
    r.start()
    r.onend = () => setUsingSR(false)
  }

  const handleSampleClick = (sentence) => {
    setText(sentence)
    if (ready) {
      const g = avatarService.signText(sentence, speed)
      setGloss(g)
      setActiveGlossIndex(0)
      setError('')
    }
  }

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
            A 3D avatar signs your sentence in ASL. About 75 hand-authored signs; unknown
            words are fingerspelled.
          </p>
        </div>
        <StatusPill tone={ready ? 'teal' : 'slate'}>
          {ready ? 'Ready' : 'Loading…'}
        </StatusPill>
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

      {/* 2-Column Split Screen: Left = 3D Avatar, Right = Input & Controls */}
      <div className="avatar-grid">
        {/* Left Half: 3D Signing Avatar Viewport */}
        <section className="card" style={{ padding: '23px 25px' }}>
          <div className="card-heading">
            <div>
              <span className="eyebrow">3D SIGNING AVATAR</span>
              <h2>Live ASL signing</h2>
            </div>
            <StatusPill tone={ready ? 'teal' : 'slate'}>
              {ready ? 'Active' : 'Standby'}
            </StatusPill>
          </div>

          <div
            id="stage"
            style={{
              height: 'min(58vh, 480px)',
              background: '#e9eef7',
              border: '1px solid #e6edf1',
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>

          {/* Live Gloss Sequence Chips */}
          {gloss.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div className="detection-label" style={{ marginBottom: 6 }}>
                CURRENT SIGN SEQUENCE
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                {gloss.map((w, i) => {
                  const isActive = activeGlossIndex === i
                  return (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#ffffff' : '#aebcdd',
                        background: isActive ? '#14b8a6' : '#101b2d',
                        border: `1px solid ${isActive ? '#14b8a6' : '#344366'}`,
                        boxShadow: isActive ? '0 2px 6px rgba(20, 184, 166, 0.4)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {w[0] === '#' ? w.slice(1).toUpperCase().split('').join('-') : w}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* Right Half: Text Input, Buttons, and Sample Sentences */}
        <section
          className="card"
          style={{
            padding: '23px 25px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div className="card-heading">
            <div>
              <span className="eyebrow">INPUT MESSAGE</span>
              <h2>Speech &amp; text input</h2>
            </div>
            {text && (
              <button
                className="text-button"
                onClick={() => {
                  setText('')
                  setGloss([])
                  setActiveGlossIndex(-1)
                }}
              >
                <RotateCcw size={14} /> Clear
              </button>
            )}
          </div>

          {/* Text Area */}
          <textarea
            rows={3}
            placeholder="Type a sentence or tap Speak to dictate…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              minHeight: '110px',
              padding: 13,
              border: '1px solid #dce7ea',
              borderRadius: 8,
              background: '#f7fafc',
              color: '#172b3a',
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
          />

          {/* Controls Row: Speak, Sign it, Speed Dropdown */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <button
              className="button button-secondary"
              onClick={handleMic}
              disabled={usingSR}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 16px',
                height: 38,
                borderRadius: 8,
                border: '1px solid #dce7ea',
                background: '#fff',
                color: '#172b3a',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Mic size={15} color={usingSR ? '#ef4444' : '#14b8a6'} />
              {usingSR ? 'Listening…' : 'Speak'}
            </button>

            <button
              className="button button-primary"
              onClick={handleSign}
              disabled={!ready || !text.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 20px',
                height: 38,
                borderRadius: 8,
                border: 'none',
                background: ready && text.trim() ? '#14b8a6' : '#d1d5db',
                color: '#fff',
                cursor: ready && text.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 700,
                fontSize: 12,
                boxShadow: ready && text.trim() ? '0 2px 6px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Play size={14} fill="currentColor" />
              {ready ? 'Sign it' : 'Loading…'}
            </button>

            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid #dce7ea',
                background: '#fff',
                color: '#172b3a',
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none',
                fontWeight: 500,
              }}
            >
              <option value={1}>Normal (1.0x)</option>
              <option value={0.7}>Slow (0.7x)</option>
              <option value={1.4}>Fast (1.4x)</option>
            </select>
          </div>

          {/* Sample Sentences Chips */}
          <div style={{ marginTop: 4 }}>
            <div className="detection-label" style={{ marginBottom: 8 }}>
              QUICK SAMPLE SENTENCES
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SAMPLE_SENTENCES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSampleClick(s)}
                  style={{
                    fontSize: 11,
                    padding: '6px 11px',
                    borderRadius: 99,
                    border: '1px solid #dce7ea',
                    background: '#fff',
                    color: '#496272',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#14b8a6'
                    e.currentTarget.style.color = '#14b8a6'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#dce7ea'
                    e.currentTarget.style.color = '#496272'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <p
            style={{
              fontSize: 10,
              color: '#8a9aa7',
              margin: '8px 0 0',
              lineHeight: 1.5,
              borderTop: '1px solid #eef2f4',
              paddingTop: 10,
            }}
          >
            About 75 hand-authored signs and common phrases; other words are fingerspelled. Facial
            grammar is not modelled. Not for medical, legal or emergency use.
          </p>
        </section>
      </div>
    </>
  )
}
