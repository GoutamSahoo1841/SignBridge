import { ArrowRight, Camera, ChevronDown, ShieldCheck, Sun, Volume2 } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function SettingsPage() {
  const { settings, updateSettings } = useApp()

  const mirrorCamera = settings?.mirrorCamera ?? true
  const autoStart = settings?.autoStartCamera ?? false
  const largerText = settings?.largerText ?? false
  const reduceMotion = settings?.reduceMotion ?? false

  return (
    <>
      <div className="page-intro feature-intro">
        <div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ArrowRight size={13} /> Settings
          </div>
          <h2>Make SignBridge yours.</h2>
          <p>Adjust your experience and accessibility preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="card settings-section">
          <div className="settings-title">
            <div className="settings-icon">
              <Camera size={18} />
            </div>
            <div>
              <h3>Camera preferences</h3>
              <p>Choose how camera access works</p>
            </div>
          </div>
          <div className="setting-row">
            <div>
              <strong>Mirror camera preview</strong>
              <span>Flip the preview horizontally</span>
            </div>
            <button
              className={`toggle ${mirrorCamera ? 'on' : ''}`}
              onClick={() => updateSettings({ mirrorCamera: !mirrorCamera })}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Auto-start camera</strong>
              <span>Start when opening Sign to Text</span>
            </div>
            <button
              className={`toggle ${autoStart ? 'on' : ''}`}
              onClick={() => updateSettings({ autoStartCamera: !autoStart })}
            >
              <span />
            </button>
          </div>
        </section>

        <section className="card settings-section">
          <div className="settings-title">
            <div className="settings-icon">
              <Volume2 size={18} />
            </div>
            <div>
              <h3>Speech settings</h3>
              <p>Customize spoken communication</p>
            </div>
          </div>
          <div className="setting-row">
            <div>
              <strong>Speaking speed</strong>
              <span>1.0× · Comfortable</span>
            </div>
            <ChevronDown size={18} className="muted-icon" />
          </div>
          <div className="setting-row">
            <div>
              <strong>Voice</strong>
              <span>English (US) · Default</span>
            </div>
            <ChevronDown size={18} className="muted-icon" />
          </div>
        </section>

        <section className="card settings-section">
          <div className="settings-title">
            <div className="settings-icon">
              <Sun size={18} />
            </div>
            <div>
              <h3>Accessibility</h3>
              <p>Make the interface easier to use</p>
            </div>
          </div>
          <div className="setting-row">
            <div>
              <strong>Larger text</strong>
              <span>Increase interface font sizes</span>
            </div>
            <button
              className={`toggle ${largerText ? 'on' : ''}`}
              onClick={() => updateSettings({ largerText: !largerText })}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Reduce motion</strong>
              <span>Use fewer transitions</span>
            </div>
            <button
              className={`toggle ${reduceMotion ? 'on' : ''}`}
              onClick={() => updateSettings({ reduceMotion: !reduceMotion })}
            >
              <span />
            </button>
          </div>
        </section>

        <section className="card settings-section privacy-section">
          <div className="settings-title">
            <div className="settings-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3>Your privacy</h3>
              <p>SignBridge is private by design</p>
            </div>
          </div>
          <p className="privacy-copy">
            Camera video and recognized messages are processed on your device. Nothing is uploaded without your permission.
            The ONNX model and MediaPipe run entirely in your browser using WASM.
          </p>
          <button className="text-button">
            Read our privacy promise <ArrowRight size={15} />
          </button>
        </section>
      </div>
    </>
  )
}
