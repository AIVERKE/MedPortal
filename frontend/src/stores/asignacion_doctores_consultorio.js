import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useAsignacionDoctoresStore = defineStore('asignacion_doctores_consultorio', () => {
    const authStore = useAuthStore()
    const asignaciones = ref([])
    const loading = ref(false)
    const error = ref(null)

    /* =====================================================
     * NORMALIZADOR
     * ===================================================== */
    const mapAsignacion = (a) => {
        if (!a) return null
        return {
            id: a.idAsignacionDoctoresConsultorio,
            idDoctor: a.idDoctor || a.doctor?.idDoctor,
            idConsultorio: a.idConsultorio || a.consultorio?.idConsultorio,
            idEspecialidad: a.idEspecialidad || a.especialidad?.idEspecialidadMedica,
            diasSemana: a.diasSemana,
            turno: a.turno,
            horaInicio: a.horaInicio,
            horaFin: a.horaFin,
            duracionCita: a.duracionCita,
            cuposDisponibles: a.cuposDisponibles,
            horasLibresMensuales: a.horasLibresMensuales ?? null,
            activo: a.activo,

            // Relaciones anidadas si existen
            doctor: a.doctor || null,
            consultorio: a.consultorio || null,
            especialidad: a.especialidad || null
        }
    }

    /* =====================================================
     * ACCIONES (CRUD)
     * ===================================================== */

    const fetchAsignaciones = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/medical/asignacion-doctores-consultorio`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al cargar las asignaciones')
            const data = await res.json()
            asignaciones.value = data.map(mapAsignacion)
            return asignaciones.value
        } catch (err) {
            error.value = err.message
            return []
        } finally {
            loading.value = false
        }
    }

    const fetchAsignacionById = async (id) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/medical/asignacion-doctores-consultorio/${id}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener la asignación')
            const data = await res.json()
            return mapAsignacion(data)
        } catch (err) {
            error.value = err.message
            return null
        } finally {
            loading.value = false
        }
    }

    const createAsignacion = async (payload) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/medical/asignacion-doctores-consultorio`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload)
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.message || 'Error al crear la asignación')
            }
            const nueva = await res.json()
            const mapped = mapAsignacion(nueva)
            asignaciones.value.push(mapped)
            return true
        } catch (err) {
            error.value = err.message
            return false
        } finally {
            loading.value = false
        }
    }

    const updateAsignacion = async (id, payload) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/medical/asignacion-doctores-consultorio/${id}`, {
                method: 'PUT',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload)
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.message || 'Error al actualizar la asignación')
            }
            const actualizada = await res.json()
            const mapped = mapAsignacion(actualizada)

            const index = asignaciones.value.findIndex(a => a.id === id)
            if (index !== -1) {
                asignaciones.value[index] = mapped
            }
            return true
        } catch (err) {
            error.value = err.message
            return false
        } finally {
            loading.value = false
        }
    }

    const previsualizarImpactoTurno = async (id, payload) => {
        try {
            const res = await fetch(
                `${API_BASE}/medical/asignacion-doctores-consultorio/${id}/previsualizar-impacto`,
                {
                    method: 'POST',
                    headers: authStore.authHeaders(),
                    body: JSON.stringify(payload),
                },
            )
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.message || 'Error al previsualizar impacto')
            }
            return await res.json()
        } catch (err) {
            error.value = err.message
            return { cantidad: 0, mensaje: null, ids: [], error: err.message }
        }
    }

    const deleteAsignacion = async (id) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/medical/asignacion-doctores-consultorio/${id}`, {
                method: 'DELETE',
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al eliminar la asignación')

            asignaciones.value = asignaciones.value.filter(a => a.id !== id)
            return true
        } catch (err) {
            error.value = err.message
            return false
        } finally {
            loading.value = false
        }
    }

    const fetchAsignacionesByEspecialidad = async (idEspecialidad) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/medical/asignacion-doctores-consultorio?idEspecialidadMedica=${idEspecialidad}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al cargar las asignaciones por especialidad')
            const data = await res.json()
            asignaciones.value = data.map(mapAsignacion)
            return asignaciones.value
        } catch (err) {
            error.value = err.message
            return []
        } finally {
            loading.value = false
        }
    }

    const reset = () => {
        asignaciones.value = []
        loading.value = false
        error.value = null
    }

    return {
        asignaciones,
        loading,
        error,
        fetchAsignaciones,
        fetchAsignacionById,
        fetchAsignacionesByEspecialidad,
        createAsignacion,
        updateAsignacion,
        previsualizarImpactoTurno,
        deleteAsignacion,
        reset
    }
})
