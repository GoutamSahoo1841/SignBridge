import { useState, useRef, useCallback, useEffect } from 'react'
import { initMediaPipe, detectFrame, isMediaPipeReady } from '../services/mediapipe.service.js'
import { startCamera, stopCamera, startLoop } from '../services/camera.service.js'
import {
  gFeat,
  gRes,
  gClassify,
  loadGestures,
  saveGestures,
} from '../services/gestureTraining.service.js'
import { speak } from '../services/speech.service.js'

const SAMPLE_DURATION = 3000 // ms per sample recording

export function useGestureTraining() {
  const videoRef = useRef(null)
  const stopLoopRef = useRef(null)
  const recordingFramesRef = useRef([])
  const recordTimerRef = useRef(null)

  const [isRunning, setIsRunning] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [phase, setPhase] = useState('idle') // idle | recording | listening
  const [sampleCount, setSampleCount] = useState(0)
  const [samples, setSamples] = useState([]) // Float32Array[][]
  const [gestures, setGestures] = useState([])
  const [listenResult, setListenResult] = useState(null)
  const [countdown, setCountdown] = useState(0)

  // Load gestures on mount
  useEffect(() => {
    setGestures(loadGestures())
  }, [])

  const onStatus = useCallback((msg) => setStatusMsg(msg), [])

  const startCamera_ = useCallback(async () => {
    if (!videoRef.current) return
    setStatusMsg('Initializing camera…')
    try {
      if (!isMediaPipeReady()) await initMediaPipe(onStatus)
      await startCamera(videoRef.current)
      setIsRunning(true)
      setStatusMsg('Camera ready')
    } catch (err) {
      setStatusMsg(err.message || 'Camera failed')
    }
  }, [onStatus])

  const stopCamera_ = useCallback(() => {
    if (stopLoopRef.current) {
      stopLoopRef.current()
      stopLoopRef.current = null
    }
    stopCamera(videoRef.current)
    setIsRunning(false)
    setPhase('idle')
    setCountdown(0)
    setStatusMsg('')
    if (recordTimerRef.current) clearTimeout(recordTimerRef.current)
  }, [])

  const startRecording = useCallback(() => {
    if (!isRunning) return
    recordingFramesRef.current = []
    setPhase('recording')
    setStatusMsg('Recording sample… hold your gesture')
    setCountdown(Math.ceil(SAMPLE_DURATION / 1000))

    // Countdown ticker
    let remaining = Math.ceil(SAMPLE_DURATION / 1000)
    const ticker = setInterval(() => {
      remaining--
      setCountdown(remaining)
      if (remaining <= 0) clearInterval(ticker)
    }, 1000)

    // Start capture loop
    const stopFn = startLoop((ts) => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return
      try {
        const raw = detectFrame(video, ts)
        const feat = gFeat(raw.hands, raw.pose)
        if (feat) recordingFramesRef.current.push(feat)
      } catch {
        // ignore
      }
    })
    stopLoopRef.current = stopFn

    recordTimerRef.current = setTimeout(() => {
      clearInterval(ticker)
      stopFn()
      stopLoopRef.current = null

      const frames = recordingFramesRef.current
      if (frames.length >= 8) {
        const resampled = gRes(frames)
        setSamples((prev) => [...prev, resampled])
        setSampleCount((c) => c + 1)
        setStatusMsg(`Sample ${sampleCount + 1} recorded (${frames.length} frames)`)
      } else {
        setStatusMsg('Too few frames — try again')
      }
      setPhase('idle')
      setCountdown(0)
    }, SAMPLE_DURATION)
  }, [isRunning, sampleCount])

  const saveGesture = useCallback((sentence) => {
    if (samples.length < 1) return false
    const G = loadGestures()
    G.push({ s: sentence, samples })
    saveGestures(G)
    setGestures(G)
    setSamples([])
    setSampleCount(0)
    setStatusMsg(`Gesture saved: "${sentence}"`)
    return true
  }, [samples])

  const deleteGesture = useCallback((index) => {
    const G = loadGestures().filter((_, i) => i !== index)
    saveGestures(G)
    setGestures(G)
  }, [])

  const startListening = useCallback(() => {
    if (!isRunning || !gestures.length) return
    setPhase('listening')
    setListenResult(null)
    setStatusMsg('Listening for gestures…')
    recordingFramesRef.current = []

    const stopFn = startLoop((ts) => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return
      try {
        const raw = detectFrame(video, ts)
        const feat = gFeat(raw.hands, raw.pose)
        if (feat) {
          recordingFramesRef.current.push(feat)
          if (recordingFramesRef.current.length > 48) {
            recordingFramesRef.current.shift()
          }
        }

        // Try classifying every 500ms worth of frames
        if (recordingFramesRef.current.length >= 16) {
          const resampled = gRes(recordingFramesRef.current)
          const result = gClassify(resampled, gestures)
          if (result.sure) {
            setListenResult({ sentence: result.g.s, distance: result.d })
            speak(result.g.s)
            recordingFramesRef.current = []
          }
        }
      } catch {
        // ignore
      }
    })
    stopLoopRef.current = stopFn
  }, [isRunning, gestures])

  const stopListening = useCallback(() => {
    if (stopLoopRef.current) {
      stopLoopRef.current()
      stopLoopRef.current = null
    }
    setPhase('idle')
    setStatusMsg('Stopped listening')
  }, [])

  const resetSamples = useCallback(() => {
    setSamples([])
    setSampleCount(0)
    setStatusMsg('Samples cleared')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera_()
    }
  }, [stopCamera_])

  return {
    videoRef,
    isRunning,
    statusMsg,
    phase,
    sampleCount,
    samples,
    gestures,
    listenResult,
    countdown,
    startCamera: startCamera_,
    stopCamera: stopCamera_,
    startRecording,
    saveGesture,
    deleteGesture,
    startListening,
    stopListening,
    resetSamples,
  }
}

