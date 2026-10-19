import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createApiError } from '@/utils/errorTimestamp'
import { createNetworkError, isNetworkError } from '@/utils/networkError'

const API_BASE = import.meta.env.VITE_API_URL

export const useRegistroEstudianteStore = defineStore('registroEstudiante', () => {
    const loading = ref(false)

    const request = async (url, options) => {
        let res
        try {
            res = await fetch(url, options)
        } catch (error) {
            if (isNetworkError(error)) throw createNetworkError(error)
            throw error
        }
        return res
    }

    const parseResponse = async (res) => {
        let data = {}
        try {
            data = await res.json()
        } catch {
            data = {}
        }
        if (!res.ok) {
            throw createApiError(data, 'Error en la solicitud al servidor')
        }
        return data
    }

    const fetchCaptcha = async () => {
        const res = await request(`${API_BASE}/auth/captcha`)
        return parseResponse(res)
    }

    const fetchFacultades = async () => {
        const res = await request(`${API_BASE}/facultades`)
        return parseResponse(res)
    }

    const fetchCarreras = async (facultadId) => {
        const res = await request(`${API_BASE}/carreras?facultadId=${facultadId}`)
        return parseResponse(res)
    }

    const registrarEstudiante = async (formData) => {
        loading.value = true
        try {
            const res = await request(`${API_BASE}/auth/registro/estudiante`, {
                method: 'POST',
                body: formData
            })

            let data = {}
            try {
                data = await res.json()
            } catch {
                data = {}
            }
            if (!res.ok) {
                throw createApiError(data, 'No se pudo completar el registro')
            }
            return data
        } finally {
            loading.value = false
        }
    }

    const registrarTipo = (url) => async (formData) => {
        loading.value = true
        try {
            const res = await request(`${API_BASE}${url}`, {
                method: 'POST',
                body: formData
            })

            let data = {}
            try {
                data = await res.json()
            } catch {
                data = {}
            }
            if (!res.ok) {
                throw createApiError(data, 'No se pudo completar el registro')
            }
            return data
        } finally {
            loading.value = false
        }
    }

    const registrarDocente = registrarTipo('/auth/registro/docente')
    const registrarAdministrativo = registrarTipo('/auth/registro/administrativo')
    const registrarConsultor = registrarTipo('/auth/registro/consultor')

    return {
        loading,
        fetchCaptcha,
        fetchFacultades,
        fetchCarreras,
        registrarEstudiante,
        registrarDocente,
        registrarAdministrativo,
        registrarConsultor
    }
})
