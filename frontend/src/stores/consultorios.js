// src/stores/consultorios.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useConsultorioStore = defineStore('consultorio', () => {
    const authStore = useAuthStore()
    const consultorios = ref([])
    const loading = ref(false)
    const error = ref(null)

    /* =====================================================
     * NORMALIZADOR DE CONSULTORIO
     * ===================================================== */
    const mapConsultorio = (c) => ({
        id: c.idConsultorioEspecialidad ?? c.idConsultorio ?? c.id,
        fechaHabilitacion: c.fechaHabilitacion,
        numeroConsultorio: c.numeroConsultorio,
        pisoUbicacion: c.pisoUbicacion,
        activo: c.activo,
        posta: c.posta ? {
            id: c.posta.idPosta ?? c.posta.id,
            nombre: c.posta.nombre,
            codigo: c.posta.codigo,
            direccion: c.posta.direccion,
            telefono: c.posta.telefono,
            horarioAtencionMananaInicio: c.posta.horarioAtencionMananaInicio,
            horarioAtencionMananaFin: c.posta.horarioAtencionMananaFin,
            horarioAtencionTardeInicio: c.posta.horarioAtencionTardeInicio,
            horarioAtencionTardeFin: c.posta.horarioAtencionTardeFin,
            activo: c.posta.activo
        } : null,
        especialidad: c.especialidad ? {
            id: c.especialidad.idEspecialidadMedica ?? c.especialidad.id,
            nombre: c.especialidad.nombre,
            codigo: c.especialidad.codigo,
            descripcion: c.especialidad.descripcion,
            tiempoCitaPorDefecto: c.especialidad.tiempoCitaPorDefecto,
            activo: c.especialidad.activo
        } : null,
        // Mantener compatibilidad con IDs directos si no hay objetos
        idPosta: c.idPosta ?? c.posta?.idPosta,
        idEspecialidad: c.idEspecialidad ?? c.especialidad?.idEspecialidadMedica
    })

    /* ======================
     * GET (ALL)
     * ====================== */
    const fetchConsultorios = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/consultorio-especialidad`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener consultorios')
            const data = await res.json()
            consultorios.value = data.map(mapConsultorio)
        } catch (err) {
            error.value = err.message || 'Error al cargar consultorios'
        } finally {
            loading.value = false
        }
    }

    /* ======================
     * GET ONE (REMOTE)
     * ====================== */
    const fetchConsultorioPorId = async (id) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/consultorio-especialidad/${id}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener consultorio')
            const data = await res.json()
            return mapConsultorio(data)
        } catch (err) {
            error.value = err.message || 'Error al cargar consultorio'
            return null
        } finally {
            loading.value = false
        }
    }

    /* =====================================================
     * GET RESERVAS POR CONSULTORIO
     * ===================================================== */
    const fetchReservasPorConsultorio = async (id) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/consultorio-especialidad/${id}/reservas`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener reservas del consultorio')
            return await res.json()
        } catch (err) {
            error.value = err.message || 'Error al cargar reservas'
            return []
        } finally {
            loading.value = false
        }
    }

    /* ======================
     * POST
     * ====================== */
    const addConsultorio = async (data) => {
        try {
            const payload = {
                idPosta: data.idPosta,
                idEspecialidad: data.idEspecialidad,
                fechaHabilitacion: data.fechaHabilitacion,
                numeroConsultorio: data.numeroConsultorio,
                pisoUbicacion: data.pisoUbicacion,
                activo: data.activo ?? true
            }

            const res = await fetch(`${API_BASE}/consultorio-especialidad`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error()
            await fetchConsultorios()
            return true
        } catch (err) {
            error.value = 'Error al crear consultorio'
            return false
        }
    }

    /* ======================
     * PUT
     * ====================== */
    const updateConsultorio = async (data) => {
        try {
            const payload = {
                idPosta: data.idPosta,
                idEspecialidad: data.idEspecialidad,
                fechaHabilitacion: data.fechaHabilitacion,
                numeroConsultorio: data.numeroConsultorio,
                pisoUbicacion: data.pisoUbicacion,
                activo: data.activo
            }

            const res = await fetch(
                `${API_BASE}/consultorio-especialidad/${data.id}`,
                {
                    method: 'PUT',
                    headers: authStore.authHeaders(),
                    body: JSON.stringify(payload)
                }
            )

            if (!res.ok) throw new Error()
            await fetchConsultorios()
            return true
        } catch (err) {
            error.value = 'Error al actualizar consultorio'
            return false
        }
    }

    /* ======================
     * DELETE (Logical)
     * ====================== */
    const deleteConsultorio = async (id) => {
        try {
            const res = await fetch(
                `${API_BASE}/consultorio-especialidad/${id}`,
                {
                    method: 'DELETE',
                    headers: authStore.authHeaders()
                }
            )

            if (!res.ok) throw new Error()
            consultorios.value = consultorios.value.filter(c => c.id !== id)
            return true
        } catch (err) {
            error.value = 'Error al eliminar consultorio'
            return false
        }
    }

    /* ======================
     * GET ONE (local)
     * ====================== */
    const getConsultorio = (id) => {
        return consultorios.value.find(c => c.id === id) || null
    }

    const reset = () => {
        consultorios.value = []
        loading.value = false
        error.value = null
    }

    return {
        consultorios,
        loading,
        error,
        fetchConsultorios,
        fetchConsultorioPorId,
        fetchReservasPorConsultorio,
        addConsultorio,
        updateConsultorio,
        deleteConsultorio,
        getConsultorio,
        reset
    }
})
