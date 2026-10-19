import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL

export const useConfiguracionReservasStore = defineStore('configuracion_reservas', () => {
  const authStore = useAuthStore()
  const currentConfig = ref(null)

  const loading = ref(false)
  const error = ref(null)

  /* =========================
   * Helpers de mapeo
   * ========================= */

  const diasStringToArray = (dias) =>
    dias
      ? dias.split(',').map(d =>
        d.trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Quitar acentos para que coincida con los botones de la UI
          .toUpperCase()
      )
      : []

  const diasArrayToString = (dias) => {
    const map = {
      'LUNES': 'Lunes', 'MARTES': 'Martes', 'MIERCOLES': 'Miércoles',
      'MIÉRCOLES': 'Miércoles', 'JUEVES': 'Jueves', 'VIERNES': 'Viernes',
      'SABADO': 'Sábado', 'SÁBADO': 'Sábado', 'DOMINGO': 'Domingo'
    }
    return dias.map(d => map[d] || d).join(', ')
  }

  const mapApiToConfig = (data) => ({
    idConfiguracionReservasMedicas: data.idConfiguracionReservasMedicas,
    dias: diasStringToArray(data.diasSemana),
    hora_inicio_reserva: data.horaInicioReserva?.slice(0, 5),
    hora_fin_reserva: data.horaFinReserva?.slice(0, 5),
    dias_anticipacion_minima: data.diasAnticipacionMinima,
    dias_anticipacion_maxima: data.diasAnticipacionMaxima,
    horas_libres_mensuales: data.horasLibresMensuales ?? null,
    deleteAt: data.deleteAt
  })

  const buildPayload = (formData) => ({
    diasSemana: diasArrayToString(formData.dias),
    horaInicioReserva: formData.hora_inicio_reserva.length === 5
      ? `${formData.hora_inicio_reserva}:00`
      : formData.hora_inicio_reserva,
    horaFinReserva: formData.hora_fin_reserva.length === 5
      ? `${formData.hora_fin_reserva}:00`
      : formData.hora_fin_reserva,
    diasAnticipacionMinima: Number(formData.dias_anticipacion_minima),
    diasAnticipacionMaxima: Number(formData.dias_anticipacion_maxima),
    horasLibresMensuales:
      formData.horas_libres_mensuales === '' || formData.horas_libres_mensuales == null
        ? null
        : Number(formData.horas_libres_mensuales),
  })

  const parseServerError = async (res, fallback) => {
    const errorData = await res.json().catch(() => ({}))
    let msg = errorData.message || fallback
    if (Array.isArray(msg)) msg = msg.join('. ')
    return msg
  }

  /* =========================
   * GET
   * ========================= */
  const fetchConfig = async () => {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(
        `${API_BASE_URL}/configuracion-reservas-consultas`,
        { headers: authStore.authHeaders() }
      )

      if (res.status === 404) {
        currentConfig.value = null
        return null
      }

      if (!res.ok) {
        throw new Error('Error al obtener configuración')
      }

      const responseData = await res.json()
      const data = Array.isArray(responseData) ? responseData[0] : responseData

      if (!data) {
        currentConfig.value = null
        return null
      }

      currentConfig.value = mapApiToConfig(data)
      return currentConfig.value
    } catch (err) {
      error.value = err.message || 'Error inesperado'
      return null
    } finally {
      loading.value = false
    }
  }

  /* =========================
   * POST / PUT
   * ========================= */
  const saveConfig = async (formData) => {
    loading.value = true
    error.value = null

    try {
      const payload = buildPayload(formData)
      const id = currentConfig.value?.idConfiguracionReservasMedicas
      const isUpdate = id != null

      const url = isUpdate
        ? `${API_BASE_URL}/configuracion-reservas-consultas/${id}`
        : `${API_BASE_URL}/configuracion-reservas-consultas`

      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: authStore.authHeaders(),
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const msg = await parseServerError(
          res,
          isUpdate ? 'Error al guardar configuración' : 'Error al crear configuración'
        )
        console.error('CONFIG: Error del servidor:', msg)
        throw new Error(msg)
      }

      const data = await res.json()
      currentConfig.value = mapApiToConfig(data)

      return true
    } catch (err) {
      console.error('CONFIG: Error en el catch del Store:', err.message)
      error.value = err.message || 'Error inesperado'
      return false
    } finally {
      loading.value = false
    }
  }

  const clearConfig = () => {
    currentConfig.value = null
  }

  return {
    currentConfig,
    loading,
    error,
    fetchConfig,
    saveConfig,
    clearConfig
  }
})
