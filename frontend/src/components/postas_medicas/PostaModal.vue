<!-- src/components/postas_medicas/PostaModal.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="onDialogUpdate"
    max-width="600"
  >
    <v-card rounded="lg">
      <v-card-title class="text-h6">
        {{ isEdit ? 'Editar posta médica' : 'Nueva posta médica' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" lazy-validation>

          <!-- Nombre -->
          <v-text-field
            v-model="localForm.nombre"
            label="Nombre"
            density="comfortable"
            hide-details="auto"
            class="mb-4"
            :rules="[rules.required]"
          />

          <!-- Código -->
          <v-text-field
            v-model="localForm.codigo"
            label="Código"
            density="comfortable"
            hide-details="auto"
            class="mb-4"
            :rules="[rules.required]"
          />

          <!-- Dirección -->
          <v-text-field
            v-model="localForm.direccion"
            label="Dirección"
            density="comfortable"
            hide-details="auto"
            class="mb-4"
            :rules="[rules.required]"
          />

          <!-- Teléfono -->
          <v-text-field
            v-model="localForm.telefono"
            label="Teléfono"
            density="comfortable"
            hide-details="auto"
            class="mb-4"
            :rules="[rules.required]"
          />

          <!-- Ubicación GPS -->
          <v-text-field
            v-model="localForm.ubicacionGps"
            label="Ubicación GPS"
            density="comfortable"
            hide-details="auto"
            class="mb-6"
            :rules="[rules.required]"
          />

          <!-- Horarios mañana -->
          <v-row dense class="mb-4">
            <v-col cols="6">
              <v-text-field
                v-model="localForm.horarioAtencionMananaInicio"
                label="Mañana inicio"
                type="time"
                density="comfortable"
                hide-details="auto"
                :rules="[
                  rules.required,
                  rules.minStartTime('06:00'),
                  rules.timeNotEqual(horaMananaFin),
                  rules.startBeforeEnd(horaMananaInicio, horaMananaFin)
                ]"
              />

            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model="localForm.horarioAtencionMananaFin"
                label="Mañana fin"
                type="time"
                density="comfortable"
                hide-details="auto"
                :rules="[
                  rules.required,
                  rules.maxEndTime('23:00'),
                  rules.timeNotEqual(horaMananaInicio),
                  rules.endAfterStart(horaMananaInicio, horaMananaFin)
                ]"
              />
            </v-col>
          </v-row>

          <!-- Horarios tarde -->
          <v-row dense class="mb-6">
            <v-col cols="6">
              <v-text-field
                v-model="localForm.horarioAtencionTardeInicio"
                label="Tarde inicio"
                type="time"
                density="comfortable"
                hide-details="auto"
                :rules="[
                  rules.required,
                  rules.minStartTime('06:00'),
                  rules.timeNotEqual(horaTardeFin),
                  rules.startBeforeEnd(horaTardeInicio, horaTardeFin)
                ]"
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model="localForm.horarioAtencionTardeFin"
                label="Tarde fin"
                type="time"
                density="comfortable"
                hide-details="auto"
                :rules="[
                  rules.required,
                  rules.maxEndTime('23:00'),
                  rules.timeNotEqual(horaTardeInicio),
                  rules.endAfterStart(horaTardeInicio, horaTardeFin)
                ]"
              />

            </v-col>
          </v-row>

          <!-- Activo -->
          <v-switch
            v-model="localForm.activo"
            label="Posta activa"
            color="primary"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="onCancel">
          Cancelar
        </v-btn>
        <v-btn color="primary" :loading="saving" @click="onSave">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Modal de retroalimentación (éxito o error) -->
  <ModalMensaje
    v-model="modalVisible"
    :title="modalTitle"
    :message="modalMessage"
    :type="modalType"
    buttonText="Aceptar"
    @confirm="modalVisible = false"
  />
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import ModalMensaje from '@/components/common/ModalMensaje.vue'
import { rules } from '@/utils/rules'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  posta: { type: Object, default: null },
  /** Función async que recibe el payload y hace la llamada al store/API */
  saveHandler: { type: Function, default: null }
})

const emit = defineEmits(['update:modelValue', 'save'])

const formRef = ref(null)
const isEdit = ref(false)
const saving = ref(false)

// Estado del ModalMensaje
const modalVisible = ref(false)
const modalTitle = ref('')
const modalMessage = ref('')
const modalType = ref('info')

/* formulario */
const localForm = ref({
  id: null,
  nombre: '',
  codigo: '',
  direccion: '',
  telefono: '',
  ubicacionGps: '',
  horarioAtencionMananaInicio: null,
  horarioAtencionMananaFin: null,
  horarioAtencionTardeInicio: null,
  horarioAtencionTardeFin: null,
  activo: true
})

const horaMananaInicio = computed(() => localForm.value.horarioAtencionMananaInicio)
const horaMananaFin = computed(() => localForm.value.horarioAtencionMananaFin)

const horaTardeInicio = computed(() => localForm.value.horarioAtencionTardeInicio)
const horaTardeFin = computed(() => localForm.value.horarioAtencionTardeFin)

/* helpers */
const reset = () => {
  localForm.value = {
    id: null,
    nombre: '',
    codigo: '',
    direccion: '',
    telefono: '',
    ubicacionGps: '',
    horarioAtencionMananaInicio: null,
    horarioAtencionMananaFin: null,
    horarioAtencionTardeInicio: null,
    horarioAtencionTardeFin: null,
    activo: true
  }
}

/* cargar datos al editar */
watch(
  () => props.posta,
  (val) => {
    if (val) {
      isEdit.value = true
      localForm.value = {
        id: val.id ?? val.idPosta ?? null,
        nombre: val.nombre ?? '',
        codigo: val.codigo ?? '',
        direccion: val.direccion ?? '',
        telefono: val.telefono ?? '',
        ubicacionGps: val.ubicacionGps ?? val.ubicacion_gps ?? '',
        horarioAtencionMananaInicio: val.horarioAtencionMananaInicio ?? null,
        horarioAtencionMananaFin: val.horarioAtencionMananaFin ?? null,
        horarioAtencionTardeInicio: val.horarioAtencionTardeInicio ?? null,
        horarioAtencionTardeFin: val.horarioAtencionTardeFin ?? null,
        activo: typeof val.activo === 'boolean' ? val.activo : true
      }
    } else {
      isEdit.value = false
      reset()
    }
  },
  { immediate: true }
)

/* eventos */
const onDialogUpdate = (val) => {
  emit('update:modelValue', val)
}

const onCancel = () => {
  emit('update:modelValue', false)
}

const onSave = async () => {
  if (formRef.value) {
    const { valid } = await formRef.value.validate()
    if (!valid) return
  }

  const payload = { ...localForm.value }
  saving.value = true

  try {
    if (props.saveHandler) {
      // Si el padre pasó un saveHandler async, lo usamos para detectar éxito/error real
      await props.saveHandler(payload)
    } else {
      // Fallback: emitir evento clásico (compatibilidad)
      emit('save', payload)
    }

    // Cerrar el diálogo de formulario
    emit('update:modelValue', false)

    // Mostrar mensaje de éxito
    modalTitle.value = 'Éxito'
    modalMessage.value = 'La posta médica se ha guardado correctamente.'
    modalType.value = 'success'
    modalVisible.value = true
  } catch (error) {
    // Mostrar mensaje de error
    modalTitle.value = 'Error'
    modalMessage.value = error?.message || 'Ocurrió un error al guardar la posta médica.'
    modalType.value = 'error'
    modalVisible.value = true
  } finally {
    saving.value = false
  }
}
</script>
