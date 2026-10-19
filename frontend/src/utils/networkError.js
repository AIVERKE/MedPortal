/** Mensaje único cuando no hay respuesta del backend (login, registro, catálogos). */
export const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor. El servicio no está disponible en este momento. Intenta de nuevo más tarde.'

const NETWORK_MESSAGE_RE =
  /failed to fetch|networkerror|network request failed|load failed|fetch failed|the network connection was lost/i

/**
 * fetch() lanza TypeError (Chrome/Edge: "Failed to fetch", Firefox: NetworkError,
 * Safari: "Load failed") cuando no hay respuesta HTTP.
 */
export function isNetworkError(error) {
  if (!error) return false
  if (error.code === 'NETWORK') return true
  const message = String(error.message || '')
  if (error.name === 'TypeError' && NETWORK_MESSAGE_RE.test(message)) return true
  if (NETWORK_MESSAGE_RE.test(message)) return true
  return false
}

export function createNetworkError(cause) {
  const error = new Error(NETWORK_ERROR_MESSAGE)
  error.code = 'NETWORK'
  error.name = 'NetworkError'
  if (cause) error.cause = cause
  return error
}

/**
 * Texto para la UI: nunca expone "Failed to fetch" ni otros mensajes nativos de red.
 */
export function userFacingErrorMessage(error, fallback = NETWORK_ERROR_MESSAGE) {
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE
  const message = String(error?.message || '').trim()
  if (!message || NETWORK_MESSAGE_RE.test(message)) return fallback
  return message
}
