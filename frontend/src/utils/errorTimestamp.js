/**
 * Formats an ISO or Date value for display in error modals (La Paz).
 * Prefer server timestamp when available for log correlation.
 */
export function formatErrorTimestamp(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return formatErrorTimestamp(new Date())
  }

  return date.toLocaleString('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/**
 * Build an Error that preserves API timestamp when present.
 */
export function createApiError(data, fallback = 'Error en la solicitud al servidor') {
  const message = Array.isArray(data?.message)
    ? data.message.join(', ')
    : data?.message || fallback
  const error = new Error(message)
  if (data?.timestamp) {
    error.timestamp = data.timestamp
  }
  return error
}
