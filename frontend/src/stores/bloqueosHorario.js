import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

export const useBloqueosHorarioStore = defineStore('bloqueosHorario', () => {
  const authStore = useAuthStore()
  const bloqueos = ref([])
  const cupo = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const parseError = async (res, fallback) => {
    const data = await res.json().catch(() => ({}))
    let msg = data.message || fallback
    if (Array.isArray(msg)) msg = msg.join('. ')
    return msg
  }

  const mapBloqueo = (b) => {
    if (!b) return null
    const fecha =
      typeof b.fecha === 'string'
        ? b.fecha.slice(0, 10)
        : b.fecha
          ? new Date(b.fecha).toISOString().slice(0, 10)
          : null
    return {
      id: b.idBloqueoHorario,
      idDoctor: b.doctor?.idDoctor ?? b.idDoctor,
      idAsignacion:
        b.asignacion?.idAsignacionDoctoresConsultorio ?? b.idAsignacion,
      fecha,
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
      descripcion: b.descripcion ?? null,
      raw: b,
    }
  }

  const fetchMios = async (desde, hasta) => {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      const qs = params.toString()
      const res = await fetch(
        `${API_BASE}/bloqueos-horario/mios${qs ? `?${qs}` : ''}`,
        { headers: authStore.authHeaders() },
      )
      if (!res.ok) throw new Error(await parseError(res, 'Error al cargar bloqueos'))
      const data = await res.json()
      bloqueos.value = (Array.isArray(data) ? data : []).map(mapBloqueo)
      return bloqueos.value
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchByDoctor = async (idDoctor, desde, hasta) => {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      const qs = params.toString()
      const res = await fetch(
        `${API_BASE}/bloqueos-horario/doctor/${idDoctor}${qs ? `?${qs}` : ''}`,
        { headers: authStore.authHeaders() },
      )
      if (!res.ok) throw new Error(await parseError(res, 'Error al cargar bloqueos'))
      const data = await res.json()
      bloqueos.value = (Array.isArray(data) ? data : []).map(mapBloqueo)
      return bloqueos.value
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchCupo = async (anio, mes) => {
    error.value = null
    try {
      const params = new URLSearchParams()
      if (anio) params.set('anio', String(anio))
      if (mes) params.set('mes', String(mes))
      const qs = params.toString()
      const res = await fetch(
        `${API_BASE}/bloqueos-horario/mios/cupo${qs ? `?${qs}` : ''}`,
        { headers: authStore.authHeaders() },
      )
      if (!res.ok) throw new Error(await parseError(res, 'Error al cargar cupo'))
      cupo.value = await res.json()
      return cupo.value
    } catch (err) {
      error.value = err.message
      cupo.value = null
      return null
    }
  }

  const createBloqueo = async ({ fecha, horaInicio, horaFin, descripcion }) => {
    error.value = null
    try {
      const payload = { fecha, horaInicio, horaFin }
      if (descripcion != null && String(descripcion).trim() !== '') {
        payload.descripcion = String(descripcion).trim()
      } else {
        payload.descripcion = null
      }
      const res = await fetch(`${API_BASE}/bloqueos-horario`, {
        method: 'POST',
        headers: authStore.authHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await parseError(res, 'No se pudo crear el bloqueo'))
      const created = mapBloqueo(await res.json())
      if (created) bloqueos.value = [...bloqueos.value, created]
      return { success: true, data: created }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  const deleteBloqueo = async (id) => {
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/bloqueos-horario/${id}`, {
        method: 'DELETE',
        headers: authStore.authHeaders(),
      })
      if (!res.ok) throw new Error(await parseError(res, 'No se pudo eliminar el bloqueo'))
      bloqueos.value = bloqueos.value.filter((b) => b.id !== id)
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  return {
    bloqueos,
    cupo,
    loading,
    error,
    fetchMios,
    fetchByDoctor,
    fetchCupo,
    createBloqueo,
    deleteBloqueo,
  }
})
