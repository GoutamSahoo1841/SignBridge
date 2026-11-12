import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Hand,
  Lightbulb,
  Play,
  Square,
  Trash2,
  Volume2,
} from 'lucide-react'

import { initMediaPipe, detectFrame } from '../services/mediapipe.service.js'
import { startCamera, stopCamera, startLoop } from '../services/camera.service.js'
import {
  gFeat,
  gRes,
  gClassify,
  loadGestures,
  saveGestures,
  QUICK_DEFS,
  loadQuickSentences,
} from '../services/gestureTraining.service.js'
import { speak, isSpeechAvailable } from '../services/speech.service.js'

function StatusPill({ children, tone = 'teal' }) {
  return <span className={`status-pill ${tone}`}><span className="pill-dot" />{children}</span>
}

export default function GestureTraining() {
  const videoRef = useRef(null)
  const stopLoopRef = useRef(null)
  const isCameraRunning = useRef(false)

  const [gestures, setGestures] = useState([])
  const [quickSentences, setQuickSentences] = useState({})
  const [gtext, setGtext] = useState('')
  const [strictMode, setStrictMode] = useState(false)
  const [status, setStatus] = useState('')
  const [step, setStep] = useState('idle') // 'idle' | 'recording' | 'done' | 'listening'
  const [sampleCount, setSampleCount] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [lastMatch, setLastMatch] = useState('')

  const gesturesRef = useRef([])
  const recRef = useRef(null)
  const gSegRef = useRef(null)
  const gPresRef = useRef(0)
  const gLastRef = useRef(0)
  const modeRef = useRef('idle')

  useEffect(() => {
    const G = loadGestures()
    gesturesRef.current = G
    setGestures(G)
    setQuickSentences(loadQuickSentences())
  }, [])

  const statusRef = useRef(setStatus)
  useEffect(() => { statusRef.current = setStatus }, [setStatus])

  const startCameraIfNeeded = async () => {
    if (isCameraRunning.current) return
    if (!videoRef.current) return

    setStatus('Starting camera…')
    await initMediaPipe((msg) => setStatus(msg))
    await startCamera(videoRef.current)
    isCameraRunning.current = true
    setCameraOn(true)

    const stopLoop = startLoop((now) => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return

      try {
        const { hands, pose } = detectFrame(video, now)
        const gf = gFeat(hands, pose)

        if (gf) {
          gPresRef.current++
          gLastRef.current = now
        } else if (!gSegRef.current) {
          gPresRef.current = 0
        }

        if (!gSegRef.current) {
          if (gf && gPresRef.current >= 3) {
            gSegRef.current = { fr: [gf], t0: now }
            if (modeRef.current !== 'idle') {
              statusRef.current('● Capturing your gesture… lower your hand(s) when done.')
            }
          }
        } else {
          gSegRef.current.fr.push(gf || new Float32Array(90))

          const timeDone = !gf && now - gLastRef.current > 600
          const tooLong = now - gSegRef.current.t0 > 5000

          if (timeDone || tooLong) {
            const fr = gSegRef.current.fr
            gSegRef.current = null
            gPresRef.current = 0

            while (fr.length && !fr[fr.length - 1].some((v) => v !== 0)) fr.pop()

            if (fr.length < 6) {
              statusRef.current('Too short. Try again, a bit slower.')
              return
            }

            const resampled = gRes(fr)
            handleGestureDone(resampled)
          }
        }
      } catch {
        // ignore frame errors
      }
    })

    stopLoopRef.current = stopLoop
    setStatus('Camera ready.')
  }

  const handleGestureDone = (r) => {
    const mode = modeRef.current

    if (mode === 'rec' && recRef.current) {
      recRef.current.samples.push(r)
      const n = recRef.current.samples.length
      setSampleCount(n)

      if (n < 3) {
        statusRef.current(`Sample ${n} of 3 saved. Do the same gesture again.`)
      } else {
        const newG = [...gesturesRef.current.filter((g) => g.s !== recRef.current.s), recRef.current]
        gesturesRef.current = newG
        try { saveGestures(newG) } catch (e) { statusRef.current('Could not save: ' + e.message) }
        setGestures([...newG])
        recRef.current = null
        modeRef.current = 'idle'
        setStep('done')
        setGtext('')
        statusRef.current('Saved! Teach another gesture, or press Start listening.')
      }
    } else if (mode === 'listen' && gesturesRef.current.length > 0) {
      const c = gClassify(r, gesturesRef.current)
      if (strictMode && !c.sure) {
        statusRef.current('Not sure which gesture that was. Try again.')
        return
      }
      const sentence = c.g.s
      setLastMatch(sentence)
      statusRef.current(`Heard: "${sentence}" ${c.sure ? '(sure)' : '(not sure)'}`)
      if (isSpeechAvailable()) speak(sentence)
    }
  }

  const handleRecord = async () => {
    const t = gtext.trim()
    if (!t) { setStatus('Type the sentence first.'); return }

    await startCameraIfNeeded()
    modeRef.current = 'rec'
    recRef.current = { s: t, samples: [] }
    gSegRef.current = null
    gPresRef.current = 0
    setSampleCount(0)
    setStep('recording')
    setStatus('Recording 1 of 3: raise your hand(s), do the gesture, lower them.')
  }

  const handleListen = async () => {
    if (isListening) {
      modeRef.current = 'idle'
      setIsListening(false)
      setStatus('Stopped.')
      return
    }

    if (gesturesRef.current.length === 0) {
      setStatus('Teach at least one gesture first.')
      return
    }

    await startCameraIfNeeded()
    modeRef.current = 'listen'
    gSegRef.current = null
    gPresRef.current = 0
    setIsListening(true)
    setStep('listening')
    setStatus('Listening… raise your hand(s), do a gesture, lower them.')
  }

  const handleDelete = (index) => {
    const updated = gesturesRef.current.filter((_, i) => i !== index)
    gesturesRef.current = updated
    try { saveGestures(updated) } catch {}
    setGestures([...updated])
  }

  const handleTest = (g) => {
    if (isSpeechAvailable()) speak(g.s)
    setLastMatch(g.s)
  }

  useEffect(() => {
    return () => {
      if (stopLoopRef.current) stopLoopRef.current()
      stopCamera(videoRef.current)
    }
  }, [])

  return (
    <>
      <div className="page-intro feature-intro">
        <div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ArrowRight size={13} />
            Gesture Training
          </div>
          <h2>Teach SignBridge your language.</h2>
          <p>Create custom gestures for messages you use most often.</p>
        </div>
        <StatusPill tone="slate">{gestures.length} saved gesture{gestures.length !== 1 ? 's' : ''}</StatusPill>
      </div>

      {status && (
        <div style={{
          background: '#f4fbf9', border: '1px solid #d8eee8', borderRadius: 8,
          padding: '10px 16px', fontSize: 12, color: '#146c61', marginBottom: 16
        }}>
          {status}
        </div>
      )}

      {lastMatch && (
        <div style={{
          background: '#eaf8f4', border: '1px solid #c9f0e6', borderRadius: 8,
          padding: '10px 16px', fontSize: 14, fontWeight: 700, color: '#1a756c', marginBottom: 16
        }}>
          🗣 Matched: "{lastMatch}"
        </div>
      )}

      <div className="training-layout">
        <section className="card training-camera">
          <div className="card-heading">
            <div>
              <span className="eyebrow">{step === 'recording' ? `RECORDING SAMPLE ${sampleCount + 1} OF 3` : 'GESTURE CAMERA'}</span>
              <h2>{step === 'recording' ? 'Record your gesture' : step === 'listening' ? 'Listening for gestures' : 'Set up camera'}</h2>
            </div>
          </div>

          <div
            className="training-stage"
            style={{ position: 'relative', overflow: 'hidden', height: 240 }}
          >
            <video
              ref={videoRef}
              autoPlay playsInline muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: cameraOn ? 'block' : 'none',
                position: 'absolute', inset: 0,
              }}
            />
            {!cameraOn && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#92a5af' }}>
                <Hand size={70} />
                <span style={{ fontSize: 12, color: '#536c7b' }}>Camera preview</span>
                <small style={{ fontSize: 10 }}>Will start when you record or listen</small>
              </div>
            )}
          </div>

          {step === 'recording' && (
            <div className="sample-progress">
              <div className="sample-title">
                <span>Recording samples</span>
                <strong>{sampleCount} of 3</strong>
              </div>
              <div className="progress">
                <span style={{ width: `${(sampleCount / 3) * 100}%` }} />
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', color: '#576e7c', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
              Message associated with this gesture
            </label>
            <input
              value={gtext}
              onChange={(e) => setGtext(e.target.value)}
              placeholder="e.g. I need assistance"
              style={{
                width: '100%', height: 40, border: '1px solid #dce7ea', borderRadius: 6,
                padding: '0 11px', outline: 'none', fontSize: 11
              }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="button button-primary"
                onClick={handleRecord}
                disabled={step === 'recording'}
                style={{ flex: 1 }}
              >
                <Play size={16} fill="currentColor" />
                {step === 'recording' ? `Sample ${sampleCount}/3…` : '⏺ Record gesture (3 samples)'}
              </button>
            </div>

            <div className="training-tip">
              <Lightbulb size={17} />
              <span>Raise your hand(s), do the gesture clearly, then lower them. Repeat 3 times.</span>
            </div>
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, color: '#576e7c', fontSize: 12 }}>
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
            />
            Only speak when sure (otherwise always picks the closest gesture)
          </label>
        </section>

        <section className="card training-form">
          <div className="card-heading">
            <div>
              <span className="eyebrow">RECOGNITION</span>
              <h2>Test &amp; listen</h2>
            </div>
          </div>

          <button
            className={`button ${isListening ? 'button-secondary' : 'button-primary'} save-button`}
            onClick={handleListen}
          >
            {isListening ? (
              <><Square size={16} fill="currentColor" /> Stop listening</>
            ) : (
              <><Volume2 size={17} /> 👂 Start listening</>
            )}
          </button>

          <div className="saved-title" style={{ marginTop: 24 }}>
            <span className="eyebrow">SAVED GESTURES</span>
            <span style={{ fontSize: 10, color: '#91a0aa' }}>{gestures.length} total</span>
          </div>

          {gestures.length === 0 && (
            <p style={{ fontSize: 11, color: '#8a9aa7', marginTop: 12 }}>
              No gestures saved yet. Record your first gesture using the form on the left.
            </p>
          )}

          {gestures.map((g, i) => (
            <div className="saved-gesture" key={i}>
              <div className="saved-gesture-icon"><Hand size={16} /></div>
              <strong style={{ flex: 1 }}>{g.s}</strong>
              <span>{g.samples.length} samples</span>
              <button
                className="icon-button"
                title="Test: speak this gesture's sentence"
                onClick={() => handleTest(g)}
              >
                <Volume2 size={15} />
              </button>
              <button
                className="icon-button"
                title="Delete"
                onClick={() => handleDelete(i)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <div className="saved-title" style={{ marginTop: 24 }}>
            <span className="eyebrow">BUILT-IN QUICK GESTURES</span>
          </div>
          <p style={{ fontSize: 10, color: '#8a9aa7', marginBottom: 10 }}>
            These gestures are always recognized (no training needed). Tap to test.
          </p>
          {QUICK_DEFS.map(([key, description, sentence]) => (
            <div
              key={key}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0',
                borderBottom: '1px solid #eff3f4', fontSize: 11
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ color: '#172b3a', fontWeight: 600 }}>{sentence}</div>
                <div style={{ color: '#8a9aa7', fontSize: 10, marginTop: 2 }}>{description}</div>
              </div>
              <button
                className="icon-button"
                title="Test voice"
                onClick={() => { if (isSpeechAvailable()) speak(sentence); setLastMatch(sentence) }}
              >
                <Volume2 size={14} />
              </button>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}
