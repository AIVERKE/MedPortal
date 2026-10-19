<!-- src/views/Reservar.vue -->
<template>
  <div class="max-width-form mx-auto pb-8">
    <EspecialidadesReservas v-if="step === 1" @select="handleEspecialidadSelect" />

    <DoctoresReservas v-if="step === 2" :especialidad="selectedEspecialidad" @select="handleDoctorSelect"
      @volver="volverAEspecialidades" />

    <CalendarioReservas v-if="step === 3" :especialidad="selectedEspecialidad" :doctor="selectedDoctor"
      @volver="volverADoctores" />
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import EspecialidadesReservas from '../components/reservas/EspecialidadesReservas.vue'
import DoctoresReservas from '../components/reservas/DoctoresReservas.vue'
import CalendarioReservas from '../components/reservas/CalendarioReservas.vue'
import { useTutorialStore } from '@/stores/tutorial'

const tutorialStore = useTutorialStore()
const step = ref(1)
const selectedEspecialidad = ref(null)
const selectedDoctor = ref(null)

watch(step, (value) => tutorialStore.setWizardStep(value), { immediate: true })

onUnmounted(() => {
  tutorialStore.setWizardStep(1)
})

const handleEspecialidadSelect = (especialidad) => {
  selectedEspecialidad.value = especialidad
  step.value = 2
}

const handleDoctorSelect = (doctor) => {
  selectedDoctor.value = doctor
  step.value = 3
}

const volverAEspecialidades = () => {
  step.value = 1
  selectedDoctor.value = null
}

const volverADoctores = () => {
  step.value = 2
}
</script>

<style scoped>
.max-width-form {
  max-width: 1200px;
}
</style>
