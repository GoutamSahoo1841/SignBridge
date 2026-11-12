/**
 * Avatar Service
 * Three.js Realistic Human Signing Avatar using GLTFLoader, rigged skeletal animation,
 * AnimationMixer, sequential sign-gloss execution, and real-time playback controls.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  createSignClip,
  createIdleClip,
  isSignSupported,
  SIGN_LEXICON,
} from './signAnimation.service.js'

// ---- English → Gloss mapping (Preserved from original SignBridge) ----

const MAP = {
  hello: 'HELLO', hi: 'HELLO', hey: 'HELLO', thanks: 'THANKYOU', thank: 'THANKYOU',
  please: 'PLEASE', sorry: 'SORRY', yes: 'YES', yeah: 'YES', ok: 'YES', okay: 'OKAY',
  no: 'NO', not: 'NO', dont: 'NO', cant: 'NO', i: 'ME', me: 'ME', im: 'ME', my: 'MY',
  mine: 'MY', you: 'YOU', your: 'YOU', youre: 'YOU', want: 'WANT', wants: 'WANT',
  need: 'NEED', needs: 'NEED', help: 'HELP', water: 'WATER', eat: 'EAT', food: 'EAT',
  hungry: 'HUNGRY', drink: 'DRINK', go: 'GO', going: 'GO', come: 'COME', good: 'GOOD',
  fine: 'FINE', well: 'GOOD', great: 'GOOD', bad: 'BAD', love: 'LOVE', home: 'HOME',
  house: 'HOME', name: 'NAME', what: 'WHAT', where: 'WHERE', how: 'HOW',
  understand: 'UNDERSTAND', know: 'KNOW', pain: 'PAIN', hurt: 'PAIN', hurts: 'PAIN',
  morning: 'MORNING', night: 'NIGHT', tonight: 'NIGHT', now: 'NOW', today: 'NOW',
  tomorrow: 'TOMORROW', yesterday: 'YESTERDAY', wait: 'WAIT', stop: 'STOP',
  work: 'WORK', job: 'WORK', school: 'SCHOOL', class: 'SCHOOL', friend: 'FRIEND',
  friends: 'FRIEND', family: 'FAMILY', mother: 'MOTHER', mom: 'MOTHER', mum: 'MOTHER',
  father: 'FATHER', dad: 'FATHER', sleep: 'SLEEP', tired: 'TIRED', sleepy: 'TIRED',
  sick: 'SICK', ill: 'SICK', doctor: 'DOCTOR', nurse: 'DOCTOR', happy: 'HAPPY',
  glad: 'HAPPY', sad: 'SAD', angry: 'ANGRY', mad: 'ANGRY', like: 'LIKE', likes: 'LIKE',
  have: 'HAVE', has: 'HAVE', give: 'GIVE', see: 'SEE', look: 'SEE', hear: 'HEAR',
  talk: 'TALK', speak: 'TALK', say: 'TALK', think: 'THINK', read: 'READ',
  bathroom: 'BATHROOM', toilet: 'BATHROOM', restroom: 'BATHROOM', welcome: 'WELCOME',
  bye: 'BYE', goodbye: 'BYE', meet: 'MEET', nice: 'NICE', more: 'MORE', again: 'MORE',
  finish: 'FINISH', finished: 'FINISH', done: 'FINISH', cold: 'COLD', milk: 'MILK',
  money: 'MONEY', car: 'CAR', phone: 'PHONE', call: 'PHONE', book: 'BOOK', we: 'WE',
  us: 'WE', he: 'HE', she: 'HE', they: 'HE', it: 'HE', who: 'WHO', why: 'WHY',
  maybe: 'MAYBE', thirsty: 'THIRSTY',
}

const PH = [
  [/\bi love you\b/g, ' ILY '],
  [/\bthank you( very much| so much)?\b/g, ' THANKYOU '],
  [/\bgood morning\b/g, ' GOOD MORNING '],
  [/\bgood night\b/g, ' GOOD NIGHT '],
  [/\bgood bye\b/g, ' BYE '],
  [/\bsee you tomorrow\b/g, ' SEE YOU TOMORROW '],
  [/\bsee you (later|soon)\b/g, ' SEE YOU BYE '],
  [/\bnice to meet you\b/g, ' NICE MEET YOU '],
  [/\bhow are you\b/g, ' HOW YOU '],
  [/\bwhat is your name\b|\bwhats your name\b/g, ' YOU NAME WHAT '],
  [/\bwhere is the (bathroom|toilet|restroom)\b/g, ' BATHROOM WHERE '],
  [/\bi do not know\b|\bi dont know\b/g, ' ME NO KNOW '],
  [/\bi do not understand\b|\bi dont understand\b/g, ' ME NO UNDERSTAND '],
  [/\bexcuse me\b/g, ' SORRY '],
  [/\byou are welcome\b|\byoure welcome\b/g, ' WELCOME '],
  [/\bi am fine\b|\bim fine\b/g, ' ME FINE '],
  [/\bi am hungry\b|\bim hungry\b/g, ' ME HUNGRY '],
  [/\bi am thirsty\b|\bim thirsty\b/g, ' ME THIRSTY '],
]

const DROP = new Set(
  'a an the is am are be to of do does at on in was were been will would just so very really and with for from into this that there here'.split(
    ' '
  )
)

export function toGloss(txt) {
  let x = txt.toLowerCase().replace(/['']/g, '').replace(/[^a-z ]/g, ' ')
  PH.forEach((p) => {
    x = x.replace(p[0], p[1])
  })
  const out = []
  for (const w of x.split(/\s+/).filter(Boolean)) {
    if (SIGN_LEXICON[w]) {
      out.push(w)
      continue
    }
    if (DROP.has(w)) continue
    const g = MAP[w] || MAP[w.replace(/(ing|ed|es|s)$/, '')]
    if (g === 'YOU' && out[out.length - 1] === 'THANKYOU') continue
    out.push(g || '#' + w)
  }
  if (out.length > 1 && ['WHAT', 'WHERE', 'WHO', 'WHY'].includes(out[0])) {
    out.push(out.shift())
  }
  return out
}

// ---- Scene Instance State ----

let sceneState = null
const stateListeners = new Set()

function notifyListeners() {
  const s = getState()
  stateListeners.forEach((fn) => {
    try {
      fn(s)
    } catch (e) {
      console.error('State listener error:', e)
    }
  })
}

export function subscribeAvatarState(fn) {
  stateListeners.add(fn)
  if (sceneState) fn(getState())
  return () => stateListeners.delete(fn)
}

export function getState() {
  if (!sceneState) {
    return {
      isLoaded: false,
      isPlaying: false,
      isPaused: false,
      currentGloss: '',
      currentIndex: -1,
      totalGlosses: 0,
      progress: 0,
      speed: 1,
      unsupported: [],
    }
  }

  return {
    isLoaded: sceneState.isLoaded,
    isPlaying: sceneState.isPlaying,
    isPaused: sceneState.isPaused,
    currentGloss: sceneState.currentGloss,
    currentIndex: sceneState.currentIndex,
    totalGlosses: sceneState.sequence.length,
    progress: sceneState.totalDuration > 0
      ? Math.min(1, Math.max(0, sceneState.elapsedTime / sceneState.totalDuration))
      : 0,
    speed: sceneState.speed,
    unsupported: sceneState.unsupportedSigns,
  }
}

/**
 * Safely creates a WebGLRenderer with fallbacks to avoid context creation failures.
 */
function createSafeRenderer(canvas) {
  // Option 1: Standard high quality
  try {
    return new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
    })
  } catch (err1) {
    console.warn('Primary WebGLRenderer creation failed, trying fallback...', err1)
  }

  // Option 2: Fallback without antialias or alpha
  try {
    return new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
      precision: 'mediump',
      failIfMajorPerformanceCaveat: false,
    })
  } catch (err2) {
    console.warn('Secondary WebGLRenderer creation failed, trying minimal configuration...', err2)
  }

  // Option 3: Minimal fallback
  return new THREE.WebGLRenderer({ canvas })
}

/**
 * Initializes the 3D scene, loads the realistic human avatar, and starts the render loop.
 */
export function initAvatar(canvas, onProgress, onError) {
  if (sceneState) {
    if (sceneState.isLoaded && onProgress) onProgress(100)
    return
  }

  try {
    const renderer = createSafeRenderer(canvas)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()

    // Front-facing camera angled to keep head, arms and hands within viewport during signing
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
    camera.position.set(0, 1.36, 2.35)
    camera.lookAt(0, 1.25, 0)

    // Realistic Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.9)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95)
    keyLight.position.set(1.5, 3.2, 2.8)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xccddee, 0.45)
    fillLight.position.set(-1.8, 2.0, 1.6)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.35)
    rimLight.position.set(0, 3.0, -2.2)
    scene.add(rimLight)

    const onContextLost = (e) => {
      e.preventDefault()
      console.warn('Avatar WebGL context was lost.')
      if (sceneState) sceneState.contextLost = true
    }

    const onContextRestored = () => {
      console.log('Avatar WebGL context restored.')
      if (sceneState) {
        sceneState.contextLost = false
        if (sceneState.model && sceneState.renderer) {
          sceneState.renderer.render(sceneState.scene, sceneState.camera)
        }
      }
    }

    canvas.addEventListener('webglcontextlost', onContextLost, false)
    canvas.addEventListener('webglcontextrestored', onContextRestored, false)

    sceneState = {
      canvas,
      renderer,
      scene,
      camera,
      model: null,
      mixer: null,
      clock: new THREE.Clock(),
      idleAction: null,
      activeAction: null,
      isLoaded: false,
      isPlaying: false,
      isPaused: false,
      contextLost: false,
      onContextLost,
      onContextRestored,
      speed: 1,
      sequence: [],
      currentIndex: -1,
      currentGloss: '',
      elapsedTime: 0,
      totalDuration: 0,
      unsupportedSigns: [],
      animId: 0,
      shoulders: {
        R: new THREE.Vector3(-0.171, 1.531, -0.049),
        L: new THREE.Vector3(0.171, 1.531, -0.049),
      },
    }

    // Load the Realistic Human Avatar GLB
    const loader = new GLTFLoader()
    loader.load(
      '/models/avatar/human-avatar.glb',
      (gltf) => {
        if (!sceneState) return // destroyed while loading
        const model = gltf.scene
        scene.add(model)
        sceneState.model = model

        // Locate skeleton shoulders to calibrate IK dynamically
        model.traverse((obj) => {
          if (obj.isBone) {
            if (obj.name === 'RightArm' || obj.name === 'RightShoulder') {
              obj.getWorldPosition(sceneState.shoulders.R)
            } else if (obj.name === 'LeftArm' || obj.name === 'LeftShoulder') {
              obj.getWorldPosition(sceneState.shoulders.L)
            }
          }
        })

        // Setup AnimationMixer
        const mixer = new THREE.AnimationMixer(model)
        sceneState.mixer = mixer

        // Setup and play natural idle resting pose
        const idleClip = createIdleClip()
        const idleAction = mixer.clipAction(idleClip)
        idleAction.setLoop(THREE.LoopRepeat)
        idleAction.play()
        sceneState.idleAction = idleAction
        sceneState.activeAction = idleAction

        sceneState.isLoaded = true
        if (onProgress) onProgress(100)
        notifyListeners()
      },
      (xhr) => {
        if (xhr.lengthComputable && onProgress) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100)
          onProgress(pct)
        }
      },
      (err) => {
        console.error('Error loading human avatar GLB:', err)
        if (onError) onError(err)
      }
    )

    // Animation Render Loop
    function animate() {
      if (!sceneState) return
      sceneState.animId = requestAnimationFrame(animate)

      if (sceneState.contextLost) return

      const delta = sceneState.clock.getDelta()

      if (sceneState.mixer) {
        if (!sceneState.isPaused) {
          sceneState.mixer.update(delta * sceneState.speed)

          if (sceneState.isPlaying) {
            sceneState.elapsedTime += delta * sceneState.speed
            notifyListeners()
          }
        }
      }

      // Responsive sizing
      const stage = canvas.parentElement
      if (stage && stage.clientWidth && stage.clientHeight) {
        const w = stage.clientWidth
        const h = stage.clientHeight
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
          renderer.setSize(w, h, false)
          camera.aspect = w / h
          camera.updateProjectionMatrix()
        }
      }

      renderer.render(scene, camera)
    }

    sceneState.animId = requestAnimationFrame(animate)
  } catch (err) {
    console.error('WebGL initialization error in initAvatar:', err)
    sceneState = null
    if (onError) onError(err)
  }
}

/**
 * Converts text into sign glosses and executes sequential animation playback.
 */
export function signText(text, speed = 1) {
  if (!sceneState || !sceneState.isLoaded) return []

  const glosses = toGloss(text)
  sceneState.speed = speed

  // Identify supported vs unsupported signs
  const unsupported = []
  const validSequence = []

  glosses.forEach((g) => {
    if (isSignSupported(g)) {
      validSequence.push(g)
    } else {
      unsupported.push(g)
    }
  })

  sceneState.unsupportedSigns = unsupported
  sceneState.sequence = validSequence
  sceneState.currentIndex = -1
  sceneState.currentGloss = ''
  sceneState.elapsedTime = 0

  if (validSequence.length === 0) {
    sceneState.isPlaying = false
    sceneState.isPaused = false
    notifyListeners()
    return glosses
  }

  // Pre-calculate total duration for progress indicator
  let totalDur = 0
  validSequence.forEach((g) => {
    const def = SIGN_LEXICON[g.toUpperCase()]
    totalDur += def ? def.duration : 1.2
  })
  sceneState.totalDuration = totalDur

  sceneState.isPlaying = true
  sceneState.isPaused = false

  playNextSign(0)
  return glosses
}

/**
 * Plays a sign in the sequence with smooth transitions.
 */
function playNextSign(index) {
  if (!sceneState || !sceneState.isPlaying) return

  if (index >= sceneState.sequence.length) {
    // Sequence finished — return smoothly to idle
    finishSequence()
    return
  }

  sceneState.currentIndex = index
  const gloss = sceneState.sequence[index]
  sceneState.currentGloss = gloss

  const clip = createSignClip(gloss, sceneState.shoulders.R, sceneState.shoulders.L)
  if (!clip) {
    playNextSign(index + 1)
    return
  }

  const mixer = sceneState.mixer
  const newAction = mixer.clipAction(clip)
  newAction.reset()
  newAction.setLoop(THREE.LoopOnce)
  newAction.clampWhenFinished = true

  const prevAction = sceneState.activeAction
  const transitionDuration = 0.22

  if (prevAction && prevAction !== newAction) {
    newAction.crossFadeFrom(prevAction, transitionDuration, true)
  }
  newAction.play()
  sceneState.activeAction = newAction

  notifyListeners()

  // Schedule next sign when this sign completes
  const clipDuration = (clip.duration / sceneState.speed) * 1000
  const waitMs = Math.max(clipDuration - 180, 200)

  setTimeout(() => {
    if (sceneState && sceneState.isPlaying && sceneState.currentIndex === index) {
      playNextSign(index + 1)
    }
  }, waitMs)
}

function finishSequence() {
  if (!sceneState) return

  sceneState.isPlaying = false
  sceneState.isPaused = false
  sceneState.currentGloss = ''
  sceneState.elapsedTime = sceneState.totalDuration

  if (sceneState.idleAction && sceneState.activeAction !== sceneState.idleAction) {
    sceneState.idleAction.reset()
    sceneState.idleAction.crossFadeFrom(sceneState.activeAction, 0.35, true)
    sceneState.idleAction.play()
    sceneState.activeAction = sceneState.idleAction
  }

  notifyListeners()
}

// ---- Playback Control Functions ----

export function pauseAvatar() {
  if (!sceneState) return
  sceneState.isPaused = true
  notifyListeners()
}

export function resumeAvatar() {
  if (!sceneState) return
  sceneState.isPaused = false
  notifyListeners()
}

export function replayAvatar() {
  if (!sceneState || sceneState.sequence.length === 0) return
  sceneState.isPlaying = true
  sceneState.isPaused = false
  sceneState.elapsedTime = 0
  playNextSign(0)
}

export function resetAvatarPose() {
  if (!sceneState) return
  sceneState.isPlaying = false
  sceneState.isPaused = false
  sceneState.currentIndex = -1
  sceneState.currentGloss = ''
  sceneState.elapsedTime = 0
  sceneState.sequence = []

  if (sceneState.mixer) {
    sceneState.mixer.stopAllAction()
  }

  if (sceneState.idleAction) {
    sceneState.idleAction.reset()
    sceneState.idleAction.play()
    sceneState.activeAction = sceneState.idleAction
  }

  notifyListeners()
}

export function setAvatarSpeed(speed) {
  if (!sceneState) return
  sceneState.speed = speed
  notifyListeners()
}

export function isAvatarReady() {
  return sceneState && sceneState.isLoaded
}

export function destroyAvatar() {
  if (!sceneState) return

  if (sceneState.animId) {
    cancelAnimationFrame(sceneState.animId)
    sceneState.animId = 0
  }

  if (sceneState.mixer) {
    sceneState.mixer.stopAllAction()
  }

  if (sceneState.canvas && sceneState.onContextLost) {
    sceneState.canvas.removeEventListener('webglcontextlost', sceneState.onContextLost)
    sceneState.canvas.removeEventListener('webglcontextrestored', sceneState.onContextRestored)
  }

  if (sceneState.model && sceneState.scene) {
    sceneState.scene.remove(sceneState.model)
    sceneState.model.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }

  if (sceneState.renderer) {
    try {
      sceneState.renderer.dispose()
      sceneState.renderer.forceContextLoss()
      const gl = sceneState.renderer.getContext()
      if (gl) {
        const ext = gl.getExtension('WEBGL_lose_context')
        if (ext) ext.loseContext()
      }
    } catch (e) {
      console.warn('Error cleanly disposing WebGL renderer:', e)
    }
  }

  sceneState = null
  notifyListeners()
}
