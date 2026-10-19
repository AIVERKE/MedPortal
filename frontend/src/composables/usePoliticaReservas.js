import { computed } from 'vue'

const getLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const pluralDiasHabiles = (n) => (n === 1 ? 'día hábil' : 'días hábiles')

export function usePoliticaReservas(configStore, feriadosStore, diasHabilitadosIndices) {
  const esDiaHabilParaAnticipacion = (date) => {
    const dayIndex = date.getDay()
    const indices = diasHabilitadosIndices.value
    if (!indices.includes(dayIndex)) return false

    const dateStr = getLocalDateString(date)
    return !feriadosStore.feriados.some((f) => f.fecha === dateStr)
  }

  const sumarDiasHabiles = (startDate, daysToSum) => {
    const date = new Date(startDate)
    date.setHours(0, 0, 0, 0)
    let count = 0

    if (daysToSum < 0) return date

    while (count < daysToSum) {
      date.setDate(date.getDate() + 1)
      if (esDiaHabilParaAnticipacion(date)) {
        count++
      }
    }
    return date
  }

  const minReservationDate = computed(() => {
    if (!configStore.currentConfig) return new Date()
    const days = configStore.currentConfig.dias_anticipacion_minima ?? 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return sumarDiasHabiles(today, days)
  })

  const maxReservationDate = computed(() => {
    if (!configStore.currentConfig) return new Date()
    const days = configStore.currentConfig.dias_anticipacion_maxima ?? 30
    return sumarDiasHabiles(minReservationDate.value, Math.max(0, days - 1))
  })

  const rangeMessage = computed(() => {
    if (!configStore.currentConfig) return ''
    const start = minReservationDate.value
    const end = maxReservationDate.value
    const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
    return `Reservas disponibles del ${fmt.format(start)} al ${fmt.format(end)}`
  })

  /** Texto corto para pacientes: rango + quién definió la anticipación */
  const rangeMessagePaciente = computed(() => {
    if (!configStore.currentConfig) return ''
    const min = configStore.currentConfig.dias_anticipacion_minima ?? 0
    const max = configStore.currentConfig.dias_anticipacion_maxima ?? 30
    return `${rangeMessage.value}. Un coordinador definió la anticipación mínima (${min} ${pluralDiasHabiles(min)}) y máxima (${max} ${pluralDiasHabiles(max)}).`
  })

  const politicaAnticipacionMessage = computed(() => {
    if (!configStore.currentConfig) return ''
    const min = configStore.currentConfig.dias_anticipacion_minima ?? 0
    const max = configStore.currentConfig.dias_anticipacion_maxima ?? 30
    const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
    const rangoFechas = `del ${fmt.format(minReservationDate.value)} al ${fmt.format(maxReservationDate.value)}`

    return `Anticipación mínima: ${min} ${pluralDiasHabiles(min)} · máxima: ${max} ${pluralDiasHabiles(max)} (${rangoFechas}). Ventana configurada por el director de la posta.`
  })

  return {
    minReservationDate,
    maxReservationDate,
    rangeMessage,
    rangeMessagePaciente,
    politicaAnticipacionMessage,
    sumarDiasHabiles,
    esDiaHabilParaAnticipacion,
  }
}
