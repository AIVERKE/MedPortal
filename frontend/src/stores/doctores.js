// src/stores/doctores.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { resolveUploadUrl } from '@/utils/uploadUrl'

const API_BASE = import.meta.env.VITE_API_URL

export const useDoctoresStore = defineStore('doctores', () => {
    const authStore = useAuthStore()
    const doctores = ref([])
    const loading = ref(false)
    const ultimoDoctor = ref(null)
    const selectedDoctor = ref(null)

    /* =====================================================
     * MAPPER DE DOCTOR
     * ===================================================== */
    const mapDoctor = (d) => {
        // Si d.doctor existe, es una AsignacionDoctorConsultorio. 
        // Si no, asumimos que d es el objeto Doctor directamente.
        const doc = d.doctor || d;
        const persona = doc.persona || {};

        const fotoUrl = resolveUploadUrl(persona.foto) || null

        return {
            id: doc.idDoctor,
            idPersona: persona.idPersona ?? null,
            nombre: `${persona.nombres || ''} ${persona.primerApellido || ''} ${persona.segundoApellido || ''}`.trim() || 'Médico Sin Nombre',
            nombres: persona.nombres || '',
            primerApellido: persona.primerApellido || '',
            segundoApellido: persona.segundoApellido || '',
            idEspecialidad: doc.especialidad?.idEspecialidadMedica ?? null,
            tiempoCitaPorDefecto: doc.especialidad?.tiempoCitaPorDefecto ?? null,
            especialidad: doc.especialidad?.nombre || '-',
            experiencia: doc.experienciaProfesional || 'No especificada',
            proximaCita: 'Consultar disponibilidad',
            foto: fotoUrl,
            imagen: fotoUrl,
            disponible: d.activo !== undefined ? d.activo : true,
            posta: d.consultorio?.posta?.nombre || (doc.consultorios && doc.consultorios[0]?.posta?.nombre) || 'Posta Central'
        }
    }

    /* =====================================================
     * GETTERS
     * ===================================================== */
    const otrosDoctores = computed(() => {
        if (!ultimoDoctor.value) return doctores.value
        return doctores.value.filter(doc => doc.id !== ultimoDoctor.value.id)
    })

    /* =====================================================
     * ACTIONS
     * ===================================================== */

    /**
     * Obtiene doctores (de una especialidad o todos) desde el backend
     */
    const fetchDoctores = async (idEspecialidad = null) => {
        loading.value = true
        try {
            const url = idEspecialidad
                ? `${API_BASE}/doctores/especialidad/${idEspecialidad}`
                : `${API_BASE}/doctores`

            const res = await fetch(url, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener doctores')
            const response = await res.json()

            // El backend devuelve { data: [...] } para especialidad y [...] para todos
            let rawData = []
            if (Array.isArray(response)) {
                rawData = response
            } else if (response && Array.isArray(response.data)) {
                rawData = response.data
            }

            doctores.value = rawData.map(mapDoctor)
        } catch (error) {
            console.error('Error fetchDoctores:', error)
            doctores.value = []
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene el último doctor atendido para un usuario y especialidad
     */
    const fetchUltimoDoctor = async (idUsuario, idEspecialidad) => {
        try {
            const res = await fetch(`${API_BASE}/doctores/ultimo-atendido/usuario/${idUsuario}/especialidad/${idEspecialidad}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) {
                ultimoDoctor.value = null
                return
            }
            const response = await res.json()

            // La API devuelve { message: '...', data: { doctor_object } }
            if (response && response.data) {
                ultimoDoctor.value = mapDoctor(response.data)
            } else {
                ultimoDoctor.value = null
            }
        } catch (error) {
            console.error('Error fetchUltimoDoctor:', error)
            ultimoDoctor.value = null
        }
    }

    /**
     * Obtiene un doctor por ID
     */
    const fetchDoctorById = async (id) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/doctores/${id}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener el doctor')
            const response = await res.json()

            // Si el backend devuelve { data: { ... } } o { ... }
            const data = response.data || response;
            selectedDoctor.value = mapDoctor(data)
            return data
        } catch (error) {
            console.error('Error fetchDoctorById:', error)
            selectedDoctor.value = null
        } finally {
            loading.value = false
        }
    }

    /**
     * Crea un nuevo doctor
     */
    const createDoctor = async (doctorData) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/doctores`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(doctorData)
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Error al crear doctor');
            }
            const response = await res.json()
            return response
        } catch (error) {
            console.error('Error createDoctor:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * Actualiza un doctor existente
     */
    const updateDoctor = async (id, doctorData) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/doctores/${id}`, {
                method: 'PUT',
                headers: authStore.authHeaders(),
                body: JSON.stringify(doctorData)
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Error al actualizar doctor');
            }
            const response = await res.json()
            return response
        } catch (error) {
            console.error('Error updateDoctor:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    /** Actualiza teléfono de emergencia y consentimiento (self-service del doctor). */
    const updateContactoMios = async (payload) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/doctores/mios/contacto`, {
                method: 'PATCH',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                const msg = Array.isArray(errData.message)
                    ? errData.message.join(', ')
                    : (errData.message || 'Error al actualizar contacto')
                throw new Error(msg)
            }
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    /**
     * Elimina un doctor
     */
    const deleteDoctor = async (id) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/doctores/${id}`, {
                method: 'DELETE',
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al eliminar doctor')
            return true
        } catch (error) {
            console.error('Error deleteDoctor:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    const reset = () => {
        doctores.value = []
        loading.value = false
        ultimoDoctor.value = null
    }

    return {
        doctores,
        loading,
        ultimoDoctor,
        selectedDoctor,
        otrosDoctores,
        fetchDoctores,
        fetchUltimoDoctor,
        fetchDoctorById,
        createDoctor,
        updateDoctor,
        updateContactoMios,
        deleteDoctor,
        reset
    }
})
