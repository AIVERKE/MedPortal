<template>
    <div class="scheduled-appointments-container">
        <div class="d-flex align-center justify-space-between mb-6">
            <h2 class="text-subtitle-1 font-weight-black text-uppercase tracking-wider text-grey-darken-3 d-flex align-center ga-2">
                Mis citas programadas
            </h2>
            <v-chip v-if="citas.length > 0" color="primary" variant="tonal" size="small" class="font-weight-bold">
                {{ citas.length }} activa{{ citas.length > 1 ? 's' : '' }}
            </v-chip>
        </div>

        <v-fade-transition group>
            <div v-if="loading && !citas.length" key="loading" class="d-flex justify-center pa-8">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else-if="citas.length === 0" key="empty" class="empty-state pa-8 text-center">
                <v-icon icon="mdi-calendar-remove" size="48" color="grey-lighten-1" class="mb-3"></v-icon>
                <p class="text-body-2 text-slate-500">No tienes citas programadas próximamente.</p>
            </div>

            <div v-else key="list" class="appointments-list">
                <v-card v-for="cita in citas" :key="cita.id" variant="outlined"
                    class="appointment-card mb-4 pa-4 rounded-xl" hover>
                    <div class="d-flex gap-4">
                        <v-avatar :color="getLightAccentColor(cita.idEspecialidad)" rounded="lg" size="48">
                            <v-icon :icon="getIconForSpec(cita.especialidad?.nombre || '')"
                                :color="getAccentColor(cita.idEspecialidad)"></v-icon>
                        </v-avatar>

                        <div class="flex-grow-1 min-width-0">
                            <div class="d-flex justify-space-between align-start mb-1">
                                <h3 class="text-subtitle-1 font-weight-bold text-slate-900 truncate">
                                    {{ cita.especialidad?.nombre || 'Consulta Médica' }}
                                </h3>
                            </div>

                            <p class="text-body-2 text-slate-500 mb-2 truncate d-flex align-center gap-1">
                                <v-icon icon="mdi-doctor" size="16"></v-icon>
                                {{ formatDoctorName(cita) }}
                            </p>

                            <div class="info-badges mb-4">
                                <div class="info-badge">
                                    <v-icon start icon="mdi-calendar-blank" size="14"></v-icon>
                                    {{ formatDate(cita.fechaCita) }}
                                </div>
                                <div class="info-badge">
                                    <v-icon start icon="mdi-clock-outline" size="14"></v-icon>
                                    {{ formatTime(cita.horaInicioCita) }}
                                </div>
                            </div>

                            <v-btn block color="error" variant="outlined" rounded="lg" size="small"
                                class="text-none font-weight-bold" prepend-icon="mdi-calendar-cancel"
                                :loading="cancellingId === cita.id" @click="confirmCancel(cita.id)">
                                Cancelar Cita
                            </v-btn>
                        </div>
                    </div>
                </v-card>
            </div>
        </v-fade-transition>

        <ModalConfirmación v-model="showConfirmModal" v-model:note="motivoCancelacion" title="Confirmar Cancelación"
            message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer." type="error"
            confirm-text="Sí, Cancelar Cita" cancel-text="No, Mantener" show-note
            note-label="Mensaje para el doctor (opcional)" @confirm="handleCancel"
            @cancel="showConfirmModal = false" />

        <v-alert v-if="citas.length > 0" color="amber-lighten-5" class="mt-6 border-amber-lighten-4 rounded-xl"
            icon="mdi-information-outline" density="compact">
            <p class="text-caption text-amber-darken-4 mb-0">
                Recuerda que puedes cancelar tu cita hasta 24 horas antes sin recargo. Las citas no canceladas a tiempo
                pueden estar sujetas a multas.
            </p>
        </v-alert>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useReservasStore } from '@/stores/reservas'
import { useAuthStore } from '@/stores/auth'
import ModalConfirmación from '@/components/common/ModalConfirmación.vue'

const reservasStore = useReservasStore()
const authStore = useAuthStore()

const emit = defineEmits(['cita-cancelada'])

const loading = ref(false)
const cancellingId = ref(null)
const showConfirmModal = ref(false)
const pendingCancelId = ref(null)
const motivoCancelacion = ref('')

const citas = computed(() => {
    return (reservasStore.reservas || [])
        .filter(r => Number(r.idUsuario) === Number(authStore.user?.idUsuario) && r.estado?.toUpperCase() === 'PENDIENTE')
        .sort((a, b) => {
            const dateA = parseAppointmentDate(a.fechaCita, a.horaInicioCita)
            const dateB = parseAppointmentDate(b.fechaCita, b.horaInicioCita)
            return dateA - dateB
        })
})

const fetchCitas = async () => {
    if (!authStore.user?.idUsuario) return
    loading.value = true
    await reservasStore.fetchReservasProgramadasByUsuario(authStore.user.idUsuario)
    loading.value = false
}

const confirmCancel = (id) => {
    pendingCancelId.value = id
    motivoCancelacion.value = ''
    showConfirmModal.value = true
}

const handleCancel = async () => {
    if (!pendingCancelId.value) return

    const id = pendingCancelId.value
    showConfirmModal.value = false
    cancellingId.value = id

    const success = await reservasStore.deleteReserva(id, motivoCancelacion.value)
    if (success) {
        emit('cita-cancelada')
    }
    cancellingId.value = null
    pendingCancelId.value = null
}

onMounted(() => {
    fetchCitas()
})

watch(() => authStore.user?.idUsuario, (newVal) => {
    if (newVal) fetchCitas()
})

/* =====================================================
   FORMATTERS & HELPERS
   ===================================================== */
const parseAppointmentDate = (dateStr, timeStr) => {
    if (!dateStr) return new Date(0)
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hour, minute] = (timeStr || '00:00').split(':').map(Number)
    return new Date(year, month - 1, day, hour, minute)
}

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTime = (timeStr) => {
    if (!timeStr) return ''
    // Asumiendo formato HH:mm:ss o HH:mm
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const formatDoctorName = (cita) => {
    const nombre = cita.doctor?.nombre || 'Médico Asignado'
    if (nombre === 'Médico Asignado') return nombre
    return nombre.startsWith('Dr.') ? nombre : `Dr. ${nombre}`
}

const getAccentColor = (id) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4', '#10b981']
    return colors[id % colors.length] || colors[0]
}

const getLightAccentColor = (id) => {
    const colors = ['#eef2ff', '#f5f3ff', '#fdf2f8', '#fff1f2', '#ecfeff', '#ecfdf5']
    return colors[id % colors.length] || colors[0]
}

const getIconForSpec = (nombre) => {
    const n = nombre.toLowerCase()
    if (n.includes('medicina')) return 'mdi-stethoscope'
    if (n.includes('pediatra') || n.includes('infantil')) return 'mdi-baby-face-outline'
    if (n.includes('dental') || n.includes('odon')) return 'mdi-tooth-outline'
    if (n.includes('gineco')) return 'mdi-gender-female'
    if (n.includes('enfermeria')) return 'mdi-medical-bag'
    return 'mdi-hospital-box-outline'
}
</script>

<style scoped>
.scheduled-appointments-container {
    width: 100%;
}

.info-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.appointment-card {
    border-color: #e2e8f0 !important;
    background-color: white !important;
    transition: all 0.3s ease;
}

.appointment-card:hover {
    border-color: #6366f1 !important;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1) !important;
}

.empty-state {
    border: 2px dashed #e2e8f0;
    border-radius: 1rem;
}

.info-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1 1 8rem;
    min-width: 0;
    font-size: 0.75rem;
    color: #475569;
    background-color: #f8fafc;
    padding: 6px 10px;
    border-radius: 8px;
    font-weight: 500;
}

.text-slate-500 {
    color: #64748b;
}

.text-slate-900 {
    color: #0f172a;
}

.gap-2 {
    gap: 8px;
}

.gap-4 {
    gap: 16px;
}

.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
