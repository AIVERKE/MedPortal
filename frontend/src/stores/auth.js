import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useReservasStore } from './reservas'
import { usePostasStore } from './postas'
import { useEspecialidadStore } from './especialidad'
import { useDoctoresStore } from './doctores'
import { useConsultorioStore } from './consultorios'
import { useAsignacionDoctoresStore } from './asignacion_doctores_consultorio'
import { useConfiguracionReservasStore } from './configuracion_reservas'
import { useConsejoDelDiaStore } from './consejo_del_dia'
import { useNotificationsStore } from './notifications'
import { createNetworkError, isNetworkError } from '@/utils/networkError'
import {
    isTokenExpired,
    tokenExpiresAt,
    readSession,
    clearStoredSession,
} from '@/utils/authToken'

const API_BASE = import.meta.env.VITE_API_URL
const SESSION_WARN_MS = 5 * 60 * 1000

// Determina qué storage usar según si el usuario eligió "Recordarme"
// Se guarda la preferencia en localStorage para poder leerla al recargar
const getStorage = () => {
    return localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage
}

export const useAuthStore = defineStore('auth', () => {
    const stored = readSession()
    if (!stored.token) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
    }

    const token = ref(stored.token)
    const user = ref(stored.user)
    const returnUrl = ref(null)
    const sessionWarning = ref(false)
    let expiring = false
    let warnTimer = null
    let expireTimer = null

    const clearSessionTimers = () => {
        if (warnTimer) clearTimeout(warnTimer)
        if (expireTimer) clearTimeout(expireTimer)
        warnTimer = null
        expireTimer = null
    }

    const dismissSessionWarning = () => {
        sessionWarning.value = false
    }

    const armSessionTimers = () => {
        clearSessionTimers()
        sessionWarning.value = false
        if (!token.value) return
        const expiresAt = tokenExpiresAt(token.value)
        if (!expiresAt) return
        const remaining = expiresAt - Date.now()
        if (remaining <= 0) {
            expireSession()
            return
        }
        const warnIn = remaining - SESSION_WARN_MS
        if (warnIn <= 0) {
            sessionWarning.value = true
        } else {
            warnTimer = setTimeout(() => {
                sessionWarning.value = true
            }, warnIn)
        }
        expireTimer = setTimeout(() => {
            expireSession()
        }, remaining)
    }

    const freshToken = () => {
        if (!token.value) return null
        if (!isTokenExpired(token.value)) return token.value
        expireSession()
        return null
    }

    const authHeaders = () => {
        const headers = { 'Content-Type': 'application/json' }
        const active = freshToken()
        if (active) headers.Authorization = `Bearer ${active}`
        return headers
    }

    const authHeadersMultipart = () => {
        const headers = {}
        const active = freshToken()
        if (active) headers.Authorization = `Bearer ${active}`
        return headers
    }

    const login = async (username, password, rememberMe = false, idRol = null) => {
        try {
            const payload = { username, password }
            if (idRol) payload.idRol = idRol

            let res
            try {
                res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            } catch (error) {
                if (isNetworkError(error)) throw createNetworkError(error)
                throw error
            }

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                if (res.status === 401) {
                    const authError = new Error(
                        parseApiMessage(data, 'Usuario o contraseña incorrectos'),
                    )
                    authError.status = 401
                    authError.code = 'AUTH'
                    throw authError
                }
                throw new Error(parseApiMessage(data, 'No se pudo iniciar sesión'))
            }

            // Si el backend requiere seleccionar un rol, devolvemos la data para que el componente lo maneje
            if (data.requireRoleSelection) {
                return data
            }

            const newToken = data.access_token

            token.value = newToken
            expiring = false

            // Guardar preferencia de "Recordarme"
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true')
                localStorage.setItem('remembered_identity', username)
            } else {
                localStorage.removeItem('rememberMe')
                localStorage.removeItem('remembered_identity')
                // Limpiar cualquier sesión persistente anterior
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            }

            // Guardar token en el storage correcto
            getStorage().setItem('token', newToken)

            await fetchProfile()
            armSessionTimers()

            if (data.mustChangePassword && user.value) {
                user.value = { ...user.value, mustChangePassword: true }
                getStorage().setItem('user', JSON.stringify(user.value))
            }

            return { success: true, mustChangePassword: !!data.mustChangePassword }
        } catch (error) {
            if (isNetworkError(error)) {
                console.error('Login error details:', error)
                throw createNetworkError(error)
            }
            console.error('Login error details:', error)
            throw error
        }
    }

    const fetchProfile = async () => {
        if (!token.value) return

        try {
            const res = await fetch(`${API_BASE}/auth/profile`, {
                headers: authHeaders()
            })

            if (!res.ok) {
                // Si falla el perfil (ej. token expirado), hacemos logout
            if (res.status === 401) {
                expireSession()
                throw new Error('Sesión expirada')
            }
                throw new Error('Error al obtener perfil')
            }

            const userData = await res.json()
            user.value = userData
            // Guardar datos del usuario en el storage correcto
            getStorage().setItem('user', JSON.stringify(userData))
        } catch (error) {
            console.error('Profile error:', error)
        }
    }

    const changePassword = async (currentPassword, newPassword, confirmPassword) => {
        const res = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            const message = Array.isArray(data.message)
                ? data.message.join(', ')
                : (data.message || 'No se pudo cambiar la contraseña')
            throw new Error(message)
        }

        if (user.value) {
            user.value = { ...user.value, mustChangePassword: false }
            getStorage().setItem('user', JSON.stringify(user.value))
        }

        return data
    }

    const forgotPassword = async (username) => {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(parseApiError(data, 'No se pudo solicitar la recuperación'))
        }
        return data
    }

    const resetPassword = async ({ token, newPassword, confirmPassword }) => {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword, confirmPassword }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(parseApiError(data, 'No se pudo restablecer la contraseña'))
        }
        return data
    }

    const updateProfilePhoto = async (file) => {
        const formData = new FormData()
        formData.append('foto', file)

        const res = await fetch(`${API_BASE}/auth/profile/foto`, {
            method: 'PATCH',
            headers: authHeadersMultipart(),
            body: formData,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            const message = Array.isArray(data.message)
                ? data.message.join(', ')
                : (data.message || 'No se pudo actualizar la foto')
            throw new Error(message)
        }
        await fetchProfile()
        return data
    }

    const updateEstudianteDocumentos = async ({ pdfMatricula, pdfCarnet }) => {
        const formData = new FormData()
        if (pdfMatricula) formData.append('pdfMatricula', pdfMatricula)
        if (pdfCarnet) formData.append('pdfCarnet', pdfCarnet)

        const res = await fetch(`${API_BASE}/auth/estudiante/documentos`, {
            method: 'PATCH',
            headers: authHeadersMultipart(),
            body: formData,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            const message = Array.isArray(data.message)
                ? data.message.join(', ')
                : (data.message || 'No se pudieron actualizar los documentos')
            throw new Error(message)
        }
        await fetchProfile()
        return data
    }

    const updateProfile = async (payload) => {
        const res = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(parseApiError(data, 'No se pudieron actualizar los datos personales'))
        }
        await fetchProfile()
        return data
    }

    const updateUsername = async (username) => {
        const res = await fetch(`${API_BASE}/auth/profile/username`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ username }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            const error = new Error(parseApiError(data, 'No se pudo actualizar el usuario'))
            error.suggestions = Array.isArray(data.suggestions) ? data.suggestions : []
            throw error
        }
        await fetchProfile()
        return data
    }

    const checkUsername = async (username) => {
        const params = new URLSearchParams({ username })
        const res = await fetch(`${API_BASE}/auth/profile/username/check?${params}`, {
            headers: authHeaders(),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(parseApiError(data, 'No se pudo verificar el usuario'))
        }
        return data
    }

    const parseApiMessage = (data, fallback) => {
        return Array.isArray(data?.message)
            ? data.message.join(', ')
            : (data?.message || fallback)
    }

    const parseApiError = (data, fallback) => parseApiMessage(data, fallback)

    const switchRole = async (idRol) => {
        const res = await fetch(`${API_BASE}/auth/switch-role`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ idRol }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(parseApiError(data, 'No se pudo cambiar el rol'))
        }
        const newToken = data.access_token
        if (!newToken) throw new Error('El servidor no devolvió un token')
        token.value = newToken
        getStorage().setItem('token', newToken)
        expiring = false
        await fetchProfile()
        armSessionTimers()
        return data
    }

    const registrarRolEstudiante = async ({
        registroUniversitario,
        idFacultad,
        idCarrera,
        pdfMatricula,
        pdfCarnet,
    }) => {
        const formData = new FormData()
        formData.append('registroUniversitario', registroUniversitario)
        formData.append('idFacultad', String(idFacultad))
        formData.append('idCarrera', String(idCarrera))
        formData.append('pdfMatricula', pdfMatricula)
        formData.append('pdfCarnet', pdfCarnet)

        const res = await fetch(`${API_BASE}/auth/cuenta/rol/estudiante`, {
            method: 'POST',
            headers: authHeadersMultipart(),
            body: formData,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(parseApiError(data, 'No se pudo registrar el rol de estudiante'))
        }
        return data
    }

    const registrarRolDocente = async (payload) => {
        const res = await fetch(`${API_BASE}/auth/cuenta/rol/docente`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(parseApiError(data, 'No se pudo registrar el rol de docente'))
        }
        return data
    }

    const registrarRolAdministrativo = async (payload) => {
        const res = await fetch(`${API_BASE}/auth/cuenta/rol/administrativo`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(parseApiError(data, 'No se pudo registrar el rol de administrativo'))
        }
        return data
    }

    const registrarRolConsultor = async ({
        tipoServicio,
        unidad,
        fechaInicioContrato,
        fechaFinContrato,
        cargo,
        pdfContrato,
    }) => {
        const formData = new FormData()
        formData.append('tipoServicio', tipoServicio)
        formData.append('unidad', unidad)
        formData.append('fechaInicioContrato', fechaInicioContrato)
        if (fechaFinContrato) formData.append('fechaFinContrato', fechaFinContrato)
        formData.append('cargo', cargo)
        formData.append('pdfContrato', pdfContrato)

        const res = await fetch(`${API_BASE}/auth/cuenta/rol/consultor`, {
            method: 'POST',
            headers: authHeadersMultipart(),
            body: formData,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(parseApiError(data, 'No se pudo registrar el rol de consultor'))
        }
        return data
    }

    const logout = () => {
        user.value = null
        token.value = null
        sessionWarning.value = false
        clearSessionTimers()
        clearStoredSession()

        // Limpiar otros stores para evitar persistencia de datos entre sesiones
        try {
            useReservasStore().reset()
            usePostasStore().reset()
            useEspecialidadStore().reset()
            useDoctoresStore().reset()
            useConsultorioStore().reset()
            useAsignacionDoctoresStore().reset()
            useConfiguracionReservasStore().clearConfig()
            useConsejoDelDiaStore().reset()
            useNotificationsStore().reset()
        } catch (error) {
            console.error('Error al limpiar stores durante el logout:', error)
        }
        // El componente se encarga de redirigir
    }

    const expireSession = () => {
        if (expiring) return
        expiring = true
        const redirect = `${window.location.pathname}${window.location.search}`
        logout()
        import('@/router').then(({ default: router }) => {
            if (router.currentRoute.value.path === '/login') return
            const target = redirect.startsWith('/login') ? undefined : redirect
            router.push({
                path: '/login',
                query: {
                    ...(target ? { redirect: target } : {}),
                    sesion: 'expirada',
                },
            })
        })
    }

    if (token.value) armSessionTimers()

    return {
        user, token, returnUrl, login, logout, expireSession, fetchProfile,
        authHeaders, authHeadersMultipart, isTokenExpired,
        sessionWarning, dismissSessionWarning,
        changePassword, forgotPassword, resetPassword,
        updateProfilePhoto, updateEstudianteDocumentos,
        updateProfile, updateUsername, checkUsername,
        switchRole,
        registrarRolEstudiante,
        registrarRolDocente,
        registrarRolAdministrativo,
        registrarRolConsultor,
    }
})
