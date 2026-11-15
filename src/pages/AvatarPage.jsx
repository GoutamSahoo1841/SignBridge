import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowRight, Mic, Play } from 'lucide-react'
import * as avatarService from '../services/avatar.service.js'

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
    let mounted = true

    const tryInit = async () => {
      // Wait for THREE from window.THREE
      for (let i = 0; i < 30; i++) {
        if (window.THREE) break
        await new Promise((r) => setTimeout(r, 200))
      }

      if (!window.THREE) {
        if (mounted) {
          setError(
            'Three.js did not load. Make sure /assets/three.min.js is present and the page is served over HTTP(S).'
          )
        }
        return
      }

      try {
        if (canvasRef.current && mounted) {
          avatarService.initAvatar(canvasRef.current, handleGlossChange)
          setReady(true)
        }
      } catch (e) {
        if (mounted) setError('Avatar error: ' + e.message)
      }
    }

    tryInit()

    return () => {
      mounted = false
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
      setError('Speech recognition needs Chrome or Edge. You can type instead.')
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
            A 3D avatar will sign your sentence in ASL. About 75 hand-authored signs; unknown
            words are fingerspelled.
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
        {/* Canvas stage from SignBridge-Complete */}
        <div
          id="stage"
          style={{
            height: 'min(62vh, 520px)',
            background: '#e9eef7',
            border: '1px solid #e6edf1',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 14,
          }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {/* Gloss sequence chips with real-time active highlighting */}
        {gloss.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 14,
              minHeight: 30,
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
                    fontSize: 12,
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
        )}

        {/* Text Input Area */}
        <textarea
          rows={2}
          placeholder="Type or speak a sentence…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #dce7ea',
            borderRadius: 8,
            background: '#f7fafc',
            color: '#172b3a',
            fontSize: 14,
            resize: 'none',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Controls Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 10,
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
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #dce7ea',
              background: '#fff',
              color: '#172b3a',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Mic size={15} color={usingSR ? '#ef4444' : '#14b8a6'} />
            {usingSR ? 'Listening…' : 'Speak'}
          </button>

          <button
            onClick={handleSign}
            disabled={!ready || !text.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: ready && text.trim() ? '#14b8a6' : '#d1d5db',
              color: '#fff',
              cursor: ready && text.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              fontSize: 13,
              boxShadow: ready && text.trim() ? '0 2px 6px rgba(20, 184, 166, 0.3)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <Play size={14} fill="currentColor" />
            {ready ? 'Sign it' : 'Loading avatar…'}
          </button>

          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #dce7ea',
              background: '#fff',
              color: '#172b3a',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value={0.7}>Slow (0.7x)</option>
            <option value={1}>Normal (1.0x)</option>
            <option value={1.4}>Fast (1.4x)</option>
          </select>
        </div>

        {/* Sample Sentences Quick Buttons from SignBridge-Complete */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {SAMPLE_SENTENCES.map((s) => (
            <button
              key={s}
              onClick={() => handleSampleClick(s)}
              style={{
                fontSize: 11,
                padding: '5px 10px',
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

        <p style={{ fontSize: 11, color: '#8a9aa7', marginTop: 16, lineHeight: 1.5 }}>
          About 75 hand-authored signs and common phrases; other words are fingerspelled. Facial
          grammar is not modelled. Not for medical, legal or emergency use.
        </p>
      </div>
    </>
  )
}
