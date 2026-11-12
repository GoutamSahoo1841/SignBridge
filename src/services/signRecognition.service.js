/**
 * Sign Recognition Service
 * Manages the sliding frame window, inference scheduling, and stable-sign
 * detection logic.  Preserves the original constants and algorithm exactly.
 */

import { runInference } from './onnx.service.js'

// --- Constants (from original) ---
const WINDOW = 48      // max frames in sliding window
const INTERVAL = 350   // ms between inference runs
const MIN_FRAMES = 12  // minimum frames needed before first inference
const CONFIDENCE = 0.2 // minimum score for a "real" sign

/** Shared frame buffer and inference state */
let frames = []
let stableLabel = ''
let stableCount = 0
let lastAdded = ''
let lastAddAt = 0
let lastInfer = 0
let busy = false

// Accumulated predictions (used by gesture recording + sentence building)
const _preds = []

export function getPreds() {
  return _preds
}

export function resetPredictions() {
  frames = []
  stableLabel = ''
  stableCount = 0
  lastAdded = ''
  lastAddAt = 0
  _preds.length = 0
}

export function getFrameCount() {
  return frames.length
}

export function getLastAddAt() {
  return lastAddAt
}

/**
 * Push a new landmark frame into the sliding window.
 * @param {Float32Array} frame Float32Array(543*3)
 * @param {boolean} hasHandsNow whether hands were detected this frame
 */
export function pushFrame(frame, hasHandsNow) {
  frames.push(frame)
  if (frames.length > WINDOW) frames.shift()
}

/**
 * Attempt to run inference if the interval has elapsed and we have enough frames.
 * Calls onResult with current state; calls onAddWord when a stable sign is committed.
 */
export async function tryInfer(now, hasHandsNow, onResult, onAddWord) {
  if (now - lastInfer < INTERVAL) return
  if (frames.length < MIN_FRAMES) return
  if (busy) return

  lastInfer = now
  busy = true

  try {
    const preds = await runInference([...frames])
    const best = preds[0]
    const ok = best.score >= CONFIDENCE && hasHandsNow

    // Push to accumulated predictions list
    _preds.push({ l: best.label, s: best.score, h: hasHandsNow })

    // Stable sign detection (original algorithm)
    if (ok) {
      if (best.label === stableLabel) {
        stableCount++
      } else {
        stableLabel = best.label
        stableCount = 1
      }

      if (
        stableCount >= 2 &&
        best.label !== lastAdded &&
        Date.now() - lastAddAt > 850
      ) {
        lastAdded = best.label
        lastAddAt = Date.now()
        onAddWord(best.label)
      }
    }

    onResult({
      topPredictions: preds,
      stableLabel: ok ? best.label : '',
      currentSign: ok ? best.label : '…',
      hasHands: hasHandsNow,
    })
  } finally {
    busy = false
  }
}

/**
 * Collect predictions over a fixed duration and extract the best words.
 * Used for the "Sign a sentence" / 7-second recording feature.
 */
export function pickWords(preds) {
  const P = preds.filter((p) => p.h && p.s >= 0.08)
  const runs = []

  P.forEach((p) => {
    const last = runs[runs.length - 1]
    if (last && last.l === p.l) {
      last.n++
      last.s = Math.max(last.s, p.s)
    } else {
      runs.push({ l: p.l, n: 1, s: p.s })
    }
  })

  let keep = runs.filter((r) => r.n >= 2)
  if (!keep.length) keep = runs.filter((r) => r.s >= 0.2)
  if (!keep.length)
    keep = [...runs]
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .sort((a, b) => runs.indexOf(a) - runs.indexOf(b))

  return keep
    .map((r) => r.l)
    .filter((l, i, a) => l !== a[i - 1])
    .slice(0, 8)
}

