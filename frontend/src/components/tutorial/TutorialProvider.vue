<script setup>
import { computed, watch, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTutorialStore } from '@/stores/tutorial'
import { useAuthStore } from '@/stores/auth'
import { useTutorialTarget } from '@/composables/useTutorialTarget'
import TutorialOverlay from './TutorialOverlay.vue'
import TutorialTooltip from './TutorialTooltip.vue'
import TutorialHelpButton from './TutorialHelpButton.vue'

const tutorialStore = useTutorialStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const getStep = () => tutorialStore.currentStep
const {
  rect,
  rings,
  targetElement,
  updateRect,
  waitForTarget,
  resolveTarget,
  attachObservers,
  detachObservers,
  clearHighlight,
} = useTutorialTarget(getStep)

let clickCleanup = null
let calendarObserver = null
let appearObserver = null
let stepSetupToken = 0

const showNext = computed(() => {
  const step = tutorialStore.currentStep
  if (!step) return false
  if (['next', 'finish'].includes(step.advanceOn)) return true
  if (step.allowNextFallback) return true
  return false
})

function cleanupListeners() {
  if (clickCleanup) {
    clickCleanup()
    clickCleanup = null
  }
  if (calendarObserver) {
    calendarObserver.disconnect()
    calendarObserver = null
  }
  if (appearObserver) {
    appearObserver.disconnect()
    appearObserver = null
  }
}

async function ensureRoute(step, stepIndex) {
  if (!step?.route || route.path === step.route) return

  const isForwardNav = tutorialStore.steps
    .slice(stepIndex + 1)
    .some((s) => s.route === route.path)

  if (isForwardNav) return

  await router.push(step.route)
  await nextTick()
  await new Promise((r) => setTimeout(r, 300))
}

async function waitForReservaStep(expectedStep) {
  const start = Date.now()
  while (Date.now() - start < 15000) {
    if (Number(tutorialStore.wizardStep) === expectedStep) return true
    await new Promise((r) => setTimeout(r, 100))
  }
  return false
}

async function waitForAgendaVista(expectedVista) {
  const start = Date.now()
  while (Date.now() - start < 15000) {
    if (tutorialStore.agendaVista === expectedVista) return true
    await new Promise((r) => setTimeout(r, 100))
  }
  return false
}

function matchesStepTarget(event, step) {
  const node = event.target
  if (!(node instanceof Element)) return false

  const selectors = [step.clickTarget, step.target].filter(Boolean)
  return selectors.some((selector) => {
    try {
      return Boolean(node.closest(selector))
    } catch {
      return false
    }
  })
}

function bindClickAdvance(step, onAdvance) {
  const handler = (event) => {
    if (!matchesStepTarget(event, step)) return

    if (tutorialStore.currentStepIndex === 0) {
      tutorialStore.completeFirstStep()
    }

    if (step.navigateOnAdvance && route.path !== step.navigateOnAdvance) {
      router.push(step.navigateOnAdvance)
      return
    }

    setTimeout(onAdvance, 200)
  }

  document.addEventListener('click', handler, true)
  return () => document.removeEventListener('click', handler, true)
}

function bindAppearAdvance(selector, onAdvance) {
  if (!selector) return () => {}

  const check = () => Boolean(document.querySelector(selector))
  if (check()) {
    setTimeout(onAdvance, 150)
    return () => {}
  }

  const observer = new MutationObserver(() => {
    if (!check()) return
    observer.disconnect()
    if (appearObserver === observer) appearObserver = null
    setTimeout(onAdvance, 150)
  })
  observer.observe(document.body, { childList: true, subtree: true })
  appearObserver = observer
  return () => observer.disconnect()
}

function bindInteractionAdvance(step, onAdvance) {
  const handler = (event) => {
    if (!matchesStepTarget(event, step)) return
    if (tutorialStore.currentStepIndex === 0) {
      tutorialStore.completeFirstStep()
    }
    onAdvance()
  }

  document.addEventListener('click', handler, true)
  document.addEventListener('focusin', handler, true)

  return () => {
    document.removeEventListener('click', handler, true)
    document.removeEventListener('focusin', handler, true)
  }
}

function bindCalendarSlotAdvance(onAdvance) {
  const handler = (event) => {
    const slotSelectors = [
      '.fc-timegrid-slot',
      '.fc-daygrid-day',
      '[data-tour="reserva-slot"]',
      '[data-tour="agenda-slot"]',
      '.gc-free-slot:not(.disabled-slot)',
    ]
    const isSlotClick = slotSelectors.some((sel) => event.target.closest?.(sel))
    if (isSlotClick) {
      setTimeout(onAdvance, 400)
    }
  }

  document.addEventListener('click', handler, true)

  const observer = new MutationObserver(() => {
    if (document.querySelector('[data-tour="reserva-confirm-submit"]')) {
      setTimeout(onAdvance, 300)
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  calendarObserver = observer

  return () => {
    document.removeEventListener('click', handler, true)
    if (calendarObserver) {
      calendarObserver.disconnect()
      calendarObserver = null
    }
  }
}

async function setupCurrentStep() {
  cleanupListeners()
  const token = ++stepSetupToken
  const step = tutorialStore.currentStep
  if (!step || !tutorialStore.active) return

  const firstStepRoute = tutorialStore.steps[0]?.route
  if (
    tutorialStore.mode === 'manual' &&
    tutorialStore.currentStepIndex === 0 &&
    firstStepRoute &&
    route.path !== firstStepRoute
  ) {
    await router.push(firstStepRoute)
    await nextTick()
    await new Promise((r) => setTimeout(r, 300))
  }

  await ensureRoute(step, tutorialStore.currentStepIndex)

  if (step.ensureDrawerOpen || step.openDrawerOnAdvance) {
    tutorialStore.setForceDrawerOpen(true)
    await nextTick()
    // Esperar a que el drawer termine de abrirse antes de medir el target.
    await new Promise((r) => setTimeout(r, 350))
  } else {
    tutorialStore.setForceDrawerOpen(false)
  }
  // Liberar highlight del paso anterior antes de anclar el nuevo target.
  clearHighlight()
  await nextTick()

  if (step.waitForReservaStep) {
    await waitForReservaStep(step.waitForReservaStep)
  }

  if (step.waitForAgendaVista) {
    await waitForAgendaVista(step.waitForAgendaVista)
  }

  if (step.waitForRoute || step.waitForModal) {
    await new Promise((r) => setTimeout(r, 400))
  }

  if (token !== stepSetupToken) return

  if (step.target) {
    const timeout = step.optionalTarget ? 2500 : 15000
    const found = await waitForTarget(step, timeout)
    if (token !== stepSetupToken) return
    if (!found && step.optionalTarget) {
      detachObservers()
      rect.value = null
    } else {
      attachObservers()
      updateRect()
    }
  } else {
    detachObservers()
    rect.value = null
  }

  const advance = () => {
    if (!tutorialStore.active) return
    if (tutorialStore.currentStep?.id !== step.id) return
    tutorialStore.nextStep()
  }

  if (step.advanceOn === 'click') {
    clickCleanup = bindClickAdvance(step, advance)
  } else if (step.advanceOn === 'interaction') {
    clickCleanup = bindInteractionAdvance(step, advance)
  } else if (step.advanceOn === 'calendar-slot') {
    clickCleanup = bindCalendarSlotAdvance(advance)
  }

  if (step.advanceWhenVisible) {
    const appearCleanup = bindAppearAdvance(step.advanceWhenVisible, advance)
    const previousClickCleanup = clickCleanup
    clickCleanup = () => {
      previousClickCleanup?.()
      appearCleanup?.()
    }
  }
}

watch(
  () => [tutorialStore.active, tutorialStore.currentStepIndex],
  async ([active]) => {
    if (active) {
      await nextTick()
      await setupCurrentStep()
    } else {
      tutorialStore.setForceDrawerOpen(false)
      cleanupListeners()
      detachObservers()
      clearHighlight()
      // Doble limpieza por si Vue re-renderizó nodos a medias.
      await nextTick()
      clearHighlight()
    }
  },
  { immediate: true },
)

watch(
  () => route.path,
  async (newPath, oldPath) => {
    if (!tutorialStore.active || newPath === oldPath) return

    const step = tutorialStore.currentStep
    if (step?.id === 'nav-reservar' && newPath === '/reservar') {
      await nextTick()
      tutorialStore.nextStep()
      return
    }

    if (
      (step?.id === 'agenda-intro-nav' ||
        step?.id === 'gestion-nav-agenda' ||
        step?.id === 'bloqueo-nav-agenda') &&
      newPath === '/doctor/agenda'
    ) {
      await nextTick()
      tutorialStore.nextStep()
      return
    }

    if (step?.id === 'home-welcome' && newPath === '/home') return
    if (step?.id === 'doctor-home-welcome' && newPath === '/doctor/home') return

    await nextTick()
    updateRect()
    await setupCurrentStep()
  },
)

function handleNext() {
  if (tutorialStore.currentStepIndex === 0) {
    tutorialStore.completeFirstStep()
  }
  tutorialStore.nextStep()
}

function handleSkip() {
  tutorialStore.skip()
}

function handleFinish() {
  tutorialStore.stop(true)
}

watch(
  () => authStore.token,
  (token) => {
    if (!token && tutorialStore.active) {
      tutorialStore.stop(false)
    }
  },
)

onUnmounted(() => {
  cleanupListeners()
  detachObservers()
  clearHighlight()
})
</script>

<template>
  <TutorialHelpButton />
  <TutorialOverlay :visible="tutorialStore.active" :rect="rect" :rings="rings" />
  <TutorialTooltip
    v-if="tutorialStore.active && tutorialStore.currentStep"
    :step="tutorialStore.currentStep"
    :rect="rect"
    :step-index="tutorialStore.currentStepIndex"
    :total-steps="tutorialStore.totalSteps"
    :can-skip="tutorialStore.canSkip"
    :show-next="showNext"
    @next="handleNext"
    @skip="handleSkip"
    @finish="handleFinish"
  />
</template>
