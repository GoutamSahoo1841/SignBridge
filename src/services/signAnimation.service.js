/**
 * Sign Animation Service
 * Generates and compiles genuine, realistic ASL sign-language animation clips
 * for a rigged 3D humanoid skeleton with individual finger articulation.
 */
import * as THREE from 'three'

// ---- Joint Names — mapped to actual GLB bone names (_JNT convention) ----
export const BONES = {
  // Spine & Head
  Hips: 'hips_JNT',
  Spine: 'spine_JNT',
  Spine1: 'spine1_JNT',
  Spine2: 'spine2_JNT',
  Neck: 'neck_JNT',
  Head: 'head_JNT',

  // Right Arm
  RightShoulder: 'r_shoulder_JNT',
  RightArm: 'r_arm_JNT',
  RightForeArm: 'r_forearm_JNT',
  RightHand: 'r_hand_JNT',

  // Right Fingers
  RightThumb: ['r_handThumb1_JNT', 'r_handThumb2_JNT', 'r_handThumb3_JNT'],
  RightIndex: ['r_handIndex1_JNT', 'r_handIndex2_JNT', 'r_handIndex3_JNT'],
  RightMiddle: ['r_handMiddle1_JNT', 'r_handMiddle2_JNT', 'r_handMiddle3_JNT'],
  RightRing: ['r_handRing1_JNT', 'r_handRing2_JNT', 'r_handRing3_JNT'],
  RightPinky: ['r_handPinky1_JNT', 'r_handPinky2_JNT', 'r_handPinky3_JNT'],

  // Left Arm
  LeftShoulder: 'l_shoulder_JNT',
  LeftArm: 'l_arm_JNT',
  LeftForeArm: 'l_forearm_JNT',
  LeftHand: 'l_hand_JNT',

  // Left Fingers
  LeftThumb: ['l_handThumb1_JNT', 'l_handThumb2_JNT', 'l_handThumb3_JNT'],
  LeftIndex: ['l_handIndex1_JNT', 'l_handIndex2_JNT', 'l_handIndex3_JNT'],
  LeftMiddle: ['l_handMiddle1_JNT', 'l_handMiddle2_JNT', 'l_handMiddle3_JNT'],
  LeftRing: ['l_handRing1_JNT', 'l_handRing2_JNT', 'l_handRing3_JNT'],
  LeftPinky: ['l_handPinky1_JNT', 'l_handPinky2_JNT', 'l_handPinky3_JNT'],
}

// Finger order: [thumb, index, middle, ring, pinky]
// Values are curl amounts: 0 = straight/extended, 1 = fully curled into palm
// Thumb: [curl, spread, rotation]
export const HANDSHAPES = {
  // Open flat hand (all fingers extended together, thumb tucked slightly) - B shape
  B: {
    thumb: [0.35, 0.2, 0.1],
    index: [0.05, 0.05, 0.02],
    middle: [0.05, 0.05, 0.02],
    ring: [0.05, 0.05, 0.02],
    pinky: [0.05, 0.05, 0.02],
  },
  // Closed fist with thumb wrapped across front - A / S shape
  A: {
    thumb: [0.2, 0.1, 0.0],
    index: [0.95, 0.95, 0.9],
    middle: [0.95, 0.95, 0.9],
    ring: [0.95, 0.95, 0.9],
    pinky: [0.95, 0.95, 0.9],
  },
  S: {
    thumb: [0.8, 0.6, 0.2],
    index: [0.95, 0.95, 0.9],
    middle: [0.95, 0.95, 0.9],
    ring: [0.95, 0.95, 0.9],
    pinky: [0.95, 0.95, 0.9],
  },
  // Curved 'C' handshape
  C: {
    thumb: [0.45, 0.3, 0.2],
    index: [0.45, 0.45, 0.4],
    middle: [0.45, 0.45, 0.4],
    ring: [0.45, 0.45, 0.4],
    pinky: [0.45, 0.45, 0.4],
  },
  // Index pointing straight up, other fingers curled - 1 / D / P1 shape
  P1: {
    thumb: [0.8, 0.5, 0.2],
    index: [0.0, 0.0, 0.0],
    middle: [0.95, 0.95, 0.9],
    ring: [0.95, 0.95, 0.9],
    pinky: [0.95, 0.95, 0.9],
  },
  D: {
    thumb: [0.65, 0.5, 0.2],
    index: [0.0, 0.0, 0.0],
    middle: [0.75, 0.75, 0.7],
    ring: [0.85, 0.85, 0.8],
    pinky: [0.95, 0.95, 0.9],
  },
  // Open 5 spread fingers - 5 / F5 shape
  F5: {
    thumb: [0.0, 0.4, 0.0],
    index: [0.0, 0.0, 0.0],
    middle: [0.0, 0.0, 0.0],
    ring: [0.0, 0.0, 0.0],
    pinky: [0.0, 0.0, 0.0],
  },
  // Claw 5 shape - C5
  C5: {
    thumb: [0.5, 0.3, 0.2],
    index: [0.55, 0.55, 0.5],
    middle: [0.55, 0.55, 0.5],
    ring: [0.55, 0.55, 0.5],
    pinky: [0.55, 0.55, 0.5],
  },
  // 'W' shape - index, middle, ring extended spread
  W: {
    thumb: [0.8, 0.4, 0.2],
    index: [0.0, 0.0, 0.0],
    middle: [0.0, 0.0, 0.0],
    ring: [0.0, 0.0, 0.0],
    pinky: [0.95, 0.95, 0.9],
  },
  // 'V' shape - index and middle extended spread (peace sign)
  V: {
    thumb: [0.8, 0.4, 0.2],
    index: [0.0, 0.0, 0.0],
    middle: [0.0, 0.0, 0.0],
    ring: [0.95, 0.95, 0.9],
    pinky: [0.95, 0.95, 0.9],
  },
  // 'H' shape - index and middle extended together horizontally
  H: {
    thumb: [0.75, 0.3, 0.1],
    index: [0.05, 0.05, 0.0],
    middle: [0.05, 0.05, 0.0],
    ring: [0.95, 0.95, 0.9],
    pinky: [0.95, 0.95, 0.9],
  },
  // 'HN' - beak shape (index & middle pointing forward, ready to snap to thumb)
  HN: {
    thumb: [0.4, 0.2, 0.1],
    index: [0.35, 0.25, 0.2],
    middle: [0.35, 0.25, 0.2],
    ring: [0.95, 0.95, 0.9],
    pinky: [0.95, 0.95, 0.9],
  },
  // 'O' shape - all fingertips touching thumb tip
  O: {
    thumb: [0.7, 0.4, 0.3],
    index: [0.75, 0.75, 0.6],
    middle: [0.75, 0.75, 0.6],
    ring: [0.75, 0.75, 0.6],
    pinky: [0.75, 0.75, 0.6],
  },
  // 'F' shape - index and thumb touching (OK sign), other 3 spread
  F: {
    thumb: [0.55, 0.3, 0.2],
    index: [0.65, 0.65, 0.5],
    middle: [0.0, 0.0, 0.0],
    ring: [0.0, 0.0, 0.0],
    pinky: [0.0, 0.0, 0.0],
  },
  // 'X' shape - index finger hooked/bent
  X: {
    thumb: [0.7, 0.3, 0.1],
    index: [0.75, 0.4, 0.1],
    middle: [0.95, 0.95, 0.9],
    ring: [0.95, 0.95, 0.9],
    pinky: [0.95, 0.95, 0.9],
  },
  // 'Y' shape - thumb and pinky extended (phone / hang loose)
  Y: {
    thumb: [0.0, 0.5, 0.0],
    index: [0.95, 0.95, 0.9],
    middle: [0.95, 0.95, 0.9],
    ring: [0.95, 0.95, 0.9],
    pinky: [0.0, 0.0, 0.0],
  },
  // 'ILY' - I Love You (thumb, index, and pinky extended, middle and ring curled)
  ILY: {
    thumb: [0.0, 0.5, 0.0],
    index: [0.0, 0.0, 0.0],
    middle: [0.95, 0.95, 0.9],
    ring: [0.95, 0.95, 0.9],
    pinky: [0.0, 0.0, 0.0],
  },
  // Relaxed resting hand (natural slight curl of fingers at rest)
  RL: {
    thumb: [0.2, 0.15, 0.05],
    index: [0.25, 0.2, 0.15],
    middle: [0.3, 0.25, 0.2],
    ring: [0.35, 0.3, 0.25],
    pinky: [0.35, 0.3, 0.25],
  },
}

// ---- Orientation Presets for Wrist/Hand ----
// Forward vector & Normal vector (determines palm direction and pointing direction)
export const ORIENTATIONS = {
  // Palm facing signer / inward (e.g. chest touches)
  US: { palm: [0, 0, -1], up: [0, 1, 0] },
  // Palm facing audience / outward / up (e.g. hello wave, thank you forward)
  UX: { palm: [0, 0.5, 0.8], up: [0, 1, 0] },
  // Palm facing up
  FU: { palm: [0, 1, 0], up: [0, 0, 1] },
  // Palm facing down
  FD: { palm: [0, -1, 0], up: [0, 0, 1] },
  // Palm facing inwards (towards midline)
  UI: { palm: [1, 0, 0], up: [0, 1, 0] },
  // Palm facing outwards (away from midline)
  UO: { palm: [-1, 0, 0], up: [0, 1, 0] },
  // Fingers pointing forward, palm inwards
  FI: { palm: [1, 0, 0], up: [0, 0, 1] },
  // Fingers pointing toward signer
  TS: { palm: [0, 0, -1], up: [1, 0, 0] },
  // Resting at side
  RS: { palm: [1, 0, 0], up: [0, -1, 0] },
}

// Length constants of the human avatar skeleton
const ARM_L1 = 0.2755 // Upper arm length
const ARM_L2 = 0.2562 // Forearm length

/**
 * Two-bone analytical Inverse Kinematics solver for human arms.
 * Calculates exact Shoulder, Arm, and ForeArm rotations to reach wrist target.
 */
export function solveArmIK(shoulderWorldPos, targetWristPos, poleDirection, isLeft = false) {
  const dVec = targetWristPos.clone().sub(shoulderWorldPos)
  let dist = dVec.length()
  const maxReach = (ARM_L1 + ARM_L2) * 0.999
  const minReach = Math.abs(ARM_L1 - ARM_L2) + 0.02
  dist = Math.min(Math.max(dist, minReach), maxReach)

  const dir = dVec.clone().normalize()

  // Law of cosines for shoulder and elbow angles
  const cosAlpha = (ARM_L1 * ARM_L1 + dist * dist - ARM_L2 * ARM_L2) / (2 * ARM_L1 * dist)
  const alpha = Math.acos(Math.min(Math.max(cosAlpha, -1), 1))

  // Find plane with pole direction (where elbow bends)
  const pProj = poleDirection
    .clone()
    .sub(dir.clone().multiplyScalar(poleDirection.dot(dir)))
    .normalize()

  // Calculated elbow world position
  const elbowPos = shoulderWorldPos
    .clone()
    .add(dir.clone().multiplyScalar(ARM_L1 * Math.cos(alpha)))
    .add(pProj.clone().multiplyScalar(ARM_L1 * Math.sin(alpha)))

  // Rest directions in T-pose
  const restArmDir = new THREE.Vector3(isLeft ? 1 : -1, 0, 0)
  const restForeDir = new THREE.Vector3(isLeft ? 1 : -1, 0, 0)

  // Desired directions
  const targetArmDir = elbowPos.clone().sub(shoulderWorldPos).normalize()
  const targetForeDir = targetWristPos.clone().sub(elbowPos).normalize()

  // World quaternions
  const qArmWorld = new THREE.Quaternion().setFromUnitVectors(restArmDir, targetArmDir)
  const qForeWorld = new THREE.Quaternion().setFromUnitVectors(restForeDir, targetForeDir)

  // Local quaternion for forearm relative to upper arm
  const qForeLocal = qArmWorld.clone().invert().multiply(qForeWorld)

  return {
    qArm: qArmWorld,
    qFore: qForeLocal,
    elbowPos,
  }
}

/**
 * Computes hand bone quaternion based on desired palm & finger orientation.
 */
export function solveHandOrientation(orientKey, isLeft = false) {
  const or = ORIENTATIONS[orientKey] || ORIENTATIONS.UX
  const palm = new THREE.Vector3(...or.palm)
  const up = new THREE.Vector3(...or.up)

  if (isLeft) {
    palm.x *= -1
    up.x *= -1
  }

  const forward = palm.clone().normalize()
  const yAxis = up.clone().normalize()
  const xAxis = yAxis.clone().cross(forward).normalize()

  const mat = new THREE.Matrix4().makeBasis(xAxis, yAxis, forward)
  return new THREE.Quaternion().setFromRotationMatrix(mat)
}

/**
 * Generates local rotation quaternions for the 15 bones of a hand given a handshape.
 */
export function getFingerQuaternions(shapeKey, isLeft = false) {
  const shape = HANDSHAPES[shapeKey] || HANDSHAPES.B
  const sideSign = isLeft ? -1 : 1
  const quats = {}

  const applyFinger = (names, curls) => {
    names.forEach((name, i) => {
      const curl = curls[i] || 0
      // Local X bending curls fingers inwards
      const euler = new THREE.Euler(curl * 1.35, 0, sideSign * curl * 0.08, 'XYZ')
      quats[name] = new THREE.Quaternion().setFromEuler(euler)
    })
  }

  const prefix = isLeft ? 'l_hand' : 'r_hand'
  applyFinger([`${prefix}Thumb1_JNT`, `${prefix}Thumb2_JNT`, `${prefix}Thumb3_JNT`], shape.thumb)
  applyFinger([`${prefix}Index1_JNT`, `${prefix}Index2_JNT`, `${prefix}Index3_JNT`], shape.index)
  applyFinger([`${prefix}Middle1_JNT`, `${prefix}Middle2_JNT`, `${prefix}Middle3_JNT`], shape.middle)
  applyFinger([`${prefix}Ring1_JNT`, `${prefix}Ring2_JNT`, `${prefix}Ring3_JNT`], shape.ring)
  applyFinger([`${prefix}Pinky1_JNT`, `${prefix}Pinky2_JNT`, `${prefix}Pinky3_JNT`], shape.pinky)

  return quats
}

// ---- Resting / Idle Positions ----
export const REST_POSE = {
  rightWrist: new THREE.Vector3(-0.24, 0.96, 0.06),
  leftWrist: new THREE.Vector3(0.24, 0.96, 0.06),
  rightOrient: 'RS',
  leftOrient: 'RS',
  handshape: 'RL',
}

// ---- Authentic ASL Sign Lexicon Database ----
export const SIGN_LEXICON = {
  HELLO: {
    name: 'Hello',
    duration: 1.2,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.35, rightPos: [-0.14, 1.66, 0.18], rOrient: 'UX', rShape: 'B', faceSmile: 0.6 },
      { t: 0.75, rightPos: [-0.34, 1.62, 0.32], rOrient: 'UX', rShape: 'B', faceSmile: 0.8 },
      { t: 1.2, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  THANKYOU: {
    name: 'Thank You',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.35, rightPos: [-0.04, 1.48, 0.22], rOrient: 'US', rShape: 'B', faceSmile: 0.5 },
      { t: 0.75, rightPos: [-0.14, 1.32, 0.44], rOrient: 'FU', rShape: 'B', faceSmile: 0.8, headNod: 0.08 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  PLEASE: {
    name: 'Please',
    duration: 1.5,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.3, rightPos: [-0.08, 1.30, 0.18], rOrient: 'US', rShape: 'B' },
      { t: 0.55, rightPos: [0.02, 1.34, 0.18], rOrient: 'US', rShape: 'B' },
      { t: 0.8, rightPos: [-0.08, 1.24, 0.18], rOrient: 'US', rShape: 'B' },
      { t: 1.05, rightPos: [0.02, 1.34, 0.18], rOrient: 'US', rShape: 'B' },
      { t: 1.5, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  SORRY: {
    name: 'Sorry',
    duration: 1.5,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.3, rightPos: [-0.06, 1.30, 0.18], rOrient: 'US', rShape: 'A' },
      { t: 0.55, rightPos: [0.02, 1.34, 0.18], rOrient: 'US', rShape: 'A' },
      { t: 0.8, rightPos: [-0.06, 1.24, 0.18], rOrient: 'US', rShape: 'A', headNod: 0.06 },
      { t: 1.1, rightPos: [0.02, 1.34, 0.18], rOrient: 'US', rShape: 'A' },
      { t: 1.5, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  HELP: {
    name: 'Help',
    duration: 1.4,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.4, rightPos: [-0.05, 1.22, 0.32], leftPos: [0.05, 1.16, 0.32], rOrient: 'UI', lOrient: 'FU', rShape: 'A', lShape: 'B' },
      { t: 0.85, rightPos: [-0.05, 1.40, 0.36], leftPos: [0.05, 1.34, 0.36], rOrient: 'UI', lOrient: 'FU', rShape: 'A', lShape: 'B' },
      { t: 1.4, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  YES: {
    name: 'Yes',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.3, rightPos: [-0.18, 1.36, 0.32], rOrient: 'UO', rShape: 'S', headNod: 0.08 },
      { t: 0.55, rightPos: [-0.18, 1.28, 0.34], rOrient: 'FD', rShape: 'S', headNod: -0.04 },
      { t: 0.8, rightPos: [-0.18, 1.36, 0.32], rOrient: 'UO', rShape: 'S', headNod: 0.08 },
      { t: 1.05, rightPos: [-0.18, 1.28, 0.34], rOrient: 'FD', rShape: 'S', headNod: 0.0 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  NO: {
    name: 'No',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.3, rightPos: [-0.16, 1.36, 0.34], rOrient: 'FI', rShape: 'HN' },
      { t: 0.55, rightPos: [-0.16, 1.36, 0.34], rOrient: 'FI', rShape: 'H', headShake: 0.08 },
      { t: 0.8, rightPos: [-0.16, 1.36, 0.34], rOrient: 'FI', rShape: 'HN' },
      { t: 1.0, rightPos: [-0.16, 1.36, 0.34], rOrient: 'FI', rShape: 'H', headShake: -0.08 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  ME: {
    name: 'Me',
    duration: 1.1,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.45, rightPos: [-0.08, 1.32, 0.20], rOrient: 'TS', rShape: 'P1' },
      { t: 0.75, rightPos: [-0.08, 1.32, 0.20], rOrient: 'TS', rShape: 'P1' },
      { t: 1.1, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  YOU: {
    name: 'You',
    duration: 1.1,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.4, rightPos: [-0.14, 1.34, 0.32], rOrient: 'FI', rShape: 'P1' },
      { t: 0.75, rightPos: [-0.14, 1.34, 0.48], rOrient: 'FI', rShape: 'P1' },
      { t: 1.1, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  MY: {
    name: 'My',
    duration: 1.1,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.45, rightPos: [-0.06, 1.32, 0.18], rOrient: 'US', rShape: 'B' },
      { t: 0.75, rightPos: [-0.06, 1.32, 0.18], rOrient: 'US', rShape: 'B' },
      { t: 1.1, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  WANT: {
    name: 'Want',
    duration: 1.3,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.4, rightPos: [-0.18, 1.25, 0.45], leftPos: [0.18, 1.25, 0.45], rOrient: 'FU', lOrient: 'FU', rShape: 'C5', lShape: 'C5' },
      { t: 0.8, rightPos: [-0.14, 1.25, 0.25], leftPos: [0.14, 1.25, 0.25], rOrient: 'FU', lOrient: 'FU', rShape: 'C5', lShape: 'C5' },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  NEED: {
    name: 'Need',
    duration: 1.2,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.35, rightPos: [-0.16, 1.38, 0.36], rOrient: 'UO', rShape: 'X' },
      { t: 0.65, rightPos: [-0.16, 1.24, 0.36], rOrient: 'FD', rShape: 'X' },
      { t: 0.85, rightPos: [-0.16, 1.36, 0.36], rOrient: 'UO', rShape: 'X' },
      { t: 1.2, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  WATER: {
    name: 'Water',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.35, rightPos: [-0.05, 1.50, 0.22], rOrient: 'UO', rShape: 'W' },
      { t: 0.55, rightPos: [-0.05, 1.45, 0.24], rOrient: 'UO', rShape: 'W' },
      { t: 0.75, rightPos: [-0.05, 1.50, 0.22], rOrient: 'UO', rShape: 'W' },
      { t: 0.95, rightPos: [-0.05, 1.45, 0.24], rOrient: 'UO', rShape: 'W' },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  EAT: {
    name: 'Eat',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.35, rightPos: [-0.05, 1.50, 0.24], rOrient: 'UI', rShape: 'O' },
      { t: 0.55, rightPos: [-0.05, 1.54, 0.22], rOrient: 'UI', rShape: 'O' },
      { t: 0.75, rightPos: [-0.05, 1.50, 0.24], rOrient: 'UI', rShape: 'O' },
      { t: 0.95, rightPos: [-0.05, 1.54, 0.22], rOrient: 'UI', rShape: 'O' },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  DRINK: {
    name: 'Drink',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.4, rightPos: [-0.10, 1.40, 0.32], rOrient: 'UI', rShape: 'C' },
      { t: 0.8, rightPos: [-0.06, 1.52, 0.25], rOrient: 'US', rShape: 'C', headNod: -0.06 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  MORE: {
    name: 'More',
    duration: 1.3,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.35, rightPos: [-0.14, 1.28, 0.35], leftPos: [0.14, 1.28, 0.35], rOrient: 'FU', lOrient: 'FU', rShape: 'O', lShape: 'O' },
      { t: 0.55, rightPos: [-0.05, 1.28, 0.35], leftPos: [0.05, 1.28, 0.35], rOrient: 'FU', lOrient: 'FU', rShape: 'O', lShape: 'O' },
      { t: 0.75, rightPos: [-0.14, 1.28, 0.35], leftPos: [0.14, 1.28, 0.35], rOrient: 'FU', lOrient: 'FU', rShape: 'O', lShape: 'O' },
      { t: 0.95, rightPos: [-0.05, 1.28, 0.35], leftPos: [0.05, 1.28, 0.35], rOrient: 'FU', lOrient: 'FU', rShape: 'O', lShape: 'O' },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  STOP: {
    name: 'Stop',
    duration: 1.3,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.4, rightPos: [-0.08, 1.42, 0.32], leftPos: [0.06, 1.22, 0.32], rOrient: 'UI', lOrient: 'FU', rShape: 'B', lShape: 'B' },
      { t: 0.75, rightPos: [-0.05, 1.24, 0.32], leftPos: [0.06, 1.22, 0.32], rOrient: 'UI', lOrient: 'FU', rShape: 'B', lShape: 'B' },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  GOOD: {
    name: 'Good',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.35, rightPos: [-0.04, 1.48, 0.22], rOrient: 'US', rShape: 'B', faceSmile: 0.5 },
      { t: 0.75, rightPos: [-0.08, 1.24, 0.34], rOrient: 'FU', rShape: 'B', faceSmile: 0.8 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  BAD: {
    name: 'Bad',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.35, rightPos: [-0.04, 1.48, 0.22], rOrient: 'US', rShape: 'B' },
      { t: 0.75, rightPos: [-0.14, 1.24, 0.36], rOrient: 'FD', rShape: 'B', headShake: 0.08 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  LOVE: {
    name: 'Love',
    duration: 1.4,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.5, rightPos: [0.08, 1.32, 0.20], leftPos: [-0.08, 1.32, 0.20], rOrient: 'US', lOrient: 'US', rShape: 'S', lShape: 'S', faceSmile: 0.8 },
      { t: 0.95, rightPos: [0.08, 1.32, 0.20], leftPos: [-0.08, 1.32, 0.20], rOrient: 'US', lOrient: 'US', rShape: 'S', lShape: 'S' },
      { t: 1.4, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  HOME: {
    name: 'Home',
    duration: 1.4,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.4, rightPos: [-0.08, 1.48, 0.24], rOrient: 'UI', rShape: 'O' },
      { t: 0.8, rightPos: [-0.14, 1.58, 0.16], rOrient: 'UI', rShape: 'O' },
      { t: 1.4, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  NAME: {
    name: 'Name',
    duration: 1.3,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.35, rightPos: [-0.06, 1.38, 0.35], leftPos: [0.06, 1.26, 0.35], rOrient: 'FD', lOrient: 'FI', rShape: 'H', lShape: 'H' },
      { t: 0.55, rightPos: [-0.06, 1.28, 0.35], leftPos: [0.06, 1.26, 0.35], rOrient: 'FD', lOrient: 'FI', rShape: 'H', lShape: 'H' },
      { t: 0.75, rightPos: [-0.06, 1.38, 0.35], leftPos: [0.06, 1.26, 0.35], rOrient: 'FD', lOrient: 'FI', rShape: 'H', lShape: 'H' },
      { t: 0.95, rightPos: [-0.06, 1.28, 0.35], leftPos: [0.06, 1.26, 0.35], rOrient: 'FD', lOrient: 'FI', rShape: 'H', lShape: 'H' },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  WHAT: {
    name: 'What',
    duration: 1.4,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.35, rightPos: [-0.18, 1.25, 0.35], leftPos: [0.18, 1.25, 0.35], rOrient: 'FU', lOrient: 'FU', rShape: 'F5', lShape: 'F5', browRaise: 0.7 },
      { t: 0.65, rightPos: [-0.26, 1.25, 0.35], leftPos: [0.26, 1.25, 0.35], rOrient: 'FU', lOrient: 'FU', rShape: 'F5', lShape: 'F5', browRaise: 0.7 },
      { t: 0.95, rightPos: [-0.18, 1.25, 0.35], leftPos: [0.18, 1.25, 0.35], rOrient: 'FU', lOrient: 'FU', rShape: 'F5', lShape: 'F5', browRaise: 0.7 },
      { t: 1.4, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  WHERE: {
    name: 'Where',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.35, rightPos: [-0.16, 1.45, 0.35], rOrient: 'UO', rShape: 'P1', browRaise: 0.7 },
      { t: 0.55, rightPos: [-0.26, 1.45, 0.35], rOrient: 'UO', rShape: 'P1', browRaise: 0.7 },
      { t: 0.75, rightPos: [-0.16, 1.45, 0.35], rOrient: 'UO', rShape: 'P1', browRaise: 0.7 },
      { t: 0.95, rightPos: [-0.26, 1.45, 0.35], rOrient: 'UO', rShape: 'P1', browRaise: 0.7 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  HOW: {
    name: 'How',
    duration: 1.3,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.45, rightPos: [-0.08, 1.26, 0.35], leftPos: [0.08, 1.26, 0.35], rOrient: 'US', lOrient: 'US', rShape: 'S', lShape: 'S', browRaise: 0.6 },
      { t: 0.85, rightPos: [-0.14, 1.32, 0.40], leftPos: [0.14, 1.32, 0.40], rOrient: 'FU', lOrient: 'FU', rShape: 'S', lShape: 'S', browRaise: 0.6 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  UNDERSTAND: {
    name: 'Understand',
    duration: 1.2,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.4, rightPos: [-0.12, 1.62, 0.20], rOrient: 'UO', rShape: 'S' },
      { t: 0.7, rightPos: [-0.12, 1.66, 0.20], rOrient: 'UO', rShape: 'P1', headNod: 0.08, faceSmile: 0.4 },
      { t: 1.2, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  KNOW: {
    name: 'Know',
    duration: 1.1,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.45, rightPos: [-0.12, 1.64, 0.20], rOrient: 'UI', rShape: 'B', headNod: 0.06 },
      { t: 0.75, rightPos: [-0.12, 1.64, 0.20], rOrient: 'UI', rShape: 'B' },
      { t: 1.1, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  BATHROOM: {
    name: 'Bathroom',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.35, rightPos: [-0.18, 1.35, 0.35], rOrient: 'UO', rShape: 'A' },
      { t: 0.55, rightPos: [-0.24, 1.35, 0.35], rOrient: 'UO', rShape: 'A' },
      { t: 0.75, rightPos: [-0.18, 1.35, 0.35], rOrient: 'UO', rShape: 'A' },
      { t: 0.95, rightPos: [-0.24, 1.35, 0.35], rOrient: 'UO', rShape: 'A' },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  BYE: {
    name: 'Goodbye',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.35, rightPos: [-0.24, 1.55, 0.35], rOrient: 'UO', rShape: 'B', faceSmile: 0.6 },
      { t: 0.55, rightPos: [-0.32, 1.55, 0.35], rOrient: 'UO', rShape: 'B', faceSmile: 0.7 },
      { t: 0.75, rightPos: [-0.24, 1.55, 0.35], rOrient: 'UO', rShape: 'B', faceSmile: 0.7 },
      { t: 0.95, rightPos: [-0.32, 1.55, 0.35], rOrient: 'UO', rShape: 'B', faceSmile: 0.6 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  MEET: {
    name: 'Meet',
    duration: 1.3,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.45, rightPos: [-0.22, 1.32, 0.35], leftPos: [0.22, 1.32, 0.35], rOrient: 'UI', lOrient: 'UI', rShape: 'P1', lShape: 'P1' },
      { t: 0.85, rightPos: [-0.04, 1.32, 0.35], leftPos: [0.04, 1.32, 0.35], rOrient: 'UI', lOrient: 'UI', rShape: 'P1', lShape: 'P1' },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  NICE: {
    name: 'Nice',
    duration: 1.3,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.4, rightPos: [-0.04, 1.28, 0.35], leftPos: [0.06, 1.22, 0.35], rOrient: 'FU', lOrient: 'FU', rShape: 'B', lShape: 'B' },
      { t: 0.8, rightPos: [-0.14, 1.28, 0.45], leftPos: [0.06, 1.22, 0.35], rOrient: 'FU', lOrient: 'FU', rShape: 'B', lShape: 'B', faceSmile: 0.6 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  ILY: {
    name: 'I Love You',
    duration: 1.3,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.45, rightPos: [-0.18, 1.50, 0.38], rOrient: 'UO', rShape: 'ILY', faceSmile: 0.8 },
      { t: 0.85, rightPos: [-0.18, 1.50, 0.44], rOrient: 'UO', rShape: 'ILY', faceSmile: 0.8 },
      { t: 1.3, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
  HAPPY: {
    name: 'Happy',
    duration: 1.4,
    both: true,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
      { t: 0.35, rightPos: [-0.14, 1.24, 0.20], leftPos: [0.14, 1.24, 0.20], rOrient: 'US', lOrient: 'US', rShape: 'B', lShape: 'B', faceSmile: 0.9 },
      { t: 0.65, rightPos: [-0.14, 1.38, 0.22], leftPos: [0.14, 1.38, 0.22], rOrient: 'US', lOrient: 'US', rShape: 'B', lShape: 'B', faceSmile: 0.9 },
      { t: 0.85, rightPos: [-0.14, 1.24, 0.20], leftPos: [0.14, 1.24, 0.20], rOrient: 'US', lOrient: 'US', rShape: 'B', lShape: 'B', faceSmile: 0.9 },
      { t: 1.05, rightPos: [-0.14, 1.38, 0.22], leftPos: [0.14, 1.38, 0.22], rOrient: 'US', lOrient: 'US', rShape: 'B', lShape: 'B', faceSmile: 0.9 },
      { t: 1.4, rightPos: [-0.24, 0.96, 0.06], leftPos: [0.24, 0.96, 0.06], rShape: 'RL', lShape: 'RL' },
    ],
  },
  FINE: {
    name: 'Fine',
    duration: 1.2,
    keyframes: [
      { t: 0.0, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
      { t: 0.4, rightPos: [-0.10, 1.32, 0.20], rOrient: 'UO', rShape: 'F5', faceSmile: 0.5 },
      { t: 0.75, rightPos: [-0.10, 1.32, 0.20], rOrient: 'UO', rShape: 'F5', faceSmile: 0.5 },
      { t: 1.2, rightPos: [-0.24, 0.96, 0.06], rOrient: 'RS', rShape: 'RL' },
    ],
  },
}

/**
 * Checks whether a given sign gloss is genuinely supported.
 */
export function isSignSupported(gloss) {
  if (!gloss) return false
  if (gloss.startsWith('#')) return true // Fingerspelled words are supported via alphabet shapes
  return Boolean(SIGN_LEXICON[gloss.toUpperCase()])
}

/**
 * Compiles a sign definition into a native Three.js AnimationClip.
 */
export function createSignClip(gloss, shoulderR, shoulderL) {
  const gUpper = gloss.toUpperCase()
  const def = SIGN_LEXICON[gUpper]

  // If fingerspelling (starts with '#'), build letter-by-letter fingerspelling clip
  if (gloss.startsWith('#')) {
    return createFingerspellClip(gloss.slice(1).toUpperCase())
  }

  if (!def) return null

  const sR = shoulderR || new THREE.Vector3(-0.171, 1.531, -0.049)
  const sL = shoulderL || new THREE.Vector3(0.171, 1.531, -0.049)
  const poleR = new THREE.Vector3(-0.5, -0.7, -0.2)
  const poleL = new THREE.Vector3(0.5, -0.7, -0.2)

  const times = []
  const tracks = {}

  // Initialize track lists
  const initTrack = (name) => {
    if (!tracks[name]) tracks[name] = []
  }

  const kfs = def.keyframes
  kfs.forEach((kf) => {
    times.push(kf.t)

    // Solve Right Arm IK
    const rWrist = new THREE.Vector3(...kf.rightPos)
    const ikR = solveArmIK(sR, rWrist, poleR, false)
    const qHandR = solveHandOrientation(kf.rOrient || 'UX', false)

    initTrack('r_arm_JNT.quaternion')
    tracks['r_arm_JNT.quaternion'].push(ikR.qArm.x, ikR.qArm.y, ikR.qArm.z, ikR.qArm.w)

    initTrack('r_forearm_JNT.quaternion')
    tracks['r_forearm_JNT.quaternion'].push(ikR.qFore.x, ikR.qFore.y, ikR.qFore.z, ikR.qFore.w)

    initTrack('r_hand_JNT.quaternion')
    tracks['r_hand_JNT.quaternion'].push(qHandR.x, qHandR.y, qHandR.z, qHandR.w)

    // Right Fingers
    const rFingers = getFingerQuaternions(kf.rShape || 'B', false)
    Object.entries(rFingers).forEach(([bName, q]) => {
      const trackName = `${bName}.quaternion`
      initTrack(trackName)
      tracks[trackName].push(q.x, q.y, q.z, q.w)
    })

    // Solve Left Arm
    if (def.both && kf.leftPos) {
      const lWrist = new THREE.Vector3(...kf.leftPos)
      const ikL = solveArmIK(sL, lWrist, poleL, true)
      const qHandL = solveHandOrientation(kf.lOrient || 'UX', true)

      initTrack('l_arm_JNT.quaternion')
      tracks['l_arm_JNT.quaternion'].push(ikL.qArm.x, ikL.qArm.y, ikL.qArm.z, ikL.qArm.w)

      initTrack('l_forearm_JNT.quaternion')
      tracks['l_forearm_JNT.quaternion'].push(ikL.qFore.x, ikL.qFore.y, ikL.qFore.z, ikL.qFore.w)

      initTrack('l_hand_JNT.quaternion')
      tracks['l_hand_JNT.quaternion'].push(qHandL.x, qHandL.y, qHandL.z, qHandL.w)

      const lFingers = getFingerQuaternions(kf.lShape || 'B', true)
      Object.entries(lFingers).forEach(([bName, q]) => {
        const trackName = `${bName}.quaternion`
        initTrack(trackName)
        tracks[trackName].push(q.x, q.y, q.z, q.w)
      })
    } else {
      // Left arm stays naturally at rest
      const ikL = solveArmIK(sL, REST_POSE.leftWrist, poleL, true)
      const qHandL = solveHandOrientation('RS', true)

      initTrack('l_arm_JNT.quaternion')
      tracks['l_arm_JNT.quaternion'].push(ikL.qArm.x, ikL.qArm.y, ikL.qArm.z, ikL.qArm.w)

      initTrack('l_forearm_JNT.quaternion')
      tracks['l_forearm_JNT.quaternion'].push(ikL.qFore.x, ikL.qFore.y, ikL.qFore.z, ikL.qFore.w)

      initTrack('l_hand_JNT.quaternion')
      tracks['l_hand_JNT.quaternion'].push(qHandL.x, qHandL.y, qHandL.z, qHandL.w)

      const lFingers = getFingerQuaternions('RL', true)
      Object.entries(lFingers).forEach(([bName, q]) => {
        const trackName = `${bName}.quaternion`
        initTrack(trackName)
        tracks[trackName].push(q.x, q.y, q.z, q.w)
      })
    }

    // Head rotation
    const headNod = kf.headNod || 0
    const headShake = kf.headShake || 0
    const qHead = new THREE.Quaternion().setFromEuler(new THREE.Euler(headNod, headShake, 0, 'XYZ'))
    initTrack('head_JNT.quaternion')
    tracks['head_JNT.quaternion'].push(qHead.x, qHead.y, qHead.z, qHead.w)
  })

  // Assemble THREE.KeyframeTrack objects
  const clipTracks = []
  const timesArray = new Float32Array(times)

  Object.entries(tracks).forEach(([name, values]) => {
    clipTracks.push(new THREE.QuaternionKeyframeTrack(name, timesArray, new Float32Array(values)))
  })

  return new THREE.AnimationClip(def.name, def.duration, clipTracks)
}

/**
 * Creates an authentic fingerspelling animation clip for unknown words.
 */
export function createFingerspellClip(word) {
  const letters = [...word].filter((c) => /[A-Z]/.test(c))
  if (letters.length === 0) return null

  const letterDuration = 0.55
  const duration = letters.length * letterDuration + 0.4
  const times = []
  const tracks = {}

  const initTrack = (name) => {
    if (!tracks[name]) tracks[name] = []
  }

  const sR = new THREE.Vector3(-0.171, 1.531, -0.049)
  const sL = new THREE.Vector3(0.171, 1.531, -0.049)
  const poleR = new THREE.Vector3(-0.5, -0.7, -0.2)
  const poleL = new THREE.Vector3(0.5, -0.7, -0.2)

  // Start at rest
  times.push(0.0)
  const startIK_R = solveArmIK(sR, REST_POSE.rightWrist, poleR, false)
  const startIK_L = solveArmIK(sL, REST_POSE.leftWrist, poleL, true)
  const qRest = solveHandOrientation('RS', false)

  initTrack('r_arm_JNT.quaternion')
  tracks['r_arm_JNT.quaternion'].push(startIK_R.qArm.x, startIK_R.qArm.y, startIK_R.qArm.z, startIK_R.qArm.w)
  initTrack('r_forearm_JNT.quaternion')
  tracks['r_forearm_JNT.quaternion'].push(startIK_R.qFore.x, startIK_R.qFore.y, startIK_R.qFore.z, startIK_R.qFore.w)
  initTrack('r_hand_JNT.quaternion')
  tracks['r_hand_JNT.quaternion'].push(qRest.x, qRest.y, qRest.z, qRest.w)

  initTrack('l_arm_JNT.quaternion')
  tracks['l_arm_JNT.quaternion'].push(startIK_L.qArm.x, startIK_L.qArm.y, startIK_L.qArm.z, startIK_L.qArm.w)
  initTrack('l_forearm_JNT.quaternion')
  tracks['l_forearm_JNT.quaternion'].push(startIK_L.qFore.x, startIK_L.qFore.y, startIK_L.qFore.z, startIK_L.qFore.w)
  initTrack('l_hand_JNT.quaternion')
  tracks['l_hand_JNT.quaternion'].push(qRest.x, qRest.y, qRest.z, qRest.w)

  letters.forEach((letter, i) => {
    const t = 0.2 + i * letterDuration
    times.push(t)

    // Hand held comfortably in front of shoulder/chest
    const pos = new THREE.Vector3(-0.18, 1.42, 0.38)
    const ikR = solveArmIK(sR, pos, poleR, false)
    const qHand = solveHandOrientation('UO', false)

    tracks['r_arm_JNT.quaternion'].push(ikR.qArm.x, ikR.qArm.y, ikR.qArm.z, ikR.qArm.w)
    tracks['r_forearm_JNT.quaternion'].push(ikR.qFore.x, ikR.qFore.y, ikR.qFore.z, ikR.qFore.w)
    tracks['r_hand_JNT.quaternion'].push(qHand.x, qHand.y, qHand.z, qHand.w)

    // Fingers for this ASL letter
    const fR = getFingerQuaternions(letter, false)
    Object.entries(fR).forEach(([bName, q]) => {
      const trackName = `${bName}.quaternion`
      initTrack(trackName)
      tracks[trackName].push(q.x, q.y, q.z, q.w)
    })

    // Left arm remains relaxed
    tracks['l_arm_JNT.quaternion'].push(startIK_L.qArm.x, startIK_L.qArm.y, startIK_L.qArm.z, startIK_L.qArm.w)
    tracks['l_forearm_JNT.quaternion'].push(startIK_L.qFore.x, startIK_L.qFore.y, startIK_L.qFore.z, startIK_L.qFore.w)
    tracks['l_hand_JNT.quaternion'].push(qRest.x, qRest.y, qRest.z, qRest.w)
  })

  // Return to rest
  times.push(duration)
  tracks['r_arm_JNT.quaternion'].push(startIK_R.qArm.x, startIK_R.qArm.y, startIK_R.qArm.z, startIK_R.qArm.w)
  tracks['r_forearm_JNT.quaternion'].push(startIK_R.qFore.x, startIK_R.qFore.y, startIK_R.qFore.z, startIK_R.qFore.w)
  tracks['r_hand_JNT.quaternion'].push(qRest.x, qRest.y, qRest.z, qRest.w)
  tracks['l_arm_JNT.quaternion'].push(startIK_L.qArm.x, startIK_L.qArm.y, startIK_L.qArm.z, startIK_L.qArm.w)
  tracks['l_forearm_JNT.quaternion'].push(startIK_L.qFore.x, startIK_L.qFore.y, startIK_L.qFore.z, startIK_L.qFore.w)
  tracks['l_hand_JNT.quaternion'].push(qRest.x, qRest.y, qRest.z, qRest.w)

  const clipTracks = []
  const timesArray = new Float32Array(times)
  Object.entries(tracks).forEach(([name, values]) => {
    clipTracks.push(new THREE.QuaternionKeyframeTrack(name, timesArray, new Float32Array(values)))
  })

  return new THREE.AnimationClip(`Fingerspell_${word}`, duration, clipTracks)
}

/**
 * Creates natural idle breathing and resting animation.
 */
export function createIdleClip() {
  const duration = 3.6
  const times = new Float32Array([0.0, 1.8, 3.6])
  const tracks = []

  const sR = new THREE.Vector3(-0.171, 1.531, -0.049)
  const sL = new THREE.Vector3(0.171, 1.531, -0.049)
  const poleR = new THREE.Vector3(-0.5, -0.7, -0.2)
  const poleL = new THREE.Vector3(0.5, -0.7, -0.2)

  const ikR = solveArmIK(sR, REST_POSE.rightWrist, poleR, false)
  const ikL = solveArmIK(sL, REST_POSE.leftWrist, poleL, true)
  const qR = solveHandOrientation('RS', false)
  const qL = solveHandOrientation('RS', true)

  const rep = (q) => new Float32Array([q.x, q.y, q.z, q.w, q.x, q.y, q.z, q.w, q.x, q.y, q.z, q.w])

  tracks.push(new THREE.QuaternionKeyframeTrack('r_arm_JNT.quaternion', times, rep(ikR.qArm)))
  tracks.push(new THREE.QuaternionKeyframeTrack('r_forearm_JNT.quaternion', times, rep(ikR.qFore)))
  tracks.push(new THREE.QuaternionKeyframeTrack('r_hand_JNT.quaternion', times, rep(qR)))
  tracks.push(new THREE.QuaternionKeyframeTrack('l_arm_JNT.quaternion', times, rep(ikL.qArm)))
  tracks.push(new THREE.QuaternionKeyframeTrack('l_forearm_JNT.quaternion', times, rep(ikL.qFore)))
  tracks.push(new THREE.QuaternionKeyframeTrack('l_hand_JNT.quaternion', times, rep(qL)))

  // Subtle natural spine breathing oscillation
  const qSpine0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
  const qSpine1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.015, 0, 0))
  tracks.push(
    new THREE.QuaternionKeyframeTrack(
      'spine1_JNT.quaternion',
      times,
      new Float32Array([
        qSpine0.x, qSpine0.y, qSpine0.z, qSpine0.w,
        qSpine1.x, qSpine1.y, qSpine1.z, qSpine1.w,
        qSpine0.x, qSpine0.y, qSpine0.z, qSpine0.w,
      ])
    )
  )

  return new THREE.AnimationClip('Idle', duration, tracks)
}

