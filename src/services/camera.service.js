/**
 * Camera Service
 * Manages the browser webcam stream lifecycle.
 * Ensures only one stream is open at a time and cleans up properly.
 */

let stream = null
let rafId = 0
let running = false

export function isCameraRunning() {
  return running
}

/**
 * Request camera access and attach the stream to the given video element.
 * Returns the MediaStream on success.
 */
export async function startCamera(video) {
  if (stream) {
    stopCamera(video)
  }

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  })

  video.srcObject = stream
  await video.play()
  running = true
  return stream
}

/**
 * Stop the camera stream and detach from video element.
 */
export function stopCamera(video) {
  running = false
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
  if (video) {
    video.srcObject = null
  }
}

/**
 * Run a callback on every animation frame while the camera is active.
 * Returns a stop function.
 */
export function startLoop(callback) {
  let active = true

  function loop(ts) {
    if (!active) return
    callback(ts)
    rafId = requestAnimationFrame(loop)
  }

  rafId = requestAnimationFrame(loop)

  return () => {
    active = false
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }
}

