<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTutorialStore } from '@/stores/tutorial'

const LABEL_FIRST_DELAY_MS = 10000
const LABEL_VISIBLE_MS = 6000
const LABEL_REPEAT_MS = 75000
const LABEL_MAX_SHOWS = 3

const PATIENT_TUTORIALS = [
  {
    id: 'reservar-cita',
    title: 'Cómo reservar una cita',
    icon: 'mdi-calendar-clock-outline',
  },
]

const DOCTOR_TUTORIALS = [
  {
    id: 'doctor-menu',
    title: 'Bienvenido al menú principal',
    icon: 'mdi-view-dashboard-outline',
  },
  {
    id: 'doctor-agenda',
    title: 'La agenda de doctor',
    icon: 'mdi-calendar-month-outline',
  },
  {
    id: 'doctor-gestionar-cita',
    title: 'Quiero agendar/reagendar/cancelar una cita',
    icon: 'mdi-calendar-edit',
  },
  {
    id: 'doctor-bloqueos',
    title: 'Quiero bloquear horarios y días en mi agenda',
    icon: 'mdi-calendar-remove',
  },
]

const authStore = useAuthStore()
const tutorialStore = useTutorialStore()
const route = useRoute()

const PATIENT_ROLES = ['ESTUDIANTE', 'DOCENTE', 'CONSULTOR', 'ADMINISTRATIVO']

const rootRef = ref(null)
const menuOpen = ref(false)
const showHelpLabel = ref(false)
const labelShowCount = ref(0)

let firstTimer = null
let hideTimer = null
let repeatTimer = null

const role = computed(() => authStore.user?.rol)
const isPatient = computed(() => PATIENT_ROLES.includes(role.value))
const isDoctor = computed(() => role.value === 'DOCTOR' || role.value === 'SUPERUSUARIO')

const AVAILABLE_TUTORIALS = computed(() => {
  const list = []
  if (isPatient.value) list.push(...PATIENT_TUTORIALS)
  if (isDoctor.value) list.push(...DOCTOR_TUTORIALS)
  return list
})

const isVisible = computed(() => {
  if (!authStore.token) return false
  return isPatient.value || isDoctor.value
})

const isTourActive = computed(() => tutorialStore.active)

function clearTimers() {
  clearTimeout(firstTimer)
  clearTimeout(hideTimer)
  clearTimeout(repeatTimer)
  firstTimer = null
  hideTimer = null
  repeatTimer = null
}

function hideNudge() {
  showHelpLabel.value = false
  clearTimeout(hideTimer)
  hideTimer = null
}

function canShowNudge() {
  return isVisible.value && !isTourActive.value && !menuOpen.value && labelShowCount.value < LABEL_MAX_SHOWS
}

function flashNudge() {
  if (!canShowNudge()) return
  labelShowCount.value += 1
  showHelpLabel.value = true
  hideTimer = setTimeout(() => {
    showHelpLabel.value = false
    scheduleRepeat()
  }, LABEL_VISIBLE_MS)
}

function scheduleFirst() {
  clearTimers()
  hideNudge()
  if (!canShowNudge()) return
  firstTimer = setTimeout(flashNudge, LABEL_FIRST_DELAY_MS)
}

function scheduleRepeat() {
  clearTimeout(repeatTimer)
  if (!canShowNudge()) return
  repeatTimer = setTimeout(flashNudge, LABEL_REPEAT_MS)
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  if (isTourActive.value) tutorialStore.stop()
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) hideNudge()
}

function startTutorial(tutorialId) {
  closeMenu()
  hideNudge()
  tutorialStore.start({
    tutorialId,
    mode: 'manual',
    routePath: route.path,
  })
}

function onDocumentPointerDown(event) {
  if (!menuOpen.value) return
  if (rootRef.value?.contains(event.target)) return
  closeMenu()
}

function onEscape(event) {
  if (event.key === 'Escape') closeMenu()
}

watch(isVisible, (visible) => {
  if (visible) scheduleFirst()
  else {
    closeMenu()
    hideNudge()
    clearTimers()
  }
})

watch(isTourActive, (active) => {
  if (active) {
    closeMenu()
    hideNudge()
    clearTimers()
    return
  }
  scheduleRepeat()
})

watch(menuOpen, (open) => {
  if (open) {
    hideNudge()
    nextTick(() => rootRef.value?.querySelector('.tutorial-help-menu-item')?.focus())
  }
})

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onEscape)
  if (isVisible.value) scheduleFirst()
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onEscape)
  clearTimers()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="isVisible" ref="rootRef" class="tutorial-help-root">
      <Transition name="help-menu">
        <div v-if="menuOpen" class="tutorial-help-menu" role="menu" aria-label="Tutoriales">
          <p class="tutorial-help-menu__title">Tutoriales</p>
          <button
            v-for="tutorial in AVAILABLE_TUTORIALS"
            :key="tutorial.id"
            type="button"
            class="tutorial-help-menu-item"
            role="menuitem"
            @click="startTutorial(tutorial.id)"
          >
            <v-icon :icon="tutorial.icon" size="20" color="primary" />
            <span>{{ tutorial.title }}</span>
          </button>
        </div>
      </Transition>

      <div class="tutorial-help-row">
        <Transition name="help-label">
          <button
            v-if="showHelpLabel && !menuOpen"
            type="button"
            class="tutorial-help-nudge"
            @click="toggleMenu"
          >
            ¿Necesitas ayuda?
          </button>
        </Transition>

        <v-btn
          class="tutorial-help-btn"
          :class="{ 'tutorial-help-btn--active': isTourActive || menuOpen }"
          icon
          color="primary"
          size="large"
          elevation="6"
          aria-label="Ver tutoriales de ayuda"
          :aria-expanded="menuOpen"
          title="Ver tutoriales"
          @click="toggleMenu"
        >
          <span class="tutorial-help-btn__label">{{ menuOpen ? '×' : '?' }}</span>
        </v-btn>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tutorial-help-root {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(72px, calc(16px + env(safe-area-inset-bottom)));
  z-index: 2800;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.tutorial-help-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.tutorial-help-nudge {
  border: 0;
  cursor: pointer;
  background: #ffffff;
  color: #312e81;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 999px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
}

.tutorial-help-menu {
  width: min(340px, calc(100vw - 32px));
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
  padding: 10px;
  border: 1px solid #e2e8f0;
}

.tutorial-help-menu__title {
  margin: 0;
  padding: 6px 8px 8px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.tutorial-help-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: #0f172a;
  text-align: left;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 10px 8px;
  border-radius: 12px;
  cursor: pointer;
}

.tutorial-help-menu-item:hover,
.tutorial-help-menu-item:focus-visible {
  background: #eef2ff;
  outline: none;
}

.tutorial-help-btn {
  width: 52px !important;
  height: 52px !important;
  flex-shrink: 0;
}

.tutorial-help-btn--active {
  animation: tutorial-help-pulse 1.5s ease-in-out infinite;
}

.tutorial-help-btn__label {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;
}

.help-label-enter-active,
.help-label-leave-active,
.help-menu-enter-active,
.help-menu-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.help-label-enter-from,
.help-label-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.help-menu-enter-from,
.help-menu-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

@keyframes tutorial-help-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

@media (max-width: 959px) {
  .tutorial-help-root {
    bottom: max(72px, calc(16px + env(safe-area-inset-bottom)));
    right: max(12px, env(safe-area-inset-right));
  }

  .tutorial-help-nudge {
    font-size: 0.72rem;
    padding: 7px 10px;
  }
}

@media (min-width: 960px) {
  .tutorial-help-root {
    bottom: max(24px, env(safe-area-inset-bottom));
  }
}
</style>
