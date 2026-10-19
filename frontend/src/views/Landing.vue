<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import logoUmsa from '@/assets/logo_umsa_without_bg.png'
import { APP_NAME, APP_TAGLINE, getAppPageTitle } from '@/config/app'
import { useAuthStore } from '@/stores/auth'
import { useEspecialidadStore } from '@/stores/especialidad'

const router = useRouter()
const authStore = useAuthStore()
const especialidadStore = useEspecialidadStore()

const PATIENT_ROLES = ['ESTUDIANTE', 'DOCENTE', 'CONSULTOR', 'ADMINISTRATIVO']

const especialidadesLoading = ref(false)
const especialidadesError = ref(null)

const navLinks = [
    { label: 'Inicio', href: '#', active: true },
    { label: 'Especialidades', href: '#especialidades' },
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Beneficios', href: '#beneficios' },
    { label: 'Contacto', href: '#contacto' },
]

const heroChips = [
    { icon: 'mdi-school', label: 'UMSA' },
    { icon: 'mdi-heart', label: 'Bienestar Social' },
    { icon: 'mdi-calendar-check', label: 'Citas online' },
]

const beneficios = [
    {
        icon: 'mdi-calendar-month',
        title: 'Reserva fácil',
        text: 'Agenda tus consultas en pocos clics, viendo la disponibilidad en tiempo real.',
    },
    {
        icon: 'mdi-file-document-outline',
        title: 'Historial clínico',
        text: 'Accede a tus diagnósticos y recetas anteriores de forma segura y confidencial.',
    },
    {
        icon: 'mdi-account-circle-outline',
        title: 'Cuenta unificada',
        text: 'Un solo perfil para todos los servicios médicos de la División de Bienestar Social.',
    },
    {
        icon: 'mdi-shield-heart-outline',
        title: 'Consejos de salud',
        text: 'Recibe notificaciones y recomendaciones personalizadas para cuidar tu bienestar.',
    },
]

const pasos = [
    {
        num: 1,
        title: 'Regístrate con tu CI',
        text: 'Verifica tu identidad como estudiante activo de la UMSA para crear tu cuenta.',
    },
    {
        num: 2,
        title: 'Elige especialidad y horario',
        text: 'Selecciona el área que necesitas y encuentra un turno que se ajuste a tus clases.',
    },
    {
        num: 3,
        title: 'Asiste a tu posta UMSA',
        text: 'Preséntate puntualmente en el consultorio indicado en tu confirmación.',
    },
]

const especialidadesDisponibles = computed(() =>
    especialidadStore.especialidades.filter((e) => e.activo !== false),
)

const getIconForEspecialidad = (nombre) => {
    const n = (nombre || '').toLowerCase()
    if (n.includes('medicina')) return 'mdi-stethoscope'
    if (n.includes('pediatra') || n.includes('infantil')) return 'mdi-baby-face-outline'
    if (n.includes('dental') || n.includes('odon')) return 'mdi-tooth-outline'
    if (n.includes('gineco')) return 'mdi-gender-female'
    if (n.includes('enfermeria')) return 'mdi-medical-bag'
    if (n.includes('psico')) return 'mdi-brain'
    if (n.includes('cardio')) return 'mdi-heart-pulse'
    if (n.includes('fisio') || n.includes('kinesio')) return 'mdi-human-handsdown'
    if (n.includes('oftalmo')) return 'mdi-eye-outline'
    if (n.includes('trauma')) return 'mdi-bone'
    return 'mdi-hospital-box-outline'
}

const isLoggedIn = () => {
    const token = authStore.token || localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) return false
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.exp >= Math.floor(Date.now() / 1000)
    } catch {
        return false
    }
}

const isPatient = () => {
    const user = authStore.user
    return user && PATIENT_ROLES.includes(user.rol)
}

const goLogin = () => router.push('/login')

const goRegister = () => router.push({ path: '/login', query: { register: '1' } })

const goReservar = () => {
    if (isLoggedIn() && isPatient()) {
        router.push('/reservar')
        return
    }
    router.push({ path: '/login', query: { redirect: '/reservar' } })
}

const loadEspecialidades = async () => {
    especialidadesLoading.value = true
    especialidadesError.value = null
    try {
        await especialidadStore.fetchEspecialidadesPublic()
    } catch {
        especialidadesError.value = 'No se pudieron cargar las especialidades.'
    } finally {
        especialidadesLoading.value = false
    }
}

onMounted(() => {
    document.documentElement.lang = 'es'
    document.title = getAppPageTitle(APP_TAGLINE)
    loadEspecialidades()
})

onUnmounted(() => {
    document.title = APP_NAME
})
</script>

<template>
    <v-app class="landing-app">
        <v-app-bar color="surface" elevation="1" sticky>
            <v-container class="d-flex align-center py-0" fluid style="max-width: 1280px;">
                <div class="d-flex align-center ga-3">
                    <v-img :src="logoUmsa" alt="UMSA Logo" width="40" height="40" class="rounded-lg" cover />
                    <span class="text-h6 font-weight-bold text-primary">{{ APP_NAME }}</span>
                </div>

                <v-spacer />

                <div class="d-none d-md-flex align-center ga-1">
                    <v-btn
                        v-for="link in navLinks"
                        :key="link.label"
                        :href="link.href"
                        variant="text"
                        :color="link.active ? 'primary' : undefined"
                        :class="{ 'font-weight-bold': link.active }"
                        class="text-none"
                    >
                        {{ link.label }}
                    </v-btn>
                </div>

                <v-spacer class="d-none d-md-flex" />

                <div class="d-flex align-center ga-2">
                    <v-btn variant="text" color="primary" class="d-none d-md-inline-flex text-none" @click="goRegister">
                        Registrarme
                    </v-btn>
                    <v-btn color="primary" variant="flat" rounded="lg" class="text-none" @click="goLogin">
                        Iniciar sesión
                    </v-btn>
                </div>
            </v-container>
        </v-app-bar>

        <v-main class="landing-main">
            <!-- Hero -->
            <v-container class="py-12 py-md-16" style="max-width: 1280px;">
                <v-row align="center">
                    <v-col cols="12" lg="6">
                        <h1 class="text-h3 text-md-h2 font-weight-black text-grey-darken-4 mb-4 hero-title">
                            Tu salud universitaria, en un solo portal
                        </h1>
                        <p class="text-h6 text-grey-darken-1 mb-8 hero-subtitle">
                            Reserva citas médicas, consulta tu historial y gestiona tu cuenta de forma simple y segura.
                        </p>
                        <div class="d-flex flex-wrap ga-3 mb-6">
                            <v-btn color="primary" size="large" rounded="lg" class="text-none px-8" @click="goReservar">
                                Reservar una cita
                            </v-btn>
                            <v-btn color="primary" variant="tonal" size="large" rounded="lg" class="text-none px-8"
                                @click="goRegister">
                                Crear cuenta
                            </v-btn>
                        </div>
                        <div class="d-flex flex-wrap ga-2">
                            <v-chip v-for="chip in heroChips" :key="chip.label" variant="tonal" color="grey">
                                <v-icon start size="16">{{ chip.icon }}</v-icon>
                                {{ chip.label }}
                            </v-chip>
                        </div>
                    </v-col>

                    <v-col cols="12" lg="6" class="d-none d-lg-block">
                        <div class="hero-visual position-relative">
                            <div class="hero-blur" />

                            <v-card class="hero-card hero-card-primary elevation-8 rounded-xl" border>
                                <div class="card-accent card-accent-primary" />
                                <v-card-text class="pa-6">
                                    <div class="d-flex justify-space-between align-start mb-4">
                                        <v-avatar color="primary-lighten-4" size="48" rounded="lg">
                                            <v-icon color="primary">mdi-calendar</v-icon>
                                        </v-avatar>
                                        <v-chip color="success" variant="tonal" size="small" class="font-weight-bold">
                                            Confirmada
                                        </v-chip>
                                    </div>
                                    <h3 class="text-h6 font-weight-bold text-grey-darken-4 mb-1">Próxima Cita</h3>
                                    <p class="text-body-2 text-grey mb-4">Medicina General - Dr. Pérez</p>
                                    <div class="d-flex align-center ga-2 text-body-2 text-grey-darken-2">
                                        <v-icon size="18">mdi-clock-outline</v-icon>
                                        <span>10:30 AM · Hoy</span>
                                    </div>
                                </v-card-text>
                            </v-card>

                            <v-card class="hero-card hero-card-secondary elevation-4 rounded-xl" border>
                                <div class="card-accent card-accent-success" />
                                <v-card-text class="pa-6">
                                    <div class="d-flex justify-space-between align-center mb-3">
                                        <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-3">Estado de Salud</h4>
                                        <v-icon color="success">mdi-check-circle</v-icon>
                                    </div>
                                    <div class="d-flex justify-space-between text-caption text-grey mb-1">
                                        <span>Perfil completado</span>
                                        <span>100%</span>
                                    </div>
                                    <v-progress-linear model-value="100" color="success" rounded height="8" />
                                </v-card-text>
                            </v-card>
                        </div>
                    </v-col>
                </v-row>
            </v-container>

            <!-- Beneficios -->
            <v-container id="beneficios" class="landing-section py-12" style="max-width: 1280px;">
                <div class="text-center mb-10 mx-auto" style="max-width: 640px;">
                    <h2 class="text-h4 font-weight-black text-grey-darken-4 mb-3">
                        Todo lo que necesitas para tu bienestar
                    </h2>
                    <p class="text-body-1 text-grey-darken-1">
                        Un ecosistema digital diseñado para simplificar tu acceso a la salud en la universidad.
                    </p>
                </div>
                <v-row>
                    <v-col v-for="item in beneficios" :key="item.title" cols="12" sm="6" lg="3">
                        <v-card class="landing-card fill-height elevation-2 rounded-xl" border>
                            <div class="card-accent card-accent-primary" />
                            <v-card-text class="pa-6">
                                <v-avatar color="primary-lighten-4" size="48" rounded="lg" class="mb-6">
                                    <v-icon color="primary">{{ item.icon }}</v-icon>
                                </v-avatar>
                                <h3 class="text-h6 font-weight-bold text-grey-darken-4 mb-2">{{ item.title }}</h3>
                                <p class="text-body-2 text-grey-darken-1">{{ item.text }}</p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>

            <!-- Cómo funciona -->
            <v-container class="pb-12" style="max-width: 1280px;">
                <v-card id="como-funciona" class="landing-section rounded-xl elevation-2 pa-8 pa-md-12" border>
                    <div class="text-center mb-10">
                        <h2 class="text-h4 font-weight-black text-grey-darken-4 mb-2">¿Cómo funciona?</h2>
                        <p class="text-body-1 text-grey-darken-1">
                            Tres simples pasos para acceder a tu atención médica
                        </p>
                    </div>
                    <v-row justify="center" class="position-relative">
                        <div class="steps-connector d-none d-md-block" />
                        <v-col v-for="paso in pasos" :key="paso.num" cols="12" md="4" class="text-center">
                            <v-avatar color="primary" size="64" class="mb-6 elevation-2">
                                <span class="text-h5 font-weight-bold text-white">{{ paso.num }}</span>
                            </v-avatar>
                            <h3 class="text-h6 font-weight-bold text-grey-darken-4 mb-2">{{ paso.title }}</h3>
                            <p class="text-body-2 text-grey-darken-1 mx-auto" style="max-width: 280px;">{{ paso.text }}</p>
                        </v-col>
                    </v-row>
                </v-card>
            </v-container>

            <!-- Especialidades -->
            <v-container id="especialidades" class="landing-section py-12" style="max-width: 1280px;">
                <div class="d-flex flex-column flex-md-row justify-space-between align-md-end ga-4 mb-8">
                    <div>
                        <h2 class="text-h4 font-weight-black text-grey-darken-4 mb-2">Especialidades Disponibles</h2>
                        <p class="text-body-1 text-grey-darken-1">
                            Atención profesional en diversas áreas para la comunidad estudiantil.
                        </p>
                    </div>
                    <v-btn variant="text" color="primary" class="text-none align-self-start align-self-md-auto"
                        append-icon="mdi-arrow-right" @click="goReservar">
                        Ver todas
                    </v-btn>
                </div>

                <div v-if="especialidadesLoading" class="text-center py-12">
                    <v-progress-circular indeterminate color="primary" size="48" />
                    <p class="text-body-1 text-grey mt-4">Cargando especialidades...</p>
                </div>
                <div v-else-if="especialidadesError" class="text-center py-12 text-grey-darken-1">
                    {{ especialidadesError }}
                </div>
                <div v-else-if="especialidadesDisponibles.length === 0" class="text-center py-12 text-grey-darken-1">
                    No hay especialidades disponibles en este momento.
                </div>
                <v-row v-else>
                    <v-col
                        v-for="especialidad in especialidadesDisponibles"
                        :key="especialidad.id"
                        cols="12"
                        sm="6"
                        md="4"
                        lg="3"
                        xl="2"
                    >
                        <v-card class="landing-card fill-height elevation-2 rounded-xl d-flex flex-column" border>
                            <v-card-text class="pa-6 flex-grow-1 d-flex flex-column">
                                <v-avatar color="primary-lighten-4" size="48" rounded="lg" class="mb-4">
                                    <v-icon color="primary">{{ getIconForEspecialidad(especialidad.nombre) }}</v-icon>
                                </v-avatar>
                                <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-2">
                                    {{ especialidad.nombre }}
                                </h3>
                                <p class="text-body-2 text-grey-darken-1 flex-grow-1">
                                    {{ especialidad.descripcion || 'Atención profesional para la comunidad universitaria.' }}
                                </p>
                                <div class="d-flex justify-space-between align-center mt-4">
                                    <v-chip size="small" variant="tonal" color="grey">
                                        <v-icon start size="14">mdi-clock-outline</v-icon>
                                        ~{{ especialidad.tiempoCitaPorDefecto || 30 }} min
                                    </v-chip>
                                    <v-btn variant="text" color="primary" size="small" class="text-none font-weight-bold"
                                        @click="goLogin">
                                        Continuar
                                    </v-btn>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>

            <!-- CTA -->
            <v-container class="pb-16" style="max-width: 960px;">
                <v-card class="cta-card rounded-xl elevation-8 pa-8 pa-md-12 text-center position-relative overflow-hidden"
                    border>
                    <div class="card-accent card-accent-primary" />
                    <div class="cta-blur cta-blur-right" />
                    <div class="cta-blur cta-blur-left" />
                    <div class="position-relative" style="z-index: 1;">
                        <h2 class="text-h4 font-weight-black text-grey-darken-4 mb-4">Empieza a cuidar tu salud hoy</h2>
                        <p class="text-h6 text-grey-darken-1 mb-8 mx-auto" style="max-width: 560px;">
                            Únete a los miles de estudiantes que ya gestionan sus citas médicas de forma rápida y
                            sencilla con {{ APP_NAME }}.
                        </p>
                        <div class="d-flex flex-column flex-sm-row justify-center ga-3">
                            <v-btn color="primary" size="large" rounded="lg" class="text-none px-8" @click="goRegister">
                                Registrarme ahora
                            </v-btn>
                            <v-btn color="primary" variant="tonal" size="large" rounded="lg" class="text-none px-8"
                                @click="goLogin">
                                Iniciar sesión
                            </v-btn>
                        </div>
                    </div>
                </v-card>
            </v-container>
        </v-main>

        <!-- Footer -->
        <v-footer id="contacto" class="landing-section landing-footer border-t pt-8 pb-8">
            <v-container style="max-width: 1280px;">
                <div class="d-flex flex-column flex-md-row justify-space-between align-center ga-6 w-100">
                    <div class="text-center text-md-start">
                        <div class="text-h6 font-weight-bold text-grey-darken-2 mb-1">{{ APP_NAME }}</div>
                        <p class="text-caption text-grey-darken-1 mb-0">
                            © 2026 Universidad Mayor de San Andrés · División de Bienestar Social. Todos los derechos
                            reservados.
                        </p>
                    </div>
                    <div class="d-flex flex-wrap justify-center ga-4">
                        <v-btn variant="text" size="small" class="text-none text-grey-darken-1" href="#">Privacidad</v-btn>
                        <v-btn variant="text" size="small" class="text-none text-grey-darken-1" href="#">Términos de Uso</v-btn>
                        <v-btn variant="text" size="small" class="text-none text-grey-darken-1" href="#">Contacto Support</v-btn>
                        <v-btn variant="text" size="small" class="text-none text-grey-darken-1" @click="goLogin">
                            Portal Académico
                        </v-btn>
                    </div>
                </div>
            </v-container>
        </v-footer>
    </v-app>
</template>

<style scoped>
.landing-app {
    background-color: #F8FAFC;
}

.landing-main {
    background-color: #F8FAFC;
}

.landing-section {
    scroll-margin-top: 88px;
}

.hero-title {
    line-height: 1.15;
    letter-spacing: -0.03em;
}

.hero-subtitle {
    line-height: 1.6;
    max-width: 560px;
}

.hero-visual {
    height: 500px;
}

.hero-blur {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 75%;
    height: 75%;
    background: rgba(99, 102, 241, 0.12);
    border-radius: 9999px;
    filter: blur(48px);
    z-index: 0;
}

.hero-card {
    position: absolute;
    z-index: 1;
    transition: transform 0.3s ease;
}

.hero-card:hover {
    transform: translateY(-8px);
}

.hero-card-primary {
    top: 40px;
    right: 40px;
    width: 320px;
}

.hero-card-secondary {
    left: 40px;
    bottom: 80px;
    width: 288px;
}

.card-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    border-radius: 12px 12px 0 0;
}

.card-accent-primary {
    background: rgb(var(--v-theme-primary));
}

.card-accent-success {
    background: rgb(var(--v-theme-success));
}

.landing-card {
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.3s ease;
}

.landing-card:hover {
    box-shadow: 0 20px 50px -12px rgba(30, 41, 59, 0.1) !important;
}

.steps-connector {
    position: absolute;
    top: 32px;
    left: 15%;
    right: 15%;
    height: 2px;
    background: #e2e8f0;
    z-index: 0;
}

.cta-card {
    background: white;
}

.cta-blur {
    position: absolute;
    width: 128px;
    height: 128px;
    border-radius: 9999px;
    filter: blur(32px);
    z-index: 0;
}

.cta-blur-right {
    top: -32px;
    right: -32px;
    background: rgba(99, 102, 241, 0.15);
}

.cta-blur-left {
    bottom: -32px;
    left: -32px;
    background: rgba(59, 130, 246, 0.12);
}

.landing-footer {
    background-color: #f5f2fe;
}
</style>
