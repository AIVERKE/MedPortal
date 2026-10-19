<template>
    <v-dialog :model-value="modelValue" max-width="560" @update:model-value="emit('update:modelValue', $event)">
        <v-card class="rounded-xl">
            <v-card-title class="d-flex align-center justify-space-between">
                <span class="text-h6 font-weight-bold">
                    {{ carrera?.id ? 'Editar Carrera' : 'Nueva Carrera' }}
                </span>
                <v-btn icon="mdi-close" variant="text" @click="emit('update:modelValue', false)" />
            </v-card-title>
            <v-divider />
            <v-card-text class="pt-5">
                <v-form ref="formRef">
                    <v-text-field v-model="form.nombre" label="Nombre" variant="outlined" rounded="lg"
                        :rules="[v => !!v || 'El nombre es requerido']" />
                    <v-select v-model="form.idFacultad" label="Facultad" :items="facultadesOptions" variant="outlined"
                        rounded="lg" :rules="[v => !!v || 'La facultad es requerida']" />
                    <v-switch v-model="form.activo" color="primary" label="Activo" hide-details />
                </v-form>
            </v-card-text>
            <v-card-actions class="pa-4">
                <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
                <v-spacer />
                <v-btn color="primary" :loading="loading" @click="handleSave">Guardar</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    carrera: { type: Object, default: null },
    facultades: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'save'])
const formRef = ref(null)
const form = ref({ nombre: '', idFacultad: null, activo: true })

const facultadesOptions = computed(() =>
    props.facultades.map((f) => ({ title: f.nombre, value: f.id }))
)

watch(() => props.modelValue, (val) => {
    if (!val) return
    form.value = props.carrera
        ? {
            nombre: props.carrera.nombre || '',
            idFacultad: props.carrera.idFacultad || null,
            activo: !!props.carrera.activo
        }
        : { nombre: '', idFacultad: null, activo: true }
})

const handleSave = async () => {
    const result = await formRef.value?.validate()
    if (!result?.valid) return
    emit('save', { ...form.value })
}
</script>
