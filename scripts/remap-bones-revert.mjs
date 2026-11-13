import { readFileSync, writeFileSync } from 'fs'

const file = 'd:/RP/SignBridge/src/services/signAnimation.service.js'
let c = readFileSync(file, 'utf8')

// Reverse: _JNT names -> standard humanoid names
const map = [
  ["'r_arm_JNT.quaternion'",      "'RightArm.quaternion'"],
  ["'r_forearm_JNT.quaternion'",  "'RightForeArm.quaternion'"],
  ["'r_hand_JNT.quaternion'",     "'RightHand.quaternion'"],
  ["'l_arm_JNT.quaternion'",      "'LeftArm.quaternion'"],
  ["'l_forearm_JNT.quaternion'",  "'LeftForeArm.quaternion'"],
  ["'l_hand_JNT.quaternion'",     "'LeftHand.quaternion'"],
  ["'spine1_JNT.quaternion'",     "'Spine1.quaternion'"],
  ["'head_JNT.quaternion'",       "'Head.quaternion'"],
]

for (const [from, to] of map) {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const count = (c.match(new RegExp(escaped, 'g')) || []).length
  c = c.replaceAll(from, to)
  console.log(`${from} -> ${to}  (${count} replacements)`)
}

writeFileSync(file, c)
console.log('Done.')
