<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useReservasStore } from '@/stores/reservas'
import { useAuthStore } from '@/stores/auth'
import { usePostasStore } from '@/stores/postas'
import { useDisplay } from 'vuetify'
import PersonaAvatar from '@/components/common/PersonaAvatar.vue'
import ModalConfirmación from '@/components/common/ModalConfirmación.vue'
import ModalMensaje from '@/components/common/ModalMensaje.vue'
import ReservaModal from '@/components/reservas/ReservaModal.vue'
import { validarReagendacion } from '@/utils/reservaConflicts'
import {
  extractReservaRawId,
  normalizeFechaCita,
  normalizeHoraCita,
  buildReservaQuery,
} from '@/utils/reservaIdentity'
import CalendarioMobileSemana from '@/components/calendario/CalendarioMobileSemana.vue'
import { alignSlotMaxToCompleteIntervals } from '@/utils/slotTime'
import { useBloqueosHorarioStore } from '@/stores/bloqueosHorario'
import { useTutorialStore } from '@/stores/tutorial'

const props = defineProps({
  fechaSeleccionada: { type: String, required: true },
  doctor: { type: Object, required: true },
  especialidad: { type: Object, required: true },
  reservas: { type: Array, default: () => [] },
  emergencias: { type: Array, default: () => [] },
  mostrarExtrasAgenda: { type: Boolean, default: false },
  agendarPacienteInitial: { type: Object, default: null },
  soloLectura: { type: Boolean, default: false },
})

const emit = defineEmits([
  'volver',
  'actualizado',
  'fecha-actualizada',
  'cancelar-agendar',
  'solicitar-agendar',
  'update:mostrarExtrasAgenda',
])

const reservasStore = useReservasStore()
const authStore = useAuthStore()
const postasStore = usePostasStore()
const bloqueosStore = useBloqueosHorarioStore()
const tutorialStore = useTutorialStore()
const { smAndDown, mobile } = useDisplay()
const router = useRouter()
const isMobile = computed(() => smAndDown.value)

const appDrawer = inject('appDrawer', ref(true))
const appDrawerWidth = inject('appDrawerWidth', 280)

/** En PC el banner sigue al sidebar; en móvil ocupa todo el ancho. */
const bannerStyle = computed(() => {
  const left =
    !mobile.value && appDrawer.value ? `${appDrawerWidth}px` : '0px'
  return { left }
})

const calendarHostRef = ref(null)
let calendarResizeObserver = null
let calendarSmoothResizeRaf = null

const refreshCalendarSize = () => {
  nextTick(() => {
    const api = fullCalendarRef.value?.getApi?.()
    if (api) api.updateSize()
  })
}

/** Recalcula el ancho de FullCalendar durante la animación del sidebar. */
const animateCalendarResize = (durationMs = 280) => {
  if (calendarSmoothResizeRaf) {
    cancelAnimationFrame(calendarSmoothResizeRaf)
    calendarSmoothResizeRaf = null
  }
  const start = performance.now()
  const tick = (now) => {
    refreshCalendarSize()
    if (now - start < durationMs) {
      calendarSmoothResizeRaf = requestAnimationFrame(tick)
    } else {
      calendarSmoothResizeRaf = null
      refreshCalendarSize()
    }
  }
  calendarSmoothResizeRaf = requestAnimationFrame(tick)
}

const loadingRules = ref(true)
const modoReagendar = ref(false)
const modoBloqueo = ref(false)
const reservaEnReagendacion = ref(null)
const reservasPaciente = ref([])
const conflictoMensaje = ref('')

const route = useRoute()

// Booking (agendar) state
const modoAgendar = ref(false)
const pacienteSeleccionado = ref(null)
const showReservaModal = ref(false)
const fechaSeleccionadaReserva = ref('')
const horaInicioSeleccionadaReserva = ref('')
const horaFinSeleccionadaReserva = ref('')

watch(
  () => props.agendarPacienteInitial,
  (newVal) => {
    if (newVal) {
      pacienteSeleccionado.value = newVal
      modoAgendar.value = true
      const slot = newVal.slot
      if (slot?.fecha && slot?.horaInicio && slot?.horaFin) {
        fechaSeleccionadaReserva.value = slot.fecha
        horaInicioSeleccionadaReserva.value = slot.horaInicio
        horaFinSeleccionadaReserva.value = slot.horaFin
        showReservaModal.value = true
      }
    } else {
      modoAgendar.value = false
      pacienteSeleccionado.value = null
    }
  },
  { immediate: true },
)

const salirModoAgendar = () => {
  modoAgendar.value = false
  pacienteSeleccionado.value = null
  emit('cancelar-agendar')
}

const handleReservaExitosa = () => {
  const fechaCita = fechaSeleccionadaReserva.value
  showReservaModal.value = false
  salirModoAgendar()
  emit('actualizado')
  // Mantener la semana del calendario alineada con la cita recién creada
  if (fechaCita) {
    emit('fecha-actualizada', fechaCita)
  }
}

const showAccionesCita = ref(false)
const citaAccionContext = ref(null)
const showAccionesSlot = ref(false)
const slotAccionContext = ref(null)
const reservaReagendarRawId = ref(null)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmShowNote = ref(false)
const confirmNote = ref('')
const confirmNoteLabel = ref('Mensaje (opcional)')
const confirmType = ref('warning')
const confirmAction = ref(null)

const showResultModal = ref(false)
const resultTitle = ref('')
const resultMessage = ref('')
const resultType = ref('success')

const pendingSlot = ref(null)
const isSubmitting = ref(false)
const fullCalendarRef = ref(null)
const showConfirmModal = ref(false)

const MAP_DIAS = {
  DOMINGO: 0, LUNES: 1, MARTES: 2, MIERCOLES: 3, MIÉRCOLES: 3,
  JUEVES: 4, VIERNES: 5, SABADO: 6, SÁBADO: 6,
}

const normalizeDiaTexto = (text = '') =>
  String(text)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const parseDiasSemana = (diasSemana = '') =>
  String(diasSemana)
    .split(',')
    .map((d) => normalizeDiaTexto(d))
    .filter(Boolean)

const asignacionesActivas = computed(() =>
  (props.doctor?.asignaciones || []).filter(
    (asig) => asig && asig.activo !== false && asig.horaInicio && asig.horaFin,
  ),
)

const postaCompleta = computed(() => {
  const idPosta =
    props.doctor.idPosta ??
    props.doctor.asignacion?.consultorio?.posta?.idPosta ??
    props.doctor.asignacion?.consultorio?.posta?.idPostaMedica

  if (idPosta != null) {
    const byId = postasStore.postas.find((p) => p.id === idPosta || p.idPosta === idPosta)
    if (byId) return byId
  }

  const nombrePosta = props.doctor.posta ?? props.doctor.asignacion?.consultorio?.posta?.nombre
  if (nombrePosta) {
    const byName = postasStore.postas.find((p) => p.nombre === nombrePosta)
    if (byName) return byName
  }

  return {
    id: idPosta ?? null,
    nombre: nombrePosta || 'Posta',
    horarioAtencionMananaInicio: '08:00:00',
    horarioAtencionMananaFin: '12:00:00',
    horarioAtencionTardeInicio: '14:00:00',
    horarioAtencionTardeFin: '18:00:00',
  }
})

const intervalo = computed(() => {
  const duraciones = asignacionesActivas.value
    .map((a) => Number(a.duracionCita))
    .filter((d) => Number.isFinite(d) && d > 0)
  if (duraciones.length) return Math.min(...duraciones)

  const fromAsignacion = Number(props.doctor?.asignacion?.duracionCita)
  if (Number.isFinite(fromAsignacion) && fromAsignacion > 0) return fromAsignacion

  // Fallback guía de especialidad (no debería usarse si el turno tiene duración)
  const fromEsp = Number(props.especialidad?.tiempoCitaPorDefecto)
  return Number.isFinite(fromEsp) && fromEsp > 0 ? fromEsp : 30
})

const esDiaDeTrabajoDoctor = (date) => {
  if (asignacionesActivas.value.length === 0) return false
  const turnos = getTurnosHabilitadosParaFecha(date)
  return turnos.length > 0
}

const esDiaDisponibleEnAgenda = (date) => esDiaDeTrabajoDoctor(date)

const normalizeDateStr = normalizeFechaCita
const normalizeTimeStr = normalizeHoraCita

const getLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getWeekStart = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

const getDayNameNormalized = (date) => {
  const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date)
  return normalizeDiaTexto(dayName)
}

const toMinutes = (timeStr) => {
  const normalized = normalizeTimeStr(timeStr)
  const parts = normalized.split(':').map(Number)
  return parts[0] * 60 + (parts[1] || 0)
}

const addMinutesToTime = (timeStr, minutes) => {
  const total = toMinutes(timeStr) + minutes
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

const buildEventTimes = (reserva, intervaloMin) => {
  const estado = (reserva.estado || '').toUpperCase()
  const esSinReserva = estado === 'A-SIN-RESERVA'
  const fecha = normalizeDateStr(
    esSinReserva ? (reserva.fechaAtendido || reserva.fechaCita) : reserva.fechaCita,
  )

  let horaInicio = null
  if (esSinReserva) {
    // Walk-in: horaInicioCita es null a propósito; usar horaAtendido
    if (reserva.horaAtendido) horaInicio = normalizeTimeStr(reserva.horaAtendido)
    else if (reserva.horaInicioCita) horaInicio = normalizeTimeStr(reserva.horaInicioCita)
  } else if (reserva.horaInicioCita) {
    horaInicio = normalizeTimeStr(reserva.horaInicioCita)
  }

  if (!horaInicio) {
    horaInicio = normalizeTimeStr(slotMinTime.value)
  }

  let horaFin = reserva.horaFinCita ? normalizeTimeStr(reserva.horaFinCita) : null
  if (!horaFin || toMinutes(horaFin) <= toMinutes(horaInicio)) {
    horaFin = addMinutesToTime(horaInicio, intervaloMin)
  }

  return {
    start: `${fecha}T${horaInicio}`,
    end: `${fecha}T${horaFin}`,
  }
}

const ESTADOS_CANCELADOS = ['CANCELADA', 'CANCELADO', 'RECHAZADA', 'ANULADA']

const weekStart = computed(() => getWeekStart(props.fechaSeleccionada))

const weekEnd = computed(() => {
  const end = new Date(weekStart.value)
  end.setDate(end.getDate() + 6)
  return getLocalDateString(end)
})

const getTurnosHabilitadosParaFecha = (date) => {
  const dayName = getDayNameNormalized(date)
  return asignacionesActivas.value
    .filter((asig) => {
      const dias = parseDiasSemana(asig.diasSemana)
      if (!dias.length) return true
      return dias.includes(dayName)
    })
    .map((asig) => ({
      inicio: normalizeTimeStr(asig.horaInicio),
      fin: normalizeTimeStr(asig.horaFin),
      turno: asig.turno,
      duracion: Number(asig.duracionCita) > 0 ? Number(asig.duracionCita) : null,
    }))
}

const slotMinTime = computed(() => {
  const turnosBase = asignacionesActivas.value
    .map((asig) => normalizeTimeStr(asig.horaInicio))
    .filter(Boolean)

  const candidates = turnosBase.length
    ? [...turnosBase]
    : [
        props.doctor.asignacion?.horaInicio,
        postaCompleta.value.horarioAtencionMananaInicio,
        postaCompleta.value.horarioAtencionTardeInicio,
        '08:00:00',
      ].filter(Boolean).map(normalizeTimeStr)

  // Incluir reservas y bloqueos de la semana visible para no ocultar citas fuera del turno
  reservasSemanaVisible.value.forEach((r) => {
    if (r.horaInicioCita) candidates.push(normalizeTimeStr(r.horaInicioCita))
    else if (r.horaAtendido) candidates.push(normalizeTimeStr(r.horaAtendido))
  })
  ;(bloqueosStore.bloqueos || []).forEach((b) => {
    const fecha = b.fecha
    if (!fecha) return
    const inicio = getLocalDateString(weekStart.value)
    const fin = weekEnd.value
    if (fecha < inicio || fecha > fin) return
    if (b.horaInicio) candidates.push(normalizeTimeStr(b.horaInicio))
  })

  return candidates.sort()[0]
})

const slotMaxTimeRaw = computed(() => {
  const turnosBase = asignacionesActivas.value
    .map((asig) => normalizeTimeStr(asig.horaFin))
    .filter(Boolean)

  const candidates = turnosBase.length
    ? [...turnosBase]
    : [
        props.doctor.asignacion?.horaFin,
        postaCompleta.value.horarioAtencionMananaFin,
        postaCompleta.value.horarioAtencionTardeFin,
        '18:00:00',
      ].filter(Boolean).map(normalizeTimeStr)

  reservasSemanaVisible.value.forEach((r) => {
    if (r.horaFinCita) candidates.push(normalizeTimeStr(r.horaFinCita))
    else if (r.horaAtendido) {
      candidates.push(addMinutesToTime(normalizeTimeStr(r.horaAtendido), intervalo.value))
    }
  })
  ;(bloqueosStore.bloqueos || []).forEach((b) => {
    const fecha = b.fecha
    if (!fecha) return
    const inicio = getLocalDateString(weekStart.value)
    const fin = weekEnd.value
    if (fecha < inicio || fecha > fin) return
    if (b.horaFin) candidates.push(normalizeTimeStr(b.horaFin))
  })

  return candidates.sort().reverse()[0]
})

// Ej. 08:00-12:00 con 45 min -> 11:45, para no mostrar el residuo incompleto.
const slotMaxTime = computed(() =>
  alignSlotMaxToCompleteIntervals(slotMinTime.value, slotMaxTimeRaw.value, intervalo.value),
)

const isHorarioDentroTurno = (dateObj) => {
  const turnos = getTurnosHabilitadosParaFecha(dateObj)
  if (!turnos.length) return false
  const inicioMin = toMinutes(dateObj.toTimeString().slice(0, 8))
  const finMin = inicioMin + intervalo.value

  return turnos.some((turno) => {
    const turnoInicioMin = toMinutes(turno.inicio)
    const turnoFinMin = toMinutes(turno.fin)
    return inicioMin >= turnoInicioMin && finMin <= turnoFinMin
  })
}

const turnosMobilePorDia = computed(() => {
  const byDay = {}
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(weekStart.value)
    day.setDate(day.getDate() + i)
    byDay[getLocalDateString(day)] = getTurnosHabilitadosParaFecha(day)
  }
  return byDay
})

const durationFormatted = computed(() => {
  const totalMinutes = intervalo.value || 30
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
})

const mostrarExtrasAgendaLocal = computed({
  get: () => props.mostrarExtrasAgenda,
  set: (val) => emit('update:mostrarExtrasAgenda', Boolean(val)),
})

const reservasActivas = computed(() =>
  props.reservas.filter((r) => {
    const estado = (r.estado || '').toUpperCase()
    if (ESTADOS_CANCELADOS.includes(estado)) return false
    if (estado === 'A-SIN-RESERVA' && !props.mostrarExtrasAgenda) return false
    if (!r.fechaCita && !(estado === 'A-SIN-RESERVA' && r.fechaAtendido)) return false
    if (estado === 'A-SIN-RESERVA') return Boolean(r.horaAtendido || r.horaInicioCita || r.horaFinCita)
    return Boolean(r.horaInicioCita)
  }),
)

const reservasSemanaVisible = computed(() => {
  const inicio = getLocalDateString(weekStart.value)
  const fin = weekEnd.value
  return reservasActivas.value.filter((r) => {
    const fecha = normalizeDateStr(r.fechaCita)
    return fecha >= inicio && fecha <= fin
  })
})

const eventosReservas = computed(() =>
  reservasSemanaVisible.value.map((r) => {
    const estado = (r.estado || '').toUpperCase()
    const eventoRawId = r.rawId ?? r.idReservaPaciente ?? extractReservaRawId(r)
    let bgColor = '#e3f2fd'
    let borderColor = '#bbdefb'
    let textColor = '#1976d2'
    let className = 'event-mine'

    if (estado === 'PRESENTE') {
      bgColor = '#e8f5e9'
      borderColor = '#a5d6a7'
      textColor = '#2e7d32'
      className = 'event-mine'
    } else if (estado === 'ATRASO' || estado === 'ABANDONO') {
      bgColor = '#c62828'
      borderColor = '#b71c1c'
      textColor = '#ffffff'
      className = 'event-atraso'
    } else if (estado === 'A-SIN-RESERVA') {
      bgColor = '#fff3e0'
      borderColor = '#ffe0b2'
      textColor = '#ef6c00'
      className = 'event-mine-other'
    } else if (['ATENDIDO', 'A-FUERA-HORARIO'].includes(estado)) {
      bgColor = '#f5f5f5'
      borderColor = '#e0e0e0'
      textColor = '#9e9e9e'
      className = 'event-reserved'
    }

    const pacienteNombre = r.paciente?.nombre || r.usuario?.persona?.nombres || 'Paciente'
    const { start, end } = buildEventTimes(r, intervalo.value)
    const title =
      estado === 'ATRASO' || estado === 'ABANDONO'
        ? `${pacienteNombre} · ATRASO`
        : estado === 'A-SIN-RESERVA'
          ? `${pacienteNombre} · Sin reserva`
          : pacienteNombre

    return {
      id: eventoRawId != null ? String(eventoRawId) : (r.id != null ? String(r.id) : `sin-id-${start}`),
      title,
      start,
      end,
      display: 'block',
      overlap: false,
      editable: false,
      backgroundColor: bgColor,
      borderColor: borderColor,
      textColor: textColor,
      classNames: [className],
      extendedProps: { reserva: r, rawId: eventoRawId ?? null, tipo: 'reserva' },
    }
  }),
)

const eventosBloqueos = computed(() => {
  const inicio = getLocalDateString(weekStart.value)
  const fin = weekEnd.value
  return (bloqueosStore.bloqueos || [])
    .filter((b) => b.fecha && b.fecha >= inicio && b.fecha <= fin)
    .map((b) => {
      const horaInicio = normalizeTimeStr(b.horaInicio)
      const horaFin = normalizeTimeStr(b.horaFin)
      return {
        id: `bloqueo-${b.id}`,
        title: b.descripcion?.trim() ? b.descripcion.trim() : 'Bloqueo',
        start: `${b.fecha}T${horaInicio}`,
        end: `${b.fecha}T${horaFin}`,
        display: 'block',
        overlap: false,
        editable: false,
        backgroundColor: '#eceff1',
        borderColor: '#90a4ae',
        textColor: '#455a64',
        classNames: ['event-bloqueo'],
        extendedProps: { bloqueo: b, tipo: 'bloqueo' },
      }
    })
})

const eventosEmergencias = computed(() => {
  if (!props.mostrarExtrasAgenda) return []
  const inicio = getLocalDateString(weekStart.value)
  const fin = weekEnd.value
  return (props.emergencias || [])
    .filter((e) => {
      const fecha = normalizeDateStr(e.fechaAtencion)
      return fecha && fecha >= inicio && fecha <= fin && e.horaInicio
    })
    .map((e) => {
      const fecha = normalizeDateStr(e.fechaAtencion)
      const horaInicio = normalizeTimeStr(e.horaInicio)
      let horaFin = e.horaFin ? normalizeTimeStr(e.horaFin) : null
      if (!horaFin || toMinutes(horaFin) <= toMinutes(horaInicio)) {
        horaFin = addMinutesToTime(horaInicio, intervalo.value)
      }
      const nombre = e.nombrePaciente || 'Emergencia'
      return {
        id: `emergencia-${e.idEmergencia || e.id}`,
        title: `${nombre} · Emergencia`,
        start: `${fecha}T${horaInicio}`,
        end: `${fecha}T${horaFin}`,
        display: 'block',
        overlap: false,
        editable: false,
        backgroundColor: '#ffebee',
        borderColor: '#ef9a9a',
        textColor: '#c62828',
        classNames: ['event-emergencia'],
        extendedProps: { emergencia: e, tipo: 'emergencia' },
      }
    })
})

const eventosCalendario = computed(() => [
  ...eventosReservas.value,
  ...eventosBloqueos.value,
  ...eventosEmergencias.value,
])

const cupoResumen = computed(() => {
  const c = bloqueosStore.cupo
  if (!c) return null
  const usadas = Number(c.gastadasHoras ?? 0)
  const total = Number(c.cupoHoras ?? 0)
  const rest = Number(c.restantesHoras ?? 0)
  const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
  return `${fmt(usadas)} / ${fmt(total)} h usadas · ${fmt(rest)} h libres`
})

const syncCalendarEvents = () => {
  nextTick(() => {
    const api = fullCalendarRef.value?.getApi?.()
    if (!api) return
    api.removeAllEvents()
    eventosCalendario.value.forEach((event) => api.addEvent(event))
    api.updateSize()
  })
}

watch(eventosCalendario, syncCalendarEvents, { deep: true })

watch(
  () => props.reservas,
  () => syncCalendarEvents(),
  { deep: true },
)

const refreshBloqueosSemana = async () => {
  const desde = getLocalDateString(weekStart.value)
  const hasta = weekEnd.value
  const d = new Date(props.fechaSeleccionada + 'T00:00:00')
  const idDoctor = props.doctor?.id ?? props.doctor?.idDoctor
  const cargarBloqueos =
    props.soloLectura && idDoctor
      ? bloqueosStore.fetchByDoctor(idDoctor, desde, hasta)
      : bloqueosStore.fetchMios(desde, hasta)
  await Promise.all([
    cargarBloqueos,
    props.soloLectura
      ? Promise.resolve()
      : bloqueosStore.fetchCupo(d.getFullYear(), d.getMonth() + 1),
  ])
  syncCalendarEvents()
  nextTick(() => {
    const api = fullCalendarRef.value?.getApi?.()
    if (api) api.updateSize()
  })
}

const applySlotOptions = () => {
  const api = fullCalendarRef.value?.getApi?.()
  if (!api) return
  api.setOption('slotMinTime', slotMinTime.value)
  api.setOption('slotMaxTime', slotMaxTime.value)
  api.setOption('slotDuration', durationFormatted.value)
  api.setOption('slotLabelInterval', durationFormatted.value)
  api.setOption('defaultTimedEventDuration', durationFormatted.value)
  api.updateSize()
}

watch([slotMinTime, slotMaxTime, durationFormatted], () => {
  nextTick(applySlotOptions)
})

watch(
  () => weekStart.value,
  () => {
    nextTick(async () => {
      const api = fullCalendarRef.value?.getApi?.()
      const target = getLocalDateString(weekStart.value)
      if (api) {
        const visible = getLocalDateString(api.view?.currentStart || api.getDate())
        if (visible !== target) api.gotoDate(weekStart.value)
      }
      await refreshBloqueosSemana()
      applySlotOptions()
    })
  },
)

watch(
  () => props.doctor?.id ?? props.doctor?.idDoctor,
  () => {
    refreshBloqueosSemana()
  },
)

onMounted(async () => {
  loadingRules.value = true
  if (postasStore.postas.length === 0) {
    await postasStore.fetchPostas()
  }
  await refreshBloqueosSemana()
  loadingRules.value = false
  nextTick(() => {
    applySlotOptions()
    syncCalendarEvents()
    if (typeof ResizeObserver !== 'undefined' && calendarHostRef.value) {
      calendarResizeObserver = new ResizeObserver(() => {
        refreshCalendarSize()
      })
      calendarResizeObserver.observe(calendarHostRef.value)
    }
    refreshCalendarSize()
  })
})

onUnmounted(() => {
  calendarResizeObserver?.disconnect()
  calendarResizeObserver = null
  if (calendarSmoothResizeRaf) {
    cancelAnimationFrame(calendarSmoothResizeRaf)
    calendarSmoothResizeRaf = null
  }
})

watch(
  () => [appDrawer.value, mobile.value],
  () => {
    animateCalendarResize(300)
  },
)

const puedeGestionar = (reserva) => {
  const estado = (reserva?.estado || '').toUpperCase()
  return estado === 'PENDIENTE' && reserva.fechaCita && reserva.horaInicioCita
}

const abrirAccionesCita = async (reserva, evento = null) => {
  if (!reserva) return

  const rawIdFromEvent = evento?.extendedProps?.rawId ?? extractReservaRawId(evento?.id)
  let ctx = rawIdFromEvent
    ? { reserva, rawId: rawIdFromEvent }
    : await reservasStore.ensureReservaIdentificada(
        reserva,
        props.doctor?.idPersona ?? authStore.user?.idPersona,
      )

  if (!ctx?.rawId) {
    resultTitle.value = 'Error'
    resultMessage.value = 'No se pudo identificar la cita seleccionada. Recarga la agenda e intenta de nuevo.'
    resultType.value = 'error'
    showResultModal.value = true
    return
  }

  citaAccionContext.value = { ...ctx, evento }
  showAccionesCita.value = true
}

const iniciarModoBloqueo = async () => {
  if (modoReagendar.value || modoAgendar.value) return
  modoBloqueo.value = true
  await refreshBloqueosSemana()
}

const salirModoBloqueo = () => {
  modoBloqueo.value = false
}

const showBloqueoFormModal = ref(false)
const bloqueoForm = ref({
  modo: 'slot', // 'slot' | 'day'
  fecha: '',
  horaInicio: '',
  horaFin: '',
  descripcion: '',
  slotsCount: 0,
})

const minFechaBloqueoDia = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 1)
  return getLocalDateString(d)
})

const esFechaFuturaParaBloqueo = (fechaStr) => {
  const fecha = normalizeDateStr(fechaStr)
  return Boolean(fecha && fecha >= minFechaBloqueoDia.value)
}

const formatFechaDMY = (fechaIso) => {
  if (!fechaIso) return ''
  const [y, m, d] = String(fechaIso).slice(0, 10).split('-')
  if (!y || !m || !d) return String(fechaIso)
  return `${d}/${m}/${y}`
}

const menuFechaBloqueo = ref(false)

const fechaBloqueoPicker = computed({
  get() {
    if (!bloqueoForm.value.fecha) return null
    return new Date(bloqueoForm.value.fecha + 'T00:00:00')
  },
  set(val) {
    if (!val) return
    const date = val instanceof Date ? val : new Date(val)
    if (Number.isNaN(date.getTime())) return
    bloqueoForm.value.fecha = getLocalDateString(date)
    menuFechaBloqueo.value = false
  },
})

const minFechaBloqueoDate = computed(
  () => new Date(minFechaBloqueoDia.value + 'T00:00:00'),
)

const abrirFormBloqueoSlot = (fechaCita, horaInicioCita, horaFinCita) => {
  if (!esFechaFuturaParaBloqueo(fechaCita)) {
    conflictoMensaje.value = 'Solo se pueden bloquear horarios de días futuros (a partir de mañana).'
    return
  }
  bloqueoForm.value = {
    modo: 'slot',
    fecha: fechaCita,
    horaInicio: horaInicioCita,
    horaFin: horaFinCita,
    descripcion: 'Almuerzo',
    slotsCount: 1,
  }
  showBloqueoFormModal.value = true
}

const abrirFormBloqueoDia = () => {
  bloqueoForm.value = {
    modo: 'day',
    fecha: minFechaBloqueoDia.value,
    horaInicio: '',
    horaFin: '',
    descripcion: '',
    slotsCount: 0,
  }
  showBloqueoFormModal.value = true
}

const confirmarEliminarBloqueo = (bloqueo) => {
  if (!bloqueo?.id) return
  const hora = (bloqueo.horaInicio || '').slice(0, 5)
  const desc = bloqueo.descripcion ? ` (${bloqueo.descripcion})` : ''
  confirmTitle.value = 'Quitar bloqueo'
  confirmMessage.value = `¿Eliminar el bloqueo del ${bloqueo.fecha} a las ${hora}${desc}? Se recuperará ese tiempo del cupo mensual.`
  confirmType.value = 'warning'
  confirmShowNote.value = false
  confirmNote.value = ''
  confirmAction.value = async () => {
    isSubmitting.value = true
    const result = await bloqueosStore.deleteBloqueo(bloqueo.id)
    isSubmitting.value = false
    if (result.success) {
      await refreshBloqueosSemana()
      resultTitle.value = 'Bloqueo eliminado'
      resultMessage.value = 'El horario quedó disponible nuevamente.'
      resultType.value = 'success'
      showResultModal.value = true
    } else {
      resultTitle.value = 'Error'
      resultMessage.value = result.error || bloqueosStore.error || 'No se pudo eliminar el bloqueo.'
      resultType.value = 'error'
      showResultModal.value = true
    }
  }
  showConfirmModal.value = true
}

const crearBloqueoEnSlot = async (fechaCita, horaInicioCita, horaFinCita, descripcion) => {
  if (!esFechaFuturaParaBloqueo(fechaCita)) {
    return {
      ok: false,
      error: 'Solo se pueden bloquear horarios de días futuros (a partir de mañana).',
    }
  }
  isSubmitting.value = true
  const result = await bloqueosStore.createBloqueo({
    fecha: fechaCita,
    horaInicio: horaInicioCita,
    horaFin: horaFinCita,
    descripcion,
  })
  isSubmitting.value = false
  if (result.success) {
    await refreshBloqueosSemana()
    return { ok: true }
  }
  return { ok: false, error: result.error || bloqueosStore.error }
}

const slotsLibresDelDia = (fechaStr) => {
  const date = new Date(fechaStr + 'T00:00:00')
  const turnos = getTurnosHabilitadosParaFecha(date)
  const slots = []
  const estadosActivos = ['PENDIENTE', 'PRESENTE', 'ATRASO']

  const slotOcupado = (horaInicio, horaFin) => {
    const startMin = toMinutes(horaInicio)
    const endMin = toMinutes(horaFin)

    const reservaChoca = (props.reservas || []).some((r) => {
      if (normalizeDateStr(r.fechaCita) !== fechaStr) return false
      if (!estadosActivos.includes(String(r.estado || '').toUpperCase())) return false
      if (!r.horaInicioCita || !r.horaFinCita) return false
      const a = toMinutes(r.horaInicioCita)
      const b = toMinutes(r.horaFinCita)
      return startMin < b && endMin > a
    })
    if (reservaChoca) return true

    return (bloqueosStore.bloqueos || []).some((b) => {
      if (b.fecha !== fechaStr) return false
      const a = toMinutes(b.horaInicio)
      const bMin = toMinutes(b.horaFin)
      return startMin < bMin && endMin > a
    })
  }

  for (const turno of turnos) {
    const duracion = turno.duracion || intervalo.value
    let cursor = toMinutes(turno.inicio)
    const fin = toMinutes(turno.fin)
    while (cursor + duracion <= fin) {
      const horaInicio = addMinutesToTime('00:00:00', cursor).slice(0, 8)
      const horaFin = addMinutesToTime('00:00:00', cursor + duracion).slice(0, 8)
      const start = new Date(`${fechaStr}T${horaInicio}`)
      if (start.getTime() <= Date.now()) {
        cursor += duracion
        continue
      }
      if (!slotOcupado(horaInicio, horaFin)) {
        slots.push({ fecha: fechaStr, horaInicio, horaFin })
      }
      cursor += duracion
    }
  }
  return slots
}

const submitBloqueoForm = async () => {
  const form = bloqueoForm.value
  const descripcion = form.descripcion?.trim() || null

  if (form.modo === 'slot') {
    showBloqueoFormModal.value = false
    const result = await crearBloqueoEnSlot(
      form.fecha,
      form.horaInicio,
      form.horaFin,
      descripcion,
    )
    if (result.ok) {
      resultTitle.value = 'Horario bloqueado'
      resultMessage.value = 'El slot ya no estará disponible para pacientes.'
      resultType.value = 'success'
      showResultModal.value = true
    } else {
      resultTitle.value = 'No se pudo bloquear'
      resultMessage.value = result.error || 'Error al crear el bloqueo.'
      resultType.value = 'error'
      showResultModal.value = true
    }
    return
  }

  // modo day
  const fechaStr = form.fecha
  if (!fechaStr || fechaStr < minFechaBloqueoDia.value) {
    conflictoMensaje.value = 'Selecciona un día futuro para bloquear (a partir de mañana).'
    return
  }
  if (!esDiaDisponibleEnAgenda(new Date(fechaStr + 'T00:00:00'))) {
    conflictoMensaje.value = 'Ese día no tiene turnos asignados.'
    return
  }

  // Cargar bloqueos de esa fecha si no están en la semana visible
  await bloqueosStore.fetchMios(fechaStr, fechaStr)

  const libres = slotsLibresDelDia(fechaStr)
  if (!libres.length) {
    showBloqueoFormModal.value = false
    conflictoMensaje.value = 'No hay slots libres futuros para bloquear en ese día.'
    return
  }

  showBloqueoFormModal.value = false
  isSubmitting.value = true
  let ok = 0
  let fail = 0
  const erroresUnicos = []
  for (const slot of libres) {
    const result = await bloqueosStore.createBloqueo({
      ...slot,
      descripcion,
    })
    if (result.success) ok += 1
    else {
      fail += 1
      const msg = result.error || 'Error al bloquear'
      if (!erroresUnicos.includes(msg)) erroresUnicos.push(msg)
    }
  }
  await refreshBloqueosSemana()
  isSubmitting.value = false
  resultTitle.value = 'Bloqueo de día'
  const detalleErrores = erroresUnicos.length ? ` ${erroresUnicos.join(' ')}` : ''
  resultMessage.value = `Bloqueados: ${ok}. Omitidos/fallidos: ${fail}.${detalleErrores}`
  if (ok > 0 && fail > 0) resultType.value = 'warning'
  else if (ok > 0) resultType.value = 'success'
  else resultType.value = 'error'
  showResultModal.value = true
}

const bloquearDiaCompleto = () => {
  abrirFormBloqueoDia()
}

const mostrarCitaSoloLectura = (reserva) => {
  if (!reserva) return
  resultTitle.value = 'Cita'
  resultMessage.value = `${reserva.paciente?.nombre || 'Paciente'} · ${normalizeDateStr(reserva.fechaCita)} ${normalizeTimeStr(reserva.horaInicioCita).slice(0, 5)} · ${reserva.estado || ''}`
  resultType.value = 'info'
  showResultModal.value = true
}

const handleEventClick = (info) => {
  const tipo = info.event.extendedProps?.tipo
  if (tipo === 'emergencia') {
    const em = info.event.extendedProps?.emergencia
    if (!em) return
    resultTitle.value = 'Emergencia'
    resultMessage.value = `${em.nombrePaciente || 'Paciente'} · ${normalizeDateStr(em.fechaAtencion)} ${(em.horaInicio || '').slice(0, 5)}${em.horaFin ? `–${String(em.horaFin).slice(0, 5)}` : ''}${em.descripcionCaso ? `\n\n${em.descripcionCaso}` : ''}`
    resultType.value = 'info'
    showResultModal.value = true
    return
  }
  if (props.soloLectura) {
    if (tipo === 'reserva') mostrarCitaSoloLectura(info.event.extendedProps?.reserva)
    return
  }
  if (tipo === 'bloqueo') {
    const bloqueo = info.event.extendedProps?.bloqueo
    if (!bloqueo) return
    const fechaStr = bloqueo.fecha
    const hora = normalizeTimeStr(bloqueo.horaInicio)
    const inicio = new Date(`${fechaStr}T${hora}`)
    if (!(inicio.getTime() > Date.now())) {
      conflictoMensaje.value = 'Solo se pueden eliminar bloqueos futuros.'
      return
    }
    confirmarEliminarBloqueo(bloqueo)
    return
  }
  if (modoReagendar.value || modoBloqueo.value) return
  const reserva = info.event.extendedProps?.reserva
  if (!reserva) return
  abrirAccionesCita(reserva, info.event)
}

const verCita = () => {
  const ctx = citaAccionContext.value
  if (!ctx?.reserva) return
  const query = buildReservaQuery({ ...ctx.reserva, rawId: ctx.rawId })
  router.push({ path: '/doctor/home', query })
  showAccionesCita.value = false
}

const salirModoReagendar = () => {
  modoReagendar.value = false
  reservaEnReagendacion.value = null
  reservaReagendarRawId.value = null
  reservasPaciente.value = []
  conflictoMensaje.value = ''
  pendingSlot.value = null
}

const iniciarReagendar = async () => {
  const ctx = citaAccionContext.value
  showAccionesCita.value = false
  showAccionesSlot.value = false
  if (!ctx?.reserva || !ctx.rawId) return

  const reserva = ctx.reserva
  const rawId = ctx.rawId

  // Activar de inmediato: si esperamos al fetch, el click puede abrir el menú de slot vacío
  reservaReagendarRawId.value = rawId
  reservaEnReagendacion.value = reserva
  modoReagendar.value = true
  conflictoMensaje.value = ''
  reservasPaciente.value = []

  try {
    const idUsuario = reserva.idUsuario || reserva.paciente?.id
    if (!idUsuario) return
    const todas = await reservasStore.fetchReservasByUsuario(idUsuario)
    // Si el usuario canceló el modo mientras cargábamos, no pisar el estado
    if (!modoReagendar.value || reservaReagendarRawId.value !== rawId) return
    reservasPaciente.value = (todas || []).filter((r) =>
      ['PENDIENTE', 'PRESENTE', 'ATRASO'].includes((r.estado || '').toUpperCase()),
    )
  } catch {
    if (modoReagendar.value && reservaReagendarRawId.value === rawId) {
      reservasPaciente.value = []
    }
  }
}

const iniciarCancelar = () => {
  const ctx = citaAccionContext.value
  showAccionesCita.value = false
  const reserva = ctx?.reserva
  if (!reserva) return

  const paciente = reserva.paciente?.nombre || 'el paciente'
  confirmTitle.value = 'Confirmar cancelación'
  confirmMessage.value = `¿Estás seguro de cancelar la cita de ${paciente} el ${reserva.fechaCita} a las ${(reserva.horaInicioCita || '').slice(0, 5)}?`
  confirmType.value = 'error'
  confirmShowNote.value = true
  confirmNote.value = ''
  confirmNoteLabel.value = 'Mensaje para el paciente (opcional)'
  confirmAction.value = async () => {
    if (tutorialStore.isDemoGestionCitas) {
      showConfirmModal.value = false
      return
    }
    isSubmitting.value = true
    const result = await reservasStore.cancelarReservaDoctor(ctx.rawId ?? reserva, confirmNote.value)
    isSubmitting.value = false
    if (result.success) {
      resultTitle.value = 'Cita cancelada'
      resultMessage.value = 'La cita fue cancelada correctamente.'
      resultType.value = 'success'
      showResultModal.value = true
      emit('actualizado')
      nextTick(syncCalendarEvents)
    } else {
      resultTitle.value = 'Error'
      resultMessage.value = reservasStore.error || 'No se pudo cancelar la cita.'
      resultType.value = 'error'
      showResultModal.value = true
    }
  }
  showConfirmModal.value = true
}

const handleDateClick = (info) => {
  if (props.soloLectura) return
  const start = info.date
  if (!esDiaDisponibleEnAgenda(start)) return
  if (!isHorarioDentroTurno(start)) {
    conflictoMensaje.value = 'La hora seleccionada está fuera de los turnos habilitados del doctor.'
    return
  }

  const end = new Date(start.getTime() + intervalo.value * 60000)

  if (modoBloqueo.value) {
    const fechaCita = getLocalDateString(start)
    if (!esFechaFuturaParaBloqueo(fechaCita)) {
      conflictoMensaje.value =
        'Solo se pueden bloquear horarios de días futuros (a partir de mañana).'
      return
    }
    const horaInicioCita = start.toTimeString().slice(0, 8)
    const horaFinCita = end.toTimeString().slice(0, 8)

    const ocupado = eventosCalendario.value.some((evento) => {
      const eventStart = new Date(evento.start)
      const eventEnd = new Date(evento.end)
      return start < eventEnd && end > eventStart
    })
    if (ocupado) {
      conflictoMensaje.value = 'Ese horario ya está ocupado o bloqueado.'
      return
    }

    abrirFormBloqueoSlot(fechaCita, horaInicioCita, horaFinCita)
    return
  }

  if (modoAgendar.value && pacienteSeleccionado.value) {
    const idUsuarioPaciente = Number(pacienteSeleccionado.value.idUsuario)
    if (!idUsuarioPaciente || Number.isNaN(idUsuarioPaciente)) {
      conflictoMensaje.value =
        'No se pudo identificar al paciente seleccionado. Cancela y vuelve a elegir el paciente.'
      return
    }

    const existeReserva = eventosCalendario.value.some((evento) => {
      const eventStart = new Date(evento.start)
      const eventEnd = new Date(evento.end)
      return start < eventEnd && end > eventStart
    })

    if (existeReserva) {
      conflictoMensaje.value = 'Este horario ya está ocupado por otro paciente. Elige otro horario.'
      return
    }

    fechaSeleccionadaReserva.value = getLocalDateString(start)
    horaInicioSeleccionadaReserva.value = start.toTimeString().slice(0, 8)
    horaFinSeleccionadaReserva.value = end.toTimeString().slice(0, 8)
    showReservaModal.value = true
    return
  }

  if (modoReagendar.value && reservaEnReagendacion.value) {
    showAccionesSlot.value = false
    const rawIdActual = reservaReagendarRawId.value

    const existeReserva = eventosCalendario.value.some((evento) => {
      const evRaw =
        evento.extendedProps?.rawId ??
        extractReservaRawId(evento.extendedProps?.reserva) ??
        extractReservaRawId(evento.id)
      if (evRaw != null && String(evRaw) === String(rawIdActual)) return false
      // Solo citas/bloqueos reales cuentan como ocupación
      if (!evento.start || !evento.end) return false
      const eventStart = new Date(evento.start)
      const eventEnd = new Date(evento.end)
      if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) return false
      return start < eventEnd && end > eventStart
    })

    if (existeReserva) {
      conflictoMensaje.value = 'Este horario ya está ocupado por otro paciente. Elige otro horario.'
      return
    }

    const fechaCita = getLocalDateString(start)
    const horaInicioCita = start.toTimeString().slice(0, 8)
    const horaFinCita = end.toTimeString().slice(0, 8)

    const validacion = validarReagendacion({
      reservaActual: reservaEnReagendacion.value,
      nuevoSlot: { fechaCita, horaInicioCita, horaFinCita },
      reservasPaciente: reservasPaciente.value,
      reservasDoctor: reservasActivas.value,
      bloqueosDoctor: bloqueosStore.bloqueos,
    })

    if (!validacion.ok) {
      conflictoMensaje.value = validacion.mensaje
      return
    }

    conflictoMensaje.value = ''
    pendingSlot.value = { fechaCita, horaInicioCita, horaFinCita }

    const paciente = reservaEnReagendacion.value.paciente?.nombre || 'el paciente'
    const horaAnterior = (reservaEnReagendacion.value.horaInicioCita || '').slice(0, 5)
    const horaNueva = horaInicioCita.slice(0, 5)

    confirmTitle.value = 'Confirmar reagendación'
    confirmMessage.value = `¿Reagendar a ${paciente} del ${reservaEnReagendacion.value.fechaCita} ${horaAnterior} al ${fechaCita} ${horaNueva}?`
    confirmType.value = 'warning'
    confirmShowNote.value = true
    confirmNote.value = ''
    confirmNoteLabel.value = 'Mensaje de reagendación (opcional)'
    confirmAction.value = async () => {
      if (tutorialStore.isDemoGestionCitas) {
        showConfirmModal.value = false
        salirModoReagendar()
        return
      }
      isSubmitting.value = true
      const rawId = reservaReagendarRawId.value
      const result = await reservasStore.reagendarReserva(rawId, {
        ...pendingSlot.value,
        motivo: confirmNote.value,
      })
      isSubmitting.value = false
      if (result.success) {
        const nuevaFecha = pendingSlot.value?.fechaCita
        salirModoReagendar()
        resultTitle.value = 'Cita reagendada'
        resultMessage.value = 'La cita fue reagendada correctamente.'
        resultType.value = 'success'
        showResultModal.value = true
        emit('actualizado')
        if (nuevaFecha) {
          emit('fecha-actualizada', nuevaFecha)
        }
        nextTick(syncCalendarEvents)
      } else {
        resultTitle.value = 'Error al reagendar'
        resultMessage.value = reservasStore.error || 'No se pudo reagendar la cita.'
        resultType.value = 'error'
        showResultModal.value = true
      }
    }
    showConfirmModal.value = true
    return
  }

  // Espacio vacío: menú bloquear / agendar (no interrumpir reagendar/agendar/bloqueo)
  if (modoReagendar.value || modoAgendar.value || modoBloqueo.value) return

  const ocupadoLibre = eventosCalendario.value.some((evento) => {
    const eventStart = new Date(evento.start)
    const eventEnd = new Date(evento.end)
    return start < eventEnd && end > eventStart
  })
  if (ocupadoLibre) {
    conflictoMensaje.value = 'Ese horario ya está ocupado o bloqueado.'
    return
  }

  slotAccionContext.value = {
    fecha: getLocalDateString(start),
    horaInicio: start.toTimeString().slice(0, 8),
    horaFin: end.toTimeString().slice(0, 8),
  }
  showAccionesSlot.value = true
}

const iniciarBloqueoDesdeSlot = () => {
  const ctx = slotAccionContext.value
  if (!ctx) return
  showAccionesSlot.value = false
  abrirFormBloqueoSlot(ctx.fecha, ctx.horaInicio, ctx.horaFin)
}

const iniciarAgendarDesdeSlot = () => {
  const ctx = slotAccionContext.value
  if (!ctx) return
  showAccionesSlot.value = false
  emit('solicitar-agendar', {
    fecha: ctx.fecha,
    horaInicio: ctx.horaInicio,
    horaFin: ctx.horaFin,
  })
}

const onConfirm = async () => {
  showConfirmModal.value = false
  if (confirmAction.value) await confirmAction.value()
  confirmAction.value = null
}

const onCancelConfirm = () => {
  showConfirmModal.value = false
  confirmAction.value = null
}

/**
 * FullCalendar prev/next cambia la vista localmente, pero reservasSemanaVisible
 * filtra por weekStart(fechaSeleccionada). Sin este sync, se ven semanas
 * “vacías” aunque las citas existan en otra semana/mes.
 */
const handleDatesSet = (info) => {
  const visibleStart =
    (info.startStr && String(info.startStr).slice(0, 10)) ||
    getLocalDateString(info.start)
  const currentWeekStart = getLocalDateString(weekStart.value)
  if (!visibleStart || visibleStart === currentWeekStart) return
  emit('fecha-actualizada', visibleStart)
}

const calendarOptions = {
  plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
  initialView: 'sevenDayTimeGrid',
  views: {
    sevenDayTimeGrid: {
      type: 'timeGrid',
      duration: { days: 7 },
    },
  },
  headerToolbar: {
    left: '',
    center: 'prev title next',
    right: '',
  },
  initialDate: weekStart.value,
  dateIncrement: { days: 7 },
  datesSet: handleDatesSet,
  titleFormat: (info) => {
    const start = info.start.marker
    const end = info.end.marker
    let month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(start)
    month = month.charAt(0).toUpperCase() + month.slice(1)
    const year = start.getFullYear()

    if (start.getMonth() === end.getMonth()) {
      const endDay = new Date(end)
      endDay.setDate(endDay.getDate() - 1)
      return `${start.getDate()} - ${endDay.getDate()} de ${month}, ${year}`
    }

    const monthEnd = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(end)
    return `${start.getDate()} ${month} - ${end.getDate()} ${monthEnd}, ${year}`
  },
  hiddenDays: [],
  dayHeaderContent: (arg) => {
    const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(arg.date)
    const dayNumber = arg.date.getDate()
    return {
      html: `
        <div class="custom-day-header">
          <div class="day-name">${dayName}</div>
          <div class="day-number-circle">${dayNumber}</div>
        </div>
      `,
    }
  },
  dayCellClassNames: (arg) => {
    const classes = []
    if (!esDiaDisponibleEnAgenda(arg.date)) classes.push('day-blocked')
    if (modoBloqueo.value && !esFechaFuturaParaBloqueo(getLocalDateString(arg.date))) {
      classes.push('day-bloqueo-no-permitido')
    }
    return classes
  },
  dayHeaderClassNames: (arg) => {
    const classes = []
    if (!esDiaDisponibleEnAgenda(arg.date)) classes.push('header-blocked')
    if (modoBloqueo.value && !esFechaFuturaParaBloqueo(getLocalDateString(arg.date))) {
      classes.push('header-bloqueo-no-permitido')
    }
    return classes
  },
  selectable: false,
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  eventDidMount: (info) => {
    const el = info.el
    if (!el) return
    const tipo = info.event.extendedProps?.tipo
    const reserva = info.event.extendedProps?.reserva
    if (tipo === 'reserva' && reserva && puedeGestionar(reserva)) {
      if (!document.querySelector('[data-tour="agenda-cita-event"]')) {
        el.setAttribute('data-tour', 'agenda-cita-event')
      }
    }
  },
  slotDuration: durationFormatted.value,
  slotLabelInterval: durationFormatted.value,
  slotMinTime: slotMinTime.value,
  slotMaxTime: slotMaxTime.value,
  events: [],
  allDaySlot: false,
  nowIndicator: true,
  expandRows: false,
  height: 'auto',
  locale: 'es',
  firstDay: 1,
  forceEventDuration: true,
  defaultTimedEventDuration: durationFormatted.value,
}

watch(
  () => tutorialStore.currentStep?.id,
  (stepId, prevId) => {
    if (prevId === 'gestion-reagendar-banner' && stepId !== prevId) {
      salirModoReagendar()
    }
    if (prevId === 'gestion-confirm-cancel' && stepId !== prevId) {
      showConfirmModal.value = false
      confirmAction.value = null
    }
  },
)

watch(() => props.fechaSeleccionada, () => {
  if (modoReagendar.value || showConfirmModal.value || modoBloqueo.value) return
  salirModoReagendar()
})

const fechaFormateada = computed(() => {
  const d = new Date(props.fechaSeleccionada + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

const weekRangeMessage = computed(() => {
  const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
  const end = new Date(weekEnd.value + 'T00:00:00')
  return `Semana del ${fmt.format(weekStart.value)} al ${fmt.format(end)}`
})

const diasSemanaMobile = computed(() => {
  const dias = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    if (esDiaDisponibleEnAgenda(d)) {
      dias.push(new Date(d))
    }
  }
  return dias
})

const cambiarSemanaMobile = (delta) => {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + delta * 7)
  emit('fecha-actualizada', getLocalDateString(d))
}

const handleMobileEventClick = ({ reserva, bloqueo, evento }) => {
  if (evento?.extendedProps?.tipo === 'emergencia') {
    const em = evento.extendedProps.emergencia
    if (!em) return
    resultTitle.value = 'Emergencia'
    resultMessage.value = `${em.nombrePaciente || 'Paciente'} · ${normalizeDateStr(em.fechaAtencion)} ${(em.horaInicio || '').slice(0, 5)}${em.horaFin ? `–${String(em.horaFin).slice(0, 5)}` : ''}${em.descripcionCaso ? `\n\n${em.descripcionCaso}` : ''}`
    resultType.value = 'info'
    showResultModal.value = true
    return
  }
  if (props.soloLectura) {
    if (reserva || evento?.extendedProps?.tipo === 'reserva') {
      mostrarCitaSoloLectura(reserva || evento?.extendedProps?.reserva)
    }
    return
  }
  if (bloqueo || evento?.extendedProps?.tipo === 'bloqueo') {
    const b = bloqueo || evento?.extendedProps?.bloqueo
    if (!b) return
    const fechaStr = b.fecha
    const hora = normalizeTimeStr(b.horaInicio)
    const inicio = new Date(`${fechaStr}T${hora}`)
    if (!(inicio.getTime() > Date.now())) {
      conflictoMensaje.value = 'Solo se pueden eliminar bloqueos futuros.'
      return
    }
    confirmarEliminarBloqueo(b)
    return
  }
  if (!reserva || modoReagendar.value || modoBloqueo.value) return
  abrirAccionesCita(reserva, evento)
}

const handleMobileSlotClick = (_dia, horario) => {
  if (!isHorarioDentroTurno(horario.dateObj)) return
  handleDateClick({ date: horario.dateObj })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="reagendar-slide">
      <div
        v-if="modoReagendar"
        class="reagendar-banner"
        data-tour="agenda-reagendar-banner"
        :style="bannerStyle"
      >
        <div class="reagendar-banner-content">
          <v-icon color="white" class="me-3 reagendar-banner-icon">mdi-calendar-cursor</v-icon>
          <div class="reagendar-banner-text flex-grow-1">
            <span class="text-subtitle-2 font-weight-bold d-block d-sm-inline">
              Modo reagendación activo.
            </span>
            <span class="text-caption d-none d-md-inline ms-1 opacity-90">
              Selecciona un nuevo horario para
              <strong>{{ reservaEnReagendacion?.paciente?.nombre || 'el paciente' }}</strong>.
            </span>
            <span class="text-caption d-md-none d-block mt-1">
              Paciente:
              <strong>{{ reservaEnReagendacion?.paciente?.nombre || 'el paciente' }}</strong>
            </span>
          </div>
          <v-btn
            variant="outlined"
            color="white"
            size="small"
            class="text-none ms-3 flex-shrink-0"
            @click="salirModoReagendar"
          >
            Cancelar reagendación
          </v-btn>
        </div>
      </div>
      <div v-else-if="modoAgendar" class="reagendar-banner" :style="bannerStyle">
        <div class="reagendar-banner-content">
          <v-icon color="white" class="me-3 reagendar-banner-icon">mdi-calendar-plus</v-icon>
          <div class="reagendar-banner-text flex-grow-1">
            <span class="text-subtitle-2 font-weight-bold d-block d-sm-inline">
              Modo agendación activo.
            </span>
            <span class="text-caption d-none d-md-inline ms-1 opacity-90">
              Selecciona un horario libre en el calendario para: <strong>{{ pacienteSeleccionado?.nombre }}</strong>.
            </span>
            <span class="text-caption d-md-none d-block mt-1">
              Paciente: <strong>{{ pacienteSeleccionado?.nombre }}</strong>
            </span>
          </div>
          <v-btn
            variant="outlined"
            color="white"
            size="small"
            class="text-none ms-3 flex-shrink-0"
            @click="salirModoAgendar"
          >
            Cancelar agendación
          </v-btn>
        </div>
      </div>
      <div
        v-else-if="modoBloqueo"
        class="reagendar-banner"
        data-tour="agenda-bloqueo-banner"
        :style="{ ...bannerStyle, background: '#c62828' }"
      >
        <div class="reagendar-banner-content">
          <v-icon color="white" class="me-3 reagendar-banner-icon">mdi-calendar-remove</v-icon>
          <div class="reagendar-banner-text flex-grow-1">
            <span class="text-subtitle-2 font-weight-bold d-block d-sm-inline">
              Bloqueo Horarios activo.
            </span>
            <span class="text-caption d-none d-md-inline ms-1 opacity-90">
              Toca un slot libre de un día futuro para bloquearlo, o un bloqueo futuro para quitarlo.
              <template v-if="cupoResumen"> · Cupo: {{ cupoResumen }}</template>
            </span>
            <span class="text-caption d-md-none d-block mt-1" v-if="cupoResumen">
              {{ cupoResumen }}
            </span>
          </div>
          <v-btn
            variant="outlined"
            color="white"
            size="small"
            class="text-none ms-2 flex-shrink-0"
            data-tour="agenda-bloquear-dia"
            @click="bloquearDiaCompleto"
          >
            Bloquear día
          </v-btn>
          <v-btn
            variant="outlined"
            color="white"
            size="small"
            class="text-none ms-2 flex-shrink-0"
            @click="salirModoBloqueo"
          >
            Salir
          </v-btn>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div
    class="container-calendar"
    :class="{
      'container-calendar--mobile': isMobile,
      'reagendar-banner-offset': modoReagendar || modoAgendar || modoBloqueo,
    }"
  >
    <v-overlay :model-value="loadingRules" contained class="align-center justify-center rounded-xl">
      <v-progress-circular indeterminate color="primary" />
    </v-overlay>

    <v-row align="center" :class="isMobile ? 'mb-3' : 'mb-6'" :style="{ opacity: loadingRules ? 0.5 : 1 }">
      <v-col cols="auto">
        <v-btn
          variant="tonal"
          :icon="isMobile ? 'mdi-arrow-left' : 'mdi-chevron-left'"
          color="primary"
          :size="isMobile ? 'small' : 'default'"
          class="rounded-lg shadow-soft"
          @click="$emit('volver')"
        />
      </v-col>
      <v-col class="min-width-0">
        <div class="d-flex align-center" :class="{ 'flex-wrap': !isMobile }">
          <PersonaAvatar
            :foto="doctor.foto || doctor.imagen"
            :nombres="doctor.nombres"
            :primer-apellido="doctor.primerApellido"
            :size="isMobile ? 40 : 56"
            rounded="lg"
            :class="isMobile ? 'me-2' : 'me-4 elevation-2 border-primary'"
          />
          <div class="min-width-0">
            <h2 :class="isMobile ? 'text-subtitle-1 font-weight-bold gradient-text text-truncate' : 'text-h5 font-weight-black gradient-text'">
              {{ doctor.nombre }}
            </h2>
            <div v-if="!isMobile" class="d-flex align-center flex-wrap gap-2 mt-1">
              <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
                {{ especialidad.nombre }}
              </v-chip>
              <v-chip size="small" variant="text" class="text-grey-darken-1 px-0">
                <v-icon start icon="mdi-map-marker" size="14" />
                {{ postaCompleta.nombre }}
              </v-chip>
            </div>
            <div v-else class="d-flex align-center gap-1 mt-1 flex-wrap">
              <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                {{ especialidad.nombre }}
              </v-chip>
              <span class="text-caption text-medium-emphasis text-capitalize">{{ fechaFormateada }}</span>
            </div>
            <p v-if="!isMobile" class="text-body-2 text-medium-emphasis text-capitalize mb-0 mt-1">{{ fechaFormateada }}</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-alert
      v-if="conflictoMensaje"
      type="info"
      variant="tonal"
      class="mb-4 rounded-xl"
      closable
      @click:close="conflictoMensaje = ''"
    >
      {{ conflictoMensaje }}
    </v-alert>

    <v-card elevation="0" rounded="xl" class="calendar-card border-subtle" :class="{ 'calendar-card--mobile': isMobile }">
      <v-toolbar v-if="!isMobile" color="white" flat class="px-2">
        <v-icon color="primary" icon="mdi-calendar-check" class="me-3" />
        <v-toolbar-title class="font-weight-bold text-primary">
          Agenda semanal
          <span class="text-caption text-grey-darken-1 font-weight-medium ms-2">
            — {{ weekRangeMessage }}
          </span>
        </v-toolbar-title>
        <v-spacer />
        <v-chip
          v-if="cupoResumen && !modoBloqueo && !soloLectura"
          size="small"
          variant="tonal"
          color="blue-grey"
          class="me-2"
        >
          {{ cupoResumen }}
        </v-chip>
        <v-switch
          v-if="!modoBloqueo && !modoReagendar && !modoAgendar"
          v-model="mostrarExtrasAgendaLocal"
          color="orange"
          density="compact"
          hide-details
          class="me-3 flex-grow-0"
          label="Ver Emergencias y Atenciones sin Reserva"
        />
        <v-btn
          v-if="!soloLectura && !modoBloqueo && !modoReagendar && !modoAgendar"
          color="error"
          variant="tonal"
          size="small"
          class="text-none font-weight-bold me-2"
          prepend-icon="mdi-calendar-remove"
          data-tour="agenda-bloqueo-btn"
          @click="iniciarModoBloqueo"
        >
          Bloqueo Horarios
        </v-btn>
      </v-toolbar>
      <v-divider v-if="!isMobile" />
      <v-card-text :class="isMobile ? 'pa-2' : 'pa-4'">
        <div ref="calendarHostRef" class="calendar-host" data-tour="agenda-calendario">
          <FullCalendar
            v-if="!loadingRules && !isMobile"
            ref="fullCalendarRef"
            :options="calendarOptions"
          />
          <div v-else-if="!loadingRules && isMobile" class="mobile-agenda-week">
          <div class="mobile-week-nav">
            <p class="text-caption font-weight-bold text-primary text-center mb-2">
              {{ weekRangeMessage }}
            </p>
            <div class="d-flex flex-column gap-2 mb-2" v-if="!modoBloqueo && !modoReagendar && !modoAgendar">
              <v-switch
                v-model="mostrarExtrasAgendaLocal"
                color="orange"
                density="compact"
                hide-details
                label="Ver Emergencias y Atenciones sin Reserva"
              />
              <v-btn
                v-if="!soloLectura"
                color="error"
                variant="tonal"
                size="small"
                class="text-none font-weight-bold w-100"
                prepend-icon="mdi-calendar-remove"
                data-tour="agenda-bloqueo-btn"
                @click="iniciarModoBloqueo"
              >
                Bloqueo Horarios
              </v-btn>
            </div>
            <div class="d-flex gap-2">
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="mdi-chevron-left"
                class="text-none font-weight-bold flex-grow-1 mobile-week-btn"
                @click="cambiarSemanaMobile(-1)"
              >
                Semana anterior
              </v-btn>
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                append-icon="mdi-chevron-right"
                class="text-none font-weight-bold flex-grow-1 mobile-week-btn"
                @click="cambiarSemanaMobile(1)"
              >
                Semana siguiente
              </v-btn>
            </div>
          </div>

          <CalendarioMobileSemana
            modo="gestionar"
            :dias="diasSemanaMobile"
            :intervalo="intervalo"
            :slot-min-time="slotMinTime"
            :slot-max-time="slotMaxTime"
            :slot-windows-by-date="turnosMobilePorDia"
            :eventos="eventosCalendario"
            :modo-reagendar="modoReagendar"
            :modo-agendar="modoAgendar"
            :modo-bloqueo="modoBloqueo"
            horarios-label="Agenda del día"
            @slot-click="handleMobileSlotClick"
            @event-click="handleMobileEventClick"
          />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-bottom-sheet v-model="showAccionesCita">
      <v-sheet class="pa-4 rounded-t-xl">
        <div class="text-subtitle-1 font-weight-bold mb-1">
          {{ citaAccionContext?.reserva?.paciente?.nombre || 'Paciente' }}
        </div>
        <div class="text-body-2 text-medium-emphasis mb-2">
          {{ normalizeDateStr(citaAccionContext?.reserva?.fechaCita) }}
          · {{ normalizeTimeStr(citaAccionContext?.reserva?.horaInicioCita).slice(0, 5) }}
        </div>
        <v-chip
          v-if="citaAccionContext?.reserva?.estado"
          class="mb-4 text-uppercase font-weight-bold"
          size="small"
          :color="(['ATRASO', 'ABANDONO'].includes((citaAccionContext.reserva.estado || '').toUpperCase()) ? 'error' : 'primary')"
          variant="tonal"
        >
          {{ citaAccionContext.reserva.estado }}
        </v-chip>
        <v-list density="comfortable" class="py-0">
          <v-list-item
            v-if="puedeGestionar(citaAccionContext?.reserva)"
            prepend-icon="mdi-calendar-sync"
            title="Reagendar cita"
            rounded="lg"
            data-tour="agenda-sheet-reagendar"
            @click.stop="iniciarReagendar"
          />
          <v-list-item
            v-if="puedeGestionar(citaAccionContext?.reserva)"
            prepend-icon="mdi-calendar-remove"
            title="Cancelar cita"
            base-color="error"
            rounded="lg"
            data-tour="agenda-sheet-cancelar"
            @click.stop="iniciarCancelar"
          />
          <v-list-item
            prepend-icon="mdi-clipboard-text"
            title="Ver cita"
            rounded="lg"
            data-tour="agenda-sheet-ver"
            @click.stop="verCita"
          />
        </v-list>
      </v-sheet>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="showAccionesSlot">
      <v-sheet class="pa-4 rounded-t-xl">
        <div class="text-subtitle-1 font-weight-bold mb-1">
          Horario libre
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ slotAccionContext?.fecha }}
          · {{ (slotAccionContext?.horaInicio || '').slice(0, 5) }}
          – {{ (slotAccionContext?.horaFin || '').slice(0, 5) }}
        </div>
        <v-list density="comfortable" class="py-0">
          <v-list-item
            prepend-icon="mdi-calendar-plus"
            title="Agendar cita"
            subtitle="Reservar este horario para un paciente"
            rounded="lg"
            data-tour="agenda-sheet-agendar-slot"
            @click.stop="iniciarAgendarDesdeSlot"
          />
          <v-list-item
            prepend-icon="mdi-calendar-remove"
            title="Bloquear horario"
            subtitle="Marcar este espacio como no disponible"
            base-color="error"
            rounded="lg"
            data-tour="agenda-sheet-bloquear-slot"
            @click.stop="iniciarBloqueoDesdeSlot"
          />
        </v-list>
      </v-sheet>
    </v-bottom-sheet>

    <ModalConfirmación
      v-model="showConfirmModal"
      v-model:note="confirmNote"
      :title="confirmTitle"
      :message="confirmMessage"
      :type="confirmType"
      confirm-text="Confirmar"
      cancel-text="Cancelar"
      :loading="isSubmitting"
      confirm-tour-attr="agenda-confirm-cancel"
      :disable-confirm="tutorialStore.isDemoGestionCitas && confirmTitle === 'Confirmar cancelación'"
      :show-note="confirmShowNote"
      :note-label="confirmNoteLabel"
      @confirm="onConfirm"
      @cancel="onCancelConfirm"
    />

    <v-dialog v-model="showBloqueoFormModal" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold pt-6 px-6">
          {{ bloqueoForm.modo === 'day' ? 'Bloquear día' : 'Bloquear horario' }}
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-2 text-medium-emphasis mb-4">
            <template v-if="bloqueoForm.modo === 'slot'">
              Slot del {{ formatFechaDMY(bloqueoForm.fecha) }}
              {{ (bloqueoForm.horaInicio || '').slice(0, 5) }}–{{ (bloqueoForm.horaFin || '').slice(0, 5) }}.
            </template>
            <template v-else>
              Elige un día futuro. Se bloquearán todos los slots libres de tus turnos ese día.
            </template>
          </p>

          <v-menu
            v-if="bloqueoForm.modo === 'day'"
            v-model="menuFechaBloqueo"
            :close-on-content-click="false"
            transition="scale-transition"
            max-width="320"
          >
            <template #activator="{ props: menuProps }">
              <v-text-field
                v-bind="menuProps"
                :model-value="formatFechaDMY(bloqueoForm.fecha)"
                label="Fecha a bloquear"
                prepend-inner-icon="mdi-calendar"
                readonly
                variant="outlined"
                rounded="lg"
                density="comfortable"
                class="mb-2"
                hide-details="auto"
              />
            </template>
            <v-date-picker
              v-model="fechaBloqueoPicker"
              :min="minFechaBloqueoDate"
              hide-header
              color="error"
              title="Fecha a bloquear"
            />
          </v-menu>

          <v-text-field
            v-model="bloqueoForm.descripcion"
            label="Descripción (opcional)"
            variant="outlined"
            rounded="lg"
            density="comfortable"
            maxlength="255"
            counter
            clearable
            hint="Ej.: Almuerzo, reunión, personal..."
            persistent-hint
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-6 pt-2">
          <v-spacer />
          <v-btn
            variant="text"
            class="text-none"
            :disabled="isSubmitting"
            @click="showBloqueoFormModal = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            class="text-none font-weight-bold"
            data-tour="agenda-bloqueo-form-submit"
            :loading="isSubmitting"
            @click="submitBloqueoForm"
          >
            Bloquear
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ModalMensaje
      v-model="showResultModal"
      :title="resultTitle"
      :message="resultMessage"
      :type="resultType"
      confirm-tour-attr="agenda-resultado-aceptar"
      @confirm="showResultModal = false"
    />

    <ReservaModal
      v-model="showReservaModal"
      :fecha="fechaSeleccionadaReserva"
      :hora-inicio="horaInicioSeleccionadaReserva"
      :hora-fin="horaFinSeleccionadaReserva"
      :especialidad="especialidad"
      :posta="postaCompleta"
      :doctor="doctor"
      :paciente-id="Number(pacienteSeleccionado?.idUsuario) || null"
      :paciente-nombre="pacienteSeleccionado?.nombre"
      @reservada="handleReservaExitosa"
    />
  </div>
</template>

<style src="@/assets/styles/calendario-reservas.css"></style>

<style scoped>
.reagendar-banner {
  position: fixed;
  top: 75px;
  left: 0;
  right: 0;
  z-index: var(--layout-content-overlay-z, 1000);
  padding: 10px 24px;
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  /* Alineado con la animación del navigation-drawer de Vuetify */
  transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.reagendar-banner-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  color: white;
}

.reagendar-banner-text strong {
  color: #fff;
}

.reagendar-banner-offset {
  padding-top: 72px;
}

.reagendar-slide-enter-active {
  transition: all 0.35s ease-out;
}

.reagendar-slide-leave-active {
  transition: all 0.25s cubic-bezier(1, 0.5, 0.8, 1);
}

.reagendar-slide-enter-from,
.reagendar-slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

@media (max-width: 600px) {
  .reagendar-banner {
    top: 0;
    padding: 10px 16px;
  }

  .reagendar-banner-icon {
    display: none;
  }

  .reagendar-banner-offset {
    padding-top: 88px;
  }
}

.min-width-0 {
  min-width: 0;
}

.calendar-host {
  width: 100%;
  max-width: 100%;
}

.calendar-card {
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.container-calendar {
  transition: padding 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.calendar-host :deep(.fc),
.calendar-host :deep(.fc-view-harness),
.calendar-host :deep(.fc-scrollgrid),
.calendar-host :deep(.fc-timegrid) {
  width: 100% !important;
  max-width: 100% !important;
}

.container-calendar--mobile {
  padding: 0;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.calendar-card--mobile {
  border-radius: 12px !important;
}

.mobile-agenda-week {
  width: 100%;
  max-width: 100%;
}

.mobile-week-nav {
  width: 100%;
  margin-bottom: 12px;
}

.mobile-week-btn {
  min-width: 0;
  padding-left: 8px !important;
  padding-right: 8px !important;
  font-size: 0.72rem !important;
  letter-spacing: 0;
}

.mobile-week-btn :deep(.v-btn__prepend),
.mobile-week-btn :deep(.v-btn__append) {
  margin-inline: 0 !important;
}

@media (max-width: 380px) {
  .mobile-week-btn {
    font-size: 0.65rem !important;
  }

  .mobile-week-btn :deep(.v-btn__content) {
    white-space: nowrap;
  }
}

:deep(.fc-event) {
  cursor: pointer;
}

:deep(.event-atraso) {
  background-color: #c62828 !important;
  border-color: #b71c1c !important;
  color: #fff !important;
  border-left: 4px solid #7f0000 !important;
  font-weight: 700;
  opacity: 1 !important;
}

:deep(.event-bloqueo) {
  background-color: #78909c !important;
  border-color: #607d8b !important;
  color: #fff !important;
  opacity: 0.92;
}

:deep(.event-emergencia) {
  background-color: #ffebee !important;
  border-color: #ef9a9a !important;
  color: #c62828 !important;
  border-left: 4px solid #c62828 !important;
  font-weight: 700;
}

:deep(.day-bloqueo-no-permitido),
:deep(.header-bloqueo-no-permitido) {
  opacity: 0.5;
  filter: grayscale(0.35);
}
</style>
