<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useConfiguracionReservasStore } from '@/stores/configuracion_reservas'
import { rules } from '@/utils/rules'

const diasSemana = [
  { label: 'L', value: 'LUNES' },
  { label: 'M', value: 'MARTES' },
  { label: 'X', value: 'MIERCOLES' },
  { label: 'J', value: 'JUEVES' },
  { label: 'V', value: 'VIERNES' },
  { label: 'S', value: 'SABADO' },
  { label: 'D', value: 'DOMINGO' },
]

const form = ref({
  dias: [],
  hora_inicio_reserva: null,
  hora_fin_reserva: null,
  dias_anticipacion_minima: null,
  dias_anticipacion_maxima: null,
  horas_libres_mensuales: null,
})

const formRef = ref(null)
const store = useConfiguracionReservasStore()
const loading = ref(false)
const success = ref('')
const error = ref('')

const horaInicio = computed(() => form.value.hora_inicio_reserva)
const horaFin = computed(() => form.value.hora_fin_reserva)
const minAnt = computed(() => form.value.dias_anticipacion_minima)
const maxAnt = computed(() => form.value.dias_anticipacion_maxima)

const emit = defineEmits(['update', 'saved', 'error'])

watch(form, (val) => {
  emit('update', val)
}, { deep: true })

const horaInicioError = computed(() => {
  const rule = rules.startBeforeEnd(horaInicio, horaFin)
  const result = rule(form.value.hora_inicio_reserva)
  return result === true ? '' : result
})

// computed que evalúa las mismas reglas que el formulario (sin marcar errores en UI)
const formIsValid = computed(() => {
  const vHoraInicio = form.value.hora_inicio_reserva
  const vHoraFin = form.value.hora_fin_reserva
  const vMinAnt = form.value.dias_anticipacion_minima
  const vMaxAnt = form.value.dias_anticipacion_maxima

  if (!vHoraInicio || !vHoraFin || vMinAnt === null || vMaxAnt === null) return false

  // validadores simplificados para el computed
  const checks = [
    rules.minStartTime('00:00')(vHoraInicio) === true,
    rules.maxEndTime('23:59')(vHoraFin) === true,
    rules.startBeforeEnd(horaInicio, horaFin)(vHoraInicio) === true,
    rules.minAnticipation(0)(vMinAnt) === true,
    rules.maxAnticipation(30)(vMaxAnt) === true,
    rules.maxGreaterOrEqualMin(minAnt)(vMaxAnt) === true
  ]

  return checks.every(c => c === true) && form.value.dias.length > 0
})

onMounted(async () => {
  await store.fetchConfig()
  if (store.currentConfig) {
    form.value = { ...store.currentConfig }
  }
})

const actualizarConfiguracion = async () => {
  if (formRef.value) {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      error.value = 'Corrige los campos antes de guardar.'
      return
    }
  }

  loading.value = true
  success.value = ''
  error.value = ''
  try {
    const ok = await store.saveConfig(form.value)
    if (ok) { 
      success.value = 'Configuración guardada correctamente.'
      emit('saved', form.value)
    } else {
      console.error('UI: El store devolvió error:', store.error)
      error.value = store.error || 'Error al guardar configuración'
      emit('error', error.value)
    }
  } catch (err) {
    console.error('UI: Error capturado en el try/catch:', err)
    error.value = err?.message || 'Error inesperado'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-card class="rounded-xl overflow-hidden" elevation="0" border>
    <!-- Header Section -->
    <div class="pa-6 pa-md-8 border-b bg-surface-light">
      <div class="d-flex align-center gap-4">
        <v-avatar color="primary-lighten-5" size="48" rounded="lg">
          <v-icon color="primary" size="28">mdi-cog-outline</v-icon>
        </v-avatar>
        <div>
          <h2 class="text-h6 font-weight-bold text-high-emphasis">Configuración Global de Reservas</h2>
          <p class="text-body-2 text-medium-emphasis mb-0">Define las reglas generales y horarios para las citas
            universitarias.</p>
        </div>
      </div>
    </div>

    <v-form ref="formRef" lazy-validation class="pa-6 pa-md-8">
      <!-- SECCIÓN 1: DÍAS HABILES -->
      <div class="section-container mb-8">
        <div class="d-flex align-center gap-2 mb-4">
          <v-icon size="20" color="primary">mdi-calendar-multiselect</v-icon>
          <span class="text-subtitle-2 font-weight-bold text-high-emphasis text-uppercase"
            style="letter-spacing: 0.5px;">
            Días de Atención
          </span>
        </div>
        <div class="chips-wrapper pa-4 rounded-xl border bg-grey-lighten-5">
          <v-chip-group v-model="form.dias" multiple column>
            <v-chip v-for="d in diasSemana" :key="d.value" :value="d.value" variant="flat"
              :class="['day-chip', { 'active': form.dias.includes(d.value) }]">
              <span class="font-weight-bold">{{ d.label }}</span>
            </v-chip>
          </v-chip-group>
        </div>
      </div>

      <v-row>
        <!-- SECCIÓN 2: HORARIOS -->
        <v-col cols="12" md="6">
          <div class="section-container mb-8">
            <div class="d-flex align-center gap-2 mb-4">
              <v-icon size="20" color="primary">mdi-clock-outline</v-icon>
              <span class="text-subtitle-2 font-weight-bold text-high-emphasis text-uppercase"
                style="letter-spacing: 0.5px;">
                Franja de Reservas
              </span>
            </div>
            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model="form.hora_inicio_reserva" label="Apertura" type="time" variant="outlined"
                  rounded="lg" density="comfortable" bg-color="white"
                  :error-messages="horaInicioError ? [horaInicioError] : []"
                  :rules="[rules.minStartTime('00:00'), rules.startBeforeEnd(horaInicio, horaFin)]" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="form.hora_fin_reserva" label="Cierre" type="time" variant="outlined" rounded="lg"
                  density="comfortable" bg-color="white"
                  :rules="[rules.maxEndTime('23:59'), rules.endAfterStart(horaInicio, horaFin)]" />
              </v-col>
            </v-row>
          </div>
        </v-col>

        <!-- SECCIÓN 3: ANTICIPACIÓN -->
        <v-col cols="12" md="6">
          <div class="section-container mb-8">
            <div class="d-flex align-center gap-2 mb-4">
              <v-icon size="20" color="primary">mdi-timer-sand</v-icon>
              <span class="text-subtitle-2 font-weight-bold text-high-emphasis text-uppercase"
                style="letter-spacing: 0.5px;">
                Anticipación (Días)
              </span>
            </div>
            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model.number="form.dias_anticipacion_minima" label="Mínima" type="number"
                  variant="outlined" rounded="lg" density="comfortable" bg-color="white"
                  :rules="[rules.numericOnly, rules.minAnticipation(0), rules.minLessOrEqualMax(maxAnt)]" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.dias_anticipacion_maxima" label="Máxima" type="number"
                  variant="outlined" rounded="lg" density="comfortable" bg-color="white"
                  :rules="[rules.maxRequired, rules.maxAnticipation(30), rules.maxGreaterOrEqualMin(minAnt)]" />
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>

      <!-- SECCIÓN 4: HORAS LIBRES DOCTOR -->
      <div class="section-container mb-8">
        <div class="d-flex align-center gap-2 mb-4">
          <v-icon size="20" color="primary">mdi-calendar-clock</v-icon>
          <span class="text-subtitle-2 font-weight-bold text-high-emphasis text-uppercase"
            style="letter-spacing: 0.5px;">
            Horas libres mensuales (bloqueo doctor)
          </span>
        </div>
        <v-text-field
          v-model.number="form.horas_libres_mensuales"
          label="Cupo global de horas libres al mes"
          type="number"
          min="0"
          variant="outlined"
          rounded="lg"
          density="comfortable"
          bg-color="white"
          hint="Si un turno no tiene override, el doctor usa este cupo para Bloqueo Horarios."
          persistent-hint
          :rules="[(v) => v === null || v === '' || v >= 0 || 'Debe ser 0 o mayor']"
          style="max-width: 360px;"
        />
      </div>

      <!-- ACCIONES -->
      <v-divider class="mb-8"></v-divider>

      <div class="d-flex flex-column align-center">
        <v-btn color="primary" size="x-large" elevation="2" :loading="loading" :disabled="loading || !formIsValid"
          rounded="xl" min-width="240" class="text-none font-weight-bold px-8" @click="actualizarConfiguracion">
          <v-icon start icon="mdi-content-save-check"></v-icon>
          Guardar Configuración
        </v-btn>

        <!-- Feedbacks -->
        <v-fade-transition>
          <v-alert v-if="success || error" :type="success ? 'success' : 'error'" variant="tonal" rounded="xl"
            class="mt-6 w-100 max-width-600" density="compact">
            {{ success || error }}
          </v-alert>
        </v-fade-transition>
      </div>
    </v-form>
  </v-card>
</template>

<style scoped>
.gap-4 {
  gap: 16px;
}

.gap-2 {
  gap: 8px;
}

.day-chip {
  width: 44px;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px !important;
  background: white !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgb(var(--v-theme-medium-emphasis));
}

.day-chip.active {
  background: rgb(var(--v-theme-primary)) !important;
  color: white !important;
  border-color: rgb(var(--v-theme-primary)) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3) !important;
}

.max-width-600 {
  max-width: 600px;
}

:deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}
</style>
