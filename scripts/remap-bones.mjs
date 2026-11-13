import { readFileSync, writeFileSync } from 'fs'

const file = 'd:/RP/SignBridge/src/services/signAnimation.service.js'
let c = readFileSync(file, 'utf8')

const map = [
  ["'RightArm.quaternion'",     "'r_arm_JNT.quaternion'"],
  ["'RightForeArm.quaternion'", "'r_forearm_JNT.quaternion'"],
  ["'RightHand.quaternion'",    "'r_hand_JNT.quaternion'"],
  ["'LeftArm.quaternion'",      "'l_arm_JNT.quaternion'"],
  ["'LeftForeArm.quaternion'",  "'l_forearm_JNT.quaternion'"],
  ["'LeftHand.quaternion'",     "'l_hand_JNT.quaternion'"],
  ["'Spine1.quaternion'",       "'spine1_JNT.quaternion'"],
  ["'Head.quaternion'",         "'head_JNT.quaternion'"],
]

for (const [from, to] of map) {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const count = (c.match(new RegExp(escaped, 'g')) || []).length
  c = c.replaceAll(from, to)
  console.log(`${from} -> ${to}  (${count} replacements)`)
}

writeFileSync(file, c)
console.log('Done.')
