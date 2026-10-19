<script setup>
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { normalizeFechaCita } from '@/utils/reservaIdentity'
import { useTutorialStore } from '@/stores/tutorial'

const props = defineProps({
  reservas: { type: Array, default: () => [] },
  emergencias: { type: Array, default: () => [] },
  mostrarExtras: { type: Boolean, default: false },
})

const emit = defineEmits(['seleccionar-dia', 'update:mostrarExtras'])

const mostrarExtrasLocal = computed({
  get: () => props.mostrarExtras,
  set: (val) => emit('update:mostrarExtras', Boolean(val)),
})
const { smAndDown } = useDisplay()
const isMobile = computed(() => smAndDown.value)
const tutorialStore = useTutorialStore()

const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const currentViewDate = ref(new Date())
const today = new Date()
const todayStr = getLocalDateString(today)

function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateStr(dateStr) {
  return normalizeFechaCita(dateStr)
}

const ESTADOS_CANCELADOS = ['CANCELADA', 'CANCELADO', 'RECHAZADA', 'ANULADA']

const conteosPorDia = computed(() => {
  const map = {}

  props.reservas.forEach((r) => {
    const fecha = normalizeDateStr(r.fechaCita)
    if (!fecha) return
    const estado = (r.estado || '').toUpperCase()
    if (ESTADOS_CANCELADOS.includes(estado)) return

    if (!map[fecha]) map[fecha] = { conReserva: 0, sinReserva: 0, emergencias: 0 }

    if (estado === 'A-SIN-RESERVA') {
      if (props.mostrarExtras) map[fecha].sinReserva += 1
    } else if (
      ['PENDIENTE', 'PRESENTE', 'ATRASO', 'ATENDIDO', 'A-FUERA-HORARIO'].includes(estado)
    ) {
      map[fecha].conReserva += 1
    }
  })

  if (props.mostrarExtras) {
    props.emergencias.forEach((e) => {
      const fecha = normalizeDateStr(e.fechaAtencion)
      if (!fecha) return
      if (!map[fecha]) map[fecha] = { conReserva: 0, sinReserva: 0, emergencias: 0 }
      map[fecha].emergencias += 1
    })
  }

  return map
})

const currentMonthLabel = computed(() => {
  return currentViewDate.value
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase())
})

const calendarDays = computed(() => {
  const date = currentViewDate.value
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startOfWeek = firstDay.getDay()
  startOfWeek = startOfWeek === 0 ? 6 : startOfWeek - 1

  const days = []
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startOfWeek - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, currentMonth: false })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const conteos = conteosPorDia.value[dStr] || { conReserva: 0, sinReserva: 0, emergencias: 0 }
    const total = conteos.conReserva + conteos.sinReserva + conteos.emergencias
    days.push({
      day: d,
      currentMonth: true,
      active: dStr === todayStr,
      fullDate: dStr,
      conteos,
      total,
      hasActivity: total > 0,
    })
  }

  const remainingCells = 42 - days.length
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, currentMonth: false })
  }

  return days
})

const changeMonth = (offset) => {
  const newDate = new Date(
    currentViewDate.value.getFullYear(),
    currentViewDate.value.getMonth() + offset,
    1,
  )
  currentViewDate.value = newDate
}

const monthOptions = [
  { title: 'Enero', value: 0 },
  { title: 'Febrero', value: 1 },
  { title: 'Marzo', value: 2 },
  { title: 'Abril', value: 3 },
  { title: 'Mayo', value: 4 },
  { title: 'Junio', value: 5 },
  { title: 'Julio', value: 6 },
  { title: 'Agosto', value: 7 },
  { title: 'Septiembre', value: 8 },
  { title: 'Octubre', value: 9 },
  { title: 'Noviembre', value: 10 },
  { title: 'Diciembre', value: 11 },
]

const yearOptions = computed(() => {
  const years = new Set([new Date().getFullYear()])
  props.reservas.forEach((r) => {
    const fecha = normalizeDateStr(r.fechaCita)
    if (fecha) years.add(parseInt(fecha.split('-')[0], 10))
  })
  props.emergencias.forEach((e) => {
    const fecha = normalizeDateStr(e.fechaAtencion)
    if (fecha) years.add(parseInt(fecha.split('-')[0], 10))
  })
  const min = Math.min(...years) - 1
  const max = Math.max(...years) + 1
  const result = []
  for (let y = min; y <= max; y++) result.push(y)
  return result
})

const selectedMonth = computed({
  get: () => currentViewDate.value.getMonth(),
  set: (val) => {
    currentViewDate.value = new Date(currentViewDate.value.getFullYear(), val, 1)
  },
})

const selectedYear = computed({
  get: () => currentViewDate.value.getFullYear(),
  set: (val) => {
    currentViewDate.value = new Date(val, currentViewDate.value.getMonth(), 1)
  },
})

const seleccionarDia = (dateObj) => {
  if (!dateObj.currentMonth || !dateObj.fullDate) return
  emit('seleccionar-dia', dateObj.fullDate)
}

const STEPS_QUE_APUNTAN_DIA_MES = new Set([
  'agenda-mes-dia',
  'gestion-abrir-semana',
  'bloqueo-abrir-semana',
])

watch(
  () => tutorialStore.currentStep?.id,
  (stepId) => {
    if (!STEPS_QUE_APUNTAN_DIA_MES.has(stepId)) return
    const now = new Date()
    currentViewDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
  },
  { immediate: true },
)

/** El tutorial siempre destaca el día de hoy (móvil y escritorio). */
const isTourDay = (date) => Boolean(date?.currentMonth && date.active && date.fullDate === todayStr)
</script>

<template>
  <v-card class="rounded-xl" :class="isMobile ? 'pa-3' : 'pa-6'" elevation="0" border>
    <div :class="isMobile ? 'mb-4' : 'd-flex flex-column gap-3 mb-6'">
      <div class="d-flex align-center justify-space-between">
        <h2 :class="isMobile ? 'text-subtitle-1 font-weight-bold' : 'text-h6 font-weight-bold'">{{ currentMonthLabel }}</h2>
        <div class="d-flex gap-1">
          <v-btn icon="mdi-chevron-left" variant="text" density="compact" rounded @click="changeMonth(-1)" />
          <v-btn icon="mdi-chevron-right" variant="text" density="compact" rounded @click="changeMonth(1)" />
        </div>
      </div>
      <div class="d-flex gap-2" :class="{ 'mt-2': isMobile }">
        <v-select
          v-model="selectedMonth"
          :items="monthOptions"
          item-title="title"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          label="Mes"
          class="flex-grow-1"
        />
        <v-select
          v-model="selectedYear"
          :items="yearOptions"
          density="compact"
          variant="outlined"
          hide-details
          label="Año"
          :style="isMobile ? 'max-width: 96px' : 'max-width: 110px'"
        />
      </div>
    </div>

    <div class="d-flex flex-wrap align-center justify-space-between gap-2 mb-4">
      <div class="d-flex flex-wrap gap-2" :class="{ 'gap-1': isMobile }">
        <v-chip size="small" color="primary" variant="tonal">
          <v-icon start size="14">mdi-calendar-check</v-icon>
          Con reserva
        </v-chip>
        <v-chip v-if="mostrarExtras" size="small" color="orange" variant="tonal">
          <v-icon start size="14">mdi-account-clock</v-icon>
          Sin reserva
        </v-chip>
        <v-chip v-if="mostrarExtras" size="small" color="error" variant="tonal">
          <v-icon start size="14">mdi-alert-circle</v-icon>
          Emergencias
        </v-chip>
      </div>
      <v-switch
        v-model="mostrarExtrasLocal"
        color="orange"
        density="compact"
        hide-details
        class="flex-grow-0"
        :label="isMobile ? 'Extras' : 'Ver Emergencias y Atenciones sin Reserva'"
      />
    </div>

    <div class="calendar-grid mb-2" data-tour="agenda-mes">
      <div
        v-for="day in weekDays"
        :key="day"
        class="text-caption font-weight-bold text-medium-emphasis text-center text-uppercase"
      >
        {{ day }}
      </div>
      <div
        v-for="(date, i) in calendarDays"
        :key="i"
        class="day-cell text-center py-1 text-body-2 rounded-lg d-flex flex-column align-center justify-center"
        :class="{
          'text-disabled': !date.currentMonth,
          'bg-primary text-white font-weight-bold': date.active,
          'text-high-emphasis font-weight-medium day-clickable': date.currentMonth && !date.active,
          'has-activity': date.hasActivity && !date.active,
        }"
        :data-tour="isTourDay(date) ? 'agenda-mes-dia' : undefined"
        @click="seleccionarDia(date)"
      >
        <span class="day-number">{{ date.day }}</span>
        <v-chip
          v-if="isMobile && date.active"
          size="x-small"
          color="white"
          variant="flat"
          class="today-chip font-weight-bold mt-1"
        >
          Hoy
        </v-chip>
        <div v-if="date.currentMonth && date.hasActivity" class="day-counts mt-1">
          <span v-if="date.conteos.conReserva" class="count-dot count-reserva" :title="`${date.conteos.conReserva} con reserva`">
            {{ date.conteos.conReserva }}
          </span>
          <span v-if="date.conteos.sinReserva" class="count-dot count-sin-reserva" :title="`${date.conteos.sinReserva} sin reserva`">
            {{ date.conteos.sinReserva }}
          </span>
          <span v-if="date.conteos.emergencias" class="count-dot count-emergencia" :title="`${date.conteos.emergencias} emergencias`">
            {{ date.conteos.emergencias }}
          </span>
        </div>
      </div>
    </div>

    <p class="text-caption text-medium-emphasis text-center mt-2">
      Haz clic en un día para ver la agenda detallada.
    </p>
  </v-card>
</template>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-cell {
  aspect-ratio: 1;
  min-height: 52px;
  border: 1px solid transparent;
}

.day-clickable {
  cursor: pointer;
  transition: background 0.15s ease;
}

.day-clickable:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.has-activity {
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.day-number {
  line-height: 1.2;
}

.day-counts {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: center;
}

.count-dot {
  font-size: 9px;
  font-weight: 700;
  min-width: 14px;
  height: 14px;
  line-height: 14px;
  border-radius: 4px;
  padding: 0 2px;
}

.count-reserva {
  background: #dbeafe;
  color: #1d4ed8;
}

.count-sin-reserva {
  background: #ffedd5;
  color: #c2410c;
}

.count-emergencia {
  background: #fee2e2;
  color: #b91c1c;
}

.bg-primary .count-reserva,
.bg-primary .count-sin-reserva,
.bg-primary .count-emergencia {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.today-chip {
  color: rgb(var(--v-theme-primary)) !important;
  height: 16px !important;
  font-size: 9px !important;
  padding: 0 6px !important;
}
</style>
