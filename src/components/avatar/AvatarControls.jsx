import React from 'react'
import { Play, Pause, RotateCcw, RotateCw, Gauge } from 'lucide-react'
import {
  resumeAvatar,
  pauseAvatar,
  replayAvatar,
  resetAvatarPose,
  setAvatarSpeed,
} from '../../services/avatar.service.js'

export default function AvatarControls({
  state,
  speed,
  onSpeedChange,
  onPlay,
  canPlay = false,
}) {
  const { isPlaying, isPaused, currentGloss, currentIndex, totalGlosses, progress } = state

  const handlePlayToggle = () => {
    if (isPlaying) {
      if (isPaused) {
        resumeAvatar()
      } else {
        pauseAvatar()
      }
    } else {
      if (onPlay) onPlay()
    }
  }

  const handleReplay = () => {
    replayAvatar()
  }

  const handleReset = () => {
    resetAvatarPose()
  }

  const handleSpeedSelect = (e) => {
    const val = Number(e.target.value)
    if (onSpeedChange) onSpeedChange(val)
    setAvatarSpeed(val)
  }

  const pct = Math.round(progress * 100)

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px 18px',
        marginTop: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Progress & Current Sign Status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
            Current Sign:
          </span>
          {currentGloss ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 12px',
                background: '#0284c7',
                color: '#ffffff',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              {currentGloss.startsWith('#')
                ? currentGloss.slice(1).toUpperCase().split('').join('-')
                : currentGloss}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
              {isPlaying ? 'Transitioning...' : 'Idle (Ready)'}
            </span>
          )}

          {totalGlosses > 0 && (
            <span style={{ fontSize: 11, color: '#64748b' }}>
              ({Math.min(currentIndex + 1, totalGlosses)} / {totalGlosses})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
          <span>Progress:</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{pct}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: 6,
          background: '#f1f5f9',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
            transition: 'width 0.15s linear',
          }}
        />
      </div>

      {/* Button Controls Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          paddingTop: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Play / Pause Button */}
          <button
            onClick={handlePlayToggle}
            disabled={!canPlay && !isPlaying}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: isPlaying && !isPaused ? '#f59e0b' : '#0284c7',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              cursor: canPlay || isPlaying ? 'pointer' : 'not-allowed',
              opacity: canPlay || isPlaying ? 1 : 0.6,
              transition: 'background 0.2s',
            }}
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause size={14} /> Pause
              </>
            ) : (
              <>
                <Play size={14} /> {isPaused ? 'Resume' : 'Play'}
              </>
            )}
          </button>

          {/* Replay Button */}
          <button
            onClick={handleReplay}
            disabled={totalGlosses === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: 12,
              fontWeight: 500,
              cursor: totalGlosses > 0 ? 'pointer' : 'not-allowed',
              opacity: totalGlosses > 0 ? 1 : 0.5,
            }}
            title="Replay sequence from beginning"
          >
            <RotateCcw size={13} /> Replay
          </button>

          {/* Reset Position Button */}
          <button
            onClick={handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Reset avatar to natural standing rest posture"
          >
            <RotateCw size={13} /> Reset Pose
          </button>
        </div>

        {/* Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Gauge size={14} color="#64748b" />
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Speed:</span>
          <select
            value={speed}
            onChange={handleSpeedSelect}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <option value={0.7}>0.7x (Slow)</option>
            <option value={1}>1.0x (Normal)</option>
            <option value={1.3}>1.3x (Brisk)</option>
            <option value={1.6}>1.6x (Fast)</option>
          </select>
        </div>
      </div>
    </div>
  )
}

