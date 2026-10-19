import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

const API_BASE = import.meta.env.VITE_API_URL;

export const useAsignacionRolesStore = defineStore('asignacion_roles', () => {
    const authStore = useAuthStore();
    const loading = ref(false);

    const assignRole = async (idPersona, idRol, active) => {
        loading.value = true;
        try {
            const res = await fetch(`${API_BASE}/asignacion-roles`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify({ idPersona, idRol, active })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Error al asignar rol');
            }

            return await res.json();
        } catch (error) {
            console.error('Error assigning role:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const fetchAssignmentsByPersona = async (idPersona) => {
        loading.value = true;
        try {
            const res = await fetch(`${API_BASE}/asignacion-roles/${idPersona}`, {
                headers: authStore.authHeaders()
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Error al obtener asignaciones de roles');
            }

            return await res.json();
        } catch (error) {
            console.error('Error fetching assignments:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    return { loading, assignRole, fetchAssignmentsByPersona };
});
