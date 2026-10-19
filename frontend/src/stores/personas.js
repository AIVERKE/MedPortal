// src/stores/personas.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const usePersonasStore = defineStore('personas', () => {
    const authStore = useAuthStore()
    const personas = ref([])
    const personasSinUsuario = ref([])
    const personasConUsuario = ref([])
    const loading = ref(false)
    const selectedPersona = ref(null)

    /* =====================================================
     * HELPERS
     * ===================================================== */

    /**
     * Mapea los datos de la persona para asegurar que la propiedad 'roles' 
     * exista con el formato requerido por los componentes del frontend.
     */
    const mapPersonaData = (p) => {
        if (!p) return null;
        return {
            ...p,

            // Solo incluimos las asignaciones activas
            roles: p.asignacionesRoles?.filter(ar => ar.activo).map(ar => ({
                idRol: ar.rol?.idRol,
                tipoRol: ar.rol?.nombre || '', // Usado en UsuariosTable/PersonasTable
                name: ar.rol?.nombre || ''     // Usado en UsuarioDetail.vue
            })) || []
        };
    };

    /* =====================================================
     * ACTIONS
     * ===================================================== */

    /**
     * Obtiene personas sin cuenta de usuario
     */
    const fetchPersonasSinUsuario = async () => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/personas/sin-usuario`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener personas sin usuario')
            const response = await res.json()

            const data = response.data || response;
            const arrayData = Array.isArray(data) ? data : []
            personasSinUsuario.value = arrayData.map(mapPersonaData)
            return personasSinUsuario.value
        } catch (error) {
            console.error('Error fetchPersonasSinUsuario:', error)
            personasSinUsuario.value = []
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene personas con cuenta de usuario
     */
    const fetchPersonasConUsuario = async () => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/personas/con-usuario`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener personas con usuario')
            const response = await res.json()

            const data = response.data || response;
            const arrayData = Array.isArray(data) ? data : []
            personasConUsuario.value = arrayData.map(mapPersonaData)
            return personasConUsuario.value
        } catch (error) {
            console.error('Error fetchPersonasConUsuario:', error)
            personasConUsuario.value = []
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene todas las personas
     */
    const fetchPersonas = async () => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/personas`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener personas')
            const response = await res.json()

            // Si el backend devuelve { data: [...] } o [...]
            const data = response.data || response;
            const arrayData = Array.isArray(data) ? data : []
            personas.value = arrayData.map(mapPersonaData)
            return personas.value
        } catch (error) {
            console.error('Error fetchPersonas:', error)
            personas.value = []
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene una persona por ID
     */
    const fetchPersonaById = async (id) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/personas/${id}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener la persona')
            const response = await res.json()

            const data = response.data || response;
            selectedPersona.value = mapPersonaData(data)
            return selectedPersona.value
        } catch (error) {
            console.error('Error fetchPersonaById:', error)
            selectedPersona.value = null
        } finally {
            loading.value = false
        }
    }

    /**
     * Crea una nueva persona
     */
    const createPersona = async (personaData) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/personas`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(personaData)
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Error al crear persona');
            }
            const response = await res.json()
            return response
        } catch (error) {
            console.error('Error createPersona:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * Actualiza una persona existente
     */
    const updatePersona = async (id, personaData) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/personas/${id}`, {
                method: 'PUT',
                headers: authStore.authHeaders(),
                body: JSON.stringify(personaData)
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Error al actualizar persona');
            }
            const response = await res.json()
            return response
        } catch (error) {
            console.error('Error updatePersona:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * Actualiza el estado activo/inactivo de una persona
     */
    const updatePersonaStatus = async (id, activo) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/personas/${id}/status`, {
                method: 'PATCH',
                headers: authStore.authHeaders(),
                body: JSON.stringify({ activo })
            })
            if (!res.ok) throw new Error('Error al actualizar estado de la persona')
            return await res.json()
        } catch (error) {
            console.error('Error updatePersonaStatus:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * Actualiza la foto de perfil de una persona
     */
    const updatePersonaFoto = async (id, file) => {
        loading.value = true
        try {
            const formData = new FormData()
            formData.append('foto', file)

            const res = await fetch(`${API_BASE}/personas/${id}/foto`, {
                method: 'PATCH',
                headers: authStore.authHeadersMultipart(),
                body: formData
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.message || 'Error al actualizar foto de perfil')
            }
            return await res.json()
        } catch (error) {
            console.error('Error updatePersonaFoto:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    const getPersonaId = (persona) =>
        persona?.idPersona ?? persona?.id_persona ?? persona?.id

    const removePersonaFromLists = (id) => {
        const matches = (persona) => String(getPersonaId(persona)) !== String(id)
        personasConUsuario.value = personasConUsuario.value.filter(matches)
        personasSinUsuario.value = personasSinUsuario.value.filter(matches)
        personas.value = personas.value.filter(matches)
    }

    /**
     * Elimina una persona
     */
    const deletePersona = async (id) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/personas/${id}`, {
                method: 'DELETE',
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al eliminar persona')

            removePersonaFromLists(id)

            await Promise.all([
                fetchPersonasSinUsuario(),
                fetchPersonasConUsuario()
            ])

            return true
        } catch (error) {
            console.error('Error deletePersona:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    const reset = () => {
        personas.value = []
        personasSinUsuario.value = []
        personasConUsuario.value = []
        loading.value = false
        selectedPersona.value = null
    }

    return {
        personas,
        personasSinUsuario,
        personasConUsuario,
        loading,
        selectedPersona,
        fetchPersonas,
        fetchPersonasSinUsuario,
        fetchPersonasConUsuario,
        fetchPersonaById,
        createPersona,
        updatePersona,
        updatePersonaFoto,
        updatePersonaStatus,
        deletePersona,
        reset
    }
})
