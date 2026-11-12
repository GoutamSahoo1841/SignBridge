/**
 * MediaPipe Service
 * Handles initialization of Face, Hand and Pose landmarkers.
 * Preserves the exact initialization logic from the original SignBridge HTML file,
 * including GPU→CPU fallback.
 *
 * Uses window.FilesetResolver / FaceLandmarker / HandLandmarker / PoseLandmarker
 * which are loaded via ESM import in index.html before React mounts.
 */

let face = null
let hands = null
let pose = null
let initialized = false
let initializing = false

export function getDetectors() {
  return { face, hands, pose }
}

export function isMediaPipeReady() {
  return initialized
}

export async function initMediaPipe(onStatus) {
  if (initialized) return
  if (initializing) {
    while (initializing) {
      await new Promise((r) => setTimeout(r, 100))
    }
    return
  }
  initializing = true

  try {
    onStatus('Loading MediaPipe…')

    // Wait for CDN types to be available (they come from an ESM module import)
    for (let i = 0; i < 50; i++) {
      if (window.FilesetResolver) break
      await new Promise((r) => setTimeout(r, 200))
    }
    if (!window.FilesetResolver) {
      throw new Error('MediaPipe scripts did not load. Check your internet connection.')
    }

    const { FilesetResolver, FaceLandmarker, HandLandmarker, PoseLandmarker } = window

    const fs = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm'
    )

    const baseOpts = { runningMode: 'VIDEO', baseOptions: { delegate: 'GPU' } }

    const faceOpts = {
      ...baseOpts,
      baseOptions: {
        ...baseOpts.baseOptions,
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      },
      numFaces: 1,
    }
    const handOpts = {
      runningMode: 'VIDEO',
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'CPU',
      },
      numHands: 2,
      minHandDetectionConfidence: 0.25,
      minHandPresenceConfidence: 0.25,
      minTrackingConfidence: 0.25,
    }
    const poseOpts = {
      ...baseOpts,
      baseOptions: {
        ...baseOpts.baseOptions,
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      },
      numPoses: 1,
    }

    try {
      ;[face, hands, pose] = await Promise.all([
        FaceLandmarker.createFromOptions(fs, faceOpts),
        HandLandmarker.createFromOptions(fs, handOpts),
        PoseLandmarker.createFromOptions(fs, poseOpts),
      ])
    } catch {
      onStatus('GPU delegate failed; retrying on CPU…')
      ;[face, hands, pose] = await Promise.all([
        FaceLandmarker.createFromOptions(fs, {
          ...faceOpts,
          baseOptions: { ...faceOpts.baseOptions, delegate: 'CPU' },
        }),
        HandLandmarker.createFromOptions(fs, handOpts),
        PoseLandmarker.createFromOptions(fs, {
          ...poseOpts,
          baseOptions: { ...poseOpts.baseOptions, delegate: 'CPU' },
        }),
      ])
    }

    initialized = true
  } finally {
    initializing = false
  }
}

/** Run all three detectors on a single video frame and return raw results */
export function detectFrame(video, timestamp) {
  if (!face || !hands || !pose) {
    throw new Error('MediaPipe not initialized')
  }
  return {
    face: face.detectForVideo(video, timestamp),
    hands: hands.detectForVideo(video, timestamp),
    pose: pose.detectForVideo(video, timestamp),
  }
}

/**
 * Build a 543×3 Float32Array from landmark results.
 * Layout (preserved from original):
 *   [0..1403]    468 face landmarks   (x,y,z each)
 *   [1404..1466] 21 left-hand landmarks
 *   [1467..1565] 33 pose landmarks
 *   [1566..1628] 21 right-hand landmarks
 */
export function makeFrame(f, h, p) {
  const out = new Float32Array(543 * 3)
  out.fill(Number.NaN)

  function writeSection(offset, count, src) {
    if (!src) return
    for (let i = 0; i < Math.min(count, src.length); i++) {
      const pt = src[i]
      const j = offset + i * 3
      out[j] = pt.x || 0
      out[j + 1] = pt.y || 0
      out[j + 2] = pt.z || 0
    }
  }

  writeSection(0, 468, f?.faceLandmarks?.[0])

  let left = null
  let right = null
  if (h?.landmarks) {
    for (let i = 0; i < h.landmarks.length; i++) {
      const name = h.handedness?.[i]?.[0]?.categoryName
      // MediaPipe labels from camera perspective: "Left" = signer's right hand = screen-left
      if (name === 'Left') right = h.landmarks[i]
      if (name === 'Right') left = h.landmarks[i]
    }
  }

  writeSection(468, 21, left ?? undefined)
  writeSection(489, 33, p?.landmarks?.[0])
  writeSection(522, 21, right ?? undefined)

  const status = {
    face: !!(f?.faceLandmarks?.[0]),
    pose: !!(p?.landmarks?.[0]),
    lh: !!left,
    rh: !!right,
  }

  return { frame: out, status }
}

/** Shut down all detectors and reset state */
export async function destroyMediaPipe() {
  try {
    face?.close()
    hands?.close()
    pose?.close()
  } catch {
    // ignore
  }
  face = null
  hands = null
  pose = null
  initialized = false
  initializing = false
}

