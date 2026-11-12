import { useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  Copy,
  FileText,
  Hand,
  Trash2,
  Volume2,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function HistoryPage() {
  const { history, clearHistory } = useApp()
  const [search, setSearch] = useState('')

  const displayList = history && history.length > 0 ? history : [
    { text: 'I need some water, please.', type: 'Sign to Text', time: 'Today, 10:42 AM', icon: Hand },
    { text: 'Thank you for your help.', type: 'Text to Speech', time: 'Yesterday, 4:16 PM', icon: Volume2 },
    { text: 'Please wait a moment.', type: 'Sign to Text', time: 'Yesterday, 2:08 PM', icon: Hand },
    { text: 'I need some rest.', type: 'Sign to Text', time: 'Nov 8, 9:30 AM', icon: Hand },
  ]

  const filtered = displayList.filter(
    (item) => item.text.toLowerCase().includes(search.toLowerCase())
  )

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }

  return (
    <>
      <div className="page-intro feature-intro">
        <div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ArrowRight size={13} /> Communication History
          </div>
          <h2>Your communication, remembered.</h2>
          <p>Review, copy, or revisit messages from your recent sessions.</p>
        </div>
        <button className="button button-secondary" onClick={clearHistory}>
          <Trash2 size={16} /> Clear history
        </button>
      </div>

      <section className="card history-card">
        <div className="history-toolbar">
          <div className="search-box">
            <FileText size={17} />
            <input
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="filter-button">
            All types <ChevronDown size={16} />
          </button>
          <button className="filter-button">
            Last 30 days <ChevronDown size={16} />
          </button>
        </div>

        <div className="history-list">
          {filtered.map((item, index) => {
            const Icon = item.icon || (item.type === 'Text to Speech' ? Volume2 : Hand)
            return (
              <div className="history-row" key={item.id || index}>
                <div className="activity-icon">
                  <Icon size={16} />
                </div>
                <div className="history-message">
                  <strong>{item.text}</strong>
                  <span>{item.type || 'Sign to Text'}</span>
                </div>
                <span className="history-time">
                  <Clock3 size={14} /> {item.time || item.timestamp || 'Recent'}
                </span>
                <button
                  className="icon-button"
                  aria-label="Copy message"
                  onClick={() => handleCopy(item.text)}
                >
                  <Copy size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Delete message"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
