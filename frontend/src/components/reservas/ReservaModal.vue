<script setup>
import { ref, computed } from 'vue'
import { useReservasStore } from '@/stores/reservas'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import ModalMensaje from '../common/ModalMensaje.vue'
import PersonaAvatar from '@/components/common/PersonaAvatar.vue'

/* =========================
   PROPS
========================= */
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  fecha: { type: String, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  especialidad: { type: Object, required: true },
  posta: { type: Object, required: true },
  doctor: { type: Object, required: true },
  pacienteId: { type: Number, default: null },
  pacienteNombre: { type: String, default: '' }
})

/* =========================
   EMITS
========================= */
const emit = defineEmits(['update:modelValue', 'reservada', 'conflict'])

/* =========================
   STORES
========================= */
const reservasStore = useReservasStore()
const authStore = useAuthStore()
const router = useRouter()

/* =========================
   ESTADO LOCAL
========================= */
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const observaciones = ref('')

// Estado para el modal de mensajes (éxito/error)
const msgModal = ref({
  show: false,
  title: '',
  message: '',
  type: 'info',
  onConfirm: () => { }
})

/* =========================
   FORMATTERS
========================= */
const formatFecha = (f) => {
  if (!f) return ''
  const date = new Date(f + 'T00:00:00')
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatHora = (h) => h?.slice(0, 5) || ''

/* =========================
   RESERVAR
========================= */
const reservar = async () => {
  // Flujo doctor→paciente: pacienteId llega explícito y NUNCA debe caer al médico logueado.
  const isBookingForPatient =
    props.pacienteId != null || Boolean(props.pacienteNombre)

  const targetIdUsuario = isBookingForPatient
    ? Number(props.pacienteId)
    : Number(authStore.user?.idUsuario || authStore.user?.id)

  if (!targetIdUsuario || Number.isNaN(targetIdUsuario)) {
    msgModal.value = {
      show: true,
      title: 'Error en la Reserva',
      message: isBookingForPatient
        ? 'No se pudo identificar al paciente seleccionado. Vuelve a seleccionar el paciente e intenta nuevamente.'
        : 'No se pudo identificar el usuario para la reserva.',
      type: 'error',
      onConfirm: () => {
        msgModal.value.show = false
      },
    }
    return
  }

  const res = await reservasStore.createReserva({
    idUsuario: targetIdUsuario,
    idEspecialidad: props.especialidad.id,
    idPosta: props.posta.id,
    idDoctor: props.doctor.id,
    fechaCita: props.fecha,
    horaInicioCita: props.horaInicio,
    horaFinCita: props.horaFin,
    observaciones: observaciones.value
  })

  if (res.success) {
    // Éxito
    msgModal.value = {
      show: true,
      title: '¡Reserva Exitosa!',
      message: props.pacienteId
        ? `La cita para ${props.pacienteNombre} ha sido programada correctamente.`
        : 'Tu cita ha sido programada correctamente. Puedes revisarla en tu panel de control.',
      type: 'success',
      onConfirm: () => {
        msgModal.value.show = false
        dialog.value = false
        if (props.pacienteId) {
          emit('reservada')
        } else {
          router.push('/home')
        }
      }
    }
    observaciones.value = ''
    emit('reservada')
  } else {
    // Error
    msgModal.value = {
      show: true,
      title: 'Error en la Reserva',
      message: reservasStore.error || 'No se pudo completar la reserva. Por favor, intenta con otro horario.',
      type: 'error',
      onConfirm: () => {
        msgModal.value.show = false
        // Cerramos el modal de detalle para que el usuario pueda elegir otro slot
        dialog.value = false
      }
    }

    // Si fue un conflicto (409), notificamos para recargar el calendario
    if (res.status === 409) {
      emit('conflict')
    }
  }
}

const close = () => {
  dialog.value = false
}
</script>

<template>
  <div>
    <v-dialog v-model="dialog" max-width="550" persistent scrollable class="rounded-xl" data-tour="reserva-confirm-modal">
      <v-card class="rounded-xl">
        <!-- Header -->
        <v-card-title class="pa-0">
          <v-toolbar color="primary" flat dark>
            <v-icon start icon="mdi-calendar-check" class="ms-4"></v-icon>
            <span class="text-h6 font-weight-bold">Confirmar Cita Médica</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
          </v-toolbar>
        </v-card-title>

        <v-card-text class="pa-6">
          <p class="text-subtitle-1 text-grey-darken-2 mb-4 text-center">
            Estás a un paso de confirmar tu cita. Revisa los detalles:
          </p>

          <v-alert v-if="pacienteNombre" type="info" variant="tonal" class="mb-4 rounded-xl font-weight-bold" density="compact">
            Paciente: {{ pacienteNombre }}
          </v-alert>

          <!-- Doctor Info Card -->
          <v-card variant="flat" color="indigo-lighten-5" rounded="xl" class="pa-4 mb-6">
            <div class="d-flex align-center">
              <PersonaAvatar
                :foto="doctor.foto || doctor.imagen"
                :nombres="doctor.nombres || doctor.nombre"
                :primer-apellido="doctor.primerApellido"
                :size="64"
                class="me-4 elevation-2 border-white"
              />
              <div>
                <div class="text-primary font-weight-black text-h6">{{ doctor.nombre }}</div>
                <div class="text-subtitle-2 text-grey-darken-1 font-weight-bold">
                  {{ especialidad.nombre }}
                </div>
                <div class="text-caption text-grey-darken-1">
                  <v-icon start icon="mdi-map-marker" size="14"></v-icon>
                  {{ posta.nombre }}
                </div>
              </div>
            </div>
          </v-card>

          <!-- Details List -->
          <v-list class="bg-transparent pa-0 mb-6">
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-avatar color="white" size="40" class="elevation-1 me-3">
                  <v-icon color="primary">mdi-calendar-range</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold text-capitalize">
                {{ formatFecha(fecha) }}
              </v-list-item-title>
              <v-list-item-subtitle>Fecha de la cita</v-list-item-subtitle>
            </v-list-item>

            <v-list-item class="px-0 mt-3">
              <template v-slot:prepend>
                <v-avatar color="white" size="40" class="elevation-1 me-3">
                  <v-icon color="secondary">mdi-clock-outline</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold">
                {{ formatHora(horaInicio) }} - {{ formatHora(horaFin) }}
              </v-list-item-title>
              <v-list-item-subtitle>Horario seleccionado</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <!-- Observations -->
          <v-textarea label="Observaciones adicionales. (OPCIONAL)*" v-model="observaciones" variant="outlined"
            placeholder="Ej: Síntomas breves, motivo de consulta, etc." rounded="xl" rows="3" color="primary"
            class="custom-textarea" hide-details />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-6 d-flex flex-wrap flex-sm-nowrap gap-3">
          <v-btn variant="text" color="grey-darken-1" rounded="xl" class="text-none font-weight-bold flex-grow-1"
            size="large" @click="close">
            Cancelar
          </v-btn>

          <v-btn color="primary" variant="flat" rounded="xl" class="text-none font-weight-bold flex-grow-1" size="large"
            elevation="4" data-tour="reserva-confirm-submit" @click="reservar" :loading="reservasStore.loading">
            Confirmar Reserva
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal de Mensajes Genérico -->
    <ModalMensaje v-model="msgModal.show" :title="msgModal.title" :message="msgModal.message" :type="msgModal.type"
      @confirm="msgModal.onConfirm" />
  </div>
</template>

<style scoped>
.border-white {
  border: 3px solid white;
}

.custom-textarea :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

.gap-3 {
  gap: 12px;
}

:deep(.v-btn--size-large) {
  padding: 0 32px;
}
</style>
