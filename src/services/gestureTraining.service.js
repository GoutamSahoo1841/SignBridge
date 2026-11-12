/**
 * Gesture Training Service
 * Custom gesture recording, DTW matching, and localStorage persistence.
 * All algorithms (gFeat, gRes, gDist, gIntra, gClassify, gPat, zig, qClass)
 * are preserved verbatim from the original SignBridge HTML file.
 */

// ---- Storage ----

const STORAGE_KEY = 'sb_gestures'

export function loadGestures() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw).map((g) => ({
      s: g.s,
      samples: g.samples.map((sm) =>
        sm.map((v) => Float32Array.from(v))
      ),
    }))
  } catch {
    return []
  }
}

export function saveGestures(G) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        G.map((g) => ({
          s: g.s,
          samples: g.samples.map((sm) =>
            sm.map((v) => Array.from(v).map((x) => +x.toFixed(3)))
          ),
        }))
      )
    )
  } catch {
    throw new Error('Could not save: browser storage is blocked.')
  }
}

// ---- Feature extraction (original gFeat) ----

export function gFeat(h, p) {
  const hs = (h && h.landmarks) || []
  if (!hs.length) return null

  let cx = 0.5,
    cy = 0.5,
    sw = 0.3
  const pl = p && p.landmarks && p.landmarks[0]
  if (pl && pl[11] && pl[12]) {
    cx = (pl[11].x + pl[12].x) / 2
    cy = (pl[11].y + pl[12].y) / 2
    sw = Math.max(0.05, Math.hypot(pl[11].x - pl[12].x, pl[11].y - pl[12].y))
  }

  // Sort by x to get left/right hand order, take at most 2
  const L = hs
    .slice()
    .sort((a, b) => a[0].x - b[0].x)
    .slice(0, 2)

  const out = new Float32Array(90)

  L.forEach((l, i) => {
    const slot = L.length === 2 ? i : l[0].x < cx ? 0 : 1
    const o = slot * 45
    const w = l[0]
    const sz = Math.max(0.02, Math.hypot(l[9].x - w.x, l[9].y - w.y))

    for (let k = 0; k < 21; k++) {
      out[o + k * 2] = (l[k].x - w.x) / sz
      out[o + k * 2 + 1] = (l[k].y - w.y) / sz
    }

    out[o + 42] = (3 * (w.x - cx)) / sw
    out[o + 43] = (3 * (w.y - cy)) / sw
    out[o + 44] = 2
  })

  return out
}

// ---- Resampling (original gRes) ----

export function gRes(seq, n = 24) {
  const m = seq.length
  const out = []

  for (let i = 0; i < n; i++) {
    const t = (i * (m - 1)) / (n - 1)
    const a = Math.floor(t)
    const b = Math.min(m - 1, a + 1)
    const f = t - a
    const A = seq[a]
    const B = seq[b]
    const v = new Float32Array(90)
    for (let k = 0; k < 90; k++) v[k] = A[k] + (B[k] - A[k]) * f
    out.push(v)
  }

  return out
}

// ---- DTW distance (original gDist) ----

export function gDist(a, b) {
  const n = a.length
  const m = b.length
  const W = 6
  const INF = 1e9
  const D = Array.from({ length: n + 1 }, () =>
    new Float64Array(m + 1).fill(INF)
  )
  D[0][0] = 0

  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(1, i - W); j <= Math.min(m, i + W); j++) {
      let c = 0
      const x = a[i - 1]
      const y = b[j - 1]
      for (let k = 0; k < 90; k++) {
        const d = x[k] - y[k]
        c += d * d
      }
      c = Math.sqrt(c / 90)
      D[i][j] = c + Math.min(D[i - 1][j], D[i][j - 1], D[i - 1][j - 1])
    }
  }

  return (D[n][m] / (n + m)) * 2
}

// ---- Intra-class distance (original gIntra) ----

export function gIntra(g) {
  let mx = 0
  for (let i = 0; i < g.samples.length; i++) {
    for (let j = i + 1; j < g.samples.length; j++) {
      mx = Math.max(mx, gDist(g.samples[i], g.samples[j]))
    }
  }
  return g.samples.length > 1 ? mx : 0.5
}

// ---- Classification (original gClassify) ----

export function gClassify(r, G) {
  const sc = G.map((g) => ({
    g,
    d: Math.min(...g.samples.map((s) => gDist(r, s))),
  })).sort((a, b) => a.d - b.d)

  const best = sc[0]
  const second = sc[1]
  const cut = Math.max(gIntra(best.g) * 2.5, gIntra(best.g) + 0.2)

  return {
    g: best.g,
    d: best.d,
    sure: best.d <= cut && (!second || best.d < 0.8 * second.d),
    inCut: best.d <= cut,
  }
}

// ---- Quick pattern classifier (original gPat / zig / qClass) ----

function gPat(f, sl) {
  const o = sl * 45
  const P = (k) => [f[o + k * 2], f[o + k * 2 + 1]]
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
  const W = [0, 0]
  const e = (t, p) =>
    d(P(t), W) > d(P(p), W) * 1.1 ? 1 : 0

  return [
    d(P(4), P(17)) > d(P(2), P(17)) * 1.2 ? 1 : 0,
    e(8, 6),
    e(12, 10),
    e(16, 14),
    e(20, 18),
  ]
}

function zig(a, thr) {
  let ext = a[0]
  let dir = 0
  let rev = 0

  for (const v of a) {
    if (dir >= 0 && v < ext - thr) {
      if (dir === 1) rev++
      dir = -1
      ext = v
    } else if (dir <= 0 && v > ext + thr) {
      if (dir === -1) rev++
      dir = 1
      ext = v
    } else if ((dir === 1 && v > ext) || (dir === -1 && v < ext)) {
      ext = v
    }
  }

  return rev
}

export function qClass(fr) {
  const n = fr.length
  const a = Math.floor(n * 0.15)
  const b = Math.max(a + 3, Math.ceil(n * 0.85))
  const mid = fr.slice(a, b)

  const on = (f, s) => f[s * 45 + 44] > 0

  const pres = [0, 1].map((s) => mid.filter((f) => on(f, s)).length)
  const two =
    pres[0] >= mid.length * 0.4 && pres[1] >= mid.length * 0.4
  const slot = pres[1] > pres[0] ? 1 : 0

  const mode = (sl) => {
    const c = {}
    mid
      .filter((f) => on(f, sl))
      .forEach((f) => {
        const k = gPat(f, sl).join('')
        c[k] = (c[k] || 0) + 1
      })
    const k = Object.keys(c).sort((x, y) => c[y] - c[x])[0]
    return k ? k.split('').map(Number) : [0, 0, 0, 0, 0]
  }

  const n4 = (p) => p[1] + p[2] + p[3] + p[4]

  if (two) {
    const A = mode(0)
    const B = mode(1)
    return n4(A) >= 3 && n4(B) >= 3 ? 'stop' : 'confused'
  }

  const p = mode(slot)
  const o = slot * 45
  const tr = mid.filter((f) => on(f, slot))
  const xs = tr.map((f) => f[o + 42] / 3)
  const ys = tr.map((f) => f[o + 43] / 3)
  const rg = (v) => Math.max(...v) - Math.min(...v)

  if (xs.length >= 4) {
    const zx = zig(xs, 0.08)
    const zy = zig(ys, 0.08)
    const rx = rg(xs)
    const ry = rg(ys)
    const dy = ys[ys.length - 1] - ys[0]
    const dx = xs[xs.length - 1] - xs[0]

    if (zx >= 2 && ry < 0.6 * rx && rx > 0.1) return 'hello'
    if (rx > 0.12 && ry > 0.12 && zx >= 1 && zy >= 1 && zx + zy >= 3) return 'sorry'
    if (dy > 0.45 && Math.abs(dx) < dy) return 'thanks'
  }

  const c = n4(p)
  if (c === 0) return p[0] ? 'ok' : 'yes'
  if (p[0] && p[4] && c === 1) return 'family'
  if (p[1] && p[4] && !p[2] && !p[3]) return 'doctor'

  return c === 1 ? 'help' : c === 2 ? 'water' : c === 3 ? 'bathroom' : 'wait'
}

// ---- Quick gesture definitions (from original) ----

export const QUICK_DEFS = [
  ['hello', 'Wave your open hand side to side', 'Hello! How are you?'],
  ['thanks', 'Open hand moving down', 'Thank you so much.'],
  ['sorry', 'Hand moving in a circle', 'I am sorry. Please forgive me.'],
  ['wait', 'Open hand held still', 'Please wait a moment.'],
  ['yes', 'Closed fist', 'Yes, I understand.'],
  ['ok', 'Thumb up', 'Okay, thank you.'],
  ['help', 'One finger up', 'I need help. Please help me.'],
  ['water', 'Two fingers up', 'I need some water, please.'],
  ['bathroom', 'Three fingers up', 'Where is the bathroom?'],
  ['doctor', 'Index and little finger up (rock sign)', 'I am not feeling well. I need a doctor.'],
  ['family', 'Thumb and little finger out (phone shape)', 'Please call my family.'],
  ['stop', 'BOTH hands open', 'Please stop. Wait a moment.'],
  ['confused', 'BOTH hands closed', 'I do not understand. Please say it again.'],
]

/** Load persisted quick-gesture sentence overrides from localStorage */
export function loadQuickSentences() {
  const defaults = {}
  QUICK_DEFS.forEach(([k, , s]) => { defaults[k] = s })
  try {
    const saved = JSON.parse(localStorage.getItem('sb_q') || '{}')
    return { ...defaults, ...saved }
  } catch {
    return defaults
  }
}

export function saveQuickSentence(key, sentence) {
  try {
    const saved = JSON.parse(localStorage.getItem('sb_q') || '{}')
    saved[key] = sentence
    localStorage.setItem('sb_q', JSON.stringify(saved))
  } catch {
    // ignore storage errors silently
  }
}

