import {
  Activity,
  ArrowRight,
  Camera,
  Hand,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react'

export default function Dashboard({ setActive }) {
  return (
    <>
      <div className="page-intro welcome">
        <div>
          <span className="eyebrow">SIGNBRIDGE — LOCAL INFERENCE · NO API KEY</span>
          <h2>Your voice matters.<br /><em>Let&apos;s make it heard.</em></h2>
          <p>Welcome to SignBridge. All processing happens in your browser.</p>
        </div>
        <div className="welcome-badge">
          <div className="badge-icon"><ShieldCheck size={22} /></div>
          <div>
            <strong>Private by design</strong>
            <span>Your conversations stay yours</span>
          </div>
        </div>
      </div>

      <div className="feature-grid">
        <button className="feature-card primary-feature" onClick={() => setActive('sign')}>
          <div className="feature-top">
            <div className="feature-icon"><Hand size={24} /></div>
            <span className="feature-arrow"><ArrowRight size={19} /></span>
          </div>
          <span className="eyebrow">PRIMARY FEATURE</span>
          <h3>Sign to Text</h3>
          <p>Translate your ASL hand gestures into readable text and spoken communication using the on-device ONNX model.</p>
          <span className="feature-cta">Start communicating <ArrowRight size={15} /></span>
        </button>
        <button className="feature-card" onClick={() => setActive('speech')}>
          <div className="feature-top">
            <div className="feature-icon mint"><Volume2 size={24} /></div>
            <span className="feature-arrow"><ArrowRight size={19} /></span>
          </div>
          <span className="eyebrow">SIMPLE &amp; CLEAR</span>
          <h3>Text to Speech</h3>
          <p>Type a message and let SignBridge speak for you, whenever you need it. Uses browser speech synthesis.</p>
          <span className="feature-cta">Start typing <ArrowRight size={15} /></span>
        </button>
      </div>

      <div className="feature-grid" style={{ marginTop: 0 }}>
        <button className="feature-card" onClick={() => setActive('training')}>
          <div className="feature-top">
            <div className="feature-icon mint"><Sparkles size={24} /></div>
            <span className="feature-arrow"><ArrowRight size={19} /></span>
          </div>
          <span className="eyebrow">PERSONALIZE</span>
          <h3>Gesture Training</h3>
          <p>Teach custom gestures that speak full sentences. Saved locally in your browser — no account needed.</p>
          <span className="feature-cta">Train gestures <ArrowRight size={15} /></span>
        </button>
        <button className="feature-card" onClick={() => setActive('avatar')}>
          <div className="feature-top">
            <div className="feature-icon mint"><MessageSquareText size={24} /></div>
            <span className="feature-arrow"><ArrowRight size={19} /></span>
          </div>
          <span className="eyebrow">3D AVATAR</span>
          <h3>Speech to Sign</h3>
          <p>Speak or type a sentence and watch the 3D avatar sign it in ASL using hand-authored keyframe animations.</p>
          <span className="feature-cta">Open avatar <ArrowRight size={15} /></span>
        </button>
      </div>

      <div className="dashboard-row">
        <section className="card steps-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">HOW IT WORKS</span>
              <h2>From gesture to voice</h2>
            </div>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-number">01</span>
              <div className="step-icon"><Camera size={19} /></div>
              <strong>Capture gesture</strong>
              <p>Position your hands in front of the camera.</p>
            </div>
            <div className="step-line" />
            <div className="step">
              <span className="step-number">02</span>
              <div className="step-icon"><Activity size={19} /></div>
              <strong>Recognize sign</strong>
              <p>MediaPipe landmarks + ONNX model classify the sign.</p>
            </div>
            <div className="step-line" />
            <div className="step">
              <span className="step-number">03</span>
              <div className="step-icon"><MessageSquareText size={19} /></div>
              <strong>Generate text</strong>
              <p>Review and share your message.</p>
            </div>
          </div>
        </section>
        <section className="card activity-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">SYSTEM INFO</span>
              <h2>About the model</h2>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 10px' }}>
              The ONNX classifier recognizes ~250 isolated ASL signs. Landmarks are extracted by MediaPipe (Face + Hand + Pose) and fed as a sliding 48-frame window into the model.
            </p>
            <p style={{ margin: 0, color: '#8a9aa7' }}>
              Sentence assembly uses rule-based logic. Ollama (optional) can improve fluency. All inference runs locally in your browser — no data is sent to any server.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
