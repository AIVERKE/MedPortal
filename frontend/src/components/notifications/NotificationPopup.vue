<template>
  <v-dialog
    :model-value="!!currentPopup"
    persistent
    max-width="480"
    @update:model-value="() => {}"
  >
    <v-card v-if="currentPopup" class="rounded-xl overflow-hidden shadow-premium d-flex flex-column popup-card">
      <div class="accent-bar" :class="typeClass"></div>
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        class="popup-close"
        aria-label="Cerrar"
        @click="handleDismiss"
      />

      <v-card-text class="pa-8 pt-6 text-center popup-body">
        <div class="icon-container mb-6" :class="typeClass">
          <v-icon :icon="iconName" size="48" :color="iconColor"></v-icon>
        </div>

        <h2 class="text-h5 font-weight-black mb-2 text-slate-800">
          {{ currentPopup.titulo }}
        </h2>

        <p class="text-body-1 text-slate-600 mb-4">
          {{ currentPopup.mensaje }}
        </p>

        <v-sheet
          v-if="hasAppointmentDetails"
          color="grey-lighten-4"
          rounded="lg"
          class="pa-4 mb-6 text-left"
        >
          <div v-if="appointmentDate" class="d-flex align-center ga-2 mb-2">
            <v-icon size="18" color="primary">mdi-calendar</v-icon>
            <span class="text-body-2">{{ appointmentDate }}</span>
          </div>
          <div v-if="appointmentTime" class="d-flex align-center ga-2 mb-2">
            <v-icon size="18" color="primary">mdi-clock-outline</v-icon>
            <span class="text-body-2">{{ appointmentTime }}</span>
          </div>
          <div v-if="appointmentPosta" class="d-flex align-center ga-2 mb-2">
            <v-icon size="18" color="primary">mdi-hospital-building</v-icon>
            <span class="text-body-2">{{ appointmentPosta }}</span>
          </div>
          <div v-if="appointmentPostaAddress" class="d-flex align-center ga-2 mb-2 pl-7">
            <span class="text-caption text-medium-emphasis">{{ appointmentPostaAddress }}</span>
          </div>
          <div v-if="appointmentSpecialty" class="d-flex align-center ga-2 mb-2">
            <v-icon size="18" color="primary">mdi-stethoscope</v-icon>
            <span class="text-body-2">{{ appointmentSpecialty }}</span>
          </div>
          <div v-if="appointmentDoctor && !isNewReservation" class="d-flex align-center ga-2 mb-2">
            <v-icon size="18" color="primary">mdi-doctor</v-icon>
            <span class="text-body-2">{{ appointmentDoctor }}</span>
          </div>
          <template v-if="hasPatientDetails">
            <v-divider class="my-3"></v-divider>
            <div class="text-caption font-weight-bold text-primary mb-2">Datos del paciente</div>
            <div v-if="meta.paciente" class="d-flex align-center ga-2 mb-2">
              <v-icon size="18" color="primary">mdi-account</v-icon>
              <span class="text-body-2">{{ meta.paciente }}</span>
            </div>
            <div v-if="meta.pacienteCi" class="d-flex align-center ga-2 mb-2">
              <v-icon size="18" color="primary">mdi-card-account-details-outline</v-icon>
              <span class="text-body-2">CI: {{ meta.pacienteCi }}</span>
            </div>
            <div v-if="meta.pacienteCelular" class="d-flex align-center ga-2 mb-2">
              <v-icon size="18" color="primary">mdi-phone</v-icon>
              <span class="text-body-2">{{ meta.pacienteCelular }}</span>
            </div>
            <div v-if="meta.pacienteEmail" class="d-flex align-center ga-2">
              <v-icon size="18" color="primary">mdi-email-outline</v-icon>
              <span class="text-body-2">{{ meta.pacienteEmail }}</span>
            </div>
          </template>
        </v-sheet>

        <div class="d-flex flex-column ga-3">
          <v-btn
            block
            size="large"
            color="primary"
            rounded="lg"
            elevation="2"
            class="text-none font-weight-bold"
            @click="handleDismiss"
          >
            Entendido
          </v-btn>
          <v-btn
            v-if="showViewAppointments"
            block
            size="large"
            variant="outlined"
            color="primary"
            rounded="lg"
            class="text-none font-weight-bold"
            @click="handleViewAppointments"
          >
            Ver mis citas
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()
const { currentPopup } = storeToRefs(notificationsStore)

const notificationType = computed(() => {
  const tipo = currentPopup.value?.tipo ?? ''
  if (tipo === 'CITA_NUEVA_RESERVA') return 'success'
  if (tipo.includes('24H') || tipo.includes('1H')) return 'warning'
  if (tipo.includes('DIA') || tipo.includes('RESUMEN')) return 'info'
  return 'info'
})

const isNewReservation = computed(() => currentPopup.value?.tipo === 'CITA_NUEVA_RESERVA')

const typeClass = computed(() => `type-${notificationType.value}`)

const iconName = computed(() => {
  switch (notificationType.value) {
    case 'success': return 'mdi-calendar-check'
    case 'warning': return 'mdi-bell-ring-outline'
    default: return 'mdi-calendar-clock'
  }
})

const iconColor = computed(() => {
  switch (notificationType.value) {
    case 'success': return '#10b981'
    case 'warning': return '#f59e0b'
    default: return '#6366f1'
  }
})

const meta = computed(() => currentPopup.value?.metadata ?? {})

const appointmentDate = computed(() => meta.value.fechaCitaDisplay || '')

const appointmentTime = computed(() => {
  const hora = meta.value.horaInicioCita
  if (!hora) return ''
  return String(hora).substring(0, 5)
})

const appointmentDoctor = computed(() => meta.value.doctor || '')
const appointmentSpecialty = computed(() => meta.value.especialidad || '')
const appointmentPosta = computed(() => meta.value.posta || '')
const appointmentPostaAddress = computed(() => meta.value.postaDireccion || '')

const hasPatientDetails = computed(() =>
  !!(meta.value.paciente || meta.value.pacienteCi || meta.value.pacienteCelular || meta.value.pacienteEmail),
)

const hasAppointmentDetails = computed(() =>
  !!(appointmentDate.value || appointmentTime.value || appointmentDoctor.value ||
    appointmentSpecialty.value || appointmentPosta.value || hasPatientDetails.value),
)

const isDoctor = computed(() => authStore.user?.rol === 'DOCTOR')

const showViewAppointments = computed(() => {
  if (currentPopup.value?.tipo === 'CITA_NUEVA_RESERVA') return isDoctor.value
  return currentPopup.value?.tipo !== 'DOCTOR_RESUMEN_DIARIO' || isDoctor.value
})

const handleDismiss = async () => {
  await notificationsStore.dismissCurrentPopup()
}

const handleViewAppointments = async () => {
  const target = isDoctor.value ? '/doctor/agenda' : '/'
  await notificationsStore.dismissCurrentPopup()
  router.push(target)
}
</script>

<style scoped>
.shadow-premium {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}

.popup-card {
  position: relative;
  max-height: 90vh;
}

.popup-body {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
}

.popup-close {
  position: absolute;
  top: 10px;
  right: 8px;
  z-index: 2;
}

.accent-bar {
  height: 6px;
  width: 100%;
}

.type-warning.accent-bar { background-color: #f59e0b; }
.type-info.accent-bar { background-color: #6366f1; }
.type-success.accent-bar { background-color: #10b981; }

.icon-container {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
}

.type-warning.icon-container { background-color: #fffbeb; }
.type-info.icon-container { background-color: #eef2ff; }
.type-success.icon-container { background-color: #ecfdf5; }

.text-slate-800 { color: #1e293b; }
.text-slate-600 { color: #475569; }
</style>
