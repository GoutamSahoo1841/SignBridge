import { useState, useCallback, useEffect } from 'react'
import { speak, stopSpeech, isSpeechAvailable, getVoices } from '../services/speech.service.js'

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [available, setAvailable] = useState(false)
  const [voices, setVoices] = useState([])

  useEffect(() => {
    setAvailable(isSpeechAvailable())
    if (isSpeechAvailable()) {
      const load = () => setVoices(getVoices())
      load()
      window.speechSynthesis.onvoiceschanged = load
    }
  }, [])

  const speakText = useCallback((text, rate, voiceName) => {
    if (!available) return
    setSpeaking(true)
    try {
      speak(text, rate, voiceName)
    } catch {
      // ignore
    }
    // Poll for end (SpeechSynthesis has no reliable onend in all browsers)
    const id = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        setSpeaking(false)
        clearInterval(id)
      }
    }, 200)
  }, [available])

  const stopSpeaking = useCallback(() => {
    stopSpeech()
    setSpeaking(false)
  }, [])

  return { speaking, available, voices, speakText, stopSpeaking }
}

