/**
 * Speech Service
 * Text-to-speech via browser SpeechSynthesis API.
 */

/** Check if speech synthesis is available */
export function isSpeechAvailable() {
  return 'speechSynthesis' in window
}

/**
 * Speak text using browser SpeechSynthesis.
 * @param {string} text Text to speak
 * @param {number} [rate=0.95] Speech rate (0.1 to 10)
 * @param {string} [voiceName] Optional voice name to use
 */
export function speak(text, rate = 0.95, voiceName = null) {
  if (!isSpeechAvailable()) {
    throw new Error('This browser does not support built-in speech. Try current Chrome or Edge.')
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  const voices = window.speechSynthesis.getVoices()
  if (voiceName) {
    const v = voices.find((x) => x.name === voiceName)
    if (v) utterance.voice = v
  } else {
    const v = voices.find((x) => /^en/i.test(x.lang))
    if (v) utterance.voice = v
  }
  window.speechSynthesis.speak(utterance)
}

/** Cancel any ongoing speech */
export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/** Get list of available voices */
export function getVoices() {
  if (!isSpeechAvailable()) return []
  return window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang))
}

// Pre-warm voices list (browser quirk: getVoices() is async the first time)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}

