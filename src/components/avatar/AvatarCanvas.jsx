import { useEffect, useRef } from 'react'
import { initAvatar, destroyAvatar } from '../../services/avatar.service.js'

export default function AvatarCanvas() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    if (!window.THREE) {
      console.warn('THREE.js not loaded. Avatar canvas will be blank.')
      return
    }

    try {
      initAvatar(canvasRef.current)
    } catch (err) {
      console.error('Avatar init error:', err)
    }

    return () => {
      destroyAvatar()
    }
  }, [])

  return (
    <div ref={containerRef} className="avatar-container">
      <canvas ref={canvasRef} className="avatar-canvas" />
    </div>
  )
}

