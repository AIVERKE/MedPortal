<!-- src/components/configuracion/ConsultorioModal.vue -->
<template>
  <v-dialog v-model="localModel" max-width="600px">
    <v-card rounded="lg">
      <v-card-title class="text-h6 d-flex flex-column pb-0">
        <span>{{ isEdit ? 'Editar consultorio' : 'Nuevo consultorio' }}</span>
        <span v-if="displayPostaNombre" class="text-subtitle-2 text-medium-emphasis font-weight-regular mt-n1">
          En: {{ displayPostaNombre }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" lazy-validation>
          <v-text-field v-model="form.numeroConsultorio" label="Número del consultorio" density="comfortable"
            hide-details="auto" class="mb-4" :rules="rules.numeroConsultorio" />

          <v-textarea v-model="form.pisoUbicacion" label="Piso / Ubicación *" density="comfortable"
            hide-details="auto" class="mb-4" rows="3" auto-grow
            placeholder="Ej: Primer piso, al fondo del pasillo junto a enfermería"
            :rules="rules.pisoUbicacion" />

          <v-text-field v-model="form.fechaHabilitacion" label="Fecha Habilitación" type="date" density="comfortable"
            hide-details="auto" class="mb-4" :rules="rules.fechaHabilitacion" />

          <v-select v-model="form.idEspecialidad" :items="especialidadStore.especialidades" item-title="nombre"
            item-value="id" label="Especialidad" :loading="especialidadStore.loading" density="comfortable"
            hide-details="auto" class="mb-4" :rules="rules.idEspecialidad" />

          <v-switch v-model="form.activo" label="Consultorio activo" color="primary" />
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-end px-6 pb-4">
        <v-btn variant="text" @click="close">
          Cancelar
        </v-btn>
        <v-btn color="primary" :loading="saving" @click="save">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Modal de retroalimentación (éxito o error) -->
  <ModalMensaje v-model="showMensaje" :title="mensajeTitulo" :message="mensajeTexto" :type="mensajeTipo"
    @confirm="showMensaje = false" />
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useEspecialidadStore } from '@/stores/especialidad'
import ModalMensaje from '@/components/common/ModalMensaje.vue'

const especialidadStore = useEspecialidadStore()
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  consultorio: { type: Object, default: null },
  postaId: { type: [String, Number], default: null },
  postaNombre: { type: String, default: '' },
  /** Función async que recibe el payload y hace la llamada al store/API */
  saveHandler: { type: Function, default: null }
})
const emit = defineEmits(['update:modelValue', 'save'])

/* =============================
 * REGLAS DE VALIDACIÓN (según DTO del backend)
 *
 * idPosta:            @IsNotEmpty() @IsInt()       → se asigna automáticamente desde props.postaId
 * idEspecialidad:     @IsNotEmpty() @IsInt()       → obligatorio
 * fechaHabilitacion:  @IsNotEmpty() @IsDateString()→ obligatorio
 * numeroConsultorio:  @IsNotEmpty() @IsString()    → obligatorio
 * pisoUbicacion:      @IsNotEmpty() @IsString()    → obligatorio
 * activo:             @IsOptional() @IsBoolean()   → opcional
 * ============================= */
const rules = {
  numeroConsultorio: [
    v => !!v || 'El número del consultorio es obligatorio'
  ],
  pisoUbicacion: [
    v => !!String(v ?? '').trim() || 'El piso / ubicación es obligatorio'
  ],
  fechaHabilitacion: [
    v => !!v || 'La fecha de habilitación es obligatoria'
  ],
  idEspecialidad: [
    v => v != null || 'La especialidad es obligatoria'
  ]
}

/* =============================
 * MODAL MENSAJE (feedback)
 * ============================= */
const showMensaje = ref(false)
const mensajeTitulo = ref('')
const mensajeTexto = ref('')
const mensajeTipo = ref('info')
const saving = ref(false)

const displayPostaNombre = computed(() => {
  if (props.consultorio?.posta?.nombre) return props.consultorio.posta.nombre
  return props.postaNombre
})

const localModel = ref(props.modelValue)
watch(() => props.modelValue, v => (localModel.value = v))
watch(localModel, v => emit('update:modelValue', v))

const isEdit = computed(() => !!(props.consultorio && props.consultorio.idConsultorio))

// Form local
const formRef = ref(null)
const form = ref({
  idConsultorio: null,
  idPosta: props.postaId || null,
  idEspecialidad: null,
  fechaHabilitacion: '',
  numeroConsultorio: '',
  pisoUbicacion: '',
  activo: true
})

watch(
  () => props.consultorio,
  (val) => {
    if (val) {
      form.value = { ...val }
    } else {
      form.value = {
        idConsultorio: null,
        idPosta: props.postaId || null,
        idEspecialidad: null,
        fechaHabilitacion: '',
        numeroConsultorio: '',
        pisoUbicacion: '',
        activo: true
      }
    }
  },
  { immediate: true }
)

const close = () => {
  localModel.value = false
}

const save = async () => {
  // Validar formulario según reglas del DTO
  const { valid } = await formRef.value.validate()
  if (!valid) return

  const payload = { ...form.value }
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
    localModel.value = false

    // Mostrar mensaje de éxito
    mensajeTitulo.value = 'Operación exitosa'
    mensajeTexto.value = isEdit.value
      ? 'El consultorio se actualizó correctamente.'
      : 'El consultorio se creó correctamente.'
    mensajeTipo.value = 'success'
    showMensaje.value = true
  } catch (err) {
    // Mostrar mensaje de error
    mensajeTitulo.value = 'Error en la operación'
    mensajeTexto.value = err?.message
      || (isEdit.value
        ? 'No se pudo actualizar el consultorio. Intente nuevamente.'
        : 'No se pudo crear el consultorio. Intente nuevamente.')
    mensajeTipo.value = 'error'
    showMensaje.value = true
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (especialidadStore.especialidades.length === 0) {
    especialidadStore.fetchEspecialidades()
  }
})
</script>
