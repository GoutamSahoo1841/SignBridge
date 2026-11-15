import { useEffect, useRef } from 'react'
import { initAvatar, destroyAvatar } from '../../services/avatar.service.js'

export default function AvatarCanvas({ onGlossChange, style, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current) {
      initAvatar(canvasRef.current, onGlossChange)
    }

    return () => {
      destroyAvatar()
    }
  }, [onGlossChange])

  return (
    <div
      style={{
        height: 'min(62vh, 520px)',
        background: '#e9eef7',
        border: '1px solid #e6edf1',
        borderRadius: 16,
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}
