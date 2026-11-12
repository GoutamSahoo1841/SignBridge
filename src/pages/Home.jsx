import { useNavigate } from 'react-router-dom'
import { HandMetal, MessageSquare, Zap, Shield, Cpu } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <Zap size={14} /> AI-Powered Sign Language Recognition
        </div>
        <h1 className="hero-title">
          Bridge the gap between <span className="hero-accent">sign language</span> and speech
        </h1>
        <p className="hero-subtitle">
          Real-time ASL recognition using MediaPipe and ONNX Runtime — all processing happens
          locally in your browser. No data leaves your device.
        </p>
        <div className="hero-actions">
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/sign')}>
            <HandMetal size={18} /> Start Signing
          </button>
          <button className="btn btn--secondary btn--lg" onClick={() => navigate('/speech')}>
            <MessageSquare size={18} /> Text to Speech
          </button>
        </div>
      </section>

      {/* Feature cards */}
      <section className="home-features">
        <div className="feature-card" onClick={() => navigate('/sign')} role="button" tabIndex={0}>
          <div className="feature-icon feature-icon--teal">
            <HandMetal size={24} />
          </div>
          <h3>Sign → Text</h3>
          <p>Use your webcam to sign ASL and get real-time text output with confidence scores.</p>
        </div>

        <div className="feature-card" onClick={() => navigate('/speech')} role="button" tabIndex={0}>
          <div className="feature-icon feature-icon--blue">
            <MessageSquare size={24} />
          </div>
          <h3>Text → Speech</h3>
          <p>Type any message and hear it spoken clearly using natural browser text-to-speech.</p>
        </div>

        <div className="feature-card" onClick={() => navigate('/training')} role="button" tabIndex={0}>
          <div className="feature-icon feature-icon--purple">
            <Zap size={24} />
          </div>
          <h3>Custom Gestures</h3>
          <p>Record your own gestures and map them to custom phrases and sentences.</p>
        </div>
      </section>

      {/* Trust badges */}
      <section className="trust-badges">
        <div className="trust-badge">
          <Shield size={16} /> Private by design
        </div>
        <div className="trust-badge">
          <Cpu size={16} /> Runs in browser
        </div>
        <div className="trust-badge">
          <Zap size={16} /> No account needed
        </div>
      </section>
    </div>
  )
}

