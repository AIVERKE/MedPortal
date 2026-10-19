<!-- src/components/configuracion/FeriadoModal.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="onDialogUpdate"
    max-width="520"
  >
    <v-card rounded="lg">
      <v-card-title class="text-h6">
        {{ isEdit ? 'Editar feriado' : 'Nuevo feriado' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" lazy-validation>
          <!-- Descripción -->
          <v-text-field
            v-model="localForm.descripcion"
            label="Descripción"
            density="comfortable"
            hide-details="auto"
            class="mb-4"
            required
          />

          <!-- Selector de fecha -->
          <v-menu
            v-model="menuFecha"
            :close-on-content-click="false"
            transition="scale-transition"
            max-width="290"
          >
            <template #activator="{ props }">
              <v-text-field
                v-bind="props"
                :model-value="fechaFormateada"
                label="Fecha del feriado"
                prepend-icon="mdi-calendar"
                readonly
                density="comfortable"
                class="mb-4"
              />
            </template>

            <v-date-picker
              v-model="fechaSeleccionada"
              @update:model-value="onFechaSeleccionada"
              hide-header
            />
          </v-menu>

          <!-- Día / Mes / Año (solo lectura) -->
          <v-row>
            <v-col cols="4">
              <v-text-field
                v-model="localForm.dia"
                label="Día"
                readonly
                density="comfortable"
              />
            </v-col>

            <v-col cols="4">
              <v-text-field
                v-model="localForm.mes"
                label="Mes"
                readonly
                density="comfortable"
              />
            </v-col>

            <v-col cols="4">
              <v-text-field
                v-model="localForm.anio"
                label="Año"
                readonly
                density="comfortable"
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
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  feriado: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'save'])

const formRef = ref(null)
const isEdit = ref(false)
const menuFecha = ref(false)

/* fecha completa (YYYY-MM-DD) */
const fechaSeleccionada = ref(null)

/* formulario */
const localForm = ref({
  id: null,
  descripcion: '',
  dia: null,
  mes: null,
  anio: null
})

/* helpers */
const reset = () => {
  localForm.value = {
    id: null,
    descripcion: '',
    dia: null,
    mes: null,
    anio: null
  }
  fechaSeleccionada.value = null
}

/* cuando se selecciona una fecha */
const onFechaSeleccionada = (fecha) => {
  if (!fecha) return

  let date

  // si ya viene como Date (Vuetify suele hacerlo)
  if (fecha instanceof Date) {
    date = fecha
  } else {
    const [y, m, d] = fecha.split('-')
    date = new Date(Number(y), Number(m) - 1, Number(d))
  }

  localForm.value.dia = date.getDate()
  localForm.value.mes = date.getMonth() + 1
  localForm.value.anio = date.getFullYear()

  menuFecha.value = false
}


/* fecha visible en el textfield */
const fechaFormateada = computed(() => {
  if (!fechaSeleccionada.value) return ''

  const d = fechaSeleccionada.value
  return d.toLocaleDateString('es-BO')
})


/* cargar datos al editar */
watch(
  () => props.feriado,
  (val) => {
    if (val) {
      isEdit.value = true
      localForm.value = { ...val }

      // reconstruimos la fecha completa
      fechaSeleccionada.value = new Date(
        val.anio,
        val.mes - 1,
        val.dia
      )

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
