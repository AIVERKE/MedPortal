<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useConfiguracionReservasStore } from '@/stores/configuracion_reservas'

const configStore = useConfiguracionReservasStore()
const currentTime = ref(new Date())
let timerInterval = null

// Lógica de tiempo
onMounted(async () => {
    if (!configStore.currentConfig) {
        await configStore.fetchConfig()
    }

    timerInterval = setInterval(() => {
        currentTime.value = new Date()
    }, 1000)
})

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
})

const config = computed(() => configStore.currentConfig)

const isOutsideRange = computed(() => {
    if (!config.value) return false

    const now = currentTime.value
    const [startH, startM] = config.value.hora_inicio_reserva.split(':').map(Number)
    const [endH, endM] = config.value.hora_fin_reserva.split(':').map(Number)

    const startTime = new Date(now)
    startTime.setHours(startH, startM, 0, 0)

    const endTime = new Date(now)
    endTime.setHours(endH, endM, 0, 0)

    return now < startTime || now > endTime
})

const countdown = computed(() => {
    if (!config.value || !isOutsideRange.value) return ''

    const now = currentTime.value
    const [startH, startM] = config.value.hora_inicio_reserva.split(':').map(Number)

    const nextStartTime = new Date(now)
    nextStartTime.setHours(startH, startM, 0, 0)

    // Si ya pasó la hora de inicio hoy, la próxima es mañana
    if (now > nextStartTime) {
        nextStartTime.setDate(nextStartTime.getDate() + 1)
    }

    const diff = nextStartTime - now

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const reservationRangeText = computed(() => {
    if (!config.value) return ''
    return `${config.value.hora_inicio_reserva} - ${config.value.hora_fin_reserva}`
})
</script>

<template>
    <Transition name="slide-fade">
        <div v-if="isOutsideRange" class="banner-wrapper">
            <div class="banner-container">
                <div class="banner-content">
                    <v-icon color="white" class="mr-3 banner-icon">mdi-clock-alert-outline</v-icon>
                    <div class="banner-text">
                        <span class="text-subtitle-2 font-weight-bold d-block d-sm-inline">Estás fuera del rango de
                            reservas.</span>
                        <span class="text-caption d-none d-md-inline ml-1 opacity-90">No puedes realizar reservas ahora pero
                            puedes consultar horarios.</span>
                        <div class="mt-1 mt-sm-0 d-flex align-center flex-wrap gap-x-4">
                            <span class="text-caption font-weight-medium">
                                <v-icon size="14" class="mr-1">mdi-calendar-clock</v-icon>
                                Horario: {{ reservationRangeText }}
                            </span>
                            <span class="text-caption font-weight-bold countdown-box">
                                <v-icon size="14" class="mr-1" color="amber-lighten-3">mdi-timer-outline</v-icon>
                                Disponible en: {{ countdown }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="banner-spacer" aria-hidden="true"></div>
        </div>
    </Transition>
</template>

<style scoped>
.banner-wrapper {
    width: 100%;
}

.banner-spacer {
    height: 72px;
}

.banner-container {
    position: fixed;
    top: 75px;
    left: 0;
    right: 0;
    z-index: var(--layout-content-overlay-z, 1000);
    padding: 10px 24px;
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    border-radius: 0;
}

.banner-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    color: white;
}

.banner-text {
    flex: 1;
}

.countdown-box {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 8px;
    border-radius: 6px;
    color: #fbbf24;
}

.gap-x-4 {
    column-gap: 16px;
}

.slide-fade-enter-active {
    transition: all 0.4s ease-out;
}

.slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateY(-20px);
    opacity: 0;
}

@media (max-width: 600px) {
    .banner-container {
        top: 0;
        padding: 10px 16px;
    }

    .banner-spacer {
        height: 64px;
    }

    .banner-icon {
        display: none;
    }
}
</style>
