import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useConsejoDelDiaStore = defineStore('consejo_del_dia', () => {
    const authStore = useAuthStore()
    const consejos = ref([])
    const consejoActual = ref(null)
    const loading = ref(false)
    const error = ref(null)

    /* ======================
     * GET (All Advice)
     * ====================== */
    const fetchAllConsejos = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/consejo-diario`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al listar los consejos del día')
            const data = await res.json()
            consejos.value = data.map(c => ({
                id: c.idConsejoDiario,
                titulo: c.titulo,
                contenido: c.contenido,
                categoria: c.categoria,
                fechaPublicacion: c.fechaPublicacion,
                activo: c.activo,
                fechaCreacion: c.fecha_creacion
            }))
        } catch (err) {
            error.value = err.message || 'Error al cargar los consejos'
            console.error('Error fetching all consejos:', err)
        } finally {
            loading.value = false
        }
    }

    /* ======================
     * GET (Random Advice)
     * ====================== */
    const fetchConsejoAleatorio = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/consejo-diario/consejo_aleatorio`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener el consejo del día')

            const data = await res.json()

            consejoActual.value = {
                id: data.idConsejoDiario,
                titulo: data.titulo,
                contenido: data.contenido,
                categoria: data.categoria,
                fechaPublicacion: data.fechaPublicacion,
                activo: data.activo,
                fechaCreacion: data.fecha_creacion
            }
        } catch (err) {
            error.value = err.message || 'Error al cargar el consejo del día'
            console.error('Error fetching consejo aleatorio:', err)
        } finally {
            loading.value = false
        }
    }

    /* ======================
     * GET (ID Advice)
     * ====================== */
    const fetchConsejoById = async (id) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/consejo-diario/${id}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener el consejo')
            const data = await res.json()
            consejoActual.value = {
                id: data.idConsejoDiario,
                titulo: data.titulo,
                contenido: data.contenido,
                categoria: data.categoria,
                fechaPublicacion: data.fechaPublicacion,
                activo: data.activo,
                fechaCreacion: data.fecha_creacion
            }
        } catch (err) {
            error.value = err.message || 'Error al cargar el consejo'
            console.error('Error fetching consejo by id:', err)
        } finally {
            loading.value = false
        }
    }

    /* ======================
     * POST (Create Advice)
     * ====================== */
    const createConsejo = async (data) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/consejo-diario`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Error al crear el consejo')
            await fetchAllConsejos()
        } catch (err) {
            error.value = err.message || 'Error al crear el consejo'
            console.error('Error creating consejo:', err)
        } finally {
            loading.value = false
        }
    }

    /* ======================
     * PATCH (Update Advice)
     * ====================== */
    const updateConsejo = async (id, data) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/consejo-diario/${id}`, {
                method: 'PATCH',
                headers: authStore.authHeaders(),
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Error al actualizar el consejo')
            await fetchAllConsejos()
        } catch (err) {
            error.value = err.message || 'Error al actualizar el consejo'
            console.error('Error updating consejo:', err)
        } finally {
            loading.value = false
        }
    }

    /* ======================
     * DELETE (Remove Advice)
     * ====================== */
    const deleteConsejo = async (id) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/consejo-diario/${id}`, {
                method: 'DELETE',
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al eliminar el consejo')
            await fetchAllConsejos()
        } catch (err) {
            error.value = err.message || 'Error al eliminar el consejo'
            console.error('Error deleting consejo:', err)
        } finally {
            loading.value = false
        }
    }

    const reset = () => {
        consejoActual.value = null
        loading.value = false
        error.value = null
    }

    return {
        consejos,
        consejoActual,
        loading,
        error,
        fetchAllConsejos,
        fetchConsejoAleatorio,
        fetchConsejoById,
        createConsejo,
        updateConsejo,
        deleteConsejo,
        reset
    }
})

