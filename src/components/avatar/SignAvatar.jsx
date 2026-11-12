import React, { useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { initAvatar, destroyAvatar, subscribeAvatarState } from '../../services/avatar.service.js'
import AvatarLoading from './AvatarLoading.jsx'

export default function SignAvatar({ height = 'min(64vh, 540px)', onError }) {
  const canvasRef = useRef(null)
  const [loadPct, setLoadPct] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [unsupported, setUnsupported] = useState([])

  useEffect(() => {
    if (!canvasRef.current) return

    let mounted = true

    initAvatar(
      canvasRef.current,
      (pct) => {
        if (mounted) {
          setLoadPct(pct)
          if (pct >= 100) setIsLoaded(true)
        }
      },
      (err) => {
        if (mounted && onError) onError(err)
      }
    )

    const unsubscribe = subscribeAvatarState((s) => {
      if (mounted) {
        setIsLoaded(s.isLoaded)
        setUnsupported(s.unsupported || [])
      }
    })

    return () => {
      mounted = false
      unsubscribe()
      destroyAvatar()
    }
  }, [onError])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        background: 'radial-gradient(circle at 50% 30%, #f0f4f9 0%, #dbe4ef 100%)',
        border: '1px solid #cbd5e1',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Loading Overlay */}
      {!isLoaded && <AvatarLoading progress={loadPct} />}

      {/* Unsupported Sign Banner */}
      {unsupported.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            background: 'rgba(254, 242, 242, 0.95)',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: '#b91c1c',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
            zIndex: 5,
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>
            <strong>Note:</strong> The sign{unsupported.length > 1 ? 's' : ''}{' '}
            <em>{unsupported.join(', ')}</em> {unsupported.length > 1 ? 'are' : 'is'} not yet in the
            3D sign dictionary and {unsupported.length > 1 ? 'were' : 'was'} skipped.
          </span>
        </div>
      )}
    </div>
  )
}

