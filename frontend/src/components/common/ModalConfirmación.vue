<template>
    <v-dialog v-model="internalValue" persistent max-width="480">
        <v-card class="rounded-xl overflow-hidden shadow-premium">
            <!-- Accent top bar based on type -->
            <div class="accent-bar" :class="typeClass"></div>

            <v-card-text class="pa-6 pa-sm-8 text-center">
                <!-- Icon section -->
                <div class="icon-container mb-6" :class="typeClass">
                    <v-icon :icon="iconName" size="48" :color="iconColor"></v-icon>
                </div>

                <!-- Title -->
                <h2 class="text-h5 font-weight-black mb-2 text-slate-800">
                    {{ title }}
                </h2>

                <!-- Message -->
                <p class="text-body-1 text-slate-600" :class="showNote ? 'mb-4' : 'mb-8'">
                    {{ message }}
                </p>

                <v-textarea
                    v-if="showNote"
                    :model-value="note"
                    :label="noteLabel"
                    placeholder="Opcional"
                    variant="outlined"
                    rounded="lg"
                    rows="3"
                    auto-grow
                    maxlength="1000"
                    counter
                    hide-details="auto"
                    class="mb-6 text-left"
                    @update:model-value="$emit('update:note', $event)"
                />

                <!-- Action Buttons -->
                <div class="actions-container">
                    <v-btn size="large" variant="tonal" color="grey-darken-1" rounded="lg"
                        class="text-none font-weight-bold action-btn cancel-btn"
                        :disabled="loading"
                        @click="$emit('cancel')">
                        {{ cancelText }}
                    </v-btn>
                    <v-btn size="large" :color="buttonColor" rounded="lg" elevation="2"
                        class="text-none font-weight-bold action-btn confirm-btn"
                        :data-tour="confirmTourAttr || undefined"
                        :loading="loading"
                        :disabled="loading || disableConfirm"
                        @click="$emit('confirm')">
                        {{ confirmText }}
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup>
// ... (script content remains the same, but let's re-verify)
import { computed } from 'vue'

const props = defineProps({
    modelValue: Boolean,
    title: {
        type: String,
        default: 'Confirmación'
    },
    message: String,
    type: {
        type: String,
        default: 'warning'
    },
    confirmText: {
        type: String,
        default: 'Confirmar'
    },
    cancelText: {
        type: String,
        default: 'Cancelar'
    },
    loading: {
        type: Boolean,
        default: false
    },
    confirmTourAttr: {
        type: String,
        default: null
    },
    disableConfirm: {
        type: Boolean,
        default: false
    },
    showNote: {
        type: Boolean,
        default: false
    },
    note: {
        type: String,
        default: ''
    },
    noteLabel: {
        type: String,
        default: 'Mensaje (opcional)'
    }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'update:note'])

const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const typeClass = computed(() => `type-${props.type || 'warning'}`)

const iconName = computed(() => {
    switch (props.type) {
        case 'success': return 'mdi-check-circle-outline'
        case 'error': return 'mdi-alert-circle-outline'
        case 'warning': return 'mdi-help-circle-outline'
        default: return 'mdi-information-outline'
    }
})

const iconColor = computed(() => {
    switch (props.type) {
        case 'success': return '#10b981'
        case 'error': return '#ef4444'
        case 'warning': return '#f59e0b'
        default: return '#6366f1'
    }
})

const buttonColor = computed(() => {
    switch (props.type) {
        case 'success': return 'success'
        case 'error': return 'error'
        case 'warning': return 'warning'
        default: return 'primary'
    }
})
</script>

<style scoped>
.shadow-premium {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}

.accent-bar {
    height: 6px;
    width: 100%;
}

.type-success.accent-bar {
    background-color: #10b981;
}

.type-error.accent-bar {
    background-color: #ef4444;
}

.type-warning.accent-bar {
    background-color: #f59e0b;
}

.type-info.accent-bar {
    background-color: #6366f1;
}

.icon-container {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    margin-right: auto;
}

.type-success.icon-container {
    background-color: #ecfdf5;
}

.type-error.icon-container {
    background-color: #fef2f2;
}

.type-warning.icon-container {
    background-color: #fffbeb;
}

.type-info.icon-container {
    background-color: #eef2ff;
}

.text-slate-800 {
    color: #1e293b;
}

.text-slate-600 {
    color: #475569;
}

.actions-container {
    display: flex;
    flex-direction: row;
    gap: 12px;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
}

.action-btn {
    flex: 1 1 160px;
    min-width: 0;
    max-width: 100%;
    white-space: normal !important;
    height: auto !important;
    min-height: 48px;
    padding-top: 12px !important;
    padding-bottom: 12px !important;
}

.action-btn :deep(.v-btn__content) {
    white-space: normal !important;
    text-align: center;
    line-height: 1.3;
    overflow: visible;
}

@media (max-width: 400px) {
    .actions-container {
        flex-direction: column-reverse;
    }

    .action-btn {
        flex: 1 1 auto;
        width: 100%;
    }
}
</style>
