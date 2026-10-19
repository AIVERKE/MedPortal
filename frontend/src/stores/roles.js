import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useRolesStore = defineStore('roles', () => {
    const authStore = useAuthStore()
    const roles = ref([])
    const loading = ref(false)

    const fetchRoles = async () => {
        loading.value = true
        try {
            const res = await fetch(`${API_BASE}/roles`, {
                headers: authStore.authHeaders()
            })
            if (!res.ok) throw new Error('Error al obtener roles')
            roles.value = await res.json()
        } catch (error) {
            console.error('Error fetching roles:', error)
        } finally {
            loading.value = false
        }
    }

    return { roles, loading, fetchRoles }
})
