<template>
    <div class="max-width-form mx-auto pb-8">
        <v-overlay v-model="isLoading" class="align-center justify-center" persistent>
            <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
        </v-overlay>

        <!-- Header Section -->
        <header class="d-flex align-center justify-space-between flex-wrap ga-3 mb-8">
            <div>
                <h3 class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">
                    Cuadro de Mando del Director
                </h3>
                <p class="text-subtitle-2 font-weight-medium text-grey-darken-1">
                    Bienvenido de nuevo, {{ userDisplayName }}
                </p>
            </div>
            <div class="d-flex align-center ga-2">
                <v-chip color="primary" variant="tonal" class="font-weight-bold px-4" size="large" rounded="lg">
                    <v-icon start size="small">mdi-calendar-today</v-icon>
                    Hoy: {{ todayDate }}
                </v-chip>
                <v-btn icon variant="tonal" color="primary" rounded="lg" to="/configuracion">
                    <v-icon size="22">mdi-cog-outline</v-icon>
                </v-btn>
            </div>
        </header>

        <!-- Summary Cards -->
        <v-row class="mb-6">
            <v-col v-for="(stat, i) in statistics" :key="i" cols="12" sm="6" lg="4">
                <v-card class="fill-height rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>
                    <div class="section-badge" :class="stat.badge"></div>
                    <v-card-text class="d-flex flex-column justify-space-between pa-6">
                        <div class="d-flex justify-space-between align-start w-100 mb-4">
                            <div>
                                <div class="text-caption font-weight-black text-uppercase text-grey-lighten-1 mb-1"
                                    style="letter-spacing: 0.05em;">{{ stat.title }}</div>
                                <div class="text-h4 font-weight-bold text-grey-darken-4">{{ stat.value }}</div>
                                <div class="text-body-2 text-grey-darken-1 mt-1">{{ stat.label }}</div>
                            </div>
                            <v-avatar :color="stat.avatarColor" size="40" rounded="lg">
                                <v-icon :color="stat.iconColor">{{ stat.icon }}</v-icon>
                            </v-avatar>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Main Content Layout -->
        <v-row>
            <!-- Doctors Main Section -->
            <v-col cols="12" lg="8">
                <v-card class="rounded-xl fill-height overflow-hidden shadow-premium premium-card position-relative" border>
                    <div class="section-badge primary"></div>
                    <v-card-item class="pb-1 pt-4">
                        <template #prepend>
                            <v-avatar color="primary-lighten-4" size="40">
                                <v-icon color="primary">mdi-doctor</v-icon>
                            </v-avatar>
                        </template>
                        <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">
                            Vista general de médicos
                        </v-card-title>
                        <v-card-subtitle class="text-grey-darken-1">
                            Listado actualizado del personal clínico
                        </v-card-subtitle>
                        <template #append>
                            <v-btn color="primary" rounded="lg" variant="flat" prepend-icon="mdi-plus"
                                class="text-none font-weight-bold">
                                Añadir Médico
                            </v-btn>
                        </template>
                    </v-card-item>

                    <v-table class="bg-transparent">
                        <thead>
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-grey-lighten-1 text-uppercase pl-6 py-4">
                                    Nombre
                                </th>
                                <th class="text-left text-caption font-weight-bold text-grey-lighten-1 text-uppercase py-4">
                                    Especialidad
                                </th>
                                <th class="text-left text-caption font-weight-bold text-grey-lighten-1 text-uppercase pr-6 py-4">
                                    Posta
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="doctor in doctors" :key="doctor.id"
                                class="hover-bg-surface-light transition-colors">
                                <td class="pl-6 py-4">
                                    <div class="d-flex align-center ga-4">
                                        <v-avatar size="44" border>
                                            <v-img :src="doctor.avatar || defaultAvatar" cover></v-img>
                                        </v-avatar>
                                        <div>
                                            <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">{{
                                                doctor.name }}</p>
                                            <p class="text-caption text-grey-darken-1 mb-0">Colegiado #{{ doctor.id }}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-4">
                                    <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">
                                        {{ doctor.specialty }}
                                    </v-chip>
                                </td>
                                <td class="pr-6 py-4">
                                    <span class="text-body-2 text-grey-darken-1 font-weight-medium text-uppercase">{{
                                        doctor.posta }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>

                    <v-divider></v-divider>
                    <div class="pa-4 d-flex justify-center">
                        <v-btn variant="tonal" color="primary" rounded="lg" class="text-none font-weight-bold" to="/doctores">
                            Ver todos los médicos
                        </v-btn>
                    </div>
                </v-card>
            </v-col>

            <!-- Right Panels Sidebar -->
            <v-col cols="12" lg="4">
                <v-card class="rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>
                    <div class="section-badge success"></div>
                    <v-card-item class="pb-1 pt-4">
                        <template #prepend>
                            <v-avatar color="success-lighten-4" size="40">
                                <v-icon color="success">mdi-medical-bag</v-icon>
                            </v-avatar>
                        </template>
                        <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">
                            Especialidades activas
                        </v-card-title>
                        <template #append>
                            <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-black">
                                {{ keySpecialties.length }}
                            </v-chip>
                        </template>
                    </v-card-item>

                    <v-card-text class="pa-4">
                        <div class="d-flex flex-column ga-2">
                            <div v-for="(spec, i) in keySpecialties" :key="i"
                                class="d-flex align-center justify-space-between pa-3 rounded-lg specialty-item transition-all cursor-pointer hover-bg-surface-light">
                                <div class="d-flex align-center ga-3">
                                    <v-avatar color="primary-lighten-4" size="36" rounded="lg">
                                        <v-icon :icon="spec.icon" size="18" color="primary"></v-icon>
                                    </v-avatar>
                                    <div class="d-flex flex-column">
                                        <span class="text-body-2 font-weight-bold text-grey-darken-4">{{ spec.name
                                            }}</span>
                                        <span class="text-caption text-grey-darken-1">{{ spec.count }} Médicos</span>
                                    </div>
                                </div>
                                <v-icon icon="mdi-chevron-right" size="small" color="grey"></v-icon>
                            </div>
                        </div>

                        <v-btn variant="tonal" block color="primary" size="large"
                            class="mt-6 text-none font-weight-bold" rounded="lg"
                            to="/especialidades-medicas" append-icon="mdi-arrow-right">
                            Gestionar Especialidades
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDoctoresStore } from '@/stores/doctores'
import { usePostasStore } from '@/stores/postas'
import { useEspecialidadStore } from '@/stores/especialidad'

const authStore = useAuthStore()
const doctoresStore = useDoctoresStore()
const postasStore = usePostasStore()
const especialidadStore = useEspecialidadStore()

onMounted(async () => {
    await Promise.allSettled([
        doctoresStore.fetchDoctores(),
        postasStore.fetchPostas(),
        especialidadStore.fetchEspecialidades()
    ])
})

const statistics = computed(() => [
    {
        title: 'Médicos Activos',
        value: doctoresStore.doctores.length,
        icon: 'mdi-doctor',
        badge: 'primary',
        avatarColor: 'primary-lighten-4',
        iconColor: 'primary',
        label: 'Certificados'
    },
    {
        title: 'Postas Médicas',
        value: postasStore.postas.length,
        icon: 'mdi-hospital-building',
        badge: 'info',
        avatarColor: 'info-lighten-4',
        iconColor: 'info',
        label: 'Operativas'
    },
    {
        title: 'Especialidades',
        value: especialidadStore.especialidades.length,
        icon: 'mdi-medical-bag',
        badge: 'success',
        avatarColor: 'success-lighten-4',
        iconColor: 'success',
        label: 'Disponibles'
    }
])

const doctors = computed(() => {
    return doctoresStore.doctores.slice(0, 10).map(d => ({
        id: d.id,
        name: d.nombre,
        specialty: d.especialidad,
        posta: d.posta || 'Posta Central',
        avatar: d.imagen
    }))
})

const keySpecialties = computed(() => {
    const counts = {}
    doctoresStore.doctores.forEach(d => {
        counts[d.especialidad] = (counts[d.especialidad] || 0) + 1
    })

    const iconMap = {
        'Cardiología': 'mdi-heart-pulse',
        'Pediatría': 'mdi-baby-face-outline',
        'Medicina General': 'mdi-stethoscope',
        'Psiquiatría': 'mdi-head-snowflake-outline',
        'Odontología': 'mdi-tooth-outline',
        'Psicología': 'mdi-brain',
        'Enfermería': 'mdi-face-mask-outline',
        'Fisioterapia y Kinesiología': 'mdi-human-handsdown',
        'Ginecología y Obstetricia': 'mdi-human-pregnant'
    }

    return especialidadStore.especialidades.map(e => ({
        name: e.nombre,
        icon: iconMap[e.nombre] || 'mdi-medical-bag',
        count: counts[e.nombre] || 0
    }))
})

const todayDate = computed(() => {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date())
})

const defaultAvatar = 'https://via.placeholder.com/150'

const userDisplayName = computed(() => {
    const u = authStore.user
    if (!u) return 'Usuario'
    return `${u.nombres} ${u.primerApellido || ''}`.trim()
})

const isLoading = computed({
    get: () => doctoresStore.loading || postasStore.loading || especialidadStore.loading,
    set: () => {}
})
</script>

<style scoped>
.max-width-form {
    max-width: 1200px;
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

.section-badge.success {
    background-color: rgb(var(--v-theme-success));
}

.section-badge.info {
    background-color: rgb(var(--v-theme-info));
}

.section-badge.warning {
    background-color: rgb(var(--v-theme-warning));
}

.hover-bg-surface-light:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.transition-colors {
    transition: background-color 0.2s ease;
}

.specialty-item {
    border: 1px solid #e2e8f0;
}

.specialty-item:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
}

.cursor-pointer {
    cursor: pointer;
}

.fill-height {
    height: 100%;
}

:deep(.v-table th) {
    height: 56px !important;
    white-space: nowrap;
}
</style>
