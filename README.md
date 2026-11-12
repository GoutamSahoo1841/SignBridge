# SignBridge

A unified React + Vite application for real-time ASL sign language recognition and communication.

All ML inference runs entirely in the browser using **MediaPipe** and **ONNX Runtime Web** — no data leaves your device.

## Features

- **Sign → Text** — Real-time ASL recognition via webcam using a 543-landmark MediaPipe pipeline and an ONNX model
- **Text → Speech** — Natural browser text-to-speech with voice selection
- **Custom Gesture Training** — Record your own gesture-to-phrase mappings using DTW classification
- **3D Signing Avatar** — Three.js avatar that signs any text in ASL
- **History** — Persistent session history with search and filter
- **Settings** — Camera mirror, speech rate, voice, accessibility options

## Project Structure

```
SignBridge/
├── public/
│   ├── models/
│   │   ├── asl-signs.onnx              # ONNX sign recognition model
│   │   └── sign_to_prediction_index_map.json
│   └── assets/
│       └── three.min.js                # Three.js for 3D avatar
├── src/
│   ├── components/
│   │   ├── common/       Button, Card, Alert, Toggle, StatusPill
│   │   ├── layout/       MainLayout, Sidebar, Header
│   │   ├── camera/       CameraPreview, DetectionStatus
│   │   ├── recognition/  CurrentSign, SignSequence, GeneratedMessage
│   │   └── avatar/       AvatarCanvas
│   ├── pages/            Home, Dashboard, SignToText, TextToSpeech,
│   │                     GestureTraining, History, Settings
│   ├── services/         8 JS service modules (MediaPipe, ONNX, Camera,
│   │                     SignRecognition, SentenceBuilder, Speech,
│   │                     GestureTraining, Avatar)
│   ├── hooks/            useSignRecognition, useGestureTraining, useSpeech
│   ├── context/          AppContext (history + settings)
│   ├── routes/           AppRoutes (React Router v6)
│   └── utils/            storage.js, format.js
└── index.html            Loads ORT, Three.js, MediaPipe as globals
```

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build & Deploy

```bash
npm run build      # outputs to dist/
npm run preview    # preview production build locally
```

**Vercel deployment:** The `vite.config.js` sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` headers required for `SharedArrayBuffer` (used by ONNX Runtime WASM). Add these headers in your Vercel project settings or `vercel.json`.

### vercel.json example

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "credentialless" }
      ]
    }
  ]
}
```

## ML Pipeline

| Component | Detail |
|-----------|--------|
| Face landmarks | 468 points × 3 coords |
| Pose landmarks | 33 points × 3 coords |
| Hand landmarks | 21 points × 3 coords per hand |
| Total input | `[T, 543, 3]` float32 tensor |
| Window | 48 frames sliding |
| Inference interval | 350 ms |
| Stable sign threshold | ≥2 consecutive + 850 ms cooldown |

Custom gestures use Dynamic Time Warping (DTW) with a 90-dim feature vector extracted by `gFeat()` and resampled to 24 frames by `gRes()`.

## Browser Requirements

- Chrome 90+ or Edge 90+ (for `SharedArrayBuffer` + WebGL)
- Camera permission required for sign recognition and gesture training
- Internet connection required on first load (MediaPipe model downloads from CDN)

## Privacy

No video, sign data, or text is ever sent to any server. All processing — camera feed, landmark detection, ONNX inference — runs locally in the browser using WebAssembly.

