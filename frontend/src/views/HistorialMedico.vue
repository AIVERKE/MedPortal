<template>
    <v-container fluid class="pa-4 pa-md-8 bg-surface-light min-vh-100">
        <!-- Header -->
        <div class="d-flex flex-column flex-md-row justify-space-between align-md-center mb-8 gap-4">
            <div>
                <v-btn variant="text" color="primary" prepend-icon="mdi-arrow-left" class="mb-2 px-0 text-none"
                    @click="$router.push('/doctor/home')">
                    Volver al Panel
                </v-btn>
                <h1 class="text-h4 font-weight-black text-high-emphasis">Historial Médico Digital</h1>
                <p class="text-subtitle-1 text-medium-emphasis">
                    {{ isPsicologo ? 'Consulta Psicológica' : 'Consulta Médica General' }}
                    <span class="mx-2 opacity-30">|</span>
                    {{ doctorName }}
                </p>
            </div>

            <v-chip color="primary" variant="flat" size="large" class="font-weight-bold px-6">
                Paciente: {{ patientName }}
            </v-chip>
        </div>

        <!-- Stepper (Solo para Médicos Generales) -->
        <v-row v-if="!isPsicologo" class="mb-8 justify-center">
            <v-col cols="12" md="10" lg="8">
                <div class="d-flex justify-space-between align-center position-relative">
                    <div class="stepper-line" :style="{ width: lineActiveWidth }"></div>
                    <div class="stepper-line-bg"></div>

                    <div v-for="(step, index) in steps" :key="index"
                        class="d-flex flex-column align-center position-relative" style="z-index: 1; flex: 1;">
                        <v-avatar :color="currentStep >= index + 1 ? 'primary' : 'white'"
                            :class="{ 'elevation-4': currentStep === index + 1, 'border': currentStep < index + 1 }"
                            size="48">
                            <v-icon v-if="currentStep > index + 1" color="white">mdi-check</v-icon>
                            <span v-else :class="currentStep >= index + 1 ? 'text-white' : 'text-medium-emphasis'"
                                class="font-weight-black">
                                {{ index + 1 }}
                            </span>
                        </v-avatar>
                        <span class="text-caption font-weight-bold mt-2 text-center d-none d-sm-block"
                            :class="currentStep >= index + 1 ? 'text-primary' : 'text-disabled'">
                            {{ step.title }}
                        </span>
                    </div>
                </div>
            </v-col>
        </v-row>

        <!-- Component Container -->
        <v-row justify="center">
            <v-col cols="12" md="10" lg="8">
                <transition name="fade" mode="out-in">
                    <!-- Psychologist Flow -->
                    <NotasPsicologiaHistorial v-if="isPsicologo" @submit="handleFinalSubmit" />

                    <!-- Medical Flow -->
                    <div v-else>
                        <ConsultaHistorial v-if="currentStep === 1" @next="goToStep(2)" />
                        <AntecedentesGinecoObstetricosHistorial v-else-if="currentStep === 2" @next="goToStep(3)"
                            @prev="goToStep(1)" />
                        <ExamenFisicoHistorial v-else-if="currentStep === 3" @submit="handleFinalSubmit"
                            @derivar="goToStep(4)" @prev="goToStep(2)" />
                        <DerivaciónHistorial v-else-if="currentStep === 4" @submit="handleFinalSubmit"
                            @prev="goToStep(3)" />
                    </div>
                </transition>
            </v-col>
        </v-row>

        <!-- Custom Modals -->
        <ModalConfirmación v-model="showConfirmModal" title="Guardar Historial"
            message="¿Estás seguro que deseas guardar los datos de este historial médico? Esta acción no se puede deshacer."
            type="warning" confirmText="Sí, Guardar" cancelText="Volver" @confirm="confirmSubmit"
            @cancel="showConfirmModal = false" />

        <ModalMensaje v-model="showSuccessModal" title="¡Historial Guardado!"
            message="La información del paciente ha sido registrada exitosamente en el sistema." type="success"
            buttonText="Ir al Panel Principal" @confirm="$router.push('/doctor/home')" />
    </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ConsultaHistorial from '@/components/historial_medico/ConsultaHistorial.vue'
import NotasPsicologiaHistorial from '@/components/historial_medico/NotasPsicologiaHistorial.vue'
import AntecedentesGinecoObstetricosHistorial from '@/components/historial_medico/AntecedentesGinecoObstetricosHistorial.vue'
import ExamenFisicoHistorial from '@/components/historial_medico/ExamenFisicoHistorial.vue'
import DerivaciónHistorial from '@/components/historial_medico/DerivaciónHistorial.vue'
import ModalConfirmación from '@/components/common/ModalConfirmación.vue'
import ModalMensaje from '@/components/common/ModalMensaje.vue'

const authStore = useAuthStore()
const route = useRoute()

// --- State ---
const currentStep = ref(1)
const showSuccessModal = ref(false)
const showConfirmModal = ref(false)
const totalData = ref({})

// --- Computed ---
const doctorName = computed(() => {
    const p = authStore.user
    if (p && p.nombres) return `Dr. ${p.nombres} ${p.primerApellido || ''}`.trim()
    return 'Doctor/a'
})

const patientName = computed(() => {
    // Si viene de "Atender sin reserva", el nombre está en el query
    if (route.query.nombre) return route.query.nombre

    // Aquí podrías obtenerlo del store de reservas si fuera una cita normal
    // Por ahora, si no hay query, devolvemos el placeholder
    return 'Paciente Registrado'
})

const isPsicologo = computed(() => {
    // Si viene por query param, forzamos la vista
    if (route.query.type === 'psicologia') return true

    const especialidad = authStore.user?.doctor?.especialidad?.nombre || ''
    return especialidad.toUpperCase().includes('PSICOLOG')
})

const steps = [
    { title: 'Consulta' },
    { title: 'Gineco-Obst.' },
    { title: 'Examen Físico' },
    { title: 'Derivación' }
]

const lineActiveWidth = computed(() => {
    const progress = ((currentStep.value - 1) / (steps.length - 1)) * 100
    return `${progress}%`
})

// --- Methods ---
const goToStep = (step) => {
    currentStep.value = step
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleFinalSubmit = (data) => {
    totalData.value = data
    showConfirmModal.value = true
}

const confirmSubmit = async () => {
    showConfirmModal.value = false

    // Simulación de guardado exitoso
    setTimeout(() => {
        showSuccessModal.value = true
    }, 500)
}
</script>

<style scoped>
.min-vh-100 {
    min-height: 100vh;
}

.gap-4 {
    gap: 16px;
}

.stepper-line {
    position: absolute;
    top: 24px;
    left: 10%;
    height: 3px;
    background-color: rgb(var(--v-theme-primary));
    transition: width 0.3s ease;
    z-index: 0;
}

.stepper-line-bg {
    position: absolute;
    top: 24px;
    left: 10%;
    right: 10%;
    height: 3px;
    background-color: rgba(var(--v-theme-on-surface), 0.08);
    z-index: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.success-lighten-5 {
    background-color: #E8F5E9 !important;
}
</style>
