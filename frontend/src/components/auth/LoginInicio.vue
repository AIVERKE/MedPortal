<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logoDiv from '@/assets/LogoDiv.png'
import logoBS from '@/assets/LogoBS.jpeg'
import logoUmsa from '@/assets/Umsa-logo.svg'
import logoFCPN from '@/assets/EscudoFCPN.png'

import enfermeria from '@/assets/login/enfermeria.jpeg'
import fisioterapia from '@/assets/login/fisioterapia.jpeg'
import medicinaGeneral from '@/assets/login/medicina-general.jpeg'
import medicinaGeneral2 from '@/assets/login/medicina-general2.jpg.jpeg'
import odoontologia from '@/assets/login/odoontologia.jpeg'
import psicologia from '@/assets/login/psicologia.jpeg'
import { APP_NAME } from '@/config/app'
import { userFacingErrorMessage } from '@/utils/networkError'

const carouselImages = [
    enfermeria,
    fisioterapia,
    medicinaGeneral,
    medicinaGeneral2,
    odoontologia,
    psicologia
]

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const navigateAfterLogin = () => {
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect.startsWith('/')) {
        router.push(redirect)
        return
    }
    const rol = authStore.user?.rol
    if (rol === 'DOCTOR') router.push('/doctor/home')
    else if (rol === 'DIRECTOR') router.push('/director/home')
    else router.push('/home')
}

const identity = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const sessionNotice = ref('')

const availableRoles = ref([])
const showRoleSelector = ref(false)
const selectedRole = ref(null)

onMounted(() => {
    if (route.query.sesion === 'expirada') {
        sessionNotice.value = 'Tu sesión expiró. Vuelve a entrar para continuar.'
    }

    if (authStore.token) {
        navigateAfterLogin()
        return
    }

    const savedIdentity = localStorage.getItem('remembered_identity')
    if (savedIdentity) {
        identity.value = savedIdentity
        remember.value = true
    }
})

const handleLogin = async () => {
    if (!identity.value || !password.value) return

    loading.value = true
    errorMessage.value = ''
    try {
        const response = await authStore.login(
            identity.value,
            password.value,
            remember.value,
            selectedRole.value ? selectedRole.value.idRol : null
        )

        if (response?.success) {
            if (response.mustChangePassword) {
                router.push('/administrar-cuenta?cambiarContrasena=1')
            } else {
                navigateAfterLogin()
            }
        } else if (response && response.requireRoleSelection) {
            if (!response.roles || response.roles.length === 0) {
                errorMessage.value = 'El servidor requiere selección de rol pero no se proporcionaron roles válidos.'
                return
            }
            availableRoles.value = response.roles
            showRoleSelector.value = true
            // Si el usuario ya tenía un rol seleccionado pero no era válido, lo limpiamos
            selectedRole.value = null
        } else {
            console.warn('Login response format not recognized:', response)
        }
    } catch (error) {
        console.error('Login failed', error)
        errorMessage.value = userFacingErrorMessage(
            error,
            'Error al iniciar sesión. Por favor, intente de nuevo.',
        )
    } finally {
        loading.value = false
    }
}

const cancelRoleSelection = () => {
    showRoleSelector.value = false
    availableRoles.value = []
    selectedRole.value = null
}
</script>

<template>
    <div class="login-page">
        <v-card class="fill-height rounded-0 overflow-hidden" elevation="0">
            <v-row no-gutters class="fill-height w-100">
                <v-col cols="12" md="6" lg="7" class="d-none d-md-flex bg-primary overflow-hidden position-relative">
                    <v-carousel
                        :show-arrows="false"
                        hide-delimiters
                        cycle
                        height="100%"
                        interval="5000"
                        class="h-100 w-100"
                    >
                        <v-carousel-item
                            v-for="(img, idx) in carouselImages"
                            :key="idx"
                            :src="img"
                            cover
                        ></v-carousel-item>
                    </v-carousel>
                    <div class="fill-height w-100 d-flex flex-column justify-space-between pa-12 overlay-content position-absolute" style="z-index: 2; top: 0; left: 0;">
                        <div class="d-flex align-center gap-3">
                            <img src="@/assets/logo_umsa_without_bg.png" alt="Logo UMSA"
                                style="height: 32px; width: auto; object-fit: contain;" />
                            <span class="text-h5 font-weight-bold text-white">{{ APP_NAME }}</span>
                        </div>

                        <div>
                            <h1 class="text-h3 font-weight-bold text-white mb-6">
                                Tu Salud, <br />Nuestra Prioridad.
                            </h1>
                            <p class="text-h6 text-white opacity-90" style="max-width: 600px; line-height: 1.6;">
                                Accede a tus citas e historial médico de forma segura.
                            </p>
                        </div>

                        <div class="d-flex align-center gap-4 text-white">
                            <div class="d-flex align-center gap-4">
                                <v-img :src="logoDiv" height="52" width="52" contain class="rounded-sm"></v-img>
                                <v-img :src="logoBS" height="52" width="52" contain class="rounded-sm"></v-img>
                                <v-img :src="logoUmsa" height="52" width="52" contain class="rounded-sm"></v-img>
                                <v-img :src="logoFCPN" height="52" width="52" contain class="rounded-sm"></v-img>
                            </div>
                            <v-divider vertical class="mx-2" color="white" thickness="2"></v-divider>
                            <div class="d-flex flex-column">
                                <span class="text-caption font-weight-bold" style="line-height: 1.2;">UMSA</span>
                                <span class="text-caption" style="line-height: 1.2; opacity: 0.8;">BIENESTAR
                                    SOCIAL</span>
                            </div>
                        </div>
                    </div>
                </v-col>

                <v-col cols="12" md="6" lg="5" class="bg-surface d-flex align-center justify-center">
                    <div class="w-100 pa-6 pa-md-16" style="max-width: 550px;">

                        <div class="d-md-none d-flex align-center justify-center gap-2 mb-6 text-primary">
                            <img src="@/assets/logo_umsa_without_bg.png" alt="Logo UMSA"
                                style="height: 38px; width: auto; object-fit: contain;" />
                            <div class="text-h5 font-weight-bold">{{ APP_NAME }}</div>
                        </div>

                        <div class="text-center text-md-left mb-8">
                            <h2 class="text-h4 font-weight-bold text-high-emphasis mb-2">Bienvenido</h2>
                            <p class="text-subtitle-1 text-medium-emphasis">
                                Ingresa tus datos para acceder a tu portal.
                            </p>
                        </div>

                        <v-alert v-if="sessionNotice" type="info" variant="tonal" closable class="mb-6"
                            @click:close="sessionNotice = ''">
                            {{ sessionNotice }}
                        </v-alert>

                        <v-alert v-if="errorMessage" type="error" variant="tonal" closable class="mb-6"
                            @click:close="errorMessage = ''">
                            {{ errorMessage }}
                        </v-alert>

                        <v-form @submit.prevent="handleLogin">
                            <template v-if="!showRoleSelector">
                                <v-label class="mb-2 text-caption text-medium-emphasis font-weight-bold">USUARIO O
                                    CÉDULA DE IDENTIDAD</v-label>
                                <v-text-field v-model="identity" prepend-inner-icon="mdi-account-outline"
                                    placeholder="Usuario o número de documento" variant="outlined" color="primary"
                                    class="mb-4" rounded="lg" hide-details="auto" density="comfortable"
                                    data-tour="login-identity"></v-text-field>

                                <v-label
                                    class="mb-2 text-caption text-medium-emphasis font-weight-bold">CONTRASEÑA</v-label>
                                <v-text-field v-model="password" :type="showPassword ? 'text' : 'password'"
                                    prepend-inner-icon="mdi-lock-outline"
                                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                    @click:append-inner="showPassword = !showPassword" placeholder="••••••••"
                                    variant="outlined" color="primary" class="mb-2" rounded="lg" hide-details="auto"
                                    density="comfortable" data-tour="login-password"></v-text-field>

                                <div class="d-flex align-center justify-space-between mb-6">
                                    <v-checkbox v-model="remember" label="Recordarme" color="primary" hide-details
                                        density="comfortable"></v-checkbox>
                                    <router-link
                                        to="/olvidar-contrasena"
                                        class="text-decoration-none text-primary text-body-2 font-weight-medium"
                                    >¿Olvidaste
                                        tu contraseña?</router-link>
                                </div>

                            </template>

                            <template v-else>
                                <div class="mb-6">
                                    <v-btn variant="text" color="primary" prepend-icon="mdi-arrow-left"
                                        class="mb-4 px-0" @click="cancelRoleSelection">
                                        Cambiar usuario
                                    </v-btn>
                                    <h3 class="text-h6 font-weight-bold mb-2">Selecciona un Rol</h3>
                                    <p class="text-body-2 text-medium-emphasis mb-4">Tienes varios roles asignados, por
                                        favor elige uno para continuar.</p>

                                    <v-select v-model="selectedRole" :items="availableRoles" item-title="nombre"
                                        item-value="idRol" return-object label="Rol de acceso" variant="outlined"
                                        rounded="lg" color="primary" prepend-inner-icon="mdi-account-cog-outline"
                                        placeholder="Seleccione un rol"></v-select>
                                </div>
                            </template>

                            <v-btn type="submit" block color="primary" size="x-large" rounded="lg" elevation="2"
                                class="text-none font-weight-bold mb-6" :loading="loading"
                                :disabled="showRoleSelector && !selectedRole" data-tour="login-submit">
                                <v-icon start :icon="showRoleSelector ? 'mdi-check-circle' : 'mdi-login'"
                                    class="mr-2"></v-icon>
                                {{ showRoleSelector ? 'Confirmar Acceso' : 'Iniciar Sesión' }}
                            </v-btn>

                            <div class="mt-4 text-center w-100">
                                <p class="text-body-2 text-medium-emphasis">
                                    ¿No tienes una cuenta?
                                    <v-btn variant="text" color="primary" class="px-2 font-weight-bold text-none"
                                        @click="$emit('register')">
                                        Registrarme
                                    </v-btn>
                                </p>
                            </div>

                            <div class="d-md-none d-flex flex-column align-center mt-10">
                                <div class="d-flex align-center justify-center gap-4 mb-3">
                                    <v-img :src="logoDiv" height="36" width="36" contain
                                        class="grayscale opacity-80"></v-img>
                                    <v-img :src="logoBS" height="36" width="36" contain
                                        class="grayscale opacity-80"></v-img>
                                    <v-img :src="logoUmsa" height="36" width="36" contain
                                        class="grayscale opacity-80"></v-img>
                                    <v-img :src="logoFCPN" height="36" width="36" contain
                                        class="grayscale opacity-80"></v-img>
                                </div>
                                <span class="text-caption text-medium-emphasis font-weight-bold"
                                    style="font-size: 0.65rem !important;">UMSA -
                                    BIENESTAR
                                    SOCIAL</span>
                            </div>
                        </v-form>
                    </div>
                </v-col>
            </v-row>
        </v-card>
    </div>
</template>

<style scoped>
.login-page {
    height: 100vh !important;
    overflow: hidden;
}

@media (max-width: 960px) {
    .login-page {
        min-height: 100dvh !important;
        height: auto !important;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
}

.overlay-content {
    background-color: rgba(19, 91, 236, 0.50);
}

.gap-2 {
    gap: 8px;
}

.gap-3 {
    gap: 12px;
}

.gap-4 {
    gap: 16px;
}

.grayscale-white {
    filter: brightness(0) invert(1);
    opacity: 0.8;
}

.grayscale {
    filter: grayscale(100%);
}
</style>