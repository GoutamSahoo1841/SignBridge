import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Camera,
  Check,
  Copy,
  Keyboard,
  Lightbulb,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Volume2,
} from 'lucide-react'

import { initMediaPipe, detectFrame, makeFrame } from '../services/mediapipe.service.js'
import { initOnnx } from '../services/onnx.service.js'
import { startCamera, stopCamera, startLoop } from '../services/camera.service.js'
import {
  pushFrame,
  tryInfer,
  resetPredictions,
} from '../services/signRecognition.service.js'
import {
  gFeat,
  gRes,
  gClassify,
  loadGestures,
  qClass,
  loadQuickSentences,
} from '../services/gestureTraining.service.js'
import { speak, isSpeechAvailable } from '../services/speech.service.js'
import { generateSentence } from '../services/sentenceBuilder.service.js'

function StatusPill({ children, tone = 'teal' }) {
  return (
    <span className={`status-pill ${tone}`}>
      <span className="pill-dot" />
      {children}
    </span>
  )
}

export default function SignToText() {
  const videoRef = useRef(null)
  const stopLoopRef = useRef(null)

  const [cameraStatus, setCameraStatus] = useState('idle')
  const [statusMsg, setStatusMsg] = useState(
    'Ready. The first run downloads MediaPipe detector assets and the ONNX runtime from public CDNs; the ~22 MB classifier is bundled locally.'
  )
  const [statusTone, setStatusTone] = useState('')

  const [detStatus, setDetStatus] = useState({ face: false, pose: false, lh: false, rh: false })
  const [currentSign, setCurrentSign] = useState('—')
  const [confidence, setConfidence] = useState(0)
  const [topPreds, setTopPreds] = useState([])
  const [sentence, setSentence] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  const gesturesRef = useRef([])
  const [gestures, setGestures] = useState([])

  const setStatus = useCallback((msg, tone = '') => {
    setStatusMsg(msg)
    setStatusTone(tone)
  }, [])

  useEffect(() => {
    const G = loadGestures()
    gesturesRef.current = G
    setGestures(G)
  }, [])

  const handleStart = async () => {
    if (!videoRef.current) return
    setCameraStatus('starting')
    setStatus('Initializing…')

    try {
      await initMediaPipe((msg) => setStatus(msg))
      await initOnnx((msg) => setStatus(msg))

      await startCamera(videoRef.current)
      setCameraStatus('running')
      resetPredictions()

      let lastDetUpdate = 0
      let gSegRef = null
      let gPresRef = 0
      let gLastRef = 0

      const stopLoop = startLoop((now) => {
        const video = videoRef.current
        if (!video || video.readyState < 2) return

        try {
          const { face, hands, pose } = detectFrame(video, now)
          const { frame, status } = makeFrame(face, hands, pose)
          const hasHands = status.lh || status.rh

          pushFrame(frame, hasHands)

          const gf = gFeat(hands, pose)
          if (gf) {
            gPresRef++
            gLastRef = now
          } else if (!gSegRef) {
            gPresRef = 0
          }

          if (!gSegRef) {
            if (gf && gPresRef >= 3) {
              gSegRef = { fr: [gf], t0: now }
            }
          } else {
            gSegRef.fr.push(gf || new Float32Array(90))
            const timeDone = !gf && now - gLastRef > 600
            const tooLong = now - gSegRef.t0 > 5000
            if (timeDone || tooLong) {
              const fr = gSegRef.fr
              gSegRef = null
              gPresRef = 0
              while (fr.length && !fr[fr.length - 1].some((v) => v !== 0)) fr.pop()

              if (fr.length >= 6 && gesturesRef.current.length > 0) {
                const resampled = gRes(fr)
                const result = gClassify(resampled, gesturesRef.current)
                if (result.inCut && result.sure) {
                  const s = result.g.s
                  setSentence((prev) => (prev ? prev + ' ' + s : s))
                  if (isSpeechAvailable()) speak(s)
                } else {
                  const qk = qClass(fr)
                  const qs = loadQuickSentences()
                  const qSentence = qs[qk]
                  if (qSentence) setSentence((prev) => (prev ? prev + ' ' + qSentence : qSentence))
                }
              } else if (fr.length >= 6 && gesturesRef.current.length === 0) {
                const qk = qClass(fr)
                const qs = loadQuickSentences()
                const qSentence = qs[qk]
                if (qSentence) setSentence((prev) => (prev ? prev + ' ' + qSentence : qSentence))
              }
            }
          }

          tryInfer(
            now,
            hasHands,
            (state) => {
              setCurrentSign(state.currentSign)
              setTopPreds(state.topPredictions)
              setConfidence(state.topPredictions[0]?.score ?? 0)
            },
            (word) => {
              setSentence((prev) => (prev ? prev + ' ' + word : word))
            }
          ).catch(() => {})

          if (now - lastDetUpdate > 400) {
            lastDetUpdate = now
            setDetStatus({ ...status })
          }
        } catch (e) {
          setStatus('Camera processing error: ' + e.message, 'error')
        }
      })

      stopLoopRef.current = stopLoop
    } catch (e) {
      setCameraStatus('error')
      setStatus('Could not start: ' + e.message, 'error')
    }
  }

  const handleStop = useCallback(() => {
    if (stopLoopRef.current) {
      stopLoopRef.current()
      stopLoopRef.current = null
    }
    stopCamera(videoRef.current)
    setCameraStatus('stopped')
    setCurrentSign('—')
    setConfidence(0)
    setTopPreds([])
    setDetStatus({ face: false, pose: false, lh: false, rh: false })
    setStatus('Stopped. Your sentence remains available to edit/copy.')
  }, [setStatus])

  useEffect(() => {
    return () => {
      if (stopLoopRef.current) stopLoopRef.current()
      stopCamera(videoRef.current)
    }
  }, [])

  const handleSpeak = () => {
    if (!sentence.trim()) {
      setStatus('Enter or generate a sentence before speaking.', 'warn')
      return
    }
    if (!isSpeechAvailable()) {
      setStatus('This browser does not support built-in speech. Try current Chrome or Edge.', 'error')
      return
    }
    speak(sentence)
    setStatus('Speaking the sentence shown in the text box.', 'ok')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sentence)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
      setStatus('Text copied.', 'ok')
    } catch {
      setStatus('Copy blocked by browser. Select the text and copy it manually.', 'warn')
    }
  }

  const handleGenerate = async () => {
    if (!sentence.trim()) {
      setStatus('No sign labels yet. Sign first, or type labels into the box.', 'warn')
      return
    }
    setGenerating(true)
    setStatus('Generating sentence…')
    const result = await generateSentence(sentence)
    setSentence(result.sentence)
    if (result.method === 'ollama') {
      setStatus('Sentence drafted by local AI. Please verify it against what you signed.', 'ok')
    } else {
      const errNote = result.error ? ` (Ollama unavailable: ${result.error})` : ''
      setStatus(`Rule-based sentence generated.${errNote}`, result.error ? 'warn' : 'ok')
    }
    setGenerating(false)
  }

  const isRunning = cameraStatus === 'running'
  const isStarting = cameraStatus === 'starting'

  return (
    <>
      <div className="page-intro feature-intro">
        <div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ArrowRight size={13} />
            Sign to Text
          </div>
          <h2>Speak with your hands.</h2>
          <p>Turn your gestures into clear, meaningful communication in real time.</p>
        </div>
        <div className="shortcut">
          <Keyboard size={16} />
          <span>Camera runs locally — no data leaves your device</span>
        </div>
      </div>

      <div className="sign-grid">
        {/* Camera Panel */}
        <section className="card camera-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">LIVE CAMERA</span>
              <h2>Camera preview</h2>
            </div>
            <StatusPill tone={isRunning ? 'teal' : isStarting ? 'amber' : 'slate'}>
              {isRunning ? 'Active' : isStarting ? 'Loading…' : 'Standby'}
            </StatusPill>
          </div>

          <div className={`camera-stage ${isRunning ? 'is-active' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: isRunning ? 'block' : 'none',
                position: 'absolute',
                inset: 0,
              }}
            />
            {isRunning && (
              <>
                <div className="camera-grid" />
                <div className="scan-line" />
                <div className="camera-corner top-left" />
                <div className="camera-corner top-right" />
                <div className="camera-corner bottom-left" />
                <div className="camera-corner bottom-right" />
                <div className="camera-caption" style={{ position: 'absolute', bottom: 14, left: 17, zIndex: 2 }}>
                  <span className="record-dot" /> Detecting hand position
                </div>
              </>
            )}
            {!isRunning && (
              <div className="camera-empty">
                <div className="camera-icon">
                  <Camera size={28} />
                </div>
                <strong>Your camera preview will appear here</strong>
                <span>Allow camera access to begin translating gestures.</span>
              </div>
            )}
          </div>

          <div className="camera-controls">
            {!isRunning ? (
              <button
                className="button button-primary"
                onClick={handleStart}
                disabled={isStarting}
              >
                <Play size={17} fill="currentColor" />
                {isStarting ? 'Starting…' : 'Start camera & model'}
              </button>
            ) : (
              <button className="button button-secondary" onClick={handleStop}>
                <Square size={16} fill="currentColor" /> Stop
              </button>
            )}
            <button
              className="button button-secondary"
              onClick={() => { setSentence(''); setCurrentSign('—'); setConfidence(0) }}
            >
              <Trash2 size={16} /> Clear sentence
            </button>
            <button className="icon-button bordered" aria-label="Camera settings">
              <Settings size={18} />
            </button>
            <span className="camera-hint">
              <ShieldCheck size={15} /> Your video stays on this device
            </span>
          </div>

          <div
            className="detection-label"
            style={{
              marginTop: 10,
              fontSize: 11,
              color: statusTone === 'ok' ? '#22a06b' : statusTone === 'error' ? '#e53e3e' : statusTone === 'warn' ? '#e8a23a' : '#64748b',
              lineHeight: 1.5,
            }}
          >
            {statusMsg}
          </div>

          <div className="detection-list">
            <div className="detection-label">DETECTION STATUS</div>
            {[
              { key: 'lh', label: 'Left hand' },
              { key: 'rh', label: 'Right hand' },
              { key: 'face', label: 'Face' },
              { key: 'pose', label: 'Body' },
            ].map(({ key, label }) => (
              <div className="detection-row" key={key}>
                <span>
                  <span className={`signal ${detStatus[key] ? 'on' : ''}`} />
                  {label}
                </span>
                <span>{isRunning ? (detStatus[key] ? 'Detected' : 'Waiting') : 'Standby'}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recognition + Output Column */}
        <div className="output-column">
          <section className="card recognition-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">RECOGNITION</span>
                <h2>Live translation</h2>
              </div>
              <StatusPill tone={isRunning ? 'teal' : 'slate'}>
                {isRunning ? 'Listening' : 'Standby'}
              </StatusPill>
            </div>

            <div className="recognized">
              <div className="recognized-label">
                <span className="live-dot" /> CURRENT SIGN
              </div>
              <div className="recognized-word">{currentSign}</div>
              <div className="confidence-row">
                <span>Confidence</span>
                <div className="confidence-bar">
                  <span style={{ width: `${Math.min(100, confidence * 100)}%` }} />
                </div>
                <strong>{isRunning ? `${(confidence * 100).toFixed(0)}%` : '—'}</strong>
              </div>
            </div>

            {topPreds.length > 0 && (
              <div className="sign-sequence" style={{ paddingBottom: 0 }}>
                <div className="section-label">TOP PREDICTIONS</div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {topPreds.map((p) => (
                    <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                      <span style={{ minWidth: 90, color: '#445b6a' }}>{p.label}</span>
                      <div className="confidence-bar" style={{ flex: 1 }}>
                        <span style={{ width: `${Math.min(100, p.score * 100)}%` }} />
                      </div>
                      <span style={{ color: '#14b8a6', fontWeight: 700 }}>{(p.score * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="recognition-note">
              <Lightbulb size={16} />
              <span>Good lighting and clear hand positioning improve accuracy. Signs recognized: ~250 ASL vocabulary.</span>
            </div>
          </section>

          <section className="card generated-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">OUTPUT</span>
                <h2>Generated message</h2>
              </div>
              <button className="text-button" onClick={() => setSentence('')}>
                <RotateCcw size={15} /> Clear
              </button>
            </div>

            <label className="sr-only" htmlFor="generated-message">Generated message</label>
            <textarea
              id="generated-message"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="Stable recognized signs will appear here. Edit the result manually if needed."
            />

            <div className="message-meta">
              <span>
                <span className="edit-dot" /> Editable text
              </span>
              <span>{sentence.length} characters</span>
            </div>

            <div className="message-actions">
              <button className="button button-primary" onClick={handleSpeak}>
                <Volume2 size={17} /> Speak text
              </button>
              <button className="button button-secondary" onClick={handleCopy}>
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? 'Copied' : 'Copy text'}
              </button>
              <button
                className="button button-ghost"
                onClick={handleGenerate}
                disabled={generating}
                title="Generate fluent sentence using Ollama (optional) or rule-based fallback"
              >
                <Sparkles size={17} />
                {generating ? 'Generating…' : 'Make sentence'}
              </button>
            </div>

            <div style={{ marginTop: 14, borderTop: '1px solid #eef2f4', paddingTop: 14 }}>
              <div className="detection-label" style={{ marginBottom: 8 }}>QUICK WORDS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['I', 'you', 'my', 'name', 'need', 'want', 'help', 'is', 'are', 'to'].map((w) => (
                  <button
                    key={w}
                    className="button button-secondary"
                    style={{ height: 28, padding: '0 10px', fontSize: 10 }}
                    onClick={() => setSentence((prev) => prev ? prev + ' ' + w : w)}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 10, color: '#8a9aa7', marginTop: 12, lineHeight: 1.5 }}>
              The model outputs sign labels, not sentence meaning. Results may be inaccurate with different lighting or signing styles.
              Treat results as experimental.
            </p>
          </section>
        </div>
      </div>

      <div className="quick-strip">
        <div>
          <span className="eyebrow">QUICK MESSAGES</span>
          <strong>Need to say something fast?</strong>
        </div>
        {['I need help', 'Please wait', 'Thank you'].map((item) => (
          <button
            key={item}
            className="quick-chip"
            onClick={() => {
              setSentence(item)
              if (isSpeechAvailable()) speak(item)
            }}
          >
            {item}
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
    </>
  )
}
