import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

const parseError = async (res, fallback) => {
    const data = await res.json().catch(() => ({}))
    const message = Array.isArray(data.message) ? data.message.join(', ') : data.message
    throw new Error(message || fallback)
}

const isFile = (value) =>
    value instanceof File || (typeof Blob !== 'undefined' && value instanceof Blob)

const appendContratoFields = (formData, data) => {
    if (data.idConsultor != null) formData.append('idConsultor', String(data.idConsultor))
    if (data.idServicio != null && data.idServicio !== '') {
        formData.append('idServicio', String(data.idServicio))
    }
    if (data.unidad != null) formData.append('unidad', data.unidad)
    if (data.fechaInicioContrato) formData.append('fechaInicioContrato', data.fechaInicioContrato)
    if (data.fechaFinContrato) formData.append('fechaFinContrato', data.fechaFinContrato)
    if (data.cargo != null) formData.append('cargo', data.cargo)
    if (data.documentoContratoUrl) {
        formData.append('documentoContratoUrl', data.documentoContratoUrl)
    }
    if (isFile(data.pdfContrato)) {
        formData.append('pdfContrato', data.pdfContrato)
    }
}

export const useConsultoresStore = defineStore('consultores', () => {
    const authStore = useAuthStore()
    const loading = ref(false)

    const fetchConsultores = async () => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/consultores`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) await parseError(res, 'Error al obtener consultores')
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const createConsultor = async (data) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/consultores`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(data)
            })
            if (!res.ok) await parseError(res, 'Error al crear consultor')
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const updateConsultor = async (id, data) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/consultores/${id}`, {
                method: 'PUT',
                headers: authStore.authHeaders(),
                body: JSON.stringify(data)
            })
            if (!res.ok) await parseError(res, 'Error al actualizar consultor')
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const createContrato = async (data) => {
        loading.value = true
        try {
            const hasFile = isFile(data.pdfContrato)
            let res
            if (hasFile) {
                const formData = new FormData()
                appendContratoFields(formData, data)
                res = await fetch(`${API_BASE}/contrato`, {
                    method: 'POST',
                    headers: authStore.authHeadersMultipart(),
                    body: formData
                })
            } else {
                const { pdfContrato, ...payload } = data
                res = await fetch(`${API_BASE}/contrato`, {
                    method: 'POST',
                    headers: authStore.authHeaders(),
                    body: JSON.stringify(payload)
                })
            }
            if (!res.ok) await parseError(res, 'Error al crear contrato')
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const updateContrato = async (id, data) => {
        loading.value = true
        try {
            const hasFile = isFile(data.pdfContrato)
            let res
            if (hasFile) {
                const formData = new FormData()
                appendContratoFields(formData, data)
                res = await fetch(`${API_BASE}/contrato/${id}`, {
                    method: 'PUT',
                    headers: authStore.authHeadersMultipart(),
                    body: formData
                })
            } else {
                const { pdfContrato, ...payload } = data
                res = await fetch(`${API_BASE}/contrato/${id}`, {
                    method: 'PUT',
                    headers: authStore.authHeaders(),
                    body: JSON.stringify(payload)
                })
            }
            if (!res.ok) await parseError(res, 'Error al actualizar contrato')
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const deleteContrato = async (id) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/contrato/${id}`, {
                method: 'DELETE',
                headers: authStore.authHeaders()
            })
            if (!res.ok) await parseError(res, 'Error al eliminar contrato')
            return true
        } finally {
            loading.value = false
        }
    }

    const fetchByPersona = async (idPersona) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/consultores/persona/${idPersona}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) {
                if (res.status === 404) return null
                await parseError(res, 'Error al obtener consultor por persona')
            }
            const text = await res.text()
            return text ? JSON.parse(text) : null
        } finally {
            loading.value = false
        }
    }

    const fetchContratosByPersona = async (idPersona) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/contrato/persona/${idPersona}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) {
                if (res.status === 404) return []
                await parseError(res, 'Error al obtener contratos')
            }
            const text = await res.text()
            return text ? JSON.parse(text) : []
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        fetchConsultores,
        createConsultor,
        updateConsultor,
        createContrato,
        updateContrato,
        deleteContrato,
        fetchByPersona,
        fetchContratosByPersona
    }
})
