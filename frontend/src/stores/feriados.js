// src/stores/feriados.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useFeriadosStore = defineStore('feriados', () => {
  const authStore = useAuthStore()
  const feriados = ref([])
  const loading = ref(false)
  const error = ref(null)

  /* ======================
   * GET
   * ====================== */
  const fetchFeriados = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/fecha-cierre-reservas`, {
        headers: authStore.authHeaders()
      })
      const data = await res.json()

      feriados.value = data.map((f) => {
        const [anio, mes, dia] = f.fecha.split('-')

        return {
          id: f.idFechaCierre,
          descripcion: f.descripcion,
          dia: Number(dia),
          mes: Number(mes),
          anio: Number(anio),
          fecha: f.fecha
        }
      })
    } catch (err) {
      error.value = 'Error al cargar feriados'
    } finally {
      loading.value = false
    }
  }

  /* ======================
   * POST
   * ====================== */
  const addFeriado = async (data) => {
    try {
      const payload = {
        fecha: `${data.anio}-${String(data.mes).padStart(2, '0')}-${String(data.dia).padStart(2, '0')}`,
        descripcion: data.descripcion
      }

      const res = await fetch(`${API_BASE}/fecha-cierre-reservas`, {
        method: 'POST',
        headers: authStore.authHeaders(),
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error()

      await fetchFeriados()
      return true
    } catch (err) {
      error.value = 'Error al crear feriado'
      return false
    }
  }

  /* ======================
   * PUT
   * ====================== */
  const updateFeriado = async (data) => {
    try {
      const payload = {
        fecha: `${data.anio}-${String(data.mes).padStart(2, '0')}-${String(data.dia).padStart(2, '0')}`,
        descripcion: data.descripcion
      }

      const res = await fetch(
        `${API_BASE}/fecha-cierre-reservas/${data.id}`,
        {
          method: 'PUT',
          headers: authStore.authHeaders(),
          body: JSON.stringify(payload)
        }
      )

      if (!res.ok) throw new Error()

      await fetchFeriados()
      return true
    } catch (err) {
      error.value = 'Error al actualizar feriado'
      return false
    }
  }

  /* ======================
   * DELETE
   * ====================== */
  const deleteFeriado = async (id) => {
    try {
      const res = await fetch(
        `${API_BASE}/fecha-cierre-reservas/${id}`,
        {
          method: 'DELETE',
          headers: authStore.authHeaders()
        }
      )

      if (!res.ok) throw new Error()

      feriados.value = feriados.value.filter(f => f.id !== id)
      return true
    } catch (err) {
      error.value = 'Error al eliminar feriado'
      return false
    }
  }

  /* ======================
   * GET ONE (local)
   * ====================== */
  const getFeriado = (id) => {
    return feriados.value.find(f => f.id === id) || null
  }

  return {
    feriados,
    loading,
    error,
    fetchFeriados,
    addFeriado,
    updateFeriado,
    deleteFeriado,
    getFeriado
  }
})
