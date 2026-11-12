/**
 * Avatar Service
 * Three.js 3D signing avatar — all sign lexicon, hand shapes, orientations,
 * keyframe builder and animation loop preserved verbatim from original.
 *
 * THREE is loaded as a global via /public/assets/three.min.js (included in index.html).
 */

// We reference THREE via window.THREE at runtime since it's a global script.
function T() {
  return window.THREE
}

// ---- Hand shape codes (from original SH) ----

const SH = {
  A:'099990',B:'700000',C:'444440',D:'506660',E:'888880',F:'560001',
  G:'309990',H:'300990',I:'799900',J:'799900',K:'300991',L:'009990',
  M:'899990',N:'899990',O:'666660',P:'300991',Q:'309990',R:'700990',
  S:'899990',T:'899990',U:'700990',V:'700991',W:'700091',X:'749990',
  Y:'099900',Z:'709990',P1:'709990',HN:'300990',C5:'444441',F5:'000001',
  RL:'333330',ILY:'009900',
}

// ---- Orientation presets ----

const OR = {
  UO:[[0,1,0],[0,0,1]],US:[[0,1,0],[0,0,-1]],UI:[[0,1,0],[1,0,0]],
  UX:[[0,1,0],[-1,0,0]],FD:[[0,0,1],[0,-1,0]],FU:[[0,0,1],[0,1,0]],
  FI:[[0,0,1],[1,0,0]],TS:[[0,0,-1],[1,0,0]],RS:[[0,-1,.1],[1,0,0]],
  OX:[[-1,0,0],[0,-1,0]],
}

// ---- Sign lexicon (from original SG) ----

const SG = {
  HELLO:{k:['B|.12,1.74,.2|UX','B|.4,1.7,.4|UX']},
  THANKYOU:{k:['B|.03,1.5,.26|US','B|.12,1.38,.5|FU']},
  PLEASE:{k:['B|.1,1.34,.2|US','B|0,1.26,.2|US','B|.1,1.2,.2|US','B|.2,1.28,.2|US']},
  SORRY:{k:['S|.1,1.34,.2|US','S|0,1.26,.2|US','S|.1,1.2,.2|US','S|.2,1.28,.2|US']},
  YES:{k:['S|.2,1.4,.4|UO','S|.2,1.35,.45|FD','S|.2,1.4,.4|UO','S|.2,1.35,.45|FD']},
  NO:{k:['HN|.2,1.4,.45|FI','H|.2,1.4,.45|FI','HN|.2,1.4,.45|FI','H|.2,1.4,.45|FI']},
  ME:{k:['P1|.12,1.4,.4|TS','P1|.1,1.36,.28|TS']},
  YOU:{k:['P1|.2,1.36,.35|FI','P1|.2,1.36,.55|FI']},
  MY:{k:['B|.1,1.32,.22|US']},
  WANT:{b:1,k:['C5|.22,1.3,.55|FU','C5|.16,1.3,.3|FU']},
  NEED:{k:['X|.2,1.45,.45|UO','X|.2,1.28,.45|UO']},
  HELP:{k:['A|.05,1.3,.42|UI','A|.05,1.46,.42|UI'],l:['B|.05,1.2,.42|FU','B|.05,1.2,.42|FU']},
  WATER:{k:['W|.04,1.52,.26|UO','W|.04,1.46,.3|UO','W|.04,1.52,.26|UO','W|.04,1.46,.3|UO']},
  EAT:{k:['O|.08,1.5,.3|UI','O|.04,1.58,.25|UI','O|.08,1.5,.3|UI','O|.04,1.58,.25|UI']},
  DRINK:{k:['C|.14,1.42,.38|UI','C|.06,1.56,.3|US']},
  GO:{b:1,k:['P1|.15,1.3,.3|FD','P1|.15,1.3,.62|FD']},
  COME:{b:1,k:['P1|.15,1.3,.62|FU','P1|.12,1.3,.3|FU']},
  GOOD:{k:['B|.03,1.5,.26|US','B|.1,1.3,.4|FU'],l:['B|.1,1.26,.42|FU','B|.1,1.26,.42|FU']},
  BAD:{k:['B|.03,1.5,.26|US','B|.15,1.28,.42|FD']},
  LOVE:{b:1,k:['S|-.08,1.32,.25|US','S|-.08,1.32,.25|US']},
  HOME:{k:['O|.06,1.5,.28|UI','O|.14,1.62,.2|UI']},
  NAME:{k:['H|.05,1.42,.45|FD','H|.05,1.36,.45|FD'],l:['H|.05,1.3,.45|FI','H|.05,1.3,.45|FI']},
  WHAT:{b:1,k:['F5|.2,1.3,.4|FU','F5|.3,1.3,.4|FU','F5|.2,1.3,.4|FU']},
  WHERE:{k:['P1|.2,1.5,.45|UO','P1|.32,1.5,.45|UO','P1|.2,1.5,.45|UO','P1|.32,1.5,.45|UO']},
  HOW:{b:1,k:['S|.06,1.3,.42|US','S|.1,1.4,.5|FU']},
  UNDERSTAND:{k:['S|.12,1.66,.22|UO','P1|.12,1.68,.22|UO']},
  KNOW:{k:['B|.1,1.66,.22|UI','B|.12,1.7,.24|UI']},
  PAIN:{b:1,k:['P1|.12,1.34,.4|UI','P1|.06,1.4,.4|UI']},
  MORNING:{k:['B|.15,1.2,.42|FU','B|.15,1.42,.42|FU'],l:['B|.1,1.3,.42|FI','B|.1,1.3,.42|FI']},
  NIGHT:{k:['C|.1,1.46,.4|FD','C|.1,1.35,.38|FD'],l:['B|.1,1.3,.4|FD','B|.1,1.3,.4|FD']},
  NOW:{b:1,k:['Y|.15,1.35,.4|FU','Y|.15,1.25,.4|FU']},
  TOMORROW:{k:['A|.08,1.68,.22|UI','A|.12,1.62,.4|UI']},
  YESTERDAY:{k:['A|.06,1.65,.24|UI','A|.12,1.7,.12|UI']},
  WAIT:{b:1,k:['F5|.15,1.3,.4|FU','F5|.2,1.3,.45|FU','F5|.15,1.3,.4|FU']},
  STOP:{k:['B|.05,1.45,.42|UI','B|.05,1.3,.42|UI'],l:['B|.05,1.25,.42|FU','B|.05,1.25,.42|FU']},
  WORK:{k:['S|.05,1.34,.42|FD','S|.05,1.3,.42|FD','S|.05,1.34,.42|FD','S|.05,1.3,.42|FD'],l:['S|.05,1.25,.42|FD','S|.05,1.25,.42|FD','S|.05,1.25,.42|FD','S|.05,1.25,.42|FD']},
  SCHOOL:{k:['B|.05,1.4,.42|FD','B|.05,1.3,.42|FD','B|.05,1.4,.42|FD','B|.05,1.3,.42|FD'],l:['B|.05,1.27,.42|FU','B|.05,1.27,.42|FU','B|.05,1.27,.42|FU','B|.05,1.27,.42|FU']},
  FRIEND:{b:1,k:['X|.04,1.3,.42|FI','X|.04,1.26,.42|FI']},
  FAMILY:{b:1,k:['F|.1,1.3,.42|UO','F|.25,1.3,.42|US']},
  MOTHER:{k:['F5|.04,1.5,.26|UO','F5|.04,1.48,.27|UO','F5|.04,1.5,.26|UO']},
  FATHER:{k:['F5|.08,1.78,.22|UO','F5|.08,1.76,.23|UO','F5|.08,1.78,.22|UO']},
  SLEEP:{k:['F5|.05,1.62,.26|US','O|.05,1.5,.26|US']},
  TIRED:{b:1,k:['C5|.15,1.38,.25|US','C5|.2,1.27,.25|US']},
  SICK:{k:['H|.06,1.76,.22|UO','H|.1,1.2,.25|UO']},
  DOCTOR:{k:['H|.06,1.3,.42|FD','H|.06,1.25,.42|FD','H|.06,1.3,.42|FD'],l:['B|.06,1.2,.42|FU','B|.06,1.2,.42|FU','B|.06,1.2,.42|FU']},
  FINE:{k:['F5|.12,1.36,.22|UO','F5|.1,1.32,.22|UO']},
  HAPPY:{b:1,k:['B|.15,1.2,.22|US','B|.15,1.38,.22|US','B|.15,1.2,.22|US','B|.15,1.38,.22|US']},
  SAD:{b:1,k:['B|.12,1.72,.35|US','B|.12,1.45,.35|US']},
  ANGRY:{b:1,k:['C5|.1,1.65,.35|US','C5|.14,1.58,.28|US']},
  LIKE:{k:['F|.1,1.32,.25|UI','F|.15,1.32,.4|UI']},
  HAVE:{b:1,k:['C5|.15,1.3,.4|FD','C5|.08,1.3,.25|FD']},
  GIVE:{k:['O|.15,1.3,.3|FD','O|.18,1.3,.55|FD']},
  SEE:{k:['V|.04,1.74,.22|UI','V|.1,1.72,.45|FI']},
  HEAR:{k:['P1|.14,1.72,.15|UO','P1|.14,1.72,.15|UO']},
  TALK:{k:['B|.05,1.58,.25|UO','B|.1,1.56,.4|UO','B|.05,1.58,.25|UO']},
  THINK:{k:['P1|.1,1.82,.2|UO','P1|.14,1.86,.22|UO']},
  READ:{k:['V|.05,1.4,.42|FD','V|.05,1.3,.42|FD'],l:['B|.05,1.25,.42|FI','B|.05,1.25,.42|FI']},
  BATHROOM:{k:['T|.2,1.4,.42|UO','T|.26,1.4,.42|UO','T|.2,1.4,.42|UO','T|.26,1.4,.42|UO']},
  WELCOME:{k:['B|.3,1.3,.5|FU','B|.05,1.3,.25|FU']},
  BYE:{k:['B|.25,1.6,.4|UO','B|.32,1.6,.4|UO','B|.25,1.6,.4|UO','B|.32,1.6,.4|UO']},
  MEET:{b:1,k:['P1|.3,1.3,.4|UI','P1|.05,1.3,.4|UI']},
  NICE:{k:['B|.05,1.3,.42|FU','B|.12,1.3,.5|FU'],l:['B|.05,1.25,.42|FU','B|.05,1.25,.42|FU']},
  MORE:{b:1,k:['O|.15,1.3,.4|FU','O|.06,1.3,.42|FU','O|.15,1.3,.4|FU','O|.06,1.3,.42|FU']},
  FINISH:{b:1,k:['F5|.2,1.3,.4|FU','F5|.2,1.3,.4|FD']},
  COLD:{b:1,k:['S|.1,1.3,.35|UI','S|.14,1.3,.35|UI','S|.1,1.3,.35|UI']},
  MILK:{k:['C|.2,1.35,.4|UI','S|.2,1.35,.4|UI','C|.2,1.35,.4|UI','S|.2,1.35,.4|UI']},
  MONEY:{k:['O|.06,1.34,.42|FU','O|.06,1.3,.42|FU','O|.06,1.34,.42|FU'],l:['B|.06,1.25,.42|FU','B|.06,1.25,.42|FU','B|.06,1.25,.42|FU']},
  CAR:{b:1,k:['S|.15,1.3,.42|UI','S|.17,1.36,.42|UI','S|.15,1.3,.42|UI']},
  PHONE:{k:['Y|.12,1.64,.2|UI','Y|.12,1.64,.2|UI']},
  BOOK:{b:1,k:['B|.05,1.3,.42|UI','B|.1,1.3,.42|UX']},
  WE:{k:['P1|.25,1.45,.28|FI','P1|-.05,1.45,.28|FI']},
  HE:{k:['P1|.3,1.35,.4|OX','P1|.34,1.35,.4|OX']},
  WHO:{k:['P1|.05,1.55,.26|UO','P1|.08,1.52,.28|UO','P1|.05,1.55,.26|UO']},
  WHY:{k:['B|.1,1.75,.2|UI','Y|.2,1.6,.3|UO']},
  ILY:{k:['ILY|.2,1.5,.42|UO','ILY|.2,1.5,.45|UO']},
  OKAY:{k:['F|.2,1.45,.42|UO','F|.2,1.45,.42|UO']},
  MAYBE:{k:['B|.15,1.3,.42|FU','B|.15,1.4,.42|FU'],l:['B|.15,1.4,.42|FU','B|.15,1.3,.42|FU']},
  HUNGRY:{k:['C|.1,1.45,.28|US','C|.1,1.28,.28|US']},
  THIRSTY:{k:['P1|.04,1.55,.26|UO','P1|.04,1.45,.26|UO']},
}

// ---- English → Gloss mapping (from original) ----

const MAP = {
  hello:'HELLO',hi:'HELLO',hey:'HELLO',thanks:'THANKYOU',thank:'THANKYOU',
  please:'PLEASE',sorry:'SORRY',yes:'YES',yeah:'YES',ok:'YES',okay:'OKAY',
  no:'NO',not:'NO',dont:'NO',cant:'NO',i:'ME',me:'ME',im:'ME',my:'MY',
  mine:'MY',you:'YOU',your:'YOU',youre:'YOU',want:'WANT',wants:'WANT',
  need:'NEED',needs:'NEED',help:'HELP',water:'WATER',eat:'EAT',food:'EAT',
  hungry:'HUNGRY',drink:'DRINK',go:'GO',going:'GO',come:'COME',good:'GOOD',
  fine:'GOOD',well:'GOOD',great:'GOOD',bad:'BAD',love:'LOVE',home:'HOME',
  house:'HOME',name:'NAME',what:'WHAT',where:'WHERE',how:'HOW',
  understand:'UNDERSTAND',know:'KNOW',pain:'PAIN',hurt:'PAIN',hurts:'PAIN',
  morning:'MORNING',night:'NIGHT',tonight:'NIGHT',now:'NOW',today:'NOW',
  tomorrow:'TOMORROW',yesterday:'YESTERDAY',wait:'WAIT',stop:'STOP',
  work:'WORK',job:'WORK',school:'SCHOOL',class:'SCHOOL',friend:'FRIEND',
  friends:'FRIEND',family:'FAMILY',mother:'MOTHER',mom:'MOTHER',mum:'MOTHER',
  father:'FATHER',dad:'FATHER',sleep:'SLEEP',tired:'TIRED',sleepy:'TIRED',
  sick:'SICK',ill:'SICK',doctor:'DOCTOR',nurse:'DOCTOR',happy:'HAPPY',
  glad:'HAPPY',sad:'SAD',angry:'ANGRY',mad:'ANGRY',like:'LIKE',likes:'LIKE',
  have:'HAVE',has:'HAVE',give:'GIVE',see:'SEE',look:'SEE',hear:'HEAR',
  talk:'TALK',speak:'TALK',say:'TALK',think:'THINK',read:'READ',
  bathroom:'BATHROOM',toilet:'BATHROOM',restroom:'BATHROOM',welcome:'WELCOME',
  bye:'BYE',goodbye:'BYE',meet:'MEET',nice:'NICE',more:'MORE',again:'MORE',
  finish:'FINISH',finished:'FINISH',done:'FINISH',cold:'COLD',milk:'MILK',
  money:'MONEY',car:'CAR',phone:'PHONE',call:'PHONE',book:'BOOK',we:'WE',
  us:'WE',he:'HE',she:'HE',they:'HE',it:'HE',who:'WHO',why:'WHY',
  maybe:'MAYBE',thirsty:'THIRSTY',
}

const PH = [
  [/\bi love you\b/g,' ILY '],
  [/\bthank you( very much| so much)?\b/g,' THANKYOU '],
  [/\bgood morning\b/g,' GOOD MORNING '],
  [/\bgood night\b/g,' GOOD NIGHT '],
  [/\bgood bye\b/g,' BYE '],
  [/\bsee you tomorrow\b/g,' SEE YOU TOMORROW '],
  [/\bsee you (later|soon)\b/g,' SEE YOU BYE '],
  [/\bnice to meet you\b/g,' NICE MEET YOU '],
  [/\bhow are you\b/g,' HOW YOU '],
  [/\bwhat is your name\b|\bwhats your name\b/g,' YOU NAME WHAT '],
  [/\bwhere is the (bathroom|toilet|restroom)\b/g,' BATHROOM WHERE '],
  [/\bi do not know\b|\bi dont know\b/g,' ME NO KNOW '],
  [/\bi do not understand\b|\bi dont understand\b/g,' ME NO UNDERSTAND '],
  [/\bexcuse me\b/g,' SORRY '],
  [/\byou are welcome\b|\byoure welcome\b/g,' WELCOME '],
  [/\bi am fine\b|\bim fine\b/g,' ME FINE '],
  [/\bi am hungry\b|\bim hungry\b/g,' ME HUNGRY '],
  [/\bi am thirsty\b|\bim thirsty\b/g,' ME THIRSTY '],
]

const DROP = new Set(
  'a an the is am are be to of do does at on in was were been will would just so very really and with for from into this that there here'.split(' ')
)

export function toGloss(txt) {
  let x = txt.toLowerCase().replace(/['']/g, '').replace(/[^a-z ]/g, ' ')
  PH.forEach((p) => { x = x.replace(p[0], p[1]) })
  const out = []
  for (const w of x.split(/\s+/).filter(Boolean)) {
    if (SG[w]) { out.push(w); continue }
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

// ---- Helper to build a HandState from a keyframe code string ----

function mkHandState(code, side) {
  const THREE = T()
  const sgn = [-1, 1]
  const [sh, loc, o] = code.split('|')
  const [x, y, z] = loc.split(',').map(Number)
  const s = SH[sh]
  const c = [...s].map(Number).map((d, i) => (i < 5 ? d / 9 : d ? 1 : 0))

  const odata = OR[o]
  let f = new THREE.Vector3(...odata[0])
  let n = new THREE.Vector3(...odata[1])

  if (side) { f.x *= -1; n.x *= -1 }

  const Y = f.normalize()
  const Z = n.sub(Y.clone().multiplyScalar(n.dot(Y))).normalize()
  const X = Y.clone().cross(Z)

  return {
    p: new THREE.Vector3(sgn[side] * x, y, z),
    q: new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(X, Y, Z)
    ),
    c,
  }
}

// ---- Hand mesh builder ----

function mkFinger(g, x, y, lens, r) {
  const THREE = T()
  const skin = new THREE.MeshStandardMaterial({ color: 0xdba37f, roughness: 0.55 })
  const b = new THREE.Group()
  b.position.set(x, y, 0)
  g.add(b)
  let p = b
  const j = []
  for (const l of lens) {
    const jt = new THREE.Group()
    p.add(jt)
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, l, 8), skin)
    m.position.y = l / 2
    jt.add(m)
    const nx = new THREE.Group()
    nx.position.y = l
    jt.add(nx)
    j.push(jt)
    p = nx
  }
  return { b, j }
}

function mkHand(sc, m) {
  const THREE = T()
  const skin = new THREE.MeshStandardMaterial({ color: 0xdba37f, roughness: 0.55 })
  const cl = new THREE.MeshStandardMaterial({ color: 0x2a6df4, roughness: 0.55 })
  const g = new THREE.Group()
  sc.add(g)
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.1, 0.026), skin)
  palm.position.set(0, 0.05, 0)
  g.add(palm)

  const f = [0, 1, 2, 3].map((i) => {
    const k = [1, 1.08, 0.98, 0.8][i]
    return mkFinger(g, m * (0.03 - i * 0.02), 0.1, [0.04 * k, 0.03 * k, 0.025 * k], 0.0105)
  })

  const up = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045 * 0.85, 1, 12), cl)
  sc.add(up)
  const fo = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038 * 0.85, 1, 12), cl)
  sc.add(fo)

  return { g, m, f, th: mkFinger(g, 0.05 * m, 0.02, [0.035, 0.03], 0.011), up, fo }
}

function setShape(h, c) {
  for (let i = 0; i < 4; i++) {
    const f = h.f[i]
    const k = c[i + 1]
    f.j[0].rotation.x = k * 1.5
    f.j[1].rotation.x = k * 1.7
    f.j[2].rotation.x = k * 1.1
    f.b.rotation.z = -h.m * c[5] * (1.5 - i) * 0.12
  }
  const t = c[0]
  h.th.b.rotation.set(t * 0.9, 0, h.m * (-0.7 + t * 0.5))
  h.th.j[0].rotation.x = t * 0.3
  h.th.j[1].rotation.x = t * 0.7
}

function place(m, a, b) {
  const THREE = T()
  const UP = new THREE.Vector3(0, 1, 0)
  const d = b.clone().sub(a)
  const L = d.length()
  m.position.copy(a).addScaledVector(d, 0.5)
  m.scale.set(1, Math.max(L, 0.001), 1)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
}

function applyHand(H, side, s) {
  const THREE = T()
  const sgn = [-1, 1]
  const UP = new THREE.Vector3(0, 1, 0)
  const h = H[side]
  const y = UP.clone().applyQuaternion(s.q)
  const w0 = s.p.clone().addScaledVector(y, -0.06)
  const sh = new THREE.Vector3(sgn[side] * 0.3, 1.45, 0)
  const d = w0.clone().sub(sh)
  const L = Math.min(Math.max(d.length(), 0.08), 0.57)
  const u = d.normalize()
  const a = (0.09 - 0.0784 + L * L) / (2 * L)
  const hh = Math.sqrt(Math.max(0.09 - a * a, 0))
  const pole = new THREE.Vector3(sgn[side] * 0.5, -1, -0.25)
  const pp = pole.sub(u.clone().multiplyScalar(pole.dot(u))).normalize()
  const el = sh.clone().addScaledVector(u, a).addScaledVector(pp, hh)
  const w = sh.clone().addScaledVector(u, L)

  h.g.position.copy(w)
  h.g.quaternion.copy(s.q)
  setShape(h, s.c)
  place(h.up, sh, el)
  place(h.fo, el, w)
}

// ---- Keyframe builder (original build()) ----

function buildTimeline(gl, sp, avatarScene) {
  const R0 = avatarScene.R0
  const L0 = avatarScene.L0
  const kf = [{ t: 0, h: [R0, L0] }]
  let t = 0

  const push = (h, d, gi) => {
    t += d / sp
    kf.push({ t, h, g: gi })
  }

  gl.forEach((w, gi) => {
    let codes
    let l
    let b

    if (w[0] === '#') {
      codes = [...w.slice(1).toUpperCase()]
        .filter((c) => /[A-Z]/.test(c))
        .map((c, i) => `${c}|${i % 2 ? '.13' : '.1'},1.42,.42|UO`)
    } else {
      const sg = SG[w]
      codes = sg.k
      l = sg.l
      b = sg.b
    }

    codes.forEach((c, i) => {
      push(
        [
          mkHandState(c, 0),
          b ? mkHandState(c, 1) : l ? mkHandState(l[i], 1) : L0,
        ],
        i ? 0.38 : 0.5,
        gi
      )
    })

    push(kf[kf.length - 1].h, 0.22, gi)
  })

  push([R0, L0], 0.6, -1)
  return kf
}

const lerp = (a, b, e) => a + (b - a) * e

// ---- Scene-level state (initialized once per mount) ----

let avatarScene = null

// ---- Public API ----

export function initAvatar(canvas) {
  if (avatarScene) return // already initialized

  const THREE = T()
  if (!THREE) throw new Error('THREE.js not loaded')

  const rnd = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  const sc = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50)
  cam.position.set(0, 1.5, 3.2)
  cam.lookAt(0, 1.42, 0)
  rnd.setPixelRatio(Math.min(devicePixelRatio, 2))

  sc.add(new THREE.HemisphereLight(0xffffff, 0x778899, 1))
  const dl = new THREE.DirectionalLight(0xffffff, 0.7)
  dl.position.set(1, 3, 3)
  sc.add(dl)

  const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })
  const skin = M(0xdba37f)
  const cl = M(0x2a6df4)
  const dk = M(0x222222)

  const add = (g, m, x, y, z, p = sc) => {
    const o = new THREE.Mesh(g, m)
    o.position.set(x, y, z)
    p.add(o)
    return o
  }

  add(new THREE.BoxGeometry(0.62, 0.8, 0.28), cl, 0, 1.12, 0)
  add(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 16), skin, 0, 1.6, 0)
  add(new THREE.SphereGeometry(0.06, 16, 12), cl, -0.3, 1.46, 0)
  add(new THREE.SphereGeometry(0.06, 16, 12), cl, 0.3, 1.46, 0)

  const head = new THREE.Group()
  head.position.set(0, 1.76, 0)
  sc.add(head)
  add(new THREE.SphereGeometry(0.16, 32, 24), skin, 0, 0, 0, head)
  add(new THREE.SphereGeometry(0.165, 24, 16, 0, 6.28, 0, 1.5), dk, 0, 0.01, -0.01, head)
  add(new THREE.SphereGeometry(0.018, 12, 8), dk, -0.055, 0.03, 0.15, head)
  add(new THREE.SphereGeometry(0.018, 12, 8), dk, 0.055, 0.03, 0.15, head)
  const mouth = add(new THREE.BoxGeometry(0.06, 0.012, 0.01), dk, 0, -0.07, 0.155, head)

  const H = [mkHand(sc, 1), mkHand(sc, -1)]

  const R0 = mkHandState('RL|.3,1.02,.1|RS', 0)
  const L0 = mkHandState('RL|.3,1.02,.1|RS', 1)

  applyHand(H, 0, R0)
  applyHand(H, 1, L0)

  avatarScene = {
    renderer: rnd, scene: sc, camera: cam, H, mouth, head,
    R0, L0, playing: false, kf: [], gl: [], t0: 0, cur: -3, animId: 0,
  }

  function frame(now) {
    avatarScene.animId = requestAnimationFrame(frame)

    const s = avatarScene
    const stage = canvas.parentElement
    if (!stage || !stage.clientWidth) return

    let t = 0
    if (s.playing) {
      t = (now - s.t0) / 1000
      const last = s.kf[s.kf.length - 1]
      if (t >= last.t) {
        s.playing = false
        t = last.t
        s.mouth.scale.y = 1
        s.cur = -3
      }

      let i = 0
      while (i < s.kf.length - 2 && s.kf[i + 1].t < t) i++
      const A = s.kf[i]
      const B = s.kf[i + 1]
      const u = Math.min(1, Math.max(0, (t - A.t) / (B.t - A.t)))
      const e = u * u * (3 - 2 * u) // smoothstep

      for (let side = 0; side < 2; side++) {
        const HA = A.h[side]
        const HB = B.h[side]
        applyHand(H, side, {
          p: HA.p.clone().lerp(HB.p, e),
          q: HA.q.clone().slerp(HB.q, e),
          c: HA.c.map((v, j) => lerp(v, HB.c[j], e)),
        })
      }

      if (s.playing) {
        s.mouth.scale.y = 1 + 0.8 * Math.abs(Math.sin(t * 9))
        s.head.rotation.x = 0.03 * Math.sin(t * 3)
      }
    } else if (s.cur === -2) {
      applyHand(H, 0, s.R0)
      applyHand(H, 1, s.L0)
      s.cur = -3
    }

    const w = stage.clientWidth
    const h = stage.clientHeight
    if (
      s.renderer.domElement.width !== Math.floor(w * s.renderer.getPixelRatio()) ||
      s.renderer.domElement.height !== Math.floor(h * s.renderer.getPixelRatio())
    ) {
      s.renderer.setSize(w, h, false)
      s.camera.aspect = w / h
      s.camera.updateProjectionMatrix()
    }

    s.renderer.render(s.scene, s.camera)
  }

  avatarScene.animId = requestAnimationFrame(frame)
}

export function signText(text, speed = 1) {
  if (!avatarScene) return []
  const gl = toGloss(text)
  avatarScene.gl = gl
  avatarScene.kf = buildTimeline(gl, speed, avatarScene)
  avatarScene.t0 = performance.now()
  avatarScene.playing = true
  avatarScene.cur = -2
  return gl
}

export function destroyAvatar() {
  if (!avatarScene) return
  cancelAnimationFrame(avatarScene.animId)
  avatarScene.renderer.dispose()
  avatarScene = null
}

export function isAvatarReady() {
  return !!avatarScene
}

