import React, { useEffect, useRef, useState, useCallback } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { initAvatar, destroyAvatar, subscribeAvatarState } from '../../services/avatar.service.js'
import AvatarLoading from './AvatarLoading.jsx'

export default function SignAvatar({ height = 'min(64vh, 540px)', onError }) {
  const canvasRef = useRef(null)
  const [loadPct, setLoadPct] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [unsupported, setUnsupported] = useState([])
  const [initError, setInitError] = useState(null)
  const [mountKey, setMountKey] = useState(0)

  const setupAvatar = useCallback(() => {
    if (!canvasRef.current) return

    setInitError(null)
    setLoadPct(0)
    setIsLoaded(false)

    try {
      initAvatar(
        canvasRef.current,
        (pct) => {
          setLoadPct(pct)
          if (pct >= 100) setIsLoaded(true)
        },
        (err) => {
          console.error('SignAvatar caught error:', err)
          setInitError(err)
          if (onError) onError(err)
        }
      )
    } catch (e) {
      console.error('SignAvatar synchronous init error:', e)
      setInitError(e)
      if (onError) onError(e)
    }
  }, [onError])

  useEffect(() => {
    setupAvatar()

    const unsubscribe = subscribeAvatarState((s) => {
      setIsLoaded(s.isLoaded)
      setUnsupported(s.unsupported || [])
    })

    return () => {
      unsubscribe()
      destroyAvatar()
    }
  }, [setupAvatar, mountKey])

  const handleRetry = () => {
    destroyAvatar()
    setInitError(null)
    setMountKey((prev) => prev + 1)
  }

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
        key={mountKey}
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: initError ? 'none' : 'block',
        }}
      />

      {/* Loading Overlay */}
      {!isLoaded && !initError && <AvatarLoading progress={loadPct} />}

      {/* Error Fallback with Retry */}
      {initError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <AlertCircle size={26} color="#ef4444" />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
            Avatar 3D Graphics Unavailable
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#64748b', maxWidth: 420, lineHeight: 1.5 }}>
            {initError.message && initError.message.includes('WebGL')
              ? 'Your browser temporarily blocked or exhausted WebGL graphics contexts. Click below to re-initialize graphics.'
              : initError.message || 'Could not load 3D model resources.'}
          </p>
          <button
            onClick={handleRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
            }}
          >
            <RotateCcw size={15} /> Retry Avatar
          </button>
        </div>
      )}

      {/* Unsupported Sign Banner */}
      {unsupported.length > 0 && !initError && (
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
