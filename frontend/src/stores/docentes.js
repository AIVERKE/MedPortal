import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useDocentesStore = defineStore('docentes', () => {
    const authStore = useAuthStore()
    const loading = ref(false)

    const createDocente = async (data) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/docentes`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Error al crear docente')
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const updateDocente = async (id, data) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/docentes/${id}`, {
                method: 'PUT',
                headers: authStore.authHeaders(),
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Error al actualizar docente')
            return await res.json()
        } finally {
            loading.value = false
        }
    }

    const fetchByPersona = async (idPersona) => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/docentes/persona/${idPersona}`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) {
                if (res.status === 404) return null
                throw new Error('Error al obtener docente por persona')
            }
            const text = await res.text()
            return text ? JSON.parse(text) : null
        } finally {
            loading.value = false
        }
    }

    return { loading, createDocente, updateDocente, fetchByPersona }
})
