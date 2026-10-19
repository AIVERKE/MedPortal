<script setup>
import { computed, onMounted, ref, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useReservasStore } from '@/stores/reservas'
import { useConsejoDelDiaStore } from '@/stores/consejo_del_dia'
import { useTutorialStore } from '@/stores/tutorial'
import { hasCompletedTutorial } from '@/utils/tutorialStorage'
import { resolveUploadUrl } from '@/utils/uploadUrl'
import defaultAvatar from '@/assets/usuario_default.webp'
import logoDiv from '@/assets/LogoDiv.png'
import logoBS from '@/assets/LogoBS.jpeg'
import logoUmsa from '@/assets/Umsa-logo.svg'
import logoFCPN from '@/assets/EscudoFCPN.png'

const authStore = useAuthStore()
const reservasStore = useReservasStore()
const consejoStore = useConsejoDelDiaStore()
const tutorialStore = useTutorialStore()

const PATIENT_ROLES = ['ESTUDIANTE', 'DOCENTE', 'CONSULTOR', 'ADMINISTRATIVO']
const isPatient = computed(() => PATIENT_ROLES.includes(authStore.user?.rol))

onMounted(async () => {
  if (authStore.user?.idUsuario) {
    const id = authStore.user.idUsuario
    await Promise.allSettled([
      reservasStore.fetchReservasByUsuario(id),
      reservasStore.fetchReservasProgramadasByUsuario(id),
      consejoStore.fetchConsejoAleatorio()
    ])
  }

  const userId = authStore.user?.idUsuario
  if (
    isPatient.value &&
    userId &&
    !hasCompletedTutorial(userId) &&
    !authStore.user?.mustChangePassword &&
    !tutorialStore.active
  ) {
    await nextTick()
    setTimeout(() => {
      tutorialStore.start({ mode: 'auto', routePath: '/home', tutorialId: 'reservar-cita' })
    }, 600)
  }
})

const normalizeDateStr = (dateStr) => {
  if (!dateStr) return ''
  if (typeof dateStr !== 'string') {
    if (dateStr instanceof Date) return dateStr.toISOString().slice(0, 10)
    return String(dateStr).slice(0, 10)
  }
  return dateStr.includes('T') ? dateStr.slice(0, 10) : dateStr
}

const belongsToUser = (reserva, userId) => {
  if (!userId) return false
  return Number(reserva.idUsuario) === Number(userId)
}

// Helper to reliably parse date and time from strings
const parseAppointmentDate = (dateStr, timeStr) => {
  const normalizedDate = normalizeDateStr(dateStr)
  if (!normalizedDate) return new Date(0)
  const [year, month, day] = normalizedDate.split('-').map(Number)
  const timePart = (timeStr || '00:00').split(':')
  const hour = Number(timePart[0]) || 0
  const minute = Number(timePart[1]) || 0
  return new Date(year, month - 1, day, hour, minute)
}

const isPastOrCompletedCita = (reserva, now) => {
  const status = reserva.estado?.toUpperCase()
  if (status === 'PENDIENTE' || status === 'PRESENTE') {
    return parseAppointmentDate(reserva.fechaCita, reserva.horaInicioCita) < now
  }
  return true
}

// Helper to format date for display
const formatDate = (dateString) => {
  const normalizedDate = normalizeDateStr(dateString)
  if (!normalizedDate) return ''
  const [year, month, day] = normalizedDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Helper to format time for display
const formatTime = (timeString) => {
  if (!timeString) return ''
  return timeString.substring(0, 5) // HH:mm
}

// Status color helper for Home view
const getHomeStatusColor = (status) => {
  const s = status?.toUpperCase()
  if (s === 'COMPLETADA' || s === 'ATENDIDO' || s === 'FINALIZADA') return 'success'
  if (s === 'PENDIENTE') return 'primary'
  if (s === 'ATRASO' || s === 'ABANDONO') return 'error'
  if (s === 'CANCELADA' || s === 'CANCELADO' || s === 'RECHAZADA') return 'error'
  if (s === 'INASISTENCIA') return 'blue-grey-darken-1'
  return 'grey'
}

// Citas Recientes (past or completed appointments)
const recentAppointments = computed(() => {
  const now = new Date()
  const userId = authStore.user?.idUsuario
  return (reservasStore.reservas || [])
    .filter(r => belongsToUser(r, userId) && isPastOrCompletedCita(r, now))
    .sort((a, b) => {
      const dateA = parseAppointmentDate(a.fechaCita, a.horaInicioCita)
      const dateB = parseAppointmentDate(b.fechaCita, b.horaInicioCita)
      return dateB - dateA
    })
    .slice(0, 10)
    .map(r => ({
      specialist: r.doctor?.nombre || 'Especialista',
      specialty: r.especialidad?.nombre || 'General',
      date: formatDate(r.fechaCita),
      time: formatTime(r.horaInicioCita),
      status: r.estado,
      avatar: resolveUploadUrl(r.doctor?.imagen) || defaultAvatar,
      statusColor: getHomeStatusColor(r.estado)
    }))
})

// Próxima Cita (The very next active appointment)
const proximaCita = computed(() => {
  const now = new Date()
  const userId = authStore.user?.idUsuario
  const futurables = (reservasStore.reservas || [])
    .filter(r => {
      if (!belongsToUser(r, userId)) return false
      const appDate = parseAppointmentDate(r.fechaCita, r.horaInicioCita)
      return r.estado?.toUpperCase() === 'PENDIENTE' && appDate >= new Date(now.getTime() - 5 * 60000)
    })
    .sort((a, b) => {
      const dateA = parseAppointmentDate(a.fechaCita, a.horaInicioCita)
      const dateB = parseAppointmentDate(b.fechaCita, b.horaInicioCita)
      return dateA - dateB
    })

  return futurables.length > 0 ? futurables[0] : null
})

// Citas Pendientes (count of future pending appointments)
const pendingAppointmentsCount = computed(() => {
  const now = new Date()
  const userId = authStore.user?.idUsuario
  return (reservasStore.reservas || []).filter(r => {
    if (!belongsToUser(r, userId)) return false
    const appDate = parseAppointmentDate(r.fechaCita, r.horaInicioCita)
    return r.estado?.toUpperCase() === 'PENDIENTE' && appDate >= now
  }).length
})

// Tooltip state
const showTooltip = ref(false)
const tooltipData = ref([])
const tooltipX = ref(0)
const tooltipY = ref(0)
const tooltipPosition = ref('right') // 'right', 'left', 'center'

// Helper: Get local YYYY-MM-DD string
const getLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Group appointments by date (all statuses)
const appointmentsByDate = computed(() => {
  const groups = {}
  const userId = authStore.user?.idUsuario
    ; (reservasStore.reservas || []).forEach(r => {
      if (!r.fechaCita || !belongsToUser(r, userId)) return

      if (!groups[r.fechaCita]) groups[r.fechaCita] = []
      groups[r.fechaCita].push({
        time: formatTime(r.horaInicioCita),
        location: r.posta?.nombre || 'Posta Central',
        doctor: r.doctor?.nombre || 'Médico Asignado',
        specialty: r.especialidad?.nombre || 'General',
        status: r.estado,
        statusColor: getHomeStatusColor(r.estado)
      })
    })
  return groups
})

// Current view date
const currentViewDate = ref(new Date())
const today = new Date()
const todayStr = getLocalDateString(today)

const currentMonthLabel = computed(() => {
  return currentViewDate.value.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase())
})

// Dynamic Calendar Generation
const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const calendarDays = computed(() => {
  const date = currentViewDate.value
  const year = date.getFullYear()
  const month = date.getMonth()

  // First day of month
  const firstDay = new Date(year, month, 1)
  // Last day of month
  const lastDay = new Date(year, month + 1, 0)

  // Starting day of week (0=Sun, 1=Mon, ..., 6=Sat)
  // Adjust to 0=Mon, ..., 6=Sun
  let startOfWeek = firstDay.getDay()
  startOfWeek = startOfWeek === 0 ? 6 : startOfWeek - 1

  const days = []

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startOfWeek - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, currentMonth: false })
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      day: d,
      currentMonth: true,
      active: dStr === todayStr,
      fullDate: dStr,
      hasAppointments: !!appointmentsByDate.value[dStr]
    })
  }

  // Next month leading days
  const remainingCells = 42 - days.length
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, currentMonth: false })
  }

  return days
})

const changeMonth = (offset) => {
  const newDate = new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth() + offset, 1)
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
  { title: 'Diciembre', value: 11 }
]

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = new Set([currentYear])
  const userId = authStore.user?.idUsuario
  ;(reservasStore.reservas || []).forEach(r => {
    if (r.idUsuario !== userId || !r.fechaCita) return
    years.add(parseInt(r.fechaCita.split('-')[0], 10))
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
  }
})

const selectedYear = computed({
  get: () => currentViewDate.value.getFullYear(),
  set: (val) => {
    currentViewDate.value = new Date(val, currentViewDate.value.getMonth(), 1)
  }
})

// Tooltip handlers
const handleHoverDay = (event, dateObj) => {
  if (dateObj.hasAppointments) {
    tooltipData.value = appointmentsByDate.value[dateObj.fullDate] || []
    tooltipX.value = event.clientX
    tooltipY.value = event.clientY

    // Tooltip width is ~240px
    const tooltipWidth = 240
    const margin = 20

    const canFitRight = (event.clientX + tooltipWidth + margin) < window.innerWidth
    const canFitLeft = (event.clientX - tooltipWidth - margin) > 0

    if (canFitRight) {
      tooltipPosition.value = 'right'
    } else if (canFitLeft) {
      tooltipPosition.value = 'left'
    } else {
      tooltipPosition.value = 'center'
    }

    showTooltip.value = true
  }
}

const hideTooltip = () => {
  showTooltip.value = false
}

// "Actividad Hoy" logic
const todayActivities = computed(() => {
  const userId = authStore.user?.idUsuario
  return (reservasStore.reservas || []).filter(r => {
    return belongsToUser(r, userId) && normalizeDateStr(r.fechaCita) === todayStr && r.estado?.toUpperCase() === 'PENDIENTE'
  })
})

const userName = computed(() => {
  const nombres = authStore.user?.nombres || 'Usuario'
  const primerNombre = nombres.split(' ')[0]
  const apellido = authStore.user?.primerApellido || ''
  return `${primerNombre} ${apellido}`.trim()
})
</script>

<template>
  <div class="max-width-form mx-auto pb-8">
    <!-- Header Section -->
    <header class="d-flex align-center justify-space-between flex-wrap ga-3 mb-8 mt-2" data-tour="home-welcome">
      <div>
        <h3 class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">
          Cuadro de Mando Integrado
        </h3>
        <p class="text-subtitle-2 font-weight-medium text-grey-darken-1">
          Bienvenido, {{ userName }}. Tu portal de salud universitaria.
        </p>
      </div>
      <v-btn color="primary" rounded="lg" variant="flat" prepend-icon="mdi-plus-circle"
        class="text-none font-weight-bold" to="/reservar">
        Reservar Nueva Cita
      </v-btn>
    </header>

    <!-- Stats Grid -->
    <v-row class="mb-6">
      <!-- Next Appointment Card -->
      <v-col cols="12" md="4">
        <v-card class="fill-height rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>
          <div class="section-badge primary"></div>
          <v-card-text class="d-flex flex-column justify-space-between pa-6">
            <div class="d-flex justify-space-between align-start w-100 mb-4">
              <div v-if="proximaCita">
                <div class="text-caption font-weight-black text-uppercase text-grey-lighten-1 mb-1" style="letter-spacing: 0.05em;">Próxima Cita</div>
                <div class="text-h6 font-weight-bold text-grey-darken-4">
                  {{ formatDate(proximaCita.fechaCita) }}, {{ formatTime(proximaCita.horaInicioCita) }}
                </div>
                <div class="text-body-2 text-primary font-weight-medium mt-1">
                  {{ proximaCita.especialidad?.nombre || 'General' }}
                </div>
              </div>
              <div v-else>
                <div class="text-caption font-weight-black text-uppercase text-grey-lighten-1 mb-1" style="letter-spacing: 0.05em;">Próxima Cita</div>
                <div class="text-h6 font-weight-bold text-grey-darken-1">Sin citas programadas</div>
                <v-btn variant="text" color="primary" size="small" density="compact" class="pa-0 mt-1 text-none font-weight-bold" to="/reservar">
                  Reservar ahora
                </v-btn>
              </div>
              <v-avatar color="primary-lighten-4" size="40" rounded="lg">
                <v-icon color="primary">mdi-calendar-today</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Pending Appointments Card -->
      <v-col cols="12" md="4">
        <v-card class="fill-height rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>
          <div class="section-badge warning"></div>
          <v-card-text class="d-flex flex-column justify-space-between pa-6">
            <div class="d-flex justify-space-between align-start w-100 mb-4">
              <div>
                <div class="text-caption font-weight-black text-uppercase text-grey-lighten-1 mb-1" style="letter-spacing: 0.05em;">Citas Pendientes</div>
                <div class="text-h4 font-weight-bold text-grey-darken-4">{{ pendingAppointmentsCount }}</div>
                <div class="text-body-2 text-grey-darken-1 mt-1">Activas próximamente</div>
              </div>
              <v-avatar color="warning-lighten-4" size="40" rounded="lg">
                <v-icon color="warning">mdi-timer-sand</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Tip Card -->
      <v-col cols="12" md="4">
        <v-card class="fill-height rounded-xl overflow-hidden shadow-premium premium-card position-relative consejo-card"
          border>
          <div class="section-badge info"></div>
          <v-card-text class="pa-6 d-flex flex-column h-100 justify-space-between">
            <div class="d-flex align-center mb-2 ga-2">
              <v-avatar color="info-lighten-4" size="40" rounded="lg">
                <v-icon color="info" size="small">mdi-lightbulb-on-outline</v-icon>
              </v-avatar>
              <span class="text-caption font-weight-black text-uppercase text-grey-lighten-1"
                style="letter-spacing: 0.05em;">Consejo del Día</span>
            </div>
            <div v-if="consejoStore.loading" class="d-flex align-center justify-center flex-grow-1">
              <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
            </div>
            <div v-else-if="consejoStore.consejoActual" class="d-flex flex-column flex-grow-1">
              <div class="text-h6 font-weight-bold text-grey-darken-4 mb-1">{{ consejoStore.consejoActual.titulo }}</div>
              <p class="text-body-2 font-weight-medium text-grey-darken-1 overflow-hidden"
                style="line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical;">
                "{{ consejoStore.consejoActual.contenido }}"
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Recent Appointments Table -->
      <v-col cols="12" lg="8">
        <v-card class="rounded-xl fill-height overflow-hidden shadow-premium premium-card position-relative" border>
          <div class="section-badge primary"></div>
          <v-card-item class="pb-1 pt-4">
            <template #prepend>
              <v-avatar color="primary-lighten-4" size="40">
                <v-icon color="primary">mdi-history</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">
              Citas recientes
            </v-card-title>
            <template #append>
              <v-btn variant="tonal" color="primary" size="small" rounded="lg" class="text-none font-weight-bold" to="/historial">
                Ver todas
              </v-btn>
            </template>
          </v-card-item>

          <v-table class="bg-transparent">
            <thead>
              <tr>
                <th class="text-left text-caption font-weight-bold text-grey-lighten-1 text-uppercase pl-6 py-4">
                  Hora</th>
                <th class="text-left text-caption font-weight-bold text-grey-lighten-1 text-uppercase py-4">
                  Especialista</th>
                <th class="text-left text-caption font-weight-bold text-grey-lighten-1 text-uppercase py-4">
                  Especialidad</th>
                <th class="text-left text-caption font-weight-bold text-grey-lighten-1 text-uppercase py-4">Fecha
                </th>
                <th class="text-center text-caption font-weight-bold text-grey-lighten-1 text-uppercase pr-6 py-4">
                  Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recentAppointments.length === 0">
                <td colspan="5" class="text-center py-10 text-grey-darken-1">
                  No hay citas recientes para mostrar.
                </td>
              </tr>
              <tr v-for="(item, index) in recentAppointments" :key="index"
                class="hover-bg-surface-light transition-colors">
                <td class="pl-6 py-4 text-body-2 font-weight-bold text-primary">{{ item.time }}</td>
                <td class="py-4">
                  <div class="d-flex align-center ga-3">
                    <v-avatar size="32" color="surface-variant">
                      <v-img :src="item.avatar" alt="Avatar" cover></v-img>
                    </v-avatar>
                    <span class="text-body-2 font-weight-bold text-grey-darken-4">{{ item.specialist }}</span>
                  </div>
                </td>
                <td class="py-4 text-body-2 text-grey-darken-1">{{ item.specialty }}</td>
                <td class="py-4 text-body-2 text-grey-darken-1">{{ item.date }}</td>
                <td class="pr-6 py-4 text-center">
                  <v-chip size="small" :color="item.statusColor" class="font-weight-bold" variant="tonal">
                    {{ item.status }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>

      <!-- Calendar Widget -->
      <v-col cols="12" lg="4">
        <div class="d-flex flex-column ga-6 h-100">
          <v-card class="rounded-xl overflow-hidden shadow-premium premium-card position-relative flex-grow-0" border>
            <div class="section-badge success"></div>
            <v-card-text class="pa-6">
            <div class="d-flex flex-column ga-3 mb-6">
              <div class="d-flex align-center justify-space-between">
                <h2 class="text-subtitle-1 font-weight-black text-uppercase tracking-wider text-grey-darken-3">{{ currentMonthLabel }}</h2>
                <div class="d-flex ga-1">
                  <v-btn icon="mdi-chevron-left" variant="text" density="compact" rounded
                    @click="changeMonth(-1)"></v-btn>
                  <v-btn icon="mdi-chevron-right" variant="text" density="compact" rounded
                    @click="changeMonth(1)"></v-btn>
                </div>
              </div>
              <div class="d-flex ga-2">
                <v-select v-model="selectedMonth" :items="monthOptions" item-title="title" item-value="value"
                  density="compact" variant="outlined" hide-details label="Mes" class="flex-grow-1" rounded="lg"></v-select>
                <v-select v-model="selectedYear" :items="yearOptions" density="compact" variant="outlined"
                  hide-details label="Año" style="max-width: 110px;" rounded="lg"></v-select>
              </div>
            </div>

            <!-- Calendar Grid -->
            <div class="calendar-grid mb-4">
              <div v-for="day in weekDays" :key="day"
                class="text-caption font-weight-bold text-grey-lighten-1 text-center text-uppercase">
                {{ day }}
              </div>
              <!-- Days -->
              <div v-for="(date, i) in calendarDays" :key="i"
                class="text-center py-2 text-body-2 rounded-lg d-flex align-center justify-center cursor-pointer position-relative"
                :class="{
                  'text-disabled': !date.currentMonth,
                  'bg-primary text-white font-weight-bold shadow-sm': date.active,
                  'text-grey-darken-4 font-weight-medium': date.currentMonth && !date.active,
                  'has-appointments': date.hasAppointments && !date.active
                }" style="aspect-ratio: 1;" @mouseenter="handleHoverDay($event, date)" @mouseleave="hideTooltip">
                {{ date.day }}
                <div v-if="date.hasAppointments && !date.active" class="appointment-dot"></div>
              </div>
            </div>

            <!-- Daily Activity -->
            <div class="mt-4 pt-4 border-t">
              <h3 class="text-caption font-weight-black text-grey-lighten-1 text-uppercase mb-4">Actividad Hoy</h3>
              <div v-if="todayActivities.length > 0" class="d-flex flex-column ga-4">
                <div v-for="(activity, idx) in todayActivities" :key="idx" class="d-flex ga-4">
                  <div class="rounded-pill bg-primary" style="width: 4px; height: 40px;"></div>
                  <div>
                    <div class="text-body-2 font-weight-bold text-grey-darken-4">{{ activity.especialidad?.nombre || 'Consulta General' }}
                    </div>
                    <div class="text-caption text-grey-darken-1">
                      {{ formatTime(activity.horaInicioCita) }} - {{ activity.posta?.nombre || 'Posta Central' }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <v-icon color="grey-lighten-1" size="32" class="mb-2">mdi-calendar-blank</v-icon>
                <div class="text-body-2 text-grey-darken-1">No hay actividades programadas para hoy.</div>
              </div>
            </div>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <!-- Appointment Tooltip -->
    <div v-if="showTooltip" class="appointment-tooltip" :class="{
      'pos-left': tooltipPosition === 'left',
      'pos-center': tooltipPosition === 'center'
    }" :style="{ top: tooltipY + 'px', left: tooltipX + 'px', '--tooltip-x': tooltipX + 'px' }">
      <div class="tooltip-header mb-2 pb-1 border-b">
        <span class="text-caption font-weight-bold text-uppercase">Citas del día</span>
      </div>
      <div v-for="(app, i) in tooltipData" :key="i" class="tooltip-item mb-3 last-mb-0">
        <div class="d-flex align-center justify-space-between ga-2 mb-1">
          <div class="d-flex align-center ga-2">
            <v-icon size="14" color="primary">mdi-clock-outline</v-icon>
            <span class="text-body-2 font-weight-bold">{{ app.time }}</span>
          </div>
          <v-chip size="x-small" :color="app.statusColor" variant="tonal" class="font-weight-bold">
            {{ app.status }}
          </v-chip>
        </div>
        <div class="text-caption font-weight-medium text-grey-darken-4">{{ app.specialty }}</div>
        <div class="text-caption text-grey-darken-1">{{ app.doctor }}</div>
        <div class="text-caption text-grey-darken-1">{{ app.location }}</div>
      </div>
    </div>

    <!-- Footer -->
    <v-footer color="transparent" class="mt-8 pa-4">
      <v-container>
        <v-row align="center" justify="center" no-gutters>
          <v-col cols="12" sm="3" class="d-flex justify-center justify-sm-start align-center ga-4 mb-4 mb-sm-0">
            <v-img :src="logoDiv" height="48" contain class="grayscale opacity-80" alt="Logo Division"></v-img>
            <v-img :src="logoBS" height="48" contain class="grayscale opacity-80" alt="Logo Bienestar Social"></v-img>
          </v-col>

          <v-col cols="12" sm="6" class="text-center mb-4 mb-sm-0">
            <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase mb-1">
              Universidad Mayor de San Andrés
            </div>
            <div class="text-caption text-grey-darken-1 font-italic mb-1">
              División de Bienestar Social
            </div>
            <div class="text-caption text-disabled">
              © 2026 Todos los derechos reservados. Portal Universitario de Salud.
            </div>
          </v-col>

          <v-col cols="12" sm="3" class="d-flex justify-center justify-sm-end align-center ga-4">
            <v-img :src="logoUmsa" height="48" contain class="grayscale opacity-80" alt="Logo UMSA"></v-img>
            <v-img :src="logoFCPN" height="48" contain class="grayscale opacity-80" alt="Logo FCPN"></v-img>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </div>
</template>

<style scoped>
.max-width-form {
  max-width: 1200px;
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

.section-badge.success {
  background-color: rgb(var(--v-theme-success));
}

.section-badge.info {
  background-color: rgb(var(--v-theme-info));
}

.section-badge.warning {
  background-color: rgb(var(--v-theme-warning));
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.hover-bg-surface-light:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.cursor-pointer {
  cursor: pointer;
}

.has-appointments {
  background-color: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: 700 !important;
}

.appointment-dot {
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  background-color: rgb(var(--v-theme-primary));
  border-radius: 50%;
}

.appointment-tooltip {
  position: fixed;
  /* Por debajo del sidebar/header; no necesita competir con el chrome */
  z-index: 50;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 16px;
  width: 240px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12);
  pointer-events: none;
  transform: translate(15px, 15px);
  transition: opacity 0.2s ease;
}

.appointment-tooltip.pos-left {
  transform: translate(calc(-100% - 15px), 15px);
}

.appointment-tooltip.pos-center {
  transform: translate(-50%, 15px);
  left: max(50%, min(var(--tooltip-x), 100% - 120px)) !important;
}

@media (max-width: 480px) {
  .appointment-tooltip.pos-center {
    left: 50% !important;
    transform: translate(-50%, 20px);
    width: 90vw;
  }
}

.tooltip-item {
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding-left: 12px;
}

.last-mb-0:last-child {
  margin-bottom: 0 !important;
}

.shadow-sm {
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3);
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.border-t {
  border-top: 1px solid #e2e8f0;
}

.grayscale {
  filter: grayscale(1);
}

.opacity-80 {
  opacity: 0.8;
}
</style>