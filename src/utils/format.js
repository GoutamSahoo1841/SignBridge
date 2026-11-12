/**
 * Formatting helpers.
 */

/**
 * Format a Date object (or ISO string) for display in history.
 * Returns e.g. "Today 14:32" or "Nov 9, 14:32"
 */
export function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  if (isToday) return `Today ${time}`

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + time
}

/**
 * Capitalize first character of a string.
 */
export function capitalize(str) {
  if (!str) return str
  return str[0].toUpperCase() + str.slice(1)
}

/**
 * Truncate a string to maxLen characters, appending ellipsis if needed.
 */
export function truncate(str, maxLen = 60) {
  if (!str || str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '…'
}

