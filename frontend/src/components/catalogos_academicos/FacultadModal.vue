<template>
    <v-dialog :model-value="modelValue" max-width="520" @update:model-value="emit('update:modelValue', $event)">
        <v-card class="rounded-xl">
            <v-card-title class="d-flex align-center justify-space-between">
                <span class="text-h6 font-weight-bold">
                    {{ facultad?.id ? 'Editar Facultad' : 'Nueva Facultad' }}
                </span>
                <v-btn icon="mdi-close" variant="text" @click="emit('update:modelValue', false)" />
            </v-card-title>
            <v-divider />
            <v-card-text class="pt-5">
                <v-form ref="formRef">
                    <v-text-field v-model="form.nombre" label="Nombre" variant="outlined" rounded="lg"
                        :rules="[v => !!v || 'El nombre es requerido']" />
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
import { ref, watch } from 'vue'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    facultad: { type: Object, default: null },
    loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'save'])
const formRef = ref(null)
const form = ref({ nombre: '', activo: true })

watch(() => props.modelValue, (val) => {
    if (!val) return
    form.value = props.facultad
        ? { nombre: props.facultad.nombre || '', activo: !!props.facultad.activo }
        : { nombre: '', activo: true }
})

const handleSave = async () => {
    const result = await formRef.value?.validate()
    if (!result?.valid) return
    emit('save', { ...form.value })
}
</script>
