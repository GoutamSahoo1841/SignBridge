import React from 'react'

export default function AvatarLoading({ progress = 0 }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(240, 244, 250, 0.95), rgba(225, 235, 248, 0.95))',
        backdropFilter: 'blur(4px)',
        zIndex: 10,
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          border: '4px solid #d1d5db',
          borderTopColor: '#0ea5e9',
          animation: 'spin 1s linear infinite',
          marginBottom: 16,
        }}
      />
      <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
        Loading 3D Human Avatar
      </h3>
      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
        Preparing realistic skeletal rig and sign-language engine... {progress > 0 ? `${progress}%` : ''}
      </p>

      {progress > 0 && (
        <div
          style={{
            width: 200,
            height: 6,
            background: '#e2e8f0',
            borderRadius: 99,
            overflow: 'hidden',
            marginTop: 14,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#0ea5e9',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

