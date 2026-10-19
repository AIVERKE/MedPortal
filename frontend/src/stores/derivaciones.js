import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useDerivacionesStore = defineStore('derivaciones', () => {
    const authStore = useAuthStore()

    const verificarDerivacion = async (especialidadId) => {
        // Soporta diferentes nombres de campo para el ID de usuario
        const userId = authStore.user?.id || authStore.user?.idUsuario || authStore.user?.id_usuario

        if (!userId) return false

        try {
            const res = await fetch(`${API_BASE}/medical/derivaciones/check/${userId}/${especialidadId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!res.ok) return false

            const text = await res.text()
            return text.trim().toLowerCase() === 'true'
        } catch (error) {
            console.error('Error en verificarDerivacion:', error)
            return false
        }
    }

    return {
        verificarDerivacion
    }
})
