import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useCarrerasStore = defineStore('carreras', () => {
    const authStore = useAuthStore()
    const carreras = ref([])
    const loading = ref(false)
    const error = ref(null)

    const mapCarrera = (c) => ({
        id: c.idCarrera,
        nombre: c.nombre,
        activo: c.activo,
        idFacultad: c.facultad?.idFacultad ?? null,
        facultadNombre: c.facultad?.nombre ?? 'Sin facultad'
    })

    const fetchCarreras = async ({ facultadId = null, includeInactive = true } = {}) => {
        loading.value = true
        error.value = null
        try {
            const params = new URLSearchParams()
            if (facultadId) params.append('facultadId', String(facultadId))
            params.append('includeInactive', String(includeInactive))
            const res = await fetch(`${API_BASE}/carreras?${params.toString()}`, {
                headers: authStore.authHeaders()
            })
            const data = await res.json()
            if (!res.ok) throw new Error()
            carreras.value = data.map(mapCarrera)
        } catch {
            error.value = 'Error al cargar carreras'
        } finally {
            loading.value = false
        }
    }

    const addCarrera = async (payload) => {
        try {
            const res = await fetch(`${API_BASE}/carreras`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.message || 'Error')
            await fetchCarreras({ includeInactive: true })
            return true
        } catch (err) {
            error.value = err.message || 'Error al crear carrera'
            return false
        }
    }

    const updateCarrera = async (id, payload) => {
        try {
            const res = await fetch(`${API_BASE}/carreras/${id}`, {
                method: 'PATCH',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.message || 'Error')
            await fetchCarreras({ includeInactive: true })
            return true
        } catch (err) {
            error.value = err.message || 'Error al actualizar carrera'
            return false
        }
    }

    const deleteCarrera = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/carreras/${id}`, {
                method: 'DELETE',
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error()
            carreras.value = carreras.value.filter((c) => c.id !== id)
            return true
        } catch {
            error.value = 'Error al eliminar carrera'
            return false
        }
    }

    const reset = () => {
        carreras.value = []
        loading.value = false
        error.value = null
    }

    return {
        carreras,
        loading,
        error,
        fetchCarreras,
        addCarrera,
        updateCarrera,
        deleteCarrera,
        reset
    }
})
