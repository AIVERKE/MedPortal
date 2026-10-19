import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useAdministrativosStore = defineStore('administrativos', () => {
    const authStore = useAuthStore()
    const loading = ref(false)

    const createAdministrativo = async (data) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/administrativos`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Error al crear administrativo')
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const updateAdministrativo = async (id, data) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/administrativos/${id}`, {
                method: 'PUT',
                headers: authStore.authHeaders(),
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Error al actualizar administrativo')
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const fetchByPersona = async (idPersona) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/administrativos/persona/${idPersona}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) {
                if (res.status === 404) return null
                throw new Error('Error al obtener administrativo por persona')
            }
            const text = await res.text()
            return text ? JSON.parse(text) : null
        } finally {
            loading.value = false
        }
    }

    return { loading, createAdministrativo, updateAdministrativo, fetchByPersona }
})
