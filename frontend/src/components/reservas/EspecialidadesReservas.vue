<template>
  <div class="especialidades-container">
    <!-- Header de Sección -->
    <header class="d-flex align-center justify-space-between flex-wrap ga-3 mb-8">
      <div>
        <h3 id="specialties-section" class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">
          Reservar cita
        </h3>
        <p class="text-subtitle-2 font-weight-medium text-grey-darken-1">
          Selecciona el área de atención. Algunas especialidades requieren derivación de Medicina General.
        </p>
      </div>
    </header>

    <!-- Buscador Refinado -->
    <v-card class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>
      <div class="section-badge primary"></div>
      <v-card-text class="pa-4">
        <v-text-field v-model="search" placeholder="Buscar especialidad (ej: Enfermeria, Psicologia...)"
          prepend-inner-icon="mdi-magnify" variant="outlined" rounded="lg" hide-details density="comfortable"
          class="search-field" data-tour="reserva-search"></v-text-field>
      </v-card-text>
    </v-card>

    <v-row>
      <!-- Panel Izquierdo: Especialidades (Grid Principal) -->
      <v-col cols="12" lg="7" xl="8">
        <v-row>
          <v-col v-for="item in especialidadesFiltradas" :key="item.id" cols="12" sm="6" md="4" lg="4" xl="3">
            <v-card class="especialidad-card overflow-hidden shadow-premium premium-card position-relative" :class="{
              'card-locked': isEspecialidadBloqueada(item)
            }" elevation="0" rounded="xl" border
              :data-tour="isEspecialidadDisponible(item) && item.id === firstAvailableSpecialtyId ? 'reserva-especialidad-card' : undefined"
              :data-tour-disabled="!isEspecialidadDisponible(item) ? '' : undefined">
              <div v-if="!locksReady"
                class="locked-overlay d-flex flex-column align-center justify-center">
                <v-progress-circular indeterminate color="white" size="40" width="3"></v-progress-circular>
              </div>

              <div v-else-if="reservasActivas[item.id]"
                class="locked-overlay d-flex flex-column align-center justify-center reserve-active-overlay">
                <v-icon icon="mdi-calendar-check" color="white" size="48" class="mb-2"></v-icon>
                <span class="text-white font-weight-bold px-4 text-center">Ya tienes una reserva programada</span>
              </div>

              <div v-else-if="item.visible && !autorizaciones[item.id]"
                class="locked-overlay d-flex flex-column align-center justify-center">
                <v-icon icon="mdi-lock-outline" color="white" size="48" class="mb-2"></v-icon>
                <span class="text-white font-weight-bold px-4 text-center">Requiere Derivación</span>
              </div>

              <div class="section-badge" :style="{ background: getAccentColor(item.id) }"></div>

              <v-card-text class="pa-6">
                <div class="d-flex justify-space-between align-start mb-4">
                  <v-avatar color="primary-lighten-4" size="56" rounded="lg">
                    <v-icon :icon="getIconForSpec(item.nombre)" :color="getAccentColor(item.id)" size="28"></v-icon>
                  </v-avatar>

                  <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                    <v-icon start icon="mdi-timer-outline" size="12"></v-icon>
                    ~{{ item.tiempoCitaPorDefecto }} min
                  </v-chip>
                </div>

                <h3 class="text-h6 font-weight-bold text-grey-darken-4 mb-2 truncate-2-lines">
                  {{ item.nombre }}
                </h3>

                <p class="text-body-2 text-grey-darken-1 mb-4 line-clamp-3">
                  {{ item.descripcion || 'Contamos con profesionales altamente capacitados para tu atención integral.'
                  }}
                </p>
              </v-card-text>

              <v-divider class="border-opacity-25"></v-divider>

              <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-tooltip :disabled="!locksReady || isEspecialidadDisponible(item)"
                  :text="reservasActivas[item.id] ? 'Ya tiene una reserva activa en esta especialidad' : 'Primero debe pasar por Medicina General para obtener una derivación'"
                  location="top" max-width="250">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props"
                      :color="isEspecialidadBloqueada(item) ? 'grey-lighten-1' : 'primary'"
                      variant="flat" rounded="lg" class="text-none font-weight-bold px-6"
                      :disabled="isEspecialidadBloqueada(item)"
                      :data-tour="isEspecialidadDisponible(item) && item.id === firstAvailableSpecialtyId ? 'reserva-continuar' : undefined"
                      @click="handleSelect(item)">
                      Continuar
                      <v-icon end icon="mdi-arrow-right" size="18"></v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- Panel Derecho: Citas Programadas (Sidebar) -->
      <v-col id="appointments-section" cols="12" lg="5" xl="4">
        <v-card class="rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>
          <div class="section-badge success"></div>
          <v-card-text class="pa-4">
            <ListaCitasProgramadas @cita-cancelada="recargarDatos" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Botón Flotante para Navegación en Móvil -->
    <v-fade-transition>
      <v-btn v-if="mobile" color="primary" size="large" rounded="xl" elevation="8"
        class="mobile-nav-fab d-lg-none text-none font-weight-bold" @click="scrollToOtherSection">
        <v-icon start :icon="isAtBottom ? 'mdi-arrow-up' : 'mdi-calendar-check'"></v-icon>
        {{ isAtBottom ? 'Volver a Reservar' : 'Ver Mis Citas' }}
      </v-btn>
    </v-fade-transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'
import { useEspecialidadStore } from '@/stores/especialidad'
import { useDerivacionesStore } from '@/stores/derivaciones'
import { useReservasStore } from '@/stores/reservas'
import { useAuthStore } from '@/stores/auth'
import ListaCitasProgramadas from './ListaCitasProgramadas.vue'

const { mobile } = useDisplay()
const isAtBottom = ref(false)

const handleScroll = () => {
  const scrollPos = window.scrollY
  const windowHeight = window.innerHeight
  const bodyHeight = document.documentElement.scrollHeight
  // Si hemos bajado más de la mitad o estamos cerca del final
  isAtBottom.value = scrollPos > (bodyHeight - windowHeight) * 0.4
}

const scrollToOtherSection = () => {
  const targetId = isAtBottom.value ? 'specialties-section' : 'appointments-section'
  const element = document.getElementById(targetId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const store = useEspecialidadStore()
const derivacionesStore = useDerivacionesStore()
const reservasStore = useReservasStore()
const authStore = useAuthStore()

const search = ref('')
const locksReady = ref(false)
const autorizaciones = ref({}) // especialidadId -> boolean
const reservasActivas = ref({}) // especialidadId -> boolean

const especialidades = computed(() => store.especialidades)

const especialidadesFiltradas = computed(() => {
  const filtered = especialidades.value.filter(e =>
    e.activo === true &&
    e.nombre.toLowerCase().includes(search.value.toLowerCase())
  )

  return [...filtered].sort((a, b) => {
    const getWeight = (item) => {
      if (reservasActivas.value[item.id]) return 2
      if (item.visible && !autorizaciones.value[item.id]) return 3
      return 1
    }

    const weightA = getWeight(a)
    const weightB = getWeight(b)

    if (weightA !== weightB) {
      return weightA - weightB
    }
    return a.nombre.localeCompare(b.nombre)
  })
})

const isEspecialidadBloqueada = (item) => {
  if (!locksReady.value) return true
  if (reservasActivas.value[item.id]) return true
  if (item.visible && !autorizaciones.value[item.id]) return true
  return false
}

const isEspecialidadDisponible = (item) => !isEspecialidadBloqueada(item)

const firstAvailableSpecialtyId = computed(() => {
  const available = especialidadesFiltradas.value.find((item) => isEspecialidadDisponible(item))
  return available?.id ?? null
})

const checkAutorizaciones = async () => {
  const visibleSpecs = especialidades.value.filter(e => e.visible)
  const resultados = await Promise.all(
    visibleSpecs.map(async (spec) => [spec.id, await derivacionesStore.verificarDerivacion(spec.id)])
  )
  autorizaciones.value = Object.fromEntries(resultados)
}

const checkReservasActivas = async () => {
  if (!authStore.user?.idUsuario) {
    reservasActivas.value = {}
    return
  }

  const programadas = await reservasStore.fetchReservasProgramadasByUsuario(authStore.user.idUsuario)
  const nuevasReservasActivas = {}

  programadas.forEach(reserva => {
    if (reserva.idEspecialidad && reserva.estado === 'PENDIENTE') {
      nuevasReservasActivas[reserva.idEspecialidad] = true
    }
  })

  reservasActivas.value = nuevasReservasActivas
}

const recargarDatos = async () => {
  locksReady.value = false
  await store.fetchEspecialidades()
  await Promise.all([checkAutorizaciones(), checkReservasActivas()])
  locksReady.value = true
}

onMounted(async () => {
  await recargarDatos()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

defineExpose({
  recargarDatos
})

const handleSelect = (item) => {
  if (isEspecialidadBloqueada(item)) return
  emit('select', item)
}

const emit = defineEmits(['select'])

/* =====================================================
   ESTILOS DINÁMICOS
   ===================================================== */
const getAccentColor = (id) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4', '#10b981']
  return colors[id % colors.length]
}

const getLightAccentColor = (id) => {
  const colors = ['#eef2ff', '#f5f3ff', '#fdf2f8', '#fff1f2', '#ecfeff', '#ecfdf5']
  return colors[id % colors.length]
}

const getIconForSpec = (nombre) => {
  const n = (nombre || '').toLowerCase()
  if (n.includes('medicina')) return 'mdi-stethoscope'
  if (n.includes('pediatra') || n.includes('infantil')) return 'mdi-baby-face-outline'
  if (n.includes('dental') || n.includes('odon')) return 'mdi-tooth-outline'
  if (n.includes('gineco')) return 'mdi-gender-female'
  if (n.includes('enfermeria')) return 'mdi-medical-bag'
  if (n.includes('psico')) return 'mdi-brain'
  if (n.includes('cardio')) return 'mdi-heart-pulse'
  if (n.includes('oftalmo')) return 'mdi-eye-outline'
  if (n.includes('trauma')) return 'mdi-bone'
  return 'mdi-hospital-box-outline'
}
</script>

<style scoped>
.especialidades-container {
  min-height: 100%;
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

.search-field {
  max-width: 500px;
}

.especialidad-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease;
}

.especialidad-card:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.18) !important;
}

.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(4px);
  z-index: 2;
  opacity: 1;
}

.reserve-active-overlay {
  background: rgba(var(--v-theme-primary), 0.9);
}

.card-locked {
  filter: grayscale(0.5);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.truncate-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 3.5rem;
}

.mobile-nav-fab {
  position: fixed;
  bottom: 88px;
  right: 16px;
  z-index: 100;
  border: 2px solid white;
}
</style>
