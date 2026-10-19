export function isTokenExpired(token) {
    if (!token) return true
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        return payload.exp < now
    } catch {
        return true
    }
}

export function tokenExpiresAt(token) {
    if (!token) return null
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return typeof payload.exp === 'number' ? payload.exp * 1000 : null
    } catch {
        return null
    }
}

function parseUser(storage) {
    try {
        return JSON.parse(storage.getItem('user') || 'null')
    } catch {
        return null
    }
}

/** Prefiere el token vigente. Si el persistente venció y el de pestaña no, usa este y descarta el viejo. */
export function readSession() {
    const localToken = localStorage.getItem('token')
    const sessionToken = sessionStorage.getItem('token')
    const localOk = Boolean(localToken) && !isTokenExpired(localToken)
    const sessionOk = Boolean(sessionToken) && !isTokenExpired(sessionToken)

    if (localOk) {
        if (sessionToken && !sessionOk) {
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('user')
        }
        return { token: localToken, user: parseUser(localStorage), expired: false }
    }

    if (sessionOk) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return { token: sessionToken, user: parseUser(sessionStorage), expired: false }
    }

    if (localToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }
    if (sessionToken) {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
    }

    return {
        token: null,
        user: null,
        expired: Boolean(localToken || sessionToken),
    }
}

export function clearStoredSession() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('rememberMe')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
}
