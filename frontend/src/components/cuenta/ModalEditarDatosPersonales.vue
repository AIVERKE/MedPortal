<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    modelValue: Boolean,
    user: {
        type: Object,
        default: null,
    },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const form = ref({
    nombres: '',
    primerApellido: '',
    segundoApellido: '',
    genero: '',
    celular: '',
    email: '',
    direccion: '',
})

const formRef = ref(null)
const requiredRule = (label) => (v) => !!String(v || '').trim() || `${label} es requerido`
const emailRule = (v) => {
    if (!v) return true
    return /.+@.+\..+/.test(v) || 'Email inválido'
}

const fillFromUser = () => {
    const u = props.user || {}
    form.value = {
        nombres: u.nombres || '',
        primerApellido: u.primerApellido || '',
        segundoApellido: u.segundoApellido || '',
        genero: u.genero || '',
        celular: u.celular || '',
        email: u.email || '',
        direccion: u.direccion || '',
    }
    formRef.value?.resetValidation?.()
}

const close = () => emit('update:modelValue', false)

watch(() => props.modelValue, (open) => {
    if (open) fillFromUser()
})

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return
    emit('submit', {
        nombres: form.value.nombres.trim(),
        primerApellido: form.value.primerApellido.trim(),
        segundoApellido: form.value.segundoApellido?.trim() || undefined,
        genero: form.value.genero?.trim() || undefined,
        celular: form.value.celular?.trim() || undefined,
        email: form.value.email?.trim() || undefined,
        direccion: form.value.direccion?.trim() || undefined,
    })
}
</script>

<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="640" persistent>
        <v-card class="rounded-xl overflow-hidden shadow-premium">
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1">
                    <v-icon start class="ms-4">mdi-account-edit</v-icon>
                    <div class="text-h6 font-weight-bold flex-grow-1 ms-2">Editar datos personales</div>
                    <v-btn icon="mdi-close" variant="text" @click="close" class="me-2" />
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6">
                <v-form ref="formRef" @submit.prevent="handleSubmit">
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">NOMBRES</v-label>
                            <v-text-field v-model="form.nombres" variant="outlined" density="comfortable" rounded="lg"
                                :rules="[requiredRule('Nombres')]" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">PRIMER APELLIDO</v-label>
                            <v-text-field v-model="form.primerApellido" variant="outlined" density="comfortable"
                                rounded="lg" :rules="[requiredRule('Primer apellido')]" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">SEGUNDO APELLIDO</v-label>
                            <v-text-field v-model="form.segundoApellido" variant="outlined" density="comfortable"
                                rounded="lg" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">GÉNERO</v-label>
                            <v-select v-model="form.genero" :items="['M', 'F', 'Otro']" variant="outlined"
                                density="comfortable" rounded="lg" clearable />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">CELULAR</v-label>
                            <v-text-field v-model="form.celular" variant="outlined" density="comfortable" rounded="lg" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">EMAIL</v-label>
                            <v-text-field v-model="form.email" variant="outlined" density="comfortable" rounded="lg"
                                :rules="[emailRule]" />
                        </v-col>
                        <v-col cols="12">
                            <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">DIRECCIÓN</v-label>
                            <v-textarea v-model="form.direccion" variant="outlined" density="comfortable" rounded="lg"
                                rows="2" auto-grow />
                        </v-col>
                    </v-row>

                    <div class="d-flex justify-end ga-3 mt-4">
                        <v-btn variant="tonal" color="grey" rounded="lg" class="text-none" @click="close">
                            Cancelar
                        </v-btn>
                        <v-btn type="submit" color="primary" variant="flat" rounded="lg" class="text-none font-weight-bold">
                            Guardar
                        </v-btn>
                    </div>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.shadow-premium {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}
</style>
