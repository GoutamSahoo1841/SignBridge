/**
 * Sentence Builder Service
 * Rule-based sentence generation + optional Ollama (localhost:11434) LLM.
 * All algorithms preserved from original SignBridge.
 */

// ---- Vocabulary helpers (original) ----

const LAB = {
  minemy: 'my',
  hesheit: 'it',
  weus: 'we',
  yourself: 'you',
  haveto: 'have to',
  callonphone: 'call on the phone',
  glasswindow: 'window',
  thankyou: 'thank you',
  icecream: 'ice cream',
  frenchfries: 'french fries',
  owie: 'it hurts',
  potty: 'bathroom',
  shhh: 'be quiet',
}

const ADJ = new Set(
  'happy sad sick hungry thirsty mad sleepy fine good bad hot dirty clean wet dry noisy quiet pretty old fast empty stuck loud cute yucky sticky high'.split(' ')
)
const VERB = new Set(
  'want need like hate have go see hear think make find give eat drink read say talk listen look stay wait open close ride jump sleep call know understand'.split(' ')
)
const SUBJ = new Set(['i', 'you', 'we', 'it', 'he', 'she', 'they'])

function cap(t) {
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

/**
 * Convert raw sign labels into a natural English sentence.
 * Preserved exactly from the original ruleSentence() function.
 */
export function ruleSentence(raw) {
  raw = raw.trim()
  if (!raw) return ''
  if (/[.?!]$/.test(raw)) return raw

  let w = raw
    .split(/\s+/)
    .map((x) => LAB[x] || x)
  let please = 0
  let thanks = 0
  w = w.filter((x) =>
    x === 'please' ? !((please = 1) && false) : x === 'thank you' ? !((thanks = 1) && false) : true
  )

  const pre = []
  while (w.length && (w[0] === 'hello' || w[0] === 'bye')) {
    pre.push(w.shift())
  }

  const Q = ['where', 'who', 'why', 'what', 'how', 'when']
  const L = (x) => x.toLowerCase()
  let isQ = 0

  if (
    w.length &&
    (Q.includes(w[0]) || Q.includes(w[w.length - 1]))
  ) {
    isQ = 1
    const wh = Q.includes(w[0]) ? w.shift() : w.pop()
    w =
      !w.length
        ? [wh]
        : SUBJ.has(L(w[0])) || VERB.has(w[0])
        ? [wh, 'do', ...w]
        : [wh, 'is', 'the', ...w]
  } else {
    if (w.length && VERB.has(w[0]) && w[0] !== 'help') w.unshift('I')
    if (w.length === 1 && ADJ.has(w[0])) w.unshift('I')

    const r = []
    w.forEach((x, i) => {
      r.push(x)
      const n = w[i + 1]
      if (n && SUBJ.has(L(x)) && ADJ.has(n)) {
        r.push(L(x) === 'i' ? 'am' : ['he', 'she', 'it'].includes(L(x)) ? 'is' : 'are')
      }
      if (n && ['want', 'need', 'like', 'hate'].includes(x) && VERB.has(n)) {
        r.push('to')
      }
    })
    w = r
  }

  let t = w.join(' ').replace(/\bi\b/g, 'I')
  if (t && please) t += ', please'
  if (t) t = cap(t) + (isQ ? '?' : '.')

  return [...pre.map((g) => cap(g) + '.'), t, thanks ? 'Thank you.' : '']
    .filter(Boolean)
    .join(' ')
}

/**
 * Try to generate a fluent English sentence using Ollama (qwen2.5:3b).
 * In production or when Ollama is unavailable, falls back to the rule-based sentence builder.
 * Never throws — always returns an object { sentence, method, error? }.
 */
export async function generateSentence(glosses) {
  if (!glosses.trim()) {
    return {
      sentence: ruleSentence(glosses) || glosses,
      method: 'rule-based',
      error: 'No sign labels provided.',
    }
  }

  const ollamaBaseUrl = import.meta.env.VITE_OLLAMA_URL || (import.meta.env.DEV ? 'http://localhost:11434' : '')
  const isLocalhost = !ollamaBaseUrl || ollamaBaseUrl.includes('localhost') || ollamaBaseUrl.includes('127.0.0.1')

  // In production deployments, skip localhost Ollama requests and use rule-based directly
  if (import.meta.env.PROD && isLocalhost) {
    return {
      sentence: ruleSentence(glosses) || glosses,
      method: 'rule-based',
    }
  }

  if (!ollamaBaseUrl) {
    return {
      sentence: ruleSentence(glosses) || glosses,
      method: 'rule-based',
    }
  }

  try {
    const endpoint = `${ollamaBaseUrl.replace(/\/+$/, '')}/api/generate`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        stream: false,
        format: 'json',
        prompt:
          'You convert noisy ASL gloss labels into a cautious, simple English sentence. ' +
          'The input is a sequence of isolated sign labels from a limited-vocabulary classifier, ' +
          'not a complete ASL grammar representation. Do not invent details or claim certainty. ' +
          'If the labels are insufficient or contradictory, return a short sentence such as ' +
          '"I could not confidently understand those signs." Return JSON only with keys sentence and note. ' +
          'Keep the sentence short. Labels: ' +
          glosses,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status}.`)
    }

    const data = await response.json()
    let parsed
    try {
      parsed = JSON.parse(data.response)
    } catch {
      parsed = { sentence: data.response, note: '' }
    }

    const sentence = String(parsed.sentence || '').trim()
    if (!sentence) throw new Error('The local model returned an empty sentence.')

    return { sentence, method: 'ollama' }
  } catch (e) {
    // Fall back to rule-based
    const fallback = ruleSentence(glosses) || glosses
    return {
      sentence: fallback,
      method: 'rule-based',
      error: e.message,
    }
  }
}

