<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    modelValue: Boolean,
    mandatory: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const form = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
})

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const formRef = ref(null)

const requiredRule = (label) => (v) => !!v || `${label} es requerido`
const passwordRule = (v) => (v && v.length >= 8) || 'La contraseña debe tener mínimo 8 caracteres'
const confirmPasswordRule = (v) => v === form.value.newPassword || 'Las contraseñas no coinciden'

const resetForm = () => {
    form.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    showCurrent.value = false
    showNew.value = false
    showConfirm.value = false
    formRef.value?.resetValidation?.()
}

const close = () => {
    if (props.mandatory) return
    emit('update:modelValue', false)
}

const onDialogUpdate = (val) => {
    if (!val && props.mandatory) return
    emit('update:modelValue', val)
}

watch(() => props.modelValue, (open) => {
    if (!open) resetForm()
})

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    emit('submit', { ...form.value })
}
</script>

<template>
    <v-dialog :model-value="modelValue" @update:model-value="onDialogUpdate" max-width="480" persistent>
        <v-card class="rounded-xl overflow-hidden shadow-premium">
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1">
                    <v-icon start class="ms-4">mdi-lock-reset</v-icon>
                    <div class="text-h6 font-weight-bold flex-grow-1 ms-2">Cambiar contraseña</div>
                    <v-btn v-if="!mandatory" icon="mdi-close" variant="text" @click="close" class="me-2"></v-btn>
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6">
                <v-form ref="formRef" @submit.prevent="handleSubmit">
                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">CONTRASEÑA ACTUAL</v-label>
                    <v-text-field v-model="form.currentPassword" :type="showCurrent ? 'text' : 'password'"
                        variant="outlined" density="comfortable" rounded="lg" class="mb-3"
                        :append-inner-icon="showCurrent ? 'mdi-eye-off' : 'mdi-eye'"
                        @click:append-inner="showCurrent = !showCurrent"
                        :rules="[requiredRule('Contraseña actual')]" />

                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">NUEVA CONTRASEÑA</v-label>
                    <v-text-field v-model="form.newPassword" :type="showNew ? 'text' : 'password'" variant="outlined"
                        density="comfortable" rounded="lg" class="mb-3"
                        :append-inner-icon="showNew ? 'mdi-eye-off' : 'mdi-eye'"
                        @click:append-inner="showNew = !showNew"
                        :rules="[requiredRule('Nueva contraseña'), passwordRule]" />

                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">CONFIRMAR NUEVA
                        CONTRASEÑA</v-label>
                    <v-text-field v-model="form.confirmPassword" :type="showConfirm ? 'text' : 'password'"
                        variant="outlined" density="comfortable" rounded="lg" class="mb-2"
                        :append-inner-icon="showConfirm ? 'mdi-eye-off' : 'mdi-eye'"
                        @click:append-inner="showConfirm = !showConfirm"
                        :rules="[requiredRule('Confirmación'), confirmPasswordRule]" />

                    <div class="d-flex justify-end ga-3 mt-4">
                        <v-btn v-if="!mandatory" variant="tonal" color="grey" rounded="lg" class="text-none"
                            @click="close">
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
