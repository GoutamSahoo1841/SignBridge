import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
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
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [usingSR, setUsingSR] = useState(false)

  useEffect(() => {
    let mounted = true

    const tryInit = async () => {
      for (let i = 0; i < 30; i++) {
        if (window.THREE) break
        await new Promise((r) => setTimeout(r, 300))
      }

      if (!window.THREE) {
        if (mounted) setError('Three.js did not load. Make sure /assets/three.min.js is present.')
        return
      }

      try {
        if (canvasRef.current && mounted) {
          avatarService.initAvatar(canvasRef.current)
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
  }, [])

  const handleSign = () => {
    if (!ready || !text.trim()) return
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
      }
    }
    r.onerror = (e) => setError('Microphone error: ' + e.error + '. Type your sentence instead.')
    setUsingSR(true)
    r.start()
    r.onend = () => setUsingSR(false)
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
          <p>A 3D avatar will sign your sentence in ASL. About 75 hand-authored signs; unknown words are fingerspelled.</p>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8,
          padding: '10px 16px', fontSize: 12, color: '#c53030', marginBottom: 16
        }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: '20px 24px', marginBottom: 18 }}>
        <div
          id="avatar-stage"
          style={{
            height: 'min(62vh, 520px)', background: '#e9eef7',
            border: '1px solid #e6edf1', borderRadius: 12,
            overflow: 'hidden', marginBottom: 14
          }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {gloss.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, minHeight: 30 }}>
            {gloss.map((w, i) => (
              <span
                key={i}
                style={{
                  padding: '4px 10px', border: '1px solid #344366',
                  borderRadius: 99, fontSize: 12, color: '#aebcdd',
                  background: '#101b2d'
                }}
              >
                {w[0] === '#' ? w.slice(1).toUpperCase().split('').join('-') : w}
              </span>
            ))}
          </div>
        )}

        <textarea
          rows={2}
          placeholder="Type or speak a sentence…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%', padding: 10, border: '1px solid #e6edf1',
            borderRadius: 8, background: '#f7fafc',
            color: '#172b3a', fontSize: 14, resize: 'none',
            fontFamily: 'inherit'
          }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <button
            onClick={handleMic}
            disabled={usingSR}
            style={{
              padding: '10px 16px', borderRadius: 8,
              border: '1px solid #e6edf1', background: '#fff',
              color: '#172b3a', cursor: 'pointer', fontSize: 13
            }}
          >
            {usingSR ? '🎙 Listening…' : '🎙 Speak'}
          </button>

          <button
            onClick={handleSign}
            disabled={!ready || !text.trim()}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: ready ? '#14b8a6' : '#d1d5db',
              color: '#fff', cursor: ready ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontSize: 13
            }}
          >
            {ready ? '▶ Sign it' : 'Loading avatar…'}
          </button>

          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{
              padding: '10px 16px', borderRadius: 8,
              border: '1px solid #e6edf1', background: '#fff',
              color: '#172b3a', fontSize: 13, cursor: 'pointer'
            }}
          >
            <option value={0.7}>Slow</option>
            <option value={1}>Normal</option>
            <option value={1.4}>Fast</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {SAMPLE_SENTENCES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setText(s)
                if (ready) {
                  const g = avatarService.signText(s, speed)
                  setGloss(g)
                }
              }}
              style={{
                fontSize: 11, padding: '5px 10px', borderRadius: 99,
                border: '1px solid #dce7ea', background: '#fff',
                color: '#496272', cursor: 'pointer'
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 11, color: '#8a9aa7', marginTop: 16, lineHeight: 1.5 }}>
          About 75 hand-authored signs and common phrases; other words are fingerspelled.
          Facial grammar is not modelled. Not for medical, legal or emergency use.
        </p>
      </div>
    </>
  )
}

