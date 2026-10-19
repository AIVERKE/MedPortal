<template>
    <div class="historial-layout">
            <!-- Header Section -->
            <header class="d-flex align-center justify-space-between flex-wrap ga-3 mb-8">
                <div>
                    <h3 class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">
                        Mi Historial
                    </h3>
                    <p class="text-subtitle-2 font-weight-medium text-grey-darken-1">
                        Gestiona y consulta tu trayectoria médica
                    </p>
                </div>
            </header>

            <!-- Control Panel -->
            <v-card
                class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>
                <div class="section-badge primary"></div>
                <v-card-text class="pa-4">
                <v-row class="ma-0 align-center">
                    <v-col cols="12" md="8" class="pa-2">
                        <v-text-field v-model="searchQuery" placeholder="Buscar médico, especialidad..." variant="outlined"
                            density="comfortable" prepend-inner-icon="mdi-magnify" hide-details rounded="lg"
                            class="search-field"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4" class="pa-2">
                        <v-select v-model="statusFilter" :items="statusOptions" item-title="label" item-value="value"
                            variant="outlined" density="comfortable" hide-details rounded="lg" class="search-field"
                            prepend-inner-icon="mdi-filter-variant"></v-select>
                    </v-col>
                </v-row>
                </v-card-text>
            </v-card>

            <!-- Loading State -->
            <div v-if="loading && !filteredReservas.length"
                class="d-flex flex-column align-center justify-center py-16">
                <v-progress-circular indeterminate color="primary" size="64" width="6"></v-progress-circular>
                <p class="mt-6 text-grey-darken-1 font-weight-bold tracking-widest text-uppercase">Cargando historial...</p>
            </div>

            <!-- Empty State -->
            <v-fade-transition hide-on-leave>
                <v-card v-if="!loading && filteredReservas.length === 0"
                    class="d-flex flex-column align-center justify-center py-16 rounded-xl shadow-premium premium-card position-relative" border>
                    <div class="section-badge primary"></div>
                    <v-icon icon="mdi-calendar-blank-outline" size="64" class="text-grey-lighten-1 mb-4"></v-icon>
                    <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-1">No se encontraron
                        registros</h3>
                    <p class="text-body-2 text-grey-darken-1 text-center px-4">Prueba con otros filtros o términos de
                        búsqueda.</p>
                </v-card>
            </v-fade-transition>

            <!-- Reservation Cards List -->
            <div v-if="filteredReservas.length > 0" class="reservation-grid d-flex flex-column ga-4">
                <v-card v-for="(reserva, index) in filteredReservas" :key="reserva.id"
                    class="reserva-card rounded-xl overflow-hidden shadow-premium premium-card position-relative" border
                    :style="{ animationDelay: `${(index % 10) * 0.1}s` }">
                    <div class="section-badge" :style="{ background: getAccentColor(reserva.idEspecialidad) }"></div>
                    <v-row no-gutters class="align-center flex-nowrap cursor-pointer"
                        @click="reserva.expanded = !reserva.expanded">
                        <!-- Date Section (Compact) -->
                        <div
                            class="pa-3 px-sm-4 d-flex flex-column align-center justify-center border-right text-center min-w-70">
                            <span class="text-caption font-weight-black text-uppercase text-grey-lighten-1 leading-tight">{{
                                getMonthShort(reserva.fechaCita) }}</span>
                            <span class="text-h5 font-weight-black text-grey-darken-3 leading-tight">{{
                                getDay(reserva.fechaCita) }}</span>
                            <span class="text-caption font-weight-bold text-grey-darken-1 mt-n1">{{
                                getYearShort(reserva.fechaCita) }}</span>
                        </div>

                        <!-- Main Content Content -->
                        <v-col class="pa-3 pa-sm-4 flex-grow-1 overflow-hidden">
                            <div
                                class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-3">
                                <div class="flex-grow-1 overflow-hidden">
                                    <div class="mb-1">
                                        <v-chip :color="getStatusColor(reserva.estado)"
                                            class="font-weight-black px-2 text-uppercase text-xxs" size="x-small"
                                            variant="tonal">
                                            {{ reserva.estado }}
                                        </v-chip>
                                    </div>
                                    <div class="d-flex align-center ga-2 mb-0.5 flex-wrap">
                                        <h4
                                            class="text-subtitle-1 font-weight-bold text-grey-darken-4 leading-tight truncate">
                                            <v-icon :icon="getIconForSpec(reserva.especialidad?.nombre || '')" size="18"
                                                class="mr-1" :color="getAccentColor(reserva.idEspecialidad)"></v-icon>
                                            {{ reserva.especialidad?.nombre || 'Consulta General' }}
                                        </h4>
                                    </div>
                                    <div
                                        class="d-flex align-center ga-3 text-caption font-weight-medium text-grey-darken-1">
                                        <span class="d-flex align-center">
                                            <v-icon icon="mdi-clock-outline" size="14" class="mr-1"></v-icon>
                                            {{ formatTime(reserva.horaInicioCita) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Request Info -->
                                <div
                                    class="d-flex flex-sm-column align-center align-sm-end justify-space-between ga-2 w-100 w-sm-auto">
                                    <span class="text-xxs text-grey-lighten-1 font-weight-bold order-first order-sm-last">
                                        Solicitado: {{ formatDateRequest(reserva.createdAt) }}
                                    </span>
                                </div>
                            </div>
                        </v-col>

                        <!-- Action Toggle -->
                        <div class="pa-2 d-flex align-center justify-center" style="width: 44px; flex-shrink: 0;">
                            <v-btn icon variant="text" size="small" color="grey"
                                @click.stop="reserva.expanded = !reserva.expanded">
                                <v-icon :icon="reserva.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"></v-icon>
                            </v-btn>
                        </div>
                    </v-row>

                    <!-- Expanded Details -->
                    <v-expand-transition>
                        <div v-if="reserva.expanded">
                            <v-divider class="border-opacity-25"></v-divider>
                            <div class="expanded-content">
                                <div class="d-flex align-center ga-4 mb-6">
                                    <v-avatar size="52" class="doctor-avatar-compact" color="slate-50">
                                        <v-img :src="getImageUrl(reserva.doctor?.imagen)" alt="Médico" cover
                                            @error="handleImgError">
                                            <template v-slot:placeholder>
                                                <v-icon icon="mdi-account" color="slate-300" size="28"></v-icon>
                                            </template>
                                        </v-img>
                                    </v-avatar>
                                    <div class="min-width-0">
                                        <h5 class="text-subtitle-1 font-weight-bold text-grey-darken-3 mb-1">
                                            {{ reserva.doctor?.nombre || 'Médico por asignar' }}
                                        </h5>
                                        <div class="d-flex align-center ga-2">
                                            <v-icon icon="mdi-hospital-building" size="16" color="grey"></v-icon>
                                            <span class="text-body-2 text-grey-darken-1">
                                                {{ reserva.posta?.nombre || 'Posta Central' }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <v-row>
                                    <v-col v-if="reserva.motivoCancelacion" cols="12">
                                        <div class="detail-section">
                                            <div class="d-flex align-center ga-2 mb-3">
                                                <v-icon color="error" size="18"
                                                    icon="mdi-alert-circle-outline"></v-icon>
                                                <span class="text-body-2 font-weight-bold text-grey-darken-3">Cancelación</span>
                                            </div>
                                            <div class="detail-box detail-box-error">
                                                <p class="text-body-2 mb-0">{{ reserva.motivoCancelacion }}</p>
                                                <p v-if="reserva.fechaCancelacion" class="text-caption text-medium-emphasis mt-2 mb-0">
                                                    {{ formatDateFull(reserva.fechaCancelacion) }}
                                                </p>
                                            </div>
                                        </div>
                                    </v-col>

                                    <v-col v-if="reserva.observaciones" cols="12" :md="reserva.consulta ? 6 : 12">
                                        <div class="detail-section">
                                            <div class="d-flex align-center ga-2 mb-3">
                                                <v-icon color="primary" size="18" icon="mdi-note-text-outline"></v-icon>
                                                <span class="text-body-2 font-weight-bold text-grey-darken-3">Observaciones</span>
                                            </div>
                                            <p class="detail-box mb-0">
                                                {{ reserva.observaciones }}
                                            </p>
                                        </div>
                                    </v-col>

                                    <v-col v-if="reserva.consulta" cols="12" :md="reserva.observaciones ? 6 : 12">
                                        <div class="detail-section">
                                            <div class="d-flex align-center ga-2 mb-3">
                                                <v-icon color="secondary" size="18" icon="mdi-pulse"></v-icon>
                                                <span class="text-body-2 font-weight-bold text-grey-darken-3">Consulta</span>
                                            </div>
                                            <div class="vitals-row">
                                                <div class="vital-mini" v-if="reserva.consulta.peso">
                                                    <span class="label">Peso</span>
                                                    <span class="val">{{ reserva.consulta.peso }} kg</span>
                                                </div>
                                                <div class="vital-mini" v-if="reserva.consulta.talla">
                                                    <span class="label">Talla</span>
                                                    <span class="val">{{ reserva.consulta.talla }} cm</span>
                                                </div>
                                                <div class="vital-mini" v-if="reserva.consulta.presion">
                                                    <span class="label">P.A.</span>
                                                    <span class="val">{{ reserva.consulta.presion }}</span>
                                                </div>
                                                <div class="vital-mini" v-if="reserva.consulta.temperatura">
                                                    <span class="label">Temp.</span>
                                                    <span class="val">{{ reserva.consulta.temperatura }} °C</span>
                                                </div>
                                                <div class="vital-mini" v-if="reserva.consulta.frecuencia">
                                                    <span class="label">F.C.</span>
                                                    <span class="val">{{ reserva.consulta.frecuencia }}</span>
                                                </div>
                                            </div>
                                            <div v-if="reserva.consulta.motivo" class="detail-box mt-4">
                                                <span class="detail-box-label">Motivo</span>
                                                <p class="text-body-2 mb-0">{{ reserva.consulta.motivo }}</p>
                                            </div>
                                            <div v-if="reserva.consulta.sintomas" class="detail-box mt-3">
                                                <span class="detail-box-label">Síntomas</span>
                                                <p class="text-body-2 mb-0">{{ reserva.consulta.sintomas }}</p>
                                            </div>
                                        </div>
                                    </v-col>
                                </v-row>
                            </div>
                        </div>
                    </v-expand-transition>
                </v-card>
            </div>

            <!-- Enhanced Pagination -->
            <footer v-if="filteredReservasTotal.length > 0"
                class="mt-10 py-6 border-t d-flex flex-column flex-md-row align-center justify-space-between gap-6 slide-up delay-3">
                <div class="d-flex align-center gap-4">
                    <span class="text-body-2 text-slate-500 font-weight-medium">Por página:</span>
                    <v-select :items="[10, 20, 50]" v-model="itemsPerPage" variant="outlined" density="compact"
                        hide-details rounded="lg" class="page-select-compact"></v-select>
                </div>

                <div class="d-flex align-center gap-4 flex-column flex-sm-row mt-2 mt-md-0">
                    <span class="text-body-2 text-slate-400 font-weight-medium">
                        Visualizando <strong>{{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage *
                            itemsPerPage, filteredReservasTotal.length) }}</strong> de <strong>{{
                                filteredReservasTotal.length }}</strong> resultados
                    </span>
                    <v-pagination v-model="currentPage" :length="totalPages" total-visible="5" size="small"
                        color="primary" density="comfortable" rounded="lg"></v-pagination>
                </div>
            </footer>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReservasStore } from '@/stores/reservas'
import { useAuthStore } from '@/stores/auth'
import defaultUserImg from '@/assets/usuario_default.webp'

const reservasStore = useReservasStore()
const authStore = useAuthStore()

const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('TODOS')
const itemsPerPage = ref(10)

const statusOptions = [
    { label: 'Todos los estados', value: 'TODOS' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Atraso', value: 'ATRASO' },
    { label: 'Atendido / Completado', value: 'ATENDIDO' },
    { label: 'Cancelado', value: 'CANCELADO' },
    { label: 'Inasistencia', value: 'INASISTENCIA' }
]

const currentPage = ref(1)

const totalPages = computed(() => {
    return Math.ceil(filteredReservasTotal.value.length / itemsPerPage.value) || 1
})

const filteredReservasTotal = computed(() => {
    let list = [...reservasStore.reservas]
        .filter(r => Number(r.idUsuario) === Number(authStore.user?.idUsuario))

    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        list = list.filter(r =>
            (r.doctor?.nombre || '').toLowerCase().includes(query) ||
            (r.especialidad?.nombre || '').toLowerCase().includes(query)
        )
    }

    // Status filter
    if (statusFilter.value !== 'TODOS') {
        list = list.filter(r => {
            const status = r.estado?.toUpperCase()
            if (statusFilter.value === 'PENDIENTE') return status === 'PENDIENTE'
            if (statusFilter.value === 'ATRASO') return status === 'ATRASO'
            if (statusFilter.value === 'ATENDIDO') return ['COMPLETADA', 'ATENDIDO', 'FINALIZADA', 'A-FUERA-HORARIO'].includes(status)
            if (statusFilter.value === 'CANCELADO') return ['CANCELADA', 'CANCELADO', 'RECHAZADA'].includes(status)
            if (statusFilter.value === 'INASISTENCIA') return status === 'INASISTENCIA' || status === 'ABANDONO'
            return false
        })
    }

    // Sort by request date (createdAt) desc
    return list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
        return dateB - dateA
    })
})

const filteredReservas = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredReservasTotal.value.slice(start, end)
})

const fetchHistory = async () => {
    if (!authStore.user?.idUsuario) return
    loading.value = true
    try {
        await reservasStore.fetchReservasByUsuario(authStore.user.idUsuario)
    } finally {
        loading.value = false
    }
}

const resetFilters = () => {
    searchQuery.value = ''
    statusFilter.value = 'TODOS'
}

onMounted(() => {
    fetchHistory()
})

const getImageUrl = (url) => {
    if (!url) return defaultUserImg
    return url
}

const handleImgError = (e) => {
    e.target.src = defaultUserImg
}

/* =====================================================
   ESTILOS DINÁMICOS & HELPERS
   ===================================================== */
const getAccentColor = (id) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4', '#10b981']
    return colors[id % colors.length]
}

const getLightAccentColor = (id) => {
    const colors = ['#eef2ff', '#f5f3ff', '#fdf2f8', '#fff1f2', '#ecfeff', '#ecfdf5']
    return colors[id % colors.length]
}

const getMonthShort = (dateStr) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
}

const getYearShort = (dateStr) => {
    if (!dateStr) return ''
    return dateStr.split('-')[0]
}

const getDay = (dateStr) => {
    if (!dateStr) return ''
    return dateStr.split('-')[2]
}

const formatDateRequest = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const formatDateFull = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const getStatusColor = (status) => {
    const s = status?.toUpperCase()
    if (s === 'PENDIENTE') return 'amber-darken-2'
    if (s === 'ATRASO' || s === 'ABANDONO') return 'error'
    if (s === 'COMPLETADA' || s === 'ATENDIDO' || s === 'A-FUERA-HORARIO') return 'emerald-darken-1'
    if (s === 'CANCELADA' || s === 'CANCELADO' || s === 'RECHAZADA') return 'rose-darken-1'
    if (s === 'INASISTENCIA') return 'blue-grey-darken-1'
    return 'slate-400'
}

const getIconForSpec = (nombre) => {
    const n = (nombre || '').toLowerCase()
    if (n.includes('medicina')) return 'mdi-stethoscope'
    if (n.includes('pediatra') || n.includes('infantil')) return 'mdi-baby-face-outline'
    if (n.includes('dental') || n.includes('odon')) return 'mdi-tooth-outline'
    if (n.includes('gineco')) return 'mdi-gender-female'
    if (n.includes('enfermeria')) return 'mdi-medical-bag'
    if (n.includes('psico')) return 'mdi-brain'
    if (n.includes('cardio')) return 'mdi-heart-pulse'
    if (n.includes('oftalmo')) return 'mdi-eye-outline'
    if (n.includes('trauma')) return 'mdi-bone'
    return 'mdi-hospital-box-outline'
}
</script>

<style scoped>
.historial-layout {
    min-height: 100%;
}

.shadow-premium {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12) !important;
}

.premium-card {
    background-color: white;
}

.section-badge {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
}

.section-badge.primary {
    background-color: rgb(var(--v-theme-primary));
}

.reserva-card {
    transition: box-shadow 0.2s ease;
}

.reserva-card:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.18) !important;
}

.min-w-70 {
    min-width: 70px;
}

.border-right {
    border-right: 1px solid #e2e8f0;
}

.text-xxs {
    font-size: 0.65rem !important;
}

.doctor-avatar-compact {
    border: 1.5px solid #e2e8f0 !important;
    flex-shrink: 0;
}

.expanded-content {
    padding: 1.5rem 1.5rem 1.75rem;
}

.min-width-0 {
    min-width: 0;
}

.detail-section {
    height: 100%;
}

.detail-box {
    padding: 14px 16px;
    border-radius: 12px;
    background: #f8fafc;
    color: #475569;
    line-height: 1.55;
}

.detail-box-error {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #be123c;
}

.detail-box-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 6px;
}

.page-select-compact {
    width: 80px;
}

.vitals-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr));
    gap: 10px;
}

.vital-mini {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    background: #f8fafc;
    border-radius: 12px;
}

.vital-mini .label {
    font-size: 0.7rem;
    color: #94a3b8;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.vital-mini .val {
    font-size: 0.95rem;
    font-weight: 800;
    color: #334155;
    line-height: 1.2;
}

.cursor-pointer {
    cursor: pointer;
}
</style>
