<!-- src/components/especialidades_medicas/EspecialidadModal.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="onDialogUpdate"
    max-width="600"
  >
    <v-card rounded="lg">
      <v-card-title class="text-h6">
        {{ isEdit ? 'Editar especialidad médica' : 'Nueva especialidad médica' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" lazy-validation>
          <v-text-field
            v-model="localForm.nombre"
            label="Nombre"
            density="comfortable"
            hide-details="auto"
            class="mb-4"
            required
          />

          <v-text-field
            v-model="localForm.codigo"
            label="Código"
            density="comfortable"
            hide-details="auto"
            class="mb-4"
            required
          />

          <v-textarea
            v-model="localForm.descripcion"
            label="Descripción"
            rows="3"
            density="comfortable"
            hide-details="auto"
            class="mb-4"
          />

          <v-text-field
            v-model.number="localForm.tiempoCitaPorDefecto"
            label="Tiempo promedio de consulta (minutos)"
            type="number"
            density="comfortable"
            class="mb-6"
            hint="Solo como guía; la duración real se define en cada turno del doctor."
            persistent-hint
            :rules="[rules.required, rules.numericOnly]"
            min="1"
          />

          <v-row dense>
            <v-col cols="6">
              <v-switch
                v-model="localForm.visible"
                label="Pasa por Medicina General"
                color="primary"
              />
            </v-col>

            <v-col cols="6">
              <v-switch
                v-model="localForm.activo"
                label="Activo"
                color="primary"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="onCancel">
          Cancelar
        </v-btn>
        <v-btn color="primary" @click="onSave">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { rules } from '@/utils/rules'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  especialidad: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'save'])

const formRef = ref(null)
const isEdit = ref(false)

const localForm = ref({
  id: null,
  nombre: '',
  codigo: '',
  descripcion: '',
  tiempoCitaPorDefecto: 30,
  visible: true,
  activo: true
})

/* helpers */
const reset = () => {
  localForm.value = {
    id: null,
    nombre: '',
    codigo: '',
    descripcion: '',
    tiempoCitaPorDefecto: 30,
    visible: true,
    activo: true
  }
}

/* cargar datos al editar */
watch(
  () => props.especialidad,
  (val) => {
    if (val) {
      isEdit.value = true
      localForm.value = { ...val }
    } else {
      isEdit.value = false
      reset()
    }
  },
  { immediate: true }
)

const onDialogUpdate = (val) => {
  emit('update:modelValue', val)
}

const onCancel = () => {
  emit('update:modelValue', false)
}

const onSave = () => {
  emit('save', { ...localForm.value })
  emit('update:modelValue', false)
}
</script>
