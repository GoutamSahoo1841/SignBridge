import Button from '../common/Button.jsx'
import { Volume2, Copy, Sparkles } from 'lucide-react'

export default function GeneratedMessage({
  sentence,
  onSpeak,
  onCopy,
  onGenerate,
  generating,
  method,
}) {
  return (
    <div className="generated-message-panel">
      <div className="generated-message-label">
        Generated Message
        {method && (
          <span className={`method-badge method-badge--${method === 'ollama' ? 'teal' : 'slate'}`}>
            {method === 'ollama' ? 'AI' : 'Rule-based'}
          </span>
        )}
      </div>
      <div className="generated-message-text">
        {sentence || <span className="placeholder-text">Signs will be converted to a message here…</span>}
      </div>
      <div className="generated-message-actions">
        <Button variant="primary" onClick={onSpeak} disabled={!sentence}>
          <Volume2 size={15} /> Speak
        </Button>
        <Button variant="secondary" onClick={onCopy} disabled={!sentence}>
          <Copy size={15} /> Copy
        </Button>
        <Button variant="ghost" onClick={onGenerate} disabled={generating}>
          <Sparkles size={15} /> {generating ? 'Generating…' : 'Generate'}
        </Button>
      </div>
    </div>
  )
}

