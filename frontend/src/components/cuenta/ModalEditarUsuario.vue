<script setup>
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
    modelValue: Boolean,
    username: {
        type: String,
        default: '',
    },
})

const emit = defineEmits(['update:modelValue', 'submit'])
const authStore = useAuthStore()

const form = ref({ username: '' })
const formRef = ref(null)
const checking = ref(false)
const available = ref(true)
const availabilityMessage = ref('')
const suggestions = ref([])

let debounceTimer = null
let checkSeq = 0

const requiredRule = (v) => !!String(v || '').trim() || 'Usuario es requerido'
const lengthRule = (v) => (String(v || '').trim().length >= 3) || 'Mínimo 3 caracteres'
const maxLengthRule = (v) => (String(v || '').trim().length <= 50) || 'Máximo 50 caracteres'
const availableRule = () => {
    if (checking.value) return true
    if (available.value === false) return availabilityMessage.value || 'Ese nombre de usuario ya está en uso.'
    return true
}

const currentUsername = computed(() => (props.username || '').trim())
const trimmedUsername = computed(() => form.value.username.trim())
const hasChanged = computed(() => trimmedUsername.value !== currentUsername.value)
const canSubmit = computed(() => hasChanged.value && !checking.value && available.value === true)

const close = () => emit('update:modelValue', false)

const resetState = () => {
    clearTimeout(debounceTimer)
    checking.value = false
    available.value = true
    availabilityMessage.value = ''
    suggestions.value = []
}

const applySuggestion = (value) => {
    form.value.username = value
    available.value = true
    availabilityMessage.value = ''
    suggestions.value = []
    formRef.value?.validate?.()
}

const checkAvailability = async (value) => {
    const seq = ++checkSeq
    checking.value = true
    try {
        const result = await authStore.checkUsername(value)
        if (seq !== checkSeq) return
        available.value = !!result.available
        availabilityMessage.value = result.message || (result.available ? '' : 'Ese nombre de usuario ya está en uso.')
        suggestions.value = Array.isArray(result.suggestions) ? result.suggestions : []
    } catch (err) {
        if (seq !== checkSeq) return
        available.value = null
        availabilityMessage.value = err.message || 'No se pudo verificar el usuario'
        suggestions.value = []
    } finally {
        if (seq === checkSeq) checking.value = false
        formRef.value?.validate?.()
    }
}

watch(() => props.modelValue, (open) => {
    if (open) {
        form.value.username = props.username || ''
        resetState()
        formRef.value?.resetValidation?.()
    }
})

watch(() => form.value.username, (value) => {
    if (!props.modelValue) return

    clearTimeout(debounceTimer)
    const trimmed = String(value || '').trim()

    if (trimmed === currentUsername.value) {
        checking.value = false
        available.value = true
        availabilityMessage.value = ''
        suggestions.value = []
        return
    }

    if (trimmed.length < 3 || trimmed.length > 50) {
        checking.value = false
        available.value = null
        availabilityMessage.value = ''
        suggestions.value = []
        return
    }

    checking.value = true
    debounceTimer = setTimeout(() => checkAvailability(trimmed), 400)
})

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid || !canSubmit.value) return
    emit('submit', trimmedUsername.value)
}
</script>

<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="480" persistent>
        <v-card class="rounded-xl overflow-hidden shadow-premium">
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1">
                    <v-icon start class="ms-4">mdi-account-key</v-icon>
                    <div class="text-h6 font-weight-bold flex-grow-1 ms-2">Editar usuario</div>
                    <v-btn icon="mdi-close" variant="text" @click="close" class="me-2" />
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6">
                <v-form ref="formRef" @submit.prevent="handleSubmit">
                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">NOMBRE DE USUARIO</v-label>
                    <v-text-field v-model="form.username" variant="outlined" density="comfortable" rounded="lg"
                        :rules="[requiredRule, lengthRule, maxLengthRule, availableRule]"
                        :loading="checking" autocomplete="username"
                        :hint="hasChanged && available === true && !checking ? 'Este usuario está disponible' : ''"
                        persistent-hint />

                    <div v-if="suggestions.length" class="mt-3">
                        <p class="text-caption text-medium-emphasis mb-2">
                            Ese nombre ya está en uso. Puedes usar una de estas opciones:
                        </p>
                        <div class="d-flex flex-wrap ga-2">
                            <v-chip v-for="option in suggestions" :key="option" color="primary" variant="tonal"
                                label clickable class="font-weight-medium" @click="applySuggestion(option)">
                                {{ option }}
                            </v-chip>
                        </div>
                    </div>

                    <div class="d-flex justify-end ga-3 mt-4">
                        <v-btn variant="tonal" color="grey" rounded="lg" class="text-none" @click="close">
                            Cancelar
                        </v-btn>
                        <v-btn type="submit" color="primary" variant="flat" rounded="lg"
                            class="text-none font-weight-bold" :disabled="!canSubmit" :loading="checking">
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
