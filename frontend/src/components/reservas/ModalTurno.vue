<!-- src/components/Reservas/ModalTurno.vue -->
<template>
    <v-dialog v-model="internalValue" max-width="500" persistent scrollable class="rounded-xl">
        <v-card class="rounded-xl overflow-hidden">
            <v-card-title class="pa-6 border-b d-flex justify-space-between align-start bg-grey-lighten-4">
                <div class="d-flex align-center gap-2 flex-wrap flex-grow-1">
                    <div class="d-flex align-center gap-2">
                        <v-icon color="primary" size="28">mdi-calendar-clock</v-icon>
                        <span class="text-h6 font-weight-black text-grey-darken-3 text-no-wrap">Programar Turno</span>
                    </div>
                    <v-chip color="secondary" size="small" variant="tonal" class="font-weight-bold">
                        {{ doctor?.especialidad }}
                    </v-chip>
                </div>

                <v-btn icon="mdi-close" variant="text" color="grey-darken-1" @click="close" class="mt-n1"></v-btn>
            </v-card-title>

            <v-card-text class="pa-8" ref="scrollContainer" @scroll="handleScroll">
                <div class="text-center mb-10">

                    <div class="text-subtitle-1 text-grey-darken-2 line-height-relaxed">
                        Estás programando una cita con el Dr.
                        <span class="font-weight-bold text-primary d-block text-h5 mt-1">{{ doctor?.nombre }}</span>
                    </div>
                    <p class="text-body-2 text-grey-darken-1 mt-6">
                        Por favor, selecciona el turno de tu preferencia para continuar.
                    </p>
                </div>

                <v-alert
                    v-if="telefonoContacto"
                    type="info"
                    variant="tonal"
                    rounded="xl"
                    class="mb-6 text-left"
                    border="start"
                >
                    <div class="text-body-2">
                        Coordina una cita personalizada fuera de los cupos del sistema.
                    </div>
                    <div class="d-flex flex-wrap ga-2 mt-2">
                        <v-btn
                            :href="`tel:${telefonoContacto}`"
                            color="primary"
                            variant="flat"
                            size="small"
                            rounded="lg"
                            class="text-none font-weight-bold"
                            prepend-icon="mdi-phone"
                            @click.stop
                        >
                            {{ telefonoContacto }}
                        </v-btn>
                    </div>
                </v-alert>

                <div class="scroll-container-wrapper relative">
                    <v-item-group v-model="selectedAsignacion" mandatory>
                        <v-row :justify="doctor?.asignaciones?.length === 1 ? 'center' : 'start'">
                            <v-col v-for="asig in doctor?.asignaciones" :key="asig.id"
                                :cols="doctor?.asignaciones?.length === 1 ? '10' : '12'"
                                :sm="doctor?.asignaciones?.length === 1 ? '8' : '6'">
                                <v-item v-slot="{ isSelected, toggle }" :value="asig">
                                    <v-card :color="isSelected ? 'indigo-lighten-5' : 'white'"
                                        :class="['pa-6 text-center cursor-pointer turn-card elevation-0 border-2', { 'border-primary': isSelected, 'border-grey-lighten-3': !isSelected }]"
                                        rounded="xl" @click="toggle"
                                        data-tour="reserva-turno-card">
                                        <v-avatar :color="isSelected ? 'primary' : 'grey-lighten-4'" size="56"
                                            class="mb-4 transition-all">
                                            <v-icon
                                                :color="isSelected ? 'white' : (asig.turno === 'Mañana' ? 'amber-darken-2' : 'indigo-darken-1')"
                                                size="32">
                                                {{ asig.turno === 'Mañana' ? 'mdi-weather-sunny' : 'mdi-weather-night'
                                                }}
                                            </v-icon>
                                        </v-avatar>
                                        <div class="font-weight-black text-h6 mb-1"
                                            :class="isSelected ? 'text-primary' : 'text-grey-darken-3'">
                                            {{ asig.turno }}
                                        </div>
                                        <div class="text-subtitle-2 font-weight-medium"
                                            :class="isSelected ? 'text-indigo-darken-2' : 'text-grey-darken-1'">
                                            {{ asig.horaInicio.substring(0, 5) }} - {{ asig.horaFin.substring(0, 5) }}
                                        </div>

                                        <v-icon v-if="isSelected" color="primary" size="24"
                                            class="selection-check">mdi-check-circle</v-icon>
                                    </v-card>
                                </v-item>
                            </v-col>
                        </v-row>
                    </v-item-group>

                    <!-- Scroll Indicator Hint -->
                    <v-fade-transition>
                        <div v-if="showScrollHint"
                            class="scroll-hint d-flex align-center justify-center py-4 bg-gradient-fade">
                            <div
                                class="d-flex align-center gap-1 bg-white px-4 py-1.5 rounded-pill shadow-sm border border-grey-lighten-4 transition-all hover-translate">
                                <v-icon size="16" color="primary" class="bounce-y">mdi-chevron-double-down</v-icon>
                                <span
                                    class="text-caption font-weight-bold text-grey-darken-1 text-uppercase tracking-wider">Desliza
                                    para ver más</span>
                            </div>
                        </div>
                    </v-fade-transition>
                </div>
            </v-card-text>

            <v-card-actions class="pa-6 pt-0 flex-column gap-3">
                <v-btn color="primary" block size="large" rounded="xl" class="text-none font-weight-bold py-4"
                    elevation="4" data-tour="reserva-turno-confirm" @click="confirm">
                    Confirmar Turno
                </v-btn>
                <v-btn variant="text" block color="grey-darken-1" class="text-none font-weight-bold" @click="close">
                    Cancelar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
    modelValue: Boolean,
    doctor: Object
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const selectedAsignacion = ref(null)
const showScrollHint = ref(false)
const scrollContainer = ref(null)

const telefonoContacto = computed(() => {
    const tel = (props.doctor?.telefonoEmergencia || '').toString().trim()
    return tel || null
})

// Reset seleccion al abrir con un nuevo doctor
watch(() => props.doctor, (newDoc) => {
    if (newDoc && newDoc.asignaciones && newDoc.asignaciones.length > 0) {
        selectedAsignacion.value = newDoc.asignaciones[0]
        // Check if we should show the hint after DOM updates
        setTimeout(checkScroll, 100)
    }
}, { immediate: true })

const checkScroll = () => {
    if (!scrollContainer.value) return
    const el = scrollContainer.value.$el || scrollContainer.value
    const isScrollable = el.scrollHeight > el.clientHeight
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10
    showScrollHint.value = isScrollable && !isAtBottom
}

const handleScroll = () => {
    checkScroll()
}

const close = () => {
    internalValue.value = false
}

const confirm = () => {
    emit('confirm', selectedAsignacion.value)
    close()
}
</script>

<style scoped>
.turn-card {
    position: relative;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.turn-card:hover {
    transform: translateY(-4px);
    background-color: #EEF2FF !important;
}

.border-primary {
    border-color: #6366F1 !important;
}

.selection-check {
    position: absolute;
    top: 12px;
    right: 12px;
}

.line-height-relaxed {
    line-height: 1.6;
}

.transition-all {
    transition: all 0.3s ease;
}

.border-2 {
    border-width: 2px !important;
}

.gap-2 {
    gap: 8px;
}

.gap-3 {
    gap: 12px;
}

.scroll-container-wrapper {
    position: relative;
    padding-bottom: 20px;
}

.scroll-hint {
    position: sticky;
    bottom: -32px;
    /* Pull it into the bottom of the card-text area */
    left: 0;
    right: 0;
    z-index: 10;
    pointer-events: none;
    /* Don't block clicking cards behind it */
}

.bg-gradient-fade {
    background: linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 100%);
}

.bounce-y {
    animation: bounceY 2s infinite;
}

@keyframes bounceY {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(4px);
    }

    60% {
        transform: translateY(2px);
    }
}

.hover-translate:hover {
    transform: translateY(-2px);
}

.relative {
    position: relative;
}
</style>
