import { useState, useRef, useCallback, useEffect } from 'react'
import { initMediaPipe, detectFrame, makeFrame, isMediaPipeReady } from '../services/mediapipe.service.js'
import { initOnnx, isOnnxReady } from '../services/onnx.service.js'
import { startCamera, stopCamera, startLoop } from '../services/camera.service.js'
import { pushFrame, tryInfer, resetPredictions } from '../services/signRecognition.service.js'
import { generateSentence, ruleSentence } from '../services/sentenceBuilder.service.js'
import { useAppContext } from '../context/AppContext.jsx'

export function useSignRecognition() {
  const { addHistory } = useAppContext()

  const videoRef = useRef(null)
  const stopLoopRef = useRef(null)

  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | running | error
  const [statusMsg, setStatusMsg] = useState('')
  const [currentSign, setCurrentSign] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [topPreds, setTopPreds] = useState([])
  const [hasHands, setHasHands] = useState(false)
  const [words, setWords] = useState([])
  const [sentence, setSentence] = useState('')
  const [detStatus, setDetStatus] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [sentenceMethod, setSentenceMethod] = useState(null)

  const onStatus = useCallback((msg) => {
    setStatusMsg(msg)
  }, [])

  const start = useCallback(async () => {
    if (!videoRef.current) return
    setStatus('loading')
    setStatusMsg('Initializing…')

    try {
      await Promise.all([
        isMediaPipeReady() ? Promise.resolve() : initMediaPipe(onStatus),
        isOnnxReady() ? Promise.resolve() : initOnnx(onStatus),
      ])

      await startCamera(videoRef.current)
      resetPredictions()
      setWords([])
      setSentence('')
      setStatus('running')
      setIsRunning(true)
      setStatusMsg('Running')

      const stopFn = startLoop(async (ts) => {
        const video = videoRef.current
        if (!video || video.readyState < 2) return
        try {
          const raw = detectFrame(video, ts)
          const { frame, status: det } = makeFrame(raw.face, raw.hands, raw.pose)
          setDetStatus(det)

          const handsNow = det.lh || det.rh
          setHasHands(handsNow)
          pushFrame(frame, handsNow)

          await tryInfer(
            ts,
            handsNow,
            (state) => {
              setCurrentSign(state.currentSign)
              setConfidence(state.topPredictions[0]?.score ?? 0)
              setTopPreds(state.topPredictions)
            },
            (word) => {
              setWords((prev) => [...prev, word])
            }
          )
        } catch {
          // ignore per-frame errors
        }
      })

      stopLoopRef.current = stopFn
    } catch (err) {
      setStatus('error')
      setStatusMsg(err.message || 'Failed to start')
      setIsRunning(false)
    }
  }, [onStatus])

  const stop = useCallback(() => {
    if (stopLoopRef.current) {
      stopLoopRef.current()
      stopLoopRef.current = null
    }
    stopCamera(videoRef.current)
    setIsRunning(false)
    setStatus('idle')
    setStatusMsg('')
    setCurrentSign('')
    setHasHands(false)
    setDetStatus(null)
  }, [])

  const addWord = useCallback((word) => {
    setWords((prev) => [...prev, word])
  }, [])

  const removeWord = useCallback((index) => {
    setWords((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearWords = useCallback(() => {
    setWords([])
    setSentence('')
    setSentenceMethod(null)
    resetPredictions()
  }, [])

  const buildSentence = useCallback(async () => {
    if (!words.length) return
    setGenerating(true)
    try {
      const glosses = words.join(' ')
      const result = await generateSentence(glosses)
      setSentence(result.sentence)
      setSentenceMethod(result.method)
      addHistory(result.sentence, 'sign')
    } catch {
      const fallback = ruleSentence(words.join(' '))
      setSentence(fallback)
      setSentenceMethod('rule-based')
    } finally {
      setGenerating(false)
    }
  }, [words, addHistory])

  // Auto-build sentence when words change (after 2s inactivity)
  useEffect(() => {
    if (!words.length) return
    const id = setTimeout(() => {
      const glosses = words.join(' ')
      const s = ruleSentence(glosses)
      if (s) setSentence(s)
    }, 2000)
    return () => clearTimeout(id)
  }, [words])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    videoRef,
    start,
    stop,
    isRunning,
    status,
    statusMsg,
    currentSign,
    confidence,
    topPreds,
    hasHands,
    words,
    sentence,
    setSentence,
    detStatus,
    addWord,
    removeWord,
    clearWords,
    buildSentence,
    generating,
    sentenceMethod,
  }
}

