// src/stores/especialidades.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useEspecialidadStore = defineStore('especialidad', () => {
  const authStore = useAuthStore()
  const especialidades = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchEspecialidadesPublic = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/especialidad-medica`)
      if (res.status === 404) {
        especialidades.value = []
        return
      }
      if (!res.ok) throw new Error('No se pudieron cargar las especialidades')
      const data = await res.json()

      especialidades.value = data
        .filter((e) => e.activo !== false)
        .map((e) => ({
          id: e.idEspecialidadMedica,
          nombre: e.nombre,
          codigo: e.codigo,
          descripcion: e.descripcion,
          tiempoCitaPorDefecto: e.tiempoCitaPorDefecto,
          activo: e.activo,
          visible: e.visible,
        }))
    } catch (err) {
      error.value = 'Error al cargar especialidades'
      especialidades.value = []
    } finally {
      loading.value = false
    }
  }

  /* ======================
   * GET (ALL)
   * ====================== */
  const fetchEspecialidades = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/especialidad-medica`, {
        headers: authStore.authHeaders()
      })
      const data = await res.json()

      especialidades.value = data.map((e) => ({
        id: e.idEspecialidadMedica,
        nombre: e.nombre,
        codigo: e.codigo,
        descripcion: e.descripcion,
        tiempoCitaPorDefecto: e.tiempoCitaPorDefecto,
        activo: e.activo,
        visible: e.visible
      }))
    } catch (err) {
      error.value = 'Error al cargar especialidades'
    } finally {
      loading.value = false
    }
  }

  /* ======================
   * POST
   * ====================== */
  const addEspecialidad = async (data) => {
    try {
      const payload = {
        nombre: data.nombre,
        codigo: data.codigo,
        descripcion: data.descripcion,
        tiempoCitaPorDefecto: data.tiempoCitaPorDefecto,
        activo: data.activo,
        visible: data.visible
      }

      const res = await fetch(`${API_BASE}/especialidad-medica`, {
        method: 'POST',
        headers: authStore.authHeaders(),
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error()

      await fetchEspecialidades()
      return true
    } catch (err) {
      error.value = 'Error al crear especialidad'
      return false
    }
  }

  /* ======================
   * PUT
   * ====================== */
  const updateEspecialidad = async (data) => {
    try {
      const payload = {
        nombre: data.nombre,
        codigo: data.codigo,
        descripcion: data.descripcion,
        tiempoCitaPorDefecto: data.tiempoCitaPorDefecto,
        activo: data.activo,
        visible: data.visible
      }

      const res = await fetch(
        `${API_BASE}/especialidad-medica/${data.id}`,
        {
          method: 'PUT',
          headers: authStore.authHeaders(),
          body: JSON.stringify(payload)
        }
      )

      if (!res.ok) throw new Error()

      await fetchEspecialidades()
      return true
    } catch (err) {
      error.value = 'Error al actualizar especialidad'
      return false
    }
  }

  /* ======================
   * DELETE
   * ====================== */
  const deleteEspecialidad = async (id) => {
    try {
      const res = await fetch(
        `${API_BASE}/especialidad-medica/${id}`,
        {
          method: 'DELETE',
          headers: authStore.authHeaders()
        }
      )

      if (!res.ok) throw new Error()

      especialidades.value = especialidades.value.filter(e => e.id !== id)
      return true
    } catch (err) {
      error.value = 'Error al eliminar especialidad'
      return false
    }
  }

  /* ======================
   * GET ONE (local)
   * ====================== */
  const getEspecialidad = (id) => {
    return especialidades.value.find(e => e.id === id) || null
  }

  const reset = () => {
    especialidades.value = []
    loading.value = false
    error.value = null
  }

  return {
    especialidades,
    loading,
    error,
    fetchEspecialidades,
    fetchEspecialidadesPublic,
    addEspecialidad,
    updateEspecialidad,
    deleteEspecialidad,
    getEspecialidad,
    reset
  }
})
