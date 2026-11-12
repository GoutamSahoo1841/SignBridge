/**
 * ONNX Service
 * Loads asl-signs.onnx and sign_to_prediction_index_map.json from /public/models/
 * and exposes a single inference function.
 *
 * Uses window.ort (ONNX Runtime Web) which is loaded via CDN script in index.html.
 * Model is loaded only once and cached for the lifetime of the page.
 */

let session = null
let labels = []
let loading = false
let loaded = false

export function isOnnxReady() {
  return loaded
}

export function getLabels() {
  return labels
}

export async function initOnnx(onStatus) {
  if (loaded) return
  if (loading) {
    while (loading) await new Promise((r) => setTimeout(r, 100))
    return
  }
  loading = true

  try {
    // Wait for ort global to be available
    for (let i = 0; i < 50; i++) {
      if (window.ort) break
      await new Promise((r) => setTimeout(r, 200))
    }
    if (!window.ort) {
      throw new Error('ONNX Runtime did not load from CDN.')
    }

    onStatus('Loading local ONNX model (~22 MB)…')

    const [modelResp, labelResp] = await Promise.all([
      fetch('/models/asl-signs.onnx'),
      fetch('/models/sign_to_prediction_index_map.json'),
    ])

    if (!modelResp.ok || !labelResp.ok) {
      throw new Error(
        `Could not load model files (HTTP ${modelResp.status} / ${labelResp.status}). ` +
          'Make sure the models folder is inside /public/models/.'
      )
    }

    const [modelBuf, map] = await Promise.all([
      modelResp.arrayBuffer(),
      labelResp.json(),
    ])

    // Build labels array from index map
    labels = Array(Object.keys(map).length)
    for (const [name, index] of Object.entries(map)) {
      labels[index] = name
    }
    window._aslLabels = labels

    session = await window.ort.InferenceSession.create(modelBuf, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    })

    loaded = true
    onStatus('Model ready. Camera is running locally; inference uses browser CPU/WASM.')
  } finally {
    loading = false
  }
}

function softmax(data) {
  let max = -Infinity
  for (const v of data) if (v > max) max = v
  let sum = 0
  const vals = Array.from(data).map((v) => {
    const n = Math.exp(v - max)
    sum += n
    return n
  })
  return vals.map((v) => v / sum)
}

export function topK(probs, k = 3) {
  return probs
    .map((score, index) => ({ label: labels[index] ?? '?', score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

/**
 * Run inference over a window of frames.
 * @param {Float32Array[]} frames Array of Float32Array(543*3) landmark frames
 */
export async function runInference(frames) {
  if (!session || !loaded) throw new Error('ONNX session not initialized')

  const T = frames.length
  const flat = new Float32Array(T * 543 * 3)
  frames.forEach((fr, i) => flat.set(fr, i * 543 * 3))

  const inputName = session.inputNames[0]
  const outName = session.outputNames[0]

  const result = await session.run({
    [inputName]: new window.ort.Tensor('float32', flat, [T, 543, 3]),
  })

  const probs = softmax(result[outName].data)
  return topK(probs, 3)
}

