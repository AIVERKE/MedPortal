const API_BASE = import.meta.env.VITE_API_URL || ''

const SESSION_ENDED_MESSAGES = new Set(['No autorizado', 'Usuario no encontrado'])

function requestUrl(input) {
    if (typeof input === 'string') return input
    if (input instanceof URL) return input.toString()
    return input?.url || ''
}

function isApiRequest(url) {
    return Boolean(API_BASE) && url.startsWith(API_BASE)
}

function isCredentialCheck(url) {
    return /\/auth\/(login|forgot-password|reset-password|change-password)(\?|$)/.test(url)
}

function messageOf(data) {
    if (!data) return ''
    if (Array.isArray(data.message)) return data.message.join(' ')
    return typeof data.message === 'string' ? data.message : ''
}

/** Ante un 401 de sesión (token ausente, vencido o inválido), cierra la sesión una sola vez. */
export function installAuthFetch(getAuthStore) {
    const nativeFetch = window.fetch.bind(window)

    window.fetch = async (input, init) => {
        const response = await nativeFetch(input, init)
        const url = requestUrl(input)
        if (response.status !== 401 || !isApiRequest(url) || isCredentialCheck(url)) {
            return response
        }

        const data = await response.clone().json().catch(() => ({}))
        if (SESSION_ENDED_MESSAGES.has(messageOf(data))) {
            getAuthStore().expireSession()
        }
        return response
    }
}
