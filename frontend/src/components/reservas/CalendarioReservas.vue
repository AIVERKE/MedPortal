<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import ReservaModal from './ReservaModal.vue'
import { useReservasStore } from '@/stores/reservas'
import { usePostasStore } from '@/stores/postas'
import { useConfiguracionReservasStore } from '@/stores/configuracion_reservas'
import { useFeriadosStore } from '@/stores/feriados'
import { useAuthStore } from '@/stores/auth'
import { useDisplay } from 'vuetify'
import PersonaAvatar from '@/components/common/PersonaAvatar.vue'
import CalendarioMobileSemana from '@/components/calendario/CalendarioMobileSemana.vue'
import { alignSlotMaxToCompleteIntervals } from '@/utils/slotTime'
import { usePoliticaReservas } from '@/composables/usePoliticaReservas'
import { useBloqueosHorarioStore } from '@/stores/bloqueosHorario'
import { ESTADOS_OCUPAN_AGENDA } from '@/utils/reservaConflicts'

/* =========================
   PROPS
========================= */
const props = defineProps({
  especialidad: { type: Object, required: true },
  doctor: { type: Object, required: true }
})

const emit = defineEmits(['volver'])

/*
  STORIES
 */
const reservasStore = useReservasStore()
const postasStore = usePostasStore()
const configStore = useConfiguracionReservasStore()
const feriadosStore = useFeriadosStore()
const authStore = useAuthStore()
const bloqueosStore = useBloqueosHorarioStore()
const { smAndDown } = useDisplay()
const isMobile = computed(() => smAndDown.value)

/** API de ocupación del doctor espera idPersona, no idDoctor. */
const doctorIdPersona = computed(() =>
  props.doctor?.idPersona
  ?? props.doctor?.persona?.idPersona
  ?? props.doctor?.asignacion?.doctor?.persona?.idPersona
  ?? null
)

const telefonoContactoPublico = computed(() => {
  const tel = (props.doctor?.telefonoEmergencia
    || props.doctor?.asignacion?.doctor?.telefonoEmergencia
    || '').toString().trim()
  return tel || null
})

// Mapeo de días para FullCalendar (0 = Domingo, 1 = Lunes, ...)
const MAP_DIAS = {
  'DOMINGO': 0, 'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3, 'MIÉRCOLES': 3,
  'JUEVES': 4, 'VIERNES': 5, 'SABADO': 6, 'SÁBADO': 6
}

// Intentar encontrar la posta completa por id o nombre
const postaCompleta = computed(() => {
  const idPosta =
    props.doctor.idPosta ??
    props.doctor.asignacion?.consultorio?.posta?.idPosta ??
    props.doctor.asignacion?.consultorio?.posta?.idPostaMedica

  if (idPosta != null) {
    const byId = postasStore.postas.find((p) => p.id === idPosta)
    if (byId) return byId
  }

  const nombrePosta =
    props.doctor.posta ??
    props.doctor.asignacion?.consultorio?.posta?.nombre

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
    horarioAtencionTardeFin: '18:00:00'
  }
})

onMounted(async () => {
  loadingRules.value = true
  const userId = authStore.user?.idUsuario || authStore.user?.id
  const idPersona = doctorIdPersona.value

  await Promise.all([
    idPersona
      ? reservasStore.fetchReservasByDoctor(idPersona)
      : Promise.resolve([]),
    userId ? reservasStore.fetchReservasProgramadasByUsuario(userId) : Promise.resolve(),
    postasStore.postas.length === 0 ? postasStore.fetchPostas() : Promise.resolve(),
    configStore.fetchConfig(),
    feriadosStore.fetchFeriados(),
  ])

  const desde = minReservationDate.value
    ? getLocalDateString(minReservationDate.value)
    : undefined
  const hasta = maxReservationDate.value
    ? getLocalDateString(maxReservationDate.value)
    : undefined
  await bloqueosStore.fetchByDoctor(props.doctor.id, desde, hasta)

  loadingRules.value = false
})

/* =====================================================
   LÓGICA DE DÍAS HÁBILES Y RESTRICCIONES
   ===================================================== */
const loadingRules = ref(true)

const diasHabilitadosArr = computed(() => configStore.currentConfig?.dias || [])
const diasHabilitadosIndices = computed(() => diasHabilitadosArr.value.map(d => MAP_DIAS[d]))

const {
  minReservationDate,
  maxReservationDate,
  rangeMessagePaciente,
  sumarDiasHabiles,
  esDiaHabilParaAnticipacion: esDiaHabilitadoYNoFeriado,
} = usePoliticaReservas(configStore, feriadosStore, diasHabilitadosIndices)

// Helper para obtener string YYYY-MM-DD en hora local
const getLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Días de la semana que NO están habilitados (para hiddenDays)
// Listado de 0 a 6, filtramos los que NO están en diasHabilitadosIndices
const hiddenDays = computed(() => {
  if (diasHabilitadosIndices.value.length === 0) return []
  const hidden = [0, 1, 2, 3, 4, 5, 6].filter(d => !diasHabilitadosIndices.value.includes(d))
  // FullCalendar falla si se ocultan todos los días de la semana
  if (hidden.length === 7) return []
  return hidden
})

/* =====================================================
   LÓGICA VISTA MÓVIL (semana navegable)
   ===================================================== */
const getWeekStart = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

const mobileWeekStart = ref(null)

watch(
  minReservationDate,
  (min) => {
    if (!min) return
    const minWeek = getWeekStart(min)
    if (!mobileWeekStart.value || mobileWeekStart.value < minWeek) {
      mobileWeekStart.value = new Date(minWeek)
    }
  },
  { immediate: true },
)

const mobileWeekEnd = computed(() => {
  if (!mobileWeekStart.value) return new Date()
  const end = new Date(mobileWeekStart.value)
  end.setDate(end.getDate() + 6)
  return end
})

const diasSemanaMobile = computed(() => {
  if (!mobileWeekStart.value) return []
  const min = new Date(minReservationDate.value)
  min.setHours(0, 0, 0, 0)
  const max = new Date(maxReservationDate.value)
  max.setHours(0, 0, 0, 0)
  const dias = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(mobileWeekStart.value)
    d.setDate(d.getDate() + i)
    if (d < min || d > max) continue
    if (esDiaHabilitadoYNoFeriado(d)) {
      dias.push(new Date(d))
    }
  }
  return dias
})

const weekRangeMessage = computed(() => {
  if (!mobileWeekStart.value) return ''
  const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
  return `Semana del ${fmt.format(mobileWeekStart.value)} al ${fmt.format(mobileWeekEnd.value)}`
})

const puedeSemanaAnterior = computed(() => {
  if (!mobileWeekStart.value) return false
  const prev = new Date(mobileWeekStart.value)
  prev.setDate(prev.getDate() - 7)
  return prev >= getWeekStart(minReservationDate.value)
})

const puedeSemanaSiguiente = computed(() => {
  if (!mobileWeekStart.value) return false
  const next = new Date(mobileWeekStart.value)
  next.setDate(next.getDate() + 7)
  return next <= getWeekStart(maxReservationDate.value)
})

const cambiarSemanaMobile = (delta) => {
  if (!mobileWeekStart.value) return
  const next = new Date(mobileWeekStart.value)
  next.setDate(next.getDate() + delta * 7)
  mobileWeekStart.value = next
}

/*
  EVENTOS
*/
const eventosReservas = computed(() => {
  const userId = authStore.user?.idUsuario || authStore.user?.id
  const ocupaAgenda = (estado) => {
    const s = (estado || '').toUpperCase()
    return ESTADOS_OCUPAN_AGENDA.includes(s) || s === 'ACTIVA' || s === 'PROGRAMADO'
  }

  return reservasStore.reservas
    .filter(r => {
      if (!ocupaAgenda(r.estado)) return false
      // 1. Reservas de ESTE doctor (independiente de quién sea el paciente)
      const esDeEsteDoctor = Number(r.idDoctor) === Number(props.doctor.id)
      // 2. Mis reservas activas (en cualquier lugar/doctor) para no solaparme conmigo mismo
      const esMiaYProgramada = Number(r.idUsuario) === Number(userId)

      return esDeEsteDoctor || esMiaYProgramada
    })
    .map(r => {
      const esMia = r.idUsuario === userId
      const esMismaEspecialidad = r.idEspecialidad === props.especialidad.id

      let title = esMia ? 'Tu Reserva' : 'Ocupado'
      if (esMia && r.especialidad?.nombre) {
        title += ` - ${r.especialidad.nombre}`
      }

      // Colores
      let bgColor = '#f5f5f5'
      let borderColor = '#e0e0e0'
      let textColor = '#9e9e9e'
      let className = 'event-reserved'

      if (esMia) {
        if (esMismaEspecialidad) {
          bgColor = '#e3f2fd'
          borderColor = '#bbdefb'
          textColor = '#1976d2'
          className = 'event-mine'
        } else {
          // Especialidad diferente: Naranja/Ambar
          bgColor = '#fff3e0'
          borderColor = '#ffe0b2'
          textColor = '#ef6c00'
          className = 'event-mine-other'
        }
      }

      return {
        id: r.id,
        title,
        start: `${r.fechaCita}T${r.horaInicioCita}`,
        end: `${r.fechaCita}T${r.horaFinCita}`,
        display: 'block',
        overlap: false,
        editable: false,
        backgroundColor: bgColor,
        borderColor: borderColor,
        textColor: textColor,
        classNames: [className]
      }
    })
})

const eventosBloqueos = computed(() =>
  (bloqueosStore.bloqueos || [])
    .filter((b) => b.fecha && b.horaInicio && b.horaFin)
    .map((b) => {
      const horaInicio = String(b.horaInicio).length === 5
        ? `${b.horaInicio}:00`
        : b.horaInicio
      const horaFin = String(b.horaFin).length === 5
        ? `${b.horaFin}:00`
        : b.horaFin
      return {
        id: `bloqueo-${b.id}`,
        title: 'Ocupado',
        start: `${b.fecha}T${horaInicio}`,
        end: `${b.fecha}T${horaFin}`,
        display: 'block',
        overlap: false,
        editable: false,
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
        textColor: '#9e9e9e',
        classNames: ['event-reserved'],
      }
    }),
)

const eventosCalendario = computed(() => [
  ...eventosReservas.value,
  ...eventosBloqueos.value,
])

const eventosSemanaMobile = computed(() => {
  if (!mobileWeekStart.value) return eventosCalendario.value
  const inicio = getLocalDateString(mobileWeekStart.value)
  const fin = getLocalDateString(mobileWeekEnd.value)
  return eventosCalendario.value.filter((e) => {
    const fecha = String(e.start).split('T')[0]
    return fecha >= inicio && fecha <= fin
  })
})

/* =========================
   ESTADO MODAL
========================= */
const modal = ref(false)
const fechaSeleccionada = ref('')
const horaInicioSeleccionada = ref('')
const horaFinSeleccionada = ref('')

const seleccionarHorarioMobile = (_dia, horario) => {
  fechaSeleccionada.value = getLocalDateString(horario.dateObj)
  horaInicioSeleccionada.value = horario.fullInicio
  horaFinSeleccionada.value = horario.fullFin
  modal.value = true
}

/* =========================
   INTERVALO DINÁMICO (desde asignación / turno)
========================= */
const intervalo = computed(() => {
  const fromAsignacion = Number(props.doctor?.asignacion?.duracionCita)
  if (Number.isFinite(fromAsignacion) && fromAsignacion > 0) return fromAsignacion

  // Fallback guía de especialidad
  const fromEsp = Number(props.especialidad?.tiempoCitaPorDefecto)
  return Number.isFinite(fromEsp) && fromEsp > 0 ? fromEsp : 30
})

const slotMinTime = computed(() =>
  props.doctor.asignacion?.horaInicio || (props.doctor.turno === 'Mañana'
    ? postaCompleta.value.horarioAtencionMananaInicio
    : postaCompleta.value.horarioAtencionTardeInicio),
)

const slotMaxTimeRaw = computed(() =>
  props.doctor.asignacion?.horaFin || (props.doctor.turno === 'Mañana'
    ? postaCompleta.value.horarioAtencionMananaFin
    : postaCompleta.value.horarioAtencionTardeFin),
)

// Ej. 08:00-12:00 con 45 min -> 11:45, para no mostrar el residuo incompleto.
const slotMaxTime = computed(() =>
  alignSlotMaxToCompleteIntervals(slotMinTime.value, slotMaxTimeRaw.value, intervalo.value),
)

/* =========================
   CLICK EN CALENDARIO
========================= */
const handleDateClick = (info) => {
  const start = info.date

  if (!esDiaHabilitadoYNoFeriado(start)) {
    return
  }

  // Comparación normalizada a 00:00:00
  const normalizedStart = new Date(start)
  normalizedStart.setHours(0, 0, 0, 0)

  const normalizedMin = new Date(minReservationDate.value)
  normalizedMin.setHours(0, 0, 0, 0)

  const normalizedMax = new Date(maxReservationDate.value)
  normalizedMax.setHours(0, 0, 0, 0)

  if (normalizedStart < normalizedMin || normalizedStart > normalizedMax) {
    return
  }

  const end = new Date(start.getTime() + intervalo.value * 60000)

  // Rechazar residuos incompletos al final del turno (ej. 11:45-12:00 con citas de 45).
  const finTurno = new Date(start)
  const [hMax, mMax, sMax = 0] = String(slotMaxTime.value || '00:00:00').split(':').map(Number)
  finTurno.setHours(hMax || 0, mMax || 0, sMax || 0, 0)
  if (end > finTurno) return

  const existeReserva = eventosCalendario.value.some(evento => {
    const eventStart = new Date(evento.start)
    const eventEnd = new Date(evento.end)
    // Traslapo de intervalos: (A_inicio < B_fin) && (A_fin > B_inicio)
    // Esto detecta si la nueva cita chocará con alguna existente por delante, por detrás o si la cubre.
    return start < eventEnd && end > eventStart
  })

  if (existeReserva) return

  // USAR getLocalDateString para evitar desfases UTC que causan errores 400
  fechaSeleccionada.value = getLocalDateString(start)
  horaInicioSeleccionada.value = start.toTimeString().slice(0, 8)
  horaFinSeleccionada.value = end.toTimeString().slice(0, 8)
  modal.value = true
}

/* =========================
   OPCIONES CALENDARIO
========================= */
const calendarOptions = computed(() => ({
  plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
  initialView: 'sevenDayTimeGrid',
  views: {
    sevenDayTimeGrid: {
      type: 'timeGrid',
      duration: { days: 7 }
    }
  },
  headerToolbar: {
    left: '',
    center: 'prev title next',
    right: ''
  },
  initialDate: minReservationDate.value,
  // Extendemos el final del validRange para permitir que la vista de 7 días 
  // pueda mostrar el último día disponible sin chocar con el límite.
  validRange: {
    start: minReservationDate.value,
    end: new Date(maxReservationDate.value.getTime() + 7 * 86400000)
  },
  dateIncrement: { days: 1 },
  titleFormat: (info) => {
    const start = info.start.marker
    const end = info.end.marker
    let month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(start)
    month = month.charAt(0).toUpperCase() + month.slice(1) // Capitalizar
    const year = start.getFullYear()

    // Si es el mismo mes
    if (start.getMonth() === end.getMonth()) {
      // end.marker en FullCalendar es el inicio del día siguiente para el cálculo de rangos
      const endDay = new Date(end)
      endDay.setDate(endDay.getDate() - 1)
      return `${start.getDate()} - ${endDay.getDate()} de ${month}, ${year}`
    }
    // Si cruza meses (opcional, pero para ser robustos)
    const monthEnd = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(end)
    return `${start.getDate()} ${month} - ${end.getDate()} ${monthEnd}, ${year}`
  },
  hiddenDays: hiddenDays.value,
  dayHeaderContent: (arg) => {
    const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(arg.date)
    const dayNumber = arg.date.getDate()
    return {
      html: `
        <div class="custom-day-header">
          <div class="day-name">${dayName}</div>
          <div class="day-number-circle">${dayNumber}</div>
        </div>
      `
    }
  },
  selectable: true,
  dateClick: handleDateClick,
  slotDuration: `00:${intervalo.value}:00`,
  slotLabelInterval: `00:${intervalo.value}:00`,
  slotMinTime: slotMinTime.value,
  slotMaxTime: slotMaxTime.value,
  events: eventosCalendario.value,
  allDaySlot: false,
  nowIndicator: true,
  expandRows: true,
  height: 'auto',
  locale: 'es',
  firstDay: 1,
  dayCellClassNames: (arg) => {
    const normalizedDate = new Date(arg.date)
    normalizedDate.setHours(0, 0, 0, 0)

    const normalizedMin = new Date(minReservationDate.value)
    normalizedMin.setHours(0, 0, 0, 0)

    const normalizedMax = new Date(maxReservationDate.value)
    normalizedMax.setHours(0, 0, 0, 0)

    if (!esDiaHabilitadoYNoFeriado(normalizedDate)) {
      return ['day-blocked']
    }

    if (normalizedDate < normalizedMin || normalizedDate > normalizedMax) {
      return ['day-blocked']
    }
    return []
  },
  dayHeaderClassNames: (arg) => {
    const normalizedDate = new Date(arg.date)
    normalizedDate.setHours(0, 0, 0, 0)

    const normalizedMin = new Date(minReservationDate.value)
    normalizedMin.setHours(0, 0, 0, 0)

    const normalizedMax = new Date(maxReservationDate.value)
    normalizedMax.setHours(0, 0, 0, 0)

    if (!esDiaHabilitadoYNoFeriado(normalizedDate)) {
      return ['header-blocked']
    }

    if (normalizedDate < normalizedMin || normalizedDate > normalizedMax) {
      return ['header-blocked']
    }
    return []
  }
}))

const refreshData = async () => {
  loadingRules.value = true
  const desde = minReservationDate.value
    ? getLocalDateString(minReservationDate.value)
    : undefined
  const hasta = maxReservationDate.value
    ? getLocalDateString(maxReservationDate.value)
    : undefined
  await Promise.all([
    doctorIdPersona.value
      ? reservasStore.fetchReservasByDoctor(doctorIdPersona.value)
      : Promise.resolve([]),
    bloqueosStore.fetchByDoctor(props.doctor.id, desde, hasta),
  ])
  loadingRules.value = false
}

</script>

<template>
  <div
    class="container-calendar"
    :class="{ 'container-calendar--mobile': isMobile }"
  >
    <v-overlay :model-value="loadingRules" contained class="align-center justify-center rounded-xl">
      <v-progress-circular indeterminate color="primary" />
    </v-overlay>

    <header class="d-flex align-center justify-space-between flex-wrap ga-3 mb-8" :style="{ opacity: loadingRules ? 0.5 : 1 }">
      <div class="d-flex align-center ga-3 min-width-0 flex-grow-1">
        <v-btn
          variant="tonal"
          :icon="isMobile ? 'mdi-arrow-left' : undefined"
          :prepend-icon="isMobile ? undefined : 'mdi-arrow-left'"
          color="primary"
          :size="isMobile ? 'small' : 'default'"
          class="rounded-lg text-none font-weight-bold"
          @click="$emit('volver')"
        >
          <span v-if="!isMobile">Volver</span>
        </v-btn>
        <PersonaAvatar
          :foto="doctor.foto || doctor.imagen"
          :nombres="doctor.nombres"
          :primer-apellido="doctor.primerApellido"
          :size="isMobile ? 40 : 56"
          rounded="lg"
          :class="isMobile ? '' : 'border-primary'"
        />
        <div class="min-width-0">
          <h3 :class="isMobile ? 'text-subtitle-1 font-weight-black text-grey-darken-4 text-truncate' : 'text-h4 font-weight-black text-grey-darken-4 tracking-tight'">
            {{ doctor.nombre }}
          </h3>
          <p v-if="!isMobile" class="text-subtitle-2 font-weight-medium text-grey-darken-1 mb-0">
            Selecciona un horario disponible
          </p>
          <div v-if="!isMobile" class="d-flex align-center flex-wrap ga-2 mt-2">
            <v-chip size="small" color="primary" variant="tonal" class="font-weight-bold">
              {{ especialidad.nombre }}
            </v-chip>
            <v-chip size="small" color="secondary" variant="tonal" class="font-weight-bold">
              <v-icon start icon="mdi-clock-outline" size="14" />
              Turno {{ doctor.turno }}
            </v-chip>
            <v-chip size="small" variant="text" class="text-grey-darken-1 px-0">
              <v-icon start icon="mdi-map-marker" size="14" />
              {{ postaCompleta.nombre }}
            </v-chip>
          </div>
          <div v-else class="d-flex align-center ga-1 mt-1 flex-wrap">
            <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
              {{ especialidad.nombre }}
            </v-chip>
            <span class="text-caption text-medium-emphasis">{{ postaCompleta.nombre }}</span>
          </div>
        </div>
      </div>
    </header>

    <v-alert
      v-if="telefonoContactoPublico"
      type="info"
      variant="tonal"
      rounded="xl"
      class="mb-4"
      border="start"
    >
      <div class="text-body-2">
        Coordina una cita personalizada fuera de los cupos del sistema.
      </div>
      <div class="d-flex flex-wrap align-center ga-2 mt-2">
        <v-btn
          :href="`tel:${telefonoContactoPublico}`"
          color="primary"
          variant="flat"
          rounded="lg"
          size="small"
          class="text-none font-weight-bold"
          prepend-icon="mdi-phone"
        >
          {{ telefonoContactoPublico }}
        </v-btn>
      </div>
    </v-alert>

    <v-card rounded="xl" class="calendar-card overflow-hidden shadow-premium premium-card position-relative" border :class="{ 'calendar-card--mobile': isMobile }">
      <div class="section-badge primary"></div>
      <v-card-item v-if="!isMobile" class="pb-1 pt-4">
        <template #prepend>
          <v-avatar color="primary-lighten-4" size="40">
            <v-icon color="primary">mdi-calendar-check</v-icon>
          </v-avatar>
        </template>
        <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">
          Selecciona tu horario
        </v-card-title>
        <v-card-subtitle class="text-wrap">{{ rangeMessagePaciente }}</v-card-subtitle>
      </v-card-item>

      <v-card-text :class="isMobile ? 'pa-2' : 'pa-4'">
        <div v-if="isMobile && !loadingRules" class="text-caption text-medium-emphasis mb-3 px-1">
          {{ rangeMessagePaciente }}
        </div>

        <div v-if="!loadingRules && !isMobile" data-tour="reserva-calendario">
          <FullCalendar :options="calendarOptions" />
        </div>

        <div v-else-if="!loadingRules && isMobile" class="mobile-reserva-week" data-tour="reserva-calendario">
          <div class="mobile-week-nav">
            <p class="text-caption font-weight-bold text-primary text-center mb-2">
              {{ weekRangeMessage }}
            </p>
            <div class="d-flex gap-2">
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="mdi-chevron-left"
                class="text-none font-weight-bold flex-grow-1 mobile-week-btn"
                :disabled="!puedeSemanaAnterior"
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
                :disabled="!puedeSemanaSiguiente"
                @click="cambiarSemanaMobile(1)"
              >
                Semana siguiente
              </v-btn>
            </div>
          </div>

          <CalendarioMobileSemana
            modo="reservar"
            :dias="diasSemanaMobile"
            :intervalo="intervalo"
            :slot-min-time="slotMinTime"
            :slot-max-time="slotMaxTime"
            :eventos="eventosSemanaMobile"
            @slot-click="seleccionarHorarioMobile"
          />
        </div>
      </v-card-text>
    </v-card>

    <ReservaModal
      v-model="modal"
      :fecha="fechaSeleccionada"
      :hora-inicio="horaInicioSeleccionada"
      :hora-fin="horaFinSeleccionada"
      :especialidad="especialidad"
      :posta="postaCompleta"
      :doctor="doctor"
      @conflict="refreshData"
    />
  </div>
</template>

<style src="@/assets/styles/calendario-reservas.css"></style>

<style scoped>
.min-width-0 {
  min-width: 0;
}

.shadow-premium {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12) !important;
}

.premium-card {
  background-color: white;
}

.section-badge {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
}

.section-badge.primary {
  background-color: rgb(var(--v-theme-primary));
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

.mobile-reserva-week {
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
}
</style>
