import { createContext, useContext, useReducer, useEffect } from 'react'
import { getItem, setItem } from '../utils/storage.js'

const AppContext = createContext(null)

const DEFAULT_SETTINGS = {
  mirrorCamera: true,
  autoStart: false,
  speechRate: 0.95,
  voiceName: '',
  largerText: false,
  reduceMotion: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_HISTORY':
      return {
        ...state,
        history: [
          { text: action.text, type: action.htype, time: new Date().toISOString() },
          ...state.history,
        ].slice(0, 200),
      }
    case 'CLEAR_HISTORY':
      return { ...state, history: [] }
    case 'DELETE_HISTORY_ITEM':
      return {
        ...state,
        history: state.history.filter((_, i) => i !== action.index),
      }
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, [action.key]: action.value },
      }
    case 'RESET_SETTINGS':
      return { ...state, settings: DEFAULT_SETTINGS }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    history: getItem('sb_history', []),
    settings: { ...DEFAULT_SETTINGS, ...getItem('sb_settings', {}) },
  })

  // Persist history whenever it changes
  useEffect(() => {
    setItem('sb_history', state.history)
  }, [state.history])

  // Persist settings whenever they change
  useEffect(() => {
    setItem('sb_settings', state.settings)
    // Apply larger-text setting to <html>
    document.documentElement.setAttribute(
      'data-larger-text',
      state.settings.largerText ? 'true' : 'false'
    )
    // Apply reduce-motion setting
    document.documentElement.setAttribute(
      'data-reduce-motion',
      state.settings.reduceMotion ? 'true' : 'false'
    )
  }, [state.settings])

  const addHistory = (text, htype = 'sign') =>
    dispatch({ type: 'ADD_HISTORY', text, htype })

  const clearHistory = () => dispatch({ type: 'CLEAR_HISTORY' })

  const deleteHistoryItem = (index) => dispatch({ type: 'DELETE_HISTORY_ITEM', index })

  const updateSettings = (key, value) => {
    if (typeof key === 'object' && key !== null) {
      Object.entries(key).forEach(([k, v]) => dispatch({ type: 'UPDATE_SETTINGS', key: k, value: v }))
    } else {
      dispatch({ type: 'UPDATE_SETTINGS', key, value })
    }
  }

  const resetSettings = () => dispatch({ type: 'RESET_SETTINGS' })

  return (
    <AppContext.Provider
      value={{
        history: state.history,
        settings: state.settings,
        addHistory,
        clearHistory,
        deleteHistoryItem,
        updateSettings,
        resetSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

export const useApp = useAppContext


