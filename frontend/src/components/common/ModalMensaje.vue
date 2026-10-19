
<template>
    <v-dialog v-model="internalValue" persistent max-width="450">
        <v-card class="rounded-xl overflow-hidden shadow-premium">
            <!-- Accent top bar based on type -->
            <div class="accent-bar" :class="typeClass"></div>

            <v-card-text class="pa-8 text-center">
                <!-- Icon section -->
                <div class="icon-container mb-6" :class="typeClass">
                    <v-icon :icon="iconName" size="48" :color="iconColor"></v-icon>
                </div>

                <!-- Title -->
                <h2 class="text-h5 font-weight-black mb-2 text-slate-800">
                    {{ title }}
                </h2>

                <!-- Message -->
                <p class="text-body-1 text-slate-600" :class="type === 'error' ? 'mb-3' : 'mb-6'">
                    {{ message }}
                </p>

                <p v-if="type === 'error' && displayTimestamp" class="text-caption text-medium-emphasis mb-6">
                    {{ displayTimestamp }}
                </p>

                <!-- Hint section (optional) -->
                <v-sheet v-if="hint" color="amber-lighten-5" rounded="lg" class="pa-3 mb-8 d-flex align-center ga-3">
                    <v-icon color="amber-darken-2" size="20">mdi-lightbulb-on-outline</v-icon>
                    <span class="text-caption text-left text-amber-darken-4 font-weight-medium">
                        {{ hint }}
                    </span>
                </v-sheet>

                <!-- Action Button -->
                <v-btn block size="x-large" :color="buttonColor" rounded="lg" elevation="2"
                    class="text-none font-weight-bold"
                    :data-tour="confirmTourAttr || undefined"
                    @click="$emit('confirm')">
                    {{ buttonText }}
                </v-btn>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { formatErrorTimestamp } from '@/utils/errorTimestamp'

const props = defineProps({
    modelValue: Boolean,
    title: {
        type: String,
        default: 'Aviso'
    },
    message: String,
    type: {
        type: String,
        default: 'info'
    },
    buttonText: {
        type: String,
        default: 'Aceptar'
    },
    hint: {
        type: String,
        default: ''
    },
    /** ISO timestamp from API when available (for log correlation) */
    timestamp: {
        type: String,
        default: ''
    },
    confirmTourAttr: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const capturedTimestamp = ref('')

watch(
    () => [props.modelValue, props.type, props.timestamp],
    ([open, type, stamp]) => {
        if (open && type === 'error') {
            capturedTimestamp.value = stamp || new Date().toISOString()
        }
        if (!open) {
            capturedTimestamp.value = ''
        }
    },
)

const displayTimestamp = computed(() => {
    if (props.type !== 'error' || !capturedTimestamp.value) return ''
    return `${formatErrorTimestamp(capturedTimestamp.value)}`
})

const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const typeClass = computed(() => `type-${props.type || 'info'}`)

const iconName = computed(() => {
    switch (props.type) {
        case 'success': return 'mdi-check-circle-outline'
        case 'error': return 'mdi-alert-circle-outline'
        case 'warning': return 'mdi-alert-outline'
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
</style>
