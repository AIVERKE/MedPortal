import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { RESERVATION_TUTORIAL_STEPS, getStepsForContext } from '@/config/reservationTutorialSteps'
import {
  DOCTOR_TUTORIAL_IDS,
  getDoctorTutorialSteps,
  isDoctorTutorialId,
} from '@/config/doctorTutorialSteps'
import {
  markTutorialCompleted,
  markDoctorTutorialCompleted,
} from '@/utils/tutorialStorage'
import { useAuthStore } from '@/stores/auth'

export const useTutorialStore = defineStore('tutorial', () => {
  const active = ref(false)
  const currentStepIndex = ref(0)
  const firstStepCompleted = ref(false)
  const mode = ref('auto')
  const activeTutorialId = ref('reservar-cita')
  const steps = ref([...RESERVATION_TUTORIAL_STEPS])
  const wizardStep = ref(1)
  const agendaVista = ref('mes')
  const forceDrawerOpen = ref(false)

  const currentStep = computed(() => steps.value[currentStepIndex.value] ?? null)
  const isLastStep = computed(() => currentStepIndex.value >= steps.value.length - 1)
  const canSkip = computed(() => active.value && firstStepCompleted.value && !isLastStep.value)
  const totalSteps = computed(() => steps.value.length)
  const isDoctorTutorial = computed(() => isDoctorTutorialId(activeTutorialId.value))
  const isDemoGestionCitas = computed(
    () => active.value && activeTutorialId.value === DOCTOR_TUTORIAL_IDS.GESTIONAR_CITA,
  )

  function resetState() {
    currentStepIndex.value = 0
    firstStepCompleted.value = false
    forceDrawerOpen.value = false
  }

  function start(options = {}) {
    const authStore = useAuthStore()
    mode.value = options.mode || 'manual'
    const isLoggedIn = Boolean(authStore.token)
    const routePath = options.routePath || '/home'
    const tutorialId = options.tutorialId || 'reservar-cita'

    activeTutorialId.value = tutorialId

    if (isDoctorTutorialId(tutorialId)) {
      steps.value = getDoctorTutorialSteps(tutorialId)
    } else {
      steps.value = getStepsForContext({
        isLoggedIn,
        routePath,
        includeLogin: options.includeLogin ?? false,
      })
    }

    resetState()
    // Asegurar menú cerrado antes de activar (el primer paso no lo necesita).
    forceDrawerOpen.value = false
    active.value = true
  }

  function stop(markComplete = false) {
    if (markComplete) {
      const authStore = useAuthStore()
      const userId = authStore.user?.idUsuario
      if (userId) {
        if (isDoctorTutorialId(activeTutorialId.value)) {
          markDoctorTutorialCompleted(activeTutorialId.value, userId)
        } else {
          markTutorialCompleted(userId)
        }
      }
    }
    active.value = false
    forceDrawerOpen.value = false
    resetState()
  }

  function skip() {
    stop(true)
  }

  function nextStep() {
    if (!active.value) return

    if (currentStepIndex.value === 0) {
      firstStepCompleted.value = true
    }

    if (isLastStep.value) {
      stop(true)
      return
    }

    currentStepIndex.value += 1
  }

  function completeFirstStep() {
    firstStepCompleted.value = true
  }

  function setWizardStep(value) {
    wizardStep.value = Number(value) || 1
  }

  function setAgendaVista(value) {
    agendaVista.value = value || 'mes'
  }

  function setForceDrawerOpen(value) {
    forceDrawerOpen.value = Boolean(value)
  }

  return {
    active,
    currentStepIndex,
    firstStepCompleted,
    mode,
    activeTutorialId,
    steps,
    wizardStep,
    agendaVista,
    forceDrawerOpen,
    currentStep,
    isLastStep,
    canSkip,
    totalSteps,
    isDoctorTutorial,
    isDemoGestionCitas,
    start,
    stop,
    skip,
    nextStep,
    completeFirstStep,
    setWizardStep,
    setAgendaVista,
    setForceDrawerOpen,
  }
})
