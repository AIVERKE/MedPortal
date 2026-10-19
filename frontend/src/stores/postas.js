// src/stores/postas.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const usePostasStore = defineStore('postas', () => {
  const authStore = useAuthStore()
  const postas = ref([])
  const loading = ref(false)
  const error = ref(null)

  /* =====================================================
   * NORMALIZADOR DE POSTA (para no repetir código)
   * ===================================================== */
  const mapPosta = (p) => ({
    id: p.idPostaMedica ?? p.idPosta ?? p.id,
    nombre: p.nombre,
    codigo: p.codigo,
    direccion: p.direccion,
    telefono: p.telefono,
    ubicacionGps: p.ubicacionGps,
    horarioAtencionMananaInicio: p.horarioAtencionMananaInicio,
    horarioAtencionMananaFin: p.horarioAtencionMananaFin,
    horarioAtencionTardeInicio: p.horarioAtencionTardeInicio,
    horarioAtencionTardeFin: p.horarioAtencionTardeFin,
    activo: p.activo,

    consultorios: p.consultorios?.map(c => ({
      id: c.idConsultorio,
      numeroConsultorio: c.numeroConsultorio,
      pisoUbicacion: c.pisoUbicacion,
      fechaHabilitacion: c.fechaHabilitacion,
      activo: c.activo,
      especialidad: {
        id: c.especialidad?.idEspecialidadMedica,
        nombre: c.especialidad?.nombre,
        codigo: c.especialidad?.codigo,
        descripcion: c.especialidad?.descripcion,
        tiempoCitaPorDefecto: c.especialidad?.tiempoCitaPorDefecto
      }
    })) ?? []
  })

  /* ======================
   * GET ALL
   * ====================== */
  const fetchPostas = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/postas-medicas`, {
        headers: authStore.authHeaders()
      })
      const data = await res.json()

      postas.value = data.map(mapPosta)
    } catch (err) {
      error.value = 'Error al cargar postas médicas'
      postas.value = []
    } finally {
      loading.value = false
    }
  }

  /* =====================================================
   * GET POR ESPECIALIDAD 
   * ===================================================== */
  const fetchPostasPorEspecialidad = async (idEspecialidad) => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(
        `${API_BASE}/postas-medicas/especialidad/${idEspecialidad}`,
        { headers: authStore.authHeaders() }
      )

      if (!res.ok) throw new Error()

      const data = await res.json()

      postas.value = data.map(mapPosta)

      return postas.value
    } catch (err) {
      error.value = 'Error al cargar postas por especialidad'
      postas.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  /* ======================
   * POST
   * ====================== */
  const addPosta = async (data) => {
    try {
      const payload = {
        nombre: data.nombre,
        codigo: data.codigo,
        direccion: data.direccion,
        telefono: data.telefono,
        ubicacionGps: data.ubicacionGps,
        horarioAtencionMananaInicio: data.horarioAtencionMananaInicio + ":00",
        horarioAtencionMananaFin: data.horarioAtencionMananaFin + ":00",
        horarioAtencionTardeInicio: data.horarioAtencionTardeInicio + ":00",
        horarioAtencionTardeFin: data.horarioAtencionTardeFin + ":00",
        activo: data.activo
      }

      const res = await fetch(`${API_BASE}/postas-medicas`, {
        method: 'POST',
        headers: authStore.authHeaders(),
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error()

      await fetchPostas()
      return true
    } catch (err) {
      error.value = 'Error al crear posta médica'
      return false
    }
  }

  /* ======================
   * PUT
   * ====================== */
  const updatePosta = async (data) => {
    try {
      const payload = {
        nombre: data.nombre,
        codigo: data.codigo,
        direccion: data.direccion,
        telefono: data.telefono,
        ubicacionGps: data.ubicacionGps,
        horarioAtencionMananaInicio: data.horarioAtencionMananaInicio,
        horarioAtencionMananaFin: data.horarioAtencionMananaFin,
        horarioAtencionTardeInicio: data.horarioAtencionTardeInicio,
        horarioAtencionTardeFin: data.horarioAtencionTardeFin,
        activo: data.activo
      }

      const res = await fetch(
        `${API_BASE}/postas-medicas/${data.id}`,
        {
          method: 'PUT',
          headers: authStore.authHeaders(),
          body: JSON.stringify(payload)
        }
      )

      if (!res.ok) throw new Error()

      await fetchPostas()
      return true
    } catch (err) {
      error.value = 'Error al actualizar posta médica'
      return false
    }
  }

  /* ======================
   * DELETE
   * ====================== */
  const deletePosta = async (id) => {
    try {
      const res = await fetch(
        `${API_BASE}/postas-medicas/${id}`,
        {
          method: 'DELETE',
          headers: authStore.authHeaders()
        }
      )

      if (!res.ok) throw new Error()

      postas.value = postas.value.filter(p => p.id !== id)
      return true
    } catch (err) {
      error.value = 'Error al eliminar posta médica'
      return false
    }
  }

  /* ======================
   * GET ONE (local)
   * ====================== */
  const getPosta = (id) => {
    return postas.value.find(p => p.id === id) || null
  }

  const reset = () => {
    postas.value = []
    loading.value = false
    error.value = null
  }

  return {
    postas,
    loading,
    error,
    fetchPostas,
    fetchPostasPorEspecialidad,
    addPosta,
    updatePosta,
    deletePosta,
    getPosta,
    reset
  }
})
