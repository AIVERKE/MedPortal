import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useFacultadesStore = defineStore('facultades', () => {
    const authStore = useAuthStore()
    const facultades = ref([])
    const loading = ref(false)
    const error = ref(null)

    const mapFacultad = (f) => ({
        id: f.idFacultad,
        nombre: f.nombre,
        activo: f.activo
    })

    const fetchFacultades = async (includeInactive = true) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/facultades?includeInactive=${includeInactive}`, {
                headers: authStore.authHeaders()
            })
            const data = await res.json()
            if (!res.ok) throw new Error()
            facultades.value = data.map(mapFacultad)
        } catch {
            error.value = 'Error al cargar facultades'
        } finally {
            loading.value = false
        }
    }

    const addFacultad = async (payload) => {
        try {
            const res = await fetch(`${API_BASE}/facultades`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.message || 'Error')
            await fetchFacultades(true)
            return true
        } catch (err) {
            error.value = err.message || 'Error al crear facultad'
            return false
        }
    }

    const updateFacultad = async (id, payload) => {
        try {
            const res = await fetch(`${API_BASE}/facultades/${id}`, {
                method: 'PATCH',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.message || 'Error')
            await fetchFacultades(true)
            return true
        } catch (err) {
            error.value = err.message || 'Error al actualizar facultad'
            return false
        }
    }

    const deleteFacultad = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/facultades/${id}`, {
                method: 'DELETE',
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error()
            facultades.value = facultades.value.filter((f) => f.id !== id)
            return true
        } catch {
            error.value = 'Error al eliminar facultad'
            return false
        }
    }

    const reset = () => {
        facultades.value = []
        loading.value = false
        error.value = null
    }

    return {
        facultades,
        loading,
        error,
        fetchFacultades,
        addFacultad,
        updateFacultad,
        deleteFacultad,
        reset
    }
})
