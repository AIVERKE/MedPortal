import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useUsuariosStore = defineStore('usuarios', () => {
    const authStore = useAuthStore()
    const loading = ref(false)
    const error = ref(null)

    const fetchUserByPersona = async (idPersona) => {
        if (!idPersona || idPersona === 'undefined') return null
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/usuarios/persona/${idPersona}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) {
                if (res.status === 404) return null
                throw new Error('Error al buscar usuario por persona')
            }
            return await res.json()
        } catch (err) {
            error.value = err.message
            return null
        } finally {
            loading.value = false
        }
    }

    const createUsuario = async (payload) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/usuarios`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload)
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.message || 'Error al crear usuario')
            }
            return await res.json()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        fetchUserByPersona,
        createUsuario
    }
})
