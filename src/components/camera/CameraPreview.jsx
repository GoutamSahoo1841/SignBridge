import { useAppContext } from '../../context/AppContext.jsx'

export default function CameraPreview({ videoRef, isActive, caption = '' }) {
  const { settings } = useAppContext()

  return (
    <div className={`camera-wrap${isActive ? ' camera-wrap--active' : ''}`}>
      <video
        ref={videoRef}
        className="camera-video"
        playsInline
        muted
        style={{ transform: settings.mirrorCamera ? 'scaleX(-1)' : 'none' }}
      />

      {/* Overlay grid lines */}
      {isActive && (
        <div className="camera-overlay" aria-hidden="true">
          <div className="camera-corner camera-corner--tl" />
          <div className="camera-corner camera-corner--tr" />
          <div className="camera-corner camera-corner--bl" />
          <div className="camera-corner camera-corner--br" />
          <div className="camera-scanline" />
        </div>
      )}

      {/* Idle placeholder */}
      {!isActive && (
        <div className="camera-idle">
          <div className="camera-idle-icon">📷</div>
          <p>Camera off</p>
        </div>
      )}

      {/* Caption bar */}
      {caption && (
        <div className="camera-caption">{caption}</div>
      )}
    </div>
  )
}

