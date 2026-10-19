<script setup>
import { computed, ref, watch } from 'vue'
import { useTutorialStore } from '@/stores/tutorial'

const props = defineProps({
  dias: { type: Array, default: () => [] },
  intervalo: { type: Number, default: 30 },
  slotMinTime: { type: String, default: '08:00:00' },
  slotMaxTime: { type: String, default: '18:00:00' },
  slotWindowsByDate: { type: Object, default: () => ({}) },
  eventos: { type: Array, default: () => [] },
  modo: {
    type: String,
    default: 'reservar',
    validator: (v) => ['reservar', 'gestionar'].includes(v),
  },
  modoReagendar: { type: Boolean, default: false },
  modoAgendar: { type: Boolean, default: false },
  modoBloqueo: { type: Boolean, default: false },
  showLoadMore: { type: Boolean, default: false },
  horariosLabel: { type: String, default: 'Horarios Disponibles' },
})

const emit = defineEmits(['slot-click', 'event-click', 'load-more'])

const ROW_HEIGHT = 56

const formatDiaMobile = (date) => {
  const diaName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date).toUpperCase()
  const diaNum = date.getDate()
  const mesName = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date).toUpperCase()
  const anio = date.getFullYear().toString().slice(-2)
  return `${diaName} ${diaNum}/${mesName}/${anio}`
}

const getLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isToday = (date) => getLocalDateString(date) === getLocalDateString(new Date())

const minFechaBloqueoDia = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 1)
  return getLocalDateString(d)
}

const esDiaFuturoParaBloqueo = (date) => {
  return getLocalDateString(date) >= minFechaBloqueoDia()
}

const isEventInPast = (ev) => new Date(ev.start) < new Date()

const getOverlayClass = (ev) => {
  if (ev.extendedProps?.tipo === 'bloqueo' || (ev.classNames || []).includes('event-bloqueo')) {
    return 'gc-absolute-atendido'
  }
  if (ev.extendedProps?.tipo === 'emergencia' || (ev.classNames || []).includes('event-emergencia')) {
    return 'gc-absolute-atraso'
  }
  if (props.modo === 'gestionar') {
    const estado = (ev.extendedProps?.reserva?.estado || '').toUpperCase()
    if (estado === 'ATRASO' || estado === 'ABANDONO' || (ev.classNames || []).includes('event-atraso')) {
      return 'gc-absolute-atraso'
    }
    if (['ATENDIDO', 'A-FUERA-HORARIO'].includes(estado)) return 'gc-absolute-atendido'
    if (estado === 'A-SIN-RESERVA') return 'gc-absolute-mine-other'
    if (estado === 'PRESENTE') return 'gc-absolute-mine'
    if (isEventInPast(ev)) return 'gc-absolute-atendido'
    return 'gc-absolute-pendiente'
  }
  const classes = ev.classNames || []
  if (classes.includes('event-atraso')) return 'gc-absolute-atraso'
  if (classes.includes('event-mine')) return 'gc-absolute-mine'
  if (classes.includes('event-mine-other')) return 'gc-absolute-mine-other'
  if (classes.includes('event-reserved')) return 'gc-absolute-atendido'
  return 'gc-absolute-pendiente'
}

const isEventClickable = (ev) => {
  if (props.modo !== 'gestionar') return false
  if (ev.extendedProps?.tipo === 'bloqueo') return true
  if (ev.extendedProps?.tipo === 'emergencia') return true
  return Boolean(ev.extendedProps?.reserva)
}

const obtenerEventosAbsolutos = (dia) => {
  const eventos = []
  const diaNormalizado = new Date(dia)
  diaNormalizado.setHours(0, 0, 0, 0)

  const [hMin, mMin] = props.slotMinTime.split(':').map(Number)
  const slotMinDate = new Date(diaNormalizado)
  slotMinDate.setHours(hMin, mMin, 0, 0)

  const [hMax, mMax] = props.slotMaxTime.split(':').map(Number)
  const slotMaxDate = new Date(diaNormalizado)
  slotMaxDate.setHours(hMax, mMax, 0, 0)

  const fuenteEventos = props.modo === 'reservar'
    ? props.eventos.filter((e) =>
        e.classNames?.includes('event-mine') || e.classNames?.includes('event-mine-other'),
      )
    : props.eventos

  fuenteEventos.forEach((ev) => {
    const evStart = new Date(ev.start)
    const evEnd = new Date(ev.end)

    const evDiaNormalizado = new Date(evStart)
    evDiaNormalizado.setHours(0, 0, 0, 0)
    if (evDiaNormalizado.getTime() !== diaNormalizado.getTime()) return

    let startObj = evStart < slotMinDate ? slotMinDate : evStart
    let endObj = evEnd > slotMaxDate ? slotMaxDate : evEnd

    if (startObj >= endObj) {
      if (evEnd <= slotMinDate) {
        startObj = new Date(slotMinDate)
        endObj = new Date(slotMinDate.getTime() + props.intervalo * 60000)
      } else if (evStart >= slotMaxDate) {
        endObj = new Date(slotMaxDate)
        startObj = new Date(slotMaxDate.getTime() - props.intervalo * 60000)
      } else {
        return
      }
    }

    const minutesFromStart = (startObj.getTime() - slotMinDate.getTime()) / 60000
    const durationMinutes = (endObj.getTime() - startObj.getTime()) / 60000

    eventos.push({
      titulo: ev.title,
      inicioStr: evStart.toTimeString().slice(0, 5),
      finStr: evEnd.toTimeString().slice(0, 5),
      top: (minutesFromStart / props.intervalo) * ROW_HEIGHT,
      height: Math.max((durationMinutes / props.intervalo) * ROW_HEIGHT, 20),
      overlayClass: getOverlayClass(ev),
      clickable: isEventClickable(ev),
      evento: ev,
      reserva: ev.extendedProps?.reserva,
    })
  })

  return eventos
}

const obtenerHorariosDisponibles = (fecha) => {
  const horarios = []
  const [hMin, mMin] = props.slotMinTime.split(':').map(Number)
  const [hMax, mMax] = props.slotMaxTime.split(':').map(Number)

  let start = new Date(fecha)
  start.setHours(hMin, mMin, 0, 0)

  const endLimit = new Date(fecha)
  endLimit.setHours(hMax, mMax, 0, 0)

  const now = new Date()

  // Solo generar intervalos completos (ej. no 11:45-12:00 si la cita dura 45 min).
  while (start.getTime() + props.intervalo * 60000 <= endLimit.getTime()) {
    const end = new Date(start.getTime() + props.intervalo * 60000)
    const fechaKey = getLocalDateString(fecha)
    const ventanas = props.slotWindowsByDate?.[fechaKey] || []
    const startMin = start.getHours() * 60 + start.getMinutes()
    const endMin = end.getHours() * 60 + end.getMinutes()
    const hasVentanasConfigured = props.slotWindowsByDate && Object.prototype.hasOwnProperty.call(props.slotWindowsByDate, fechaKey)
    const dentroDeTurno = !hasVentanasConfigured || ventanas.some((turno) => {
      const [hIni, mIni] = turno.inicio.split(':').map(Number)
      const [hFin, mFin] = turno.fin.split(':').map(Number)
      const iniMin = hIni * 60 + (mIni || 0)
      const finMin = hFin * 60 + (mFin || 0)
      return startMin >= iniMin && endMin <= finMin
    })

    const eventoEncontrado = props.eventos.find((evento) => {
      const eventStart = new Date(evento.start)
      const eventEnd = new Date(evento.end)
      return start < eventEnd && end > eventStart
    })

    let estado = 'LIBRE'
    let titulo = 'Disponible'

    if (!dentroDeTurno) {
      estado = 'FUERA_TURNO'
      titulo = 'Fuera de turno'
    } else if (start < now) {
      estado = 'PASADO'
      titulo = 'Pasado'
    } else if (props.modoBloqueo && !esDiaFuturoParaBloqueo(fecha)) {
      estado = 'PASADO'
      titulo = 'Solo días futuros'
    } else if (eventoEncontrado) {
      if (props.modo === 'reservar') {
        if (eventoEncontrado.classNames?.includes('event-mine')) {
          estado = 'MIO'
          titulo = 'Tu Reserva'
        } else if (eventoEncontrado.classNames?.includes('event-mine-other')) {
          estado = 'MIO_OTRA'
          titulo = eventoEncontrado.title
        } else {
          estado = 'OCUPADO'
          titulo = 'Ocupado'
        }
      } else {
        estado = 'OCUPADO'
        titulo = eventoEncontrado.title || 'Ocupado'
      }
    }

    horarios.push({
      inicio: start.toTimeString().slice(0, 5),
      fin: end.toTimeString().slice(0, 5),
      fullInicio: start.toTimeString().slice(0, 8),
      fullFin: end.toTimeString().slice(0, 8),
      dateObj: new Date(start),
      estado,
      titulo,
    })

    start = end
  }

  return horarios
}

const onSlotClick = (dia, horario) => {
  if (['PASADO', 'OCUPADO', 'FUERA_TURNO'].includes(horario.estado)) return
  if (props.modo === 'reservar' && horario.estado !== 'LIBRE') return
  if (props.modo === 'gestionar') {
    if (horario.estado !== 'LIBRE') return
    if (props.modoBloqueo && !esDiaFuturoParaBloqueo(dia)) return
  }
  emit('slot-click', dia, horario)
}

const puedeSeleccionarSlotBloqueo = (dia, h) => {
  return (
    props.modo === 'gestionar' &&
    props.modoBloqueo &&
    h.estado === 'LIBRE' &&
    esDiaFuturoParaBloqueo(dia)
  )
}

const puedeSeleccionarSlotLibre = (h) => {
  return props.modo === 'gestionar' && h.estado === 'LIBRE'
}

const onEventClick = (item) => {
  if (!item.clickable) return
  emit('event-click', {
    reserva: item.reserva,
    bloqueo: item.evento?.extendedProps?.bloqueo,
    evento: item.evento,
  })
}

const emptyDays = computed(() => props.dias.length === 0)

const firstFreeSlotKey = computed(() => {
  for (let diaIndex = 0; diaIndex < props.dias.length; diaIndex++) {
    const dia = props.dias[diaIndex]
    if (props.modoBloqueo && !esDiaFuturoParaBloqueo(dia)) continue
    const horarios = obtenerHorariosDisponibles(dia)
    for (let hIdx = 0; hIdx < horarios.length; hIdx++) {
      if (horarios[hIdx].estado === 'LIBRE') return `${diaIndex}-${hIdx}`
    }
  }
  return null
})

const firstCitaEventKey = computed(() => {
  for (let diaIndex = 0; diaIndex < props.dias.length; diaIndex++) {
    const dia = props.dias[diaIndex]
    const eventos = obtenerEventosAbsolutos(dia)
    const cita = eventos.find(
      (ev) => ev.clickable && ev.evento?.extendedProps?.tipo !== 'bloqueo' && ev.evento?.extendedProps?.reserva,
    )
    if (cita) return `${diaIndex}-${cita.titulo}-${cita.inicioStr}`
  }
  return null
})

const isTourSlot = (diaIndex, hIdx, h) => {
  return props.modo === 'reservar' && h.estado === 'LIBRE'
}

const isAgendaTourSlot = (diaIndex, hIdx, h) => {
  if (props.modo !== 'gestionar' || h.estado !== 'LIBRE') return false
  if (props.modoBloqueo) {
    const dia = props.dias[diaIndex]
    if (!dia || !esDiaFuturoParaBloqueo(dia)) return false
  }
  return firstFreeSlotKey.value === `${diaIndex}-${hIdx}`
}

const citaTourAttr = (diaIndex, evento) => {
  if (props.modo !== 'gestionar') return undefined
  if (!evento?.clickable || evento.evento?.extendedProps?.tipo === 'bloqueo') return undefined
  if (!evento.evento?.extendedProps?.reserva) return undefined
  const key = `${diaIndex}-${evento.titulo}-${evento.inicioStr}`
  return key === firstCitaEventKey.value ? 'agenda-cita-event' : undefined
}

const slotTourAttr = (diaIndex, hIdx, h) => {
  if (isTourSlot(diaIndex, hIdx, h)) return 'reserva-slot'
  if (isAgendaTourSlot(diaIndex, hIdx, h)) return 'agenda-slot'
  return undefined
}

const tutorialStore = useTutorialStore()
const expandedPanel = ref(undefined)

watch(
  () => tutorialStore.currentStep?.id,
  (stepId) => {
    const expandSteps = [
      'reserva-calendario',
      'agenda-semana-intro',
      'gestion-cita-event',
      'gestion-cita-cancelar',
      'bloqueo-slot',
      'bloqueo-banner',
    ]
    if (expandSteps.includes(stepId) && (expandedPanel.value == null || expandedPanel.value === undefined)) {
      expandedPanel.value = 0
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="mobile-calendar-view">
    <v-expansion-panels v-if="!emptyDays" v-model="expandedPanel" variant="accordion" class="custom-panels">
      <v-expansion-panel
        v-for="(dia, index) in dias"
        :key="index"
        elevation="0"
        class="mb-2 border-subtle-panel"
        :class="{ 'day-panel--today': isToday(dia) }"
      >
        <v-expansion-panel-title class="py-4" :class="{ 'day-panel-title--today': isToday(dia) }">
          <template #default="{ expanded }">
            <v-row no-gutters align="center">
              <v-col cols="1" class="d-flex justify-center">
                <v-icon
                  :color="isToday(dia) || expanded ? 'primary' : 'grey-darken-1'"
                  :icon="expanded ? 'mdi-calendar-clock' : 'mdi-calendar-blank'"
                />
              </v-col>
              <v-col class="ms-4 d-flex align-center flex-wrap gap-2">
                <span
                  class="text-subtitle-1 font-weight-bold"
                  :class="isToday(dia) || expanded ? 'text-primary' : ''"
                >
                  {{ formatDiaMobile(dia) }}
                </span>
                <v-chip
                  v-if="isToday(dia)"
                  color="primary"
                  size="x-small"
                  variant="flat"
                  class="font-weight-bold"
                >
                  Hoy
                </v-chip>
              </v-col>
            </v-row>
          </template>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="pa-2">
            <h4 class="text-caption font-weight-bold text-grey-darken-1 mb-4 text-uppercase letter-spacing-1">
              {{ horariosLabel }}
            </h4>

            <div class="gc-timeline">
              <div class="gc-grid-container" style="position: relative;">
                <div class="gc-absolute-overlay">
                  <div
                    v-for="(evento, eIdx) in obtenerEventosAbsolutos(dia)"
                    :key="`ev-${eIdx}`"
                    class="gc-absolute-event"
                    :class="[
                      evento.overlayClass,
                      { 'gc-absolute-clickable': evento.clickable },
                    ]"
                    :style="{ top: evento.top + 'px', height: evento.height + 'px' }"
                    :data-tour="citaTourAttr(index, evento)"
                    @click.stop="onEventClick(evento)"
                  >
                    <div class="gc-event-content">
                      <span class="font-weight-bold text-caption">{{ evento.titulo }}</span>
                      <span class="text-xs gc-event-time">{{ evento.inicioStr }} - {{ evento.finStr }}</span>
                    </div>
                  </div>
                </div>

                <div
                  v-for="(h, hIdx) in obtenerHorariosDisponibles(dia)"
                  :key="hIdx"
                  class="gc-time-row"
                  :class="{
                    'gc-time-row-selectable':
                      (modo === 'reservar' && h.estado === 'LIBRE') ||
                      (modo === 'gestionar' &&
                        (modoReagendar || modoAgendar) &&
                        h.estado === 'LIBRE') ||
                      puedeSeleccionarSlotBloqueo(dia, h) ||
                      (!modoReagendar && !modoAgendar && !modoBloqueo && puedeSeleccionarSlotLibre(h)),
                  }"
                  @click="onSlotClick(dia, h)"
                >
                  <div class="gc-time-axis">
                    <span class="gc-time-text">{{ h.inicio }}</span>
                  </div>

                  <div class="gc-event-container">
                    <div class="gc-divider" />

                    <template v-if="h.estado === 'PASADO'">
                      <div class="gc-past-slot" />
                    </template>

                    <template v-else-if="h.estado === 'OCUPADO'">
                      <div
                        v-if="modo === 'reservar'"
                        class="gc-event-block gc-occupied"
                      >
                        <div class="gc-event-content">
                          <span class="font-weight-bold text-caption">{{ h.titulo }}</span>
                          <span class="text-xs gc-event-time">{{ h.inicio }} - {{ h.fin }}</span>
                        </div>
                      </div>
                      <div v-else class="gc-free-slot disabled-slot" style="background: transparent;" />
                    </template>

                    <template v-else-if="h.estado === 'MIO' || h.estado === 'MIO_OTRA'">
                      <div class="gc-free-slot disabled-slot" style="background: transparent;" />
                    </template>

                    <template v-else-if="h.estado === 'FUERA_TURNO'">
                      <div class="gc-free-slot disabled-slot" style="background: transparent;" />
                    </template>

                    <template v-else>
                      <div class="gc-free-slot" :data-tour="slotTourAttr(index, hIdx, h)">
                        <v-icon icon="mdi-plus" size="20" class="gc-add-icon" />
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="obtenerHorariosDisponibles(dia).length === 0" class="text-center py-4">
              <v-icon color="grey-lighten-1" size="32" icon="mdi-calendar-remove" />
              <p class="text-caption text-grey-darken-1 mt-2">No hay horarios de atención para este día</p>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-alert v-else type="info" variant="tonal" class="rounded-xl">
      No hay días disponibles para mostrar.
    </v-alert>

    <div v-if="showLoadMore" class="d-flex justify-center mt-4">
      <v-btn variant="text" color="primary" prepend-icon="mdi-plus" class="font-weight-bold" @click="emit('load-more')">
        Cargar más días
      </v-btn>
    </div>
  </div>
</template>

<style src="@/assets/styles/calendario-reservas.css"></style>

<style scoped>
.day-panel--today {
  border-color: rgba(var(--v-theme-primary), 0.35) !important;
}

.day-panel-title--today {
  background: rgba(var(--v-theme-primary), 0.08);
}
</style>
