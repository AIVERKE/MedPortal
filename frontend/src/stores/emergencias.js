import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useEmergenciasStore = defineStore('emergencias', () => {
    const authStore = useAuthStore()

    // Estado
    const emergencias = ref([])
    const emergenciasDoctor = ref([])
    const selectedEmergencia = ref(null)
    const loading = ref(false)

    /**
     * OBTENER TODAS LAS EMERGENCIAS
     * GET /medical/emergencias
     */
    const fetchEmergencias = async () => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/medical/emergencias`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener emergencias')
            const response = await res.json()

            const data = response.data || response
            emergencias.value = Array.isArray(data) ? data : []
            return data
        } catch (error) {
            console.error('Error fetchEmergencias:', error)
            emergencias.value = []
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * OBTENER EMERGENCIA POR ID
     * GET /medical/emergencias/{id}
     */
    const fetchEmergenciaById = async (id) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/medical/emergencias/${id}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener la emergencia')
            const response = await res.json()

            const data = response.data || response
            selectedEmergencia.value = data
            return data
        } catch (error) {
            console.error('Error fetchEmergenciaById:', error)
            selectedEmergencia.value = null
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * OBTENER EMERGENCIAS POR DOCTOR
     * GET /medical/emergencias/doctor/{id_doctor}
     */
    const fetchEmergenciasByDoctor = async (idPersona) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/medical/emergencias/doctor/${idPersona}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener emergencias del doctor')
            const response = await res.json()

            const data = response.data || response
            emergenciasDoctor.value = Array.isArray(data) ? data : []
            return data
        } catch (error) {
            console.error('Error fetchEmergenciasByDoctor:', error)
            emergenciasDoctor.value = []
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * CREAR EMERGENCIA
     * POST /medical/emergencias
     */
    const createEmergencia = async (emergenciaData) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/medical/emergencias`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(emergenciaData)
            })
            if (!res.ok) throw new Error('Error al crear emergencia')
            const response = await res.json()
            return response.data || response
        } catch (error) {
            console.error('Error createEmergencia:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * ACTUALIZAR EMERGENCIA
     * PATCH /medical/emergencias/{id}
     */
    const updateEmergencia = async (id, emergenciaData) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/medical/emergencias/${id}`, {
                method: 'PATCH',
                headers: authStore.authHeaders(),
                body: JSON.stringify(emergenciaData)
            })
            if (!res.ok) throw new Error('Error al actualizar emergencia')
            const response = await res.json()
            return response.data || response
        } catch (error) {
            console.error('Error updateEmergencia:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * ELIMINAR EMERGENCIA (SOFT DELETE)
     * DELETE /medical/emergencias/{id}
     */
    const deleteEmergencia = async (id) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/medical/emergencias/${id}`, {
                method: 'DELETE',
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al eliminar emergencia')
            return true
        } catch (error) {
            console.error('Error deleteEmergencia:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    // Reiniciar estado
    const reset = () => {
        emergencias.value = []
        emergenciasDoctor.value = []
        selectedEmergencia.value = null
        loading.value = false
    }

    return {
        // Estado
        emergencias,
        emergenciasDoctor,
        selectedEmergencia,
        loading,

        // Acciones
        fetchEmergencias,
        fetchEmergenciaById,
        fetchEmergenciasByDoctor,
        createEmergencia,
        updateEmergencia,
        deleteEmergencia,
        reset
    }
})
