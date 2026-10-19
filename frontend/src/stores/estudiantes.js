import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useEstudiantesStore = defineStore('estudiantes', () => {
    const authStore = useAuthStore()
    const loading = ref(false)

    const createEstudiante = async (data) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/estudiantes`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(data)
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.message || 'Error al crear estudiante')
            }
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const updateEstudiante = async (id, data) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/estudiantes/${id}`, {
                method: 'PUT',
                headers: authStore.authHeaders(),
                body: JSON.stringify(data)
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.message || 'Error al actualizar estudiante')
            }
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const updateDocumentos = async (id, { pdfMatricula, pdfCarnet }) => {
        loading.value = true
        try {
            const formData = new FormData()
            if (pdfMatricula) formData.append('pdfMatricula', pdfMatricula)
            if (pdfCarnet) formData.append('pdfCarnet', pdfCarnet)

            const res = await fetch(`${API_BASE}/estudiantes/${id}/documentos`, {
                method: 'PATCH',
                headers: authStore.authHeadersMultipart(),
                body: formData
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.message || 'Error al actualizar documentos')
            }
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const fetchByPersona = async (idPersona) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/estudiantes/persona/${idPersona}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) {
                if (res.status === 404) return null
                throw new Error('Error al obtener estudiante por persona')
            }
            const text = await res.text()
            return text ? JSON.parse(text) : null
        } finally {
            loading.value = false
        }
    }

    return { loading, createEstudiante, updateEstudiante, updateDocumentos, fetchByPersona }
})
