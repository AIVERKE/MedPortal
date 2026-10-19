<!-- 
 Create by: Jesus Reynaldo Perez Benavides 
 phone: +591 73030203
 mail: jperezbenavides@gmail.com
 -->
<script setup>
import { ref, computed, onMounted, onUnmounted, provide, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useTutorialStore } from '@/stores/tutorial'
import { useFormulariosStore } from '@/stores/formularios'
import { useDisplay } from 'vuetify'
import BannerReservaFueraRango from '@/components/reservas/BannerReservaFueraRango.vue'
import NotificationPopup from '@/components/notifications/NotificationPopup.vue'
import NotificationBell from '@/components/notifications/NotificationBell.vue'
import logoUmsa from '@/assets/logo_umsa_without_bg.png'
import ModalConfirmacion from '@/components/common/ModalConfirmación.vue'
import PersonaAvatar from '@/components/common/PersonaAvatar.vue'
import { APP_NAME } from '@/config/app'

const SIDEBAR_WIDTH = 280

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const tutorialStore = useTutorialStore()
const { mobile } = useDisplay()
const drawer = ref(!mobile.value)
const showLogoutConfirm = ref(false)
let pollInterval = null

provide('appDrawer', drawer)
provide('appDrawerWidth', SIDEBAR_WIDTH)

function closeDrawerForTutorial() {
  if (mobile.value) drawer.value = false
}

watch(
  () => tutorialStore.active,
  (active) => {
    if (active) {
      if (!tutorialStore.forceDrawerOpen) closeDrawerForTutorial()
      return
    }
    closeDrawerForTutorial()
  },
)

watch(
  () => tutorialStore.forceDrawerOpen,
  (open) => {
    if (open) {
      drawer.value = true
      return
    }
    if (tutorialStore.active) closeDrawerForTutorial()
  },
)

watch(drawer, (open) => {
  if (!open) return
  if (!tutorialStore.active || !mobile.value) return
  if (tutorialStore.forceDrawerOpen) return
  drawer.value = false
})

let lockedScrollY = 0

function setMobileDrawerScrollLock(locked) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const { body } = document
  if (locked) {
    lockedScrollY = window.scrollY || window.pageYOffset || 0
    root.classList.add('mobile-drawer-open')
    body.classList.add('mobile-drawer-open')
    body.style.top = `-${lockedScrollY}px`
    return
  }
  root.classList.remove('mobile-drawer-open')
  body.classList.remove('mobile-drawer-open')
  body.style.top = ''
  window.scrollTo(0, lockedScrollY)
}

watch(
  [drawer, mobile],
  ([open, isMobile]) => {
    setMobileDrawerScrollLock(Boolean(open && isMobile))
  },
  { immediate: true },
)

const role = computed(() => authStore.user?.rol)
const isSuper = computed(() => role.value === 'SUPERUSUARIO')
const isDirector = computed(() => role.value === 'DIRECTOR')
const isDoctor = computed(() => role.value === 'DOCTOR')
const isPatient = computed(() => ['ESTUDIANTE', 'DOCENTE', 'CONSULTOR', 'ADMINISTRATIVO'].includes(role.value))
const showConfigMenu = computed(() => isSuper.value || isDirector.value)
const tieneFotoPerfil = computed(() => Boolean(authStore.user?.foto))
const showNotifications = computed(() => isSuper.value || isPatient.value || isDoctor.value)

const formulariosStore = useFormulariosStore()
const showLlenarFormularios = computed(
    () => formulariosStore.sidebarAccess?.showLlenarFormularios === true,
)
const showFormulariosPacientes = computed(
    () => formulariosStore.sidebarAccess?.showFormulariosPacientes === true,
)

const showReservationBanner = computed(() => {
    return ['reservar', 'historial'].includes(route.name)
})

const bottomNavValue = computed(() => {
    if (route.path === '/doctor/agenda') return 'agenda'
    if (route.path === '/doctor/home') return 'home'
    if (route.path === '/reservar') return 'reservar'
    if (route.path === '/historial') return 'historial'
    if (route.path === '/home' || route.path === '/') return 'home'
    return ''
})

onMounted(() => {
    if (authStore.token && showNotifications.value) {
        notificationsStore.poll()
        pollInterval = setInterval(() => notificationsStore.poll(), 60000)
    }
    if (authStore.token) {
        formulariosStore.fetchSidebarAccess()
    }
})

watch(
    () => authStore.user?.rol,
    () => {
        if (authStore.token) {
            formulariosStore.fetchSidebarAccess()
        }
    },
)

onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval)
    setMobileDrawerScrollLock(false)
})

const handleLogout = () => {
    showLogoutConfirm.value = true
}

const performLogout = () => {
    authStore.logout()
    router.push('/')
    showLogoutConfirm.value = false
}
</script>
<template>
    <v-app>
        <!-- Barra superior -->
        <v-app-bar v-if="!mobile" class="header-modern" height="75" elevation="3">
            <v-app-bar-nav-icon color="white" @click="drawer = !drawer"></v-app-bar-nav-icon>

            <v-app-bar-title v-if="!mobile">
                <div class="d-flex align-center py-1">
                    <div class="logo-wrapper-header mr-4 d-flex justify-center align-center elevation-2">
                        <v-img :src="logoUmsa" width="40" height="40" contain class="logo-animate"></v-img>
                    </div>
                    <span class="text-h5 font-weight-black text-white header-title">{{ APP_NAME }}</span>
                </div>
            </v-app-bar-title>

            <v-spacer></v-spacer>

            <NotificationBell v-if="showNotifications" />

            <!-- Menú de usuario -->
            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props" color="white" class="mr-2 user-menu-btn">
                        <PersonaAvatar
                            v-if="tieneFotoPerfil"
                            :foto="authStore.user?.foto"
                            :nombres="authStore.user?.nombres"
                            :primer-apellido="authStore.user?.primerApellido"
                            :size="36"
                            rounded="circle"
                        />
                        <v-icon v-else size="28">mdi-account-circle</v-icon>
                    </v-btn>
                </template>
                <v-list width="250">
                    <v-list-item class="px-4 py-3">
                        <template v-slot:prepend>
                            <div class="mr-3">
                                <PersonaAvatar
                                    :foto="authStore.user?.foto"
                                    :nombres="authStore.user?.nombres"
                                    :primer-apellido="authStore.user?.primerApellido"
                                    size="40"
                                />
                            </div>
                        </template>
                        <v-list-item-title class="font-weight-bold text-body-2">{{ authStore.user?.nombres }}</v-list-item-title>
                        <v-list-item-subtitle class="text-caption font-weight-medium text-primary">
                            {{ authStore.user?.rol }}
                        </v-list-item-subtitle>
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item title="Mi Perfil" prepend-icon="mdi-account-outline" to="/administrar-cuenta"></v-list-item>
                    <v-list-item
                        v-if="showConfigMenu"
                        title="Configuración"
                        prepend-icon="mdi-cog-outline"
                        to="/configuracion"
                    ></v-list-item>
                    <v-divider></v-divider>
                    <v-list-item title="Cerrar Sesión" class="text-error" prepend-icon="mdi-logout-variant"
                        @click="handleLogout"></v-list-item>
                </v-list>
            </v-menu>
        </v-app-bar>

        <!-- Sidebar de navegación -->
        <v-navigation-drawer
            v-model="drawer"
            app
            :temporary="mobile"
            :width="SIDEBAR_WIDTH"
            class="sidebar-modern"
            elevation="4"
        >
            <div class="pa-4 d-flex flex-column h-100">
                <!-- Header del Sidebar (Logo/Nombre) -->
                <div v-if="mobile" class="d-flex align-center gap-3 px-2 mb-8 mt-2">
                    <div
                        class="logo-wrapper-sidebar d-flex align-center justify-center bg-white rounded-lg elevation-2">
                        <v-img :src="logoUmsa" width="42" height="42" contain class="logo-animate"></v-img>
                    </div>
                    <span class="text-h6 font-weight-black text-primary sidebar-title">{{ APP_NAME }}</span>
                </div>
                <div v-else class="mb-4"></div>

                <div class="sidebar-section-title px-2 mb-2">Menú Principal</div>

                <!-- Contenedor scrollable para la lista -->
                <div class="flex-grow-1 overflow-y-auto pr-2 custom-scrollbar">

                    <v-list density="compact" nav class="pa-0">
                        <!-- Cuadro de Mando Integrado (Paciente) -->
                        <v-list-item v-if="isSuper || isPatient" prepend-icon="mdi-view-dashboard-outline"
                            title="Cuadro de Mando Integrado" to="/home" rounded="xl" color="primary" class="mb-1"></v-list-item>

                        <!-- Cuadro de Mando Integrado (Doctor) -->
                        <v-list-item v-if="isSuper || isDoctor" prepend-icon="mdi-view-dashboard-outline"
                            title="Cuadro de Mando Integrado" to="/doctor/home" rounded="xl" color="primary"
                            class="mb-1" data-tour="nav-doctor-home" data-tour-surface="sidebar"></v-list-item>

                        <!-- Cuadro de Mando Integrado (Director) -->
                        <v-list-item v-if="isSuper || isDirector" prepend-icon="mdi-view-dashboard-outline"
                            title="Cuadro de Mando Integrado" to="/director/home" rounded="xl" color="primary"
                            class="mb-1"></v-list-item>

                        <v-list-item v-if="isSuper || isDoctor || isDirector" prepend-icon="mdi-calendar-month"
                            title="Agenda" to="/doctor/agenda" rounded="xl" color="primary"
                            class="mb-1" data-tour="nav-doctor-agenda" data-tour-surface="sidebar"></v-list-item>

                        <!-- Acciones Paciente -->
                        <v-list-item v-if="isSuper || isPatient" prepend-icon="mdi-calendar-check-outline"
                            title="Reservar Cita" to="/reservar" rounded="xl" color="primary"
                            class="mb-1" data-tour="nav-reservar"></v-list-item>

                        <v-list-item v-if="isSuper || isPatient" prepend-icon="mdi-history" title="Mi Historial"
                            to="/historial" rounded="xl" color="primary" class="mb-1"></v-list-item>

                        <v-list-item
                            v-if="showLlenarFormularios"
                            prepend-icon="mdi-clipboard-edit-outline"
                            title="Llenar formularios"
                            to="/llenar-formularios"
                            rounded="xl"
                            color="primary"
                            class="mb-1"
                        />

                        <v-list-item
                            v-if="showFormulariosPacientes"
                            prepend-icon="mdi-account-multiple-check-outline"
                            title="Pacientes"
                            to="/formularios/pacientes"
                            rounded="xl"
                            color="primary"
                            class="mb-1"
                        />

                        <!-- Gestión (Super y Director) -->
                        <div v-if="isSuper || isDirector" class="sidebar-section-title px-2 mt-6 mb-2">Administración
                        </div>

                        <v-list-item v-if="isSuper || isDirector" prepend-icon="mdi-account-group-outline"
                            title="Usuarios" to="/usuarios" rounded="xl" color="primary" class="mb-1">
                        </v-list-item>

                        <!-- <v-list-group v-if="isSuper || isDirector" class="no-indent"
                            prepend-icon="mdi-account-cog-outline" value="Personas" rounded="xl">
                            <template #activator="{ props }">
                                <v-list-item v-bind="props" title="Gestionar Personas" rounded="xl"></v-list-item>
                            </template>

                            <v-list-item prepend-icon="mdi-account-multiple-outline" title="Personas"
                                to="/administrar/personas" rounded="xl" class="mb-1"></v-list-item>
                            <v-list-item prepend-icon="mdi-school-outline" title="Estudiantes"
                                to="/administrar/estudiantes" rounded="xl" class="mb-1"></v-list-item>
                            <v-list-item prepend-icon="mdi-human-male-board" title="Docentes" to="/administrar/docentes"
                                rounded="xl" class="mb-1"></v-list-item>
                            <v-list-item prepend-icon="mdi-briefcase-account-outline" title="Administrativos"
                                to="/administrar/administrativos" rounded="xl" class="mb-1"></v-list-item>
                            <v-list-item prepend-icon="mdi-account-tie-outline" title="Consultores"
                                to="/administrar/consultores" rounded="xl" class="mb-1"></v-list-item>
                            <v-list-item prepend-icon="mdi-doctor" title="Doctores" to="/administrar/doctores"
                                rounded="xl" class="mb-1"></v-list-item>
                        </v-list-group> -->

                        <v-list-item v-if="isSuper || isDirector" prepend-icon="mdi-hospital-building"
                            title="Postas Médicas" to="/postas-medicas" rounded="xl" color="primary"
                            class="mb-1"></v-list-item>

                        <v-list-item v-if="isSuper || isDirector" prepend-icon="mdi-stethoscope" title="Especialidades"
                            to="/especialidades-medicas" rounded="xl" color="primary" class="mb-1"></v-list-item>

                        <v-list-item v-if="isSuper" prepend-icon="mdi-school-outline"
                            title="Catálogos Académicos" to="/catalogos-academicos" rounded="xl" color="primary"
                            class="mb-1"></v-list-item>

                        <v-list-item v-if="isSuper || isDirector" prepend-icon="mdi-doctor" title="Listado de Doctores"
                            to="/doctores" rounded="xl" color="primary" class="mb-1"></v-list-item>

                        <v-list-item v-if="isSuper || isDirector" prepend-icon="mdi-cog-outline" title="Configuración"
                            to="/configuracion" rounded="xl" color="primary" class="mb-1"></v-list-item>

                        <v-list-item v-if="isSuper || isDirector" prepend-icon="mdi-lightbulb-on-outline"
                            title="Consejos del Día" to="/admin/consejos" rounded="xl" color="primary"
                            class="mb-1"></v-list-item>

                        <v-list-item v-if="isSuper || isDirector" prepend-icon="mdi-file-document-multiple-outline"
                            title="Formularios" to="/formularios" rounded="xl" color="primary"
                            class="mb-1"></v-list-item>

                        <v-list-item prepend-icon="mdi-card-account-details-outline" title="Administrar cuenta"
                            to="/administrar-cuenta" rounded="xl" color="primary" class="mb-1"
                            data-tour="nav-doctor-cuenta" data-tour-surface="sidebar"></v-list-item>
                    </v-list>
                </div>

                <v-spacer v-if="!mobile"></v-spacer>

                <!-- Usuario en el footer del sidebar (solo escritorio) -->
                <template v-if="!mobile">
                    <v-divider class="mb-4"></v-divider>
                    <v-card variant="text" rounded="xl" class="user-profile-card">
                        <v-list-item class="px-2 py-1">
                            <template v-slot:prepend>
                                <PersonaAvatar
                                    :foto="authStore.user?.foto"
                                    :nombres="authStore.user?.nombres"
                                    :primer-apellido="authStore.user?.primerApellido"
                                    size="40"
                                />
                            </template>
                            <v-list-item-title class="font-weight-bold text-body-2">{{ authStore.user?.nombres
                                }}</v-list-item-title>
                            <v-list-item-subtitle class="text-caption font-weight-medium text-primary">{{
                                authStore.user?.rol
                                }}</v-list-item-subtitle>
                            <template v-slot:append>
                                <v-btn icon="mdi-cog-outline" variant="text" size="small" color="primary"
                                    to="/administrar-cuenta" title="Administrar cuenta"></v-btn>
                                <v-btn icon="mdi-logout-variant" variant="text" size="small" color="error"
                                    title="Cerrar sesión" @click="handleLogout"></v-btn>
                            </template>
                        </v-list-item>
                    </v-card>
                </template>
            </div>
        </v-navigation-drawer>

        <!-- Navegación inferior (Mobile) — fija al viewport -->
        <Teleport to="body">
            <v-bottom-navigation
                v-if="mobile"
                grow
                class="mobile-bottom-nav"
                color="primary"
                :model-value="bottomNavValue"
                height="56"
            >
                <v-btn value="sidebar" icon title="Menú" data-tour="nav-doctor-menu" @click="drawer = !drawer">
                    <v-icon size="26">mdi-menu</v-icon>
                </v-btn>

                <v-btn v-if="isSuper || isPatient" value="reservar" icon title="Reservar" to="/reservar"
                    data-tour="nav-reservar">
                    <v-icon size="26">mdi-calendar-plus</v-icon>
                </v-btn>

                <v-btn
                    value="home"
                    icon
                    title="Inicio"
                    :to="(isDoctor && !isSuper) ? '/doctor/home' : ((isDirector && !isSuper) ? '/director/home' : '/home')"
                    :data-tour="(isDoctor || isSuper) ? 'nav-doctor-home' : undefined"
                    :data-tour-surface="(isDoctor || isSuper) ? 'bottom-nav' : undefined"
                >
                    <v-icon size="26">mdi-home</v-icon>
                </v-btn>

                <v-btn
                    v-if="isSuper || isDoctor || isDirector"
                    value="agenda"
                    icon
                    title="Agenda"
                    to="/doctor/agenda"
                    data-tour="nav-doctor-agenda"
                    data-tour-surface="bottom-nav"
                >
                    <v-icon size="26">mdi-calendar-month</v-icon>
                </v-btn>

                <v-btn v-if="isSuper || isPatient" value="historial" icon title="Historial" to="/historial">
                    <v-icon size="26">mdi-history</v-icon>
                </v-btn>

                <v-btn value="perfil" icon title="Perfil" class="nav-profile-btn" data-tour="nav-doctor-cuenta">
                    <PersonaAvatar
                        v-if="tieneFotoPerfil"
                        :foto="authStore.user?.foto"
                        :nombres="authStore.user?.nombres"
                        :primer-apellido="authStore.user?.primerApellido"
                        :size="26"
                        rounded="circle"
                    />
                    <v-icon v-else size="26">mdi-account-circle</v-icon>
                    <v-menu activator="parent" location="top center" offset="10">
                        <v-list width="250">
                            <v-list-item class="px-4 py-3">
                                <template v-slot:prepend>
                                    <div class="mr-3">
                                        <PersonaAvatar
                                            :foto="authStore.user?.foto"
                                            :nombres="authStore.user?.nombres"
                                            :primer-apellido="authStore.user?.primerApellido"
                                            size="40"
                                        />
                                    </div>
                                </template>
                                <v-list-item-title class="font-weight-bold text-body-2">{{ authStore.user?.nombres
                                    }}</v-list-item-title>
                                <v-list-item-subtitle class="text-caption font-weight-medium text-primary">{{
                                    authStore.user?.rol
                                    }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-divider></v-divider>
                            <v-list-item title="Mi Perfil" prepend-icon="mdi-account-outline"
                                to="/administrar-cuenta"></v-list-item>
                            <v-list-item
                                v-if="showConfigMenu"
                                title="Configuración"
                                prepend-icon="mdi-cog-outline"
                                to="/configuracion"
                            ></v-list-item>
                            <v-divider></v-divider>
                            <v-list-item title="Cerrar Sesión" class="text-error" prepend-icon="mdi-logout-variant"
                                @click="handleLogout"></v-list-item>
                        </v-list>
                    </v-menu>
                </v-btn>
            </v-bottom-navigation>
        </Teleport>

        <!-- Contenido principal -->
        <v-main :class="{ 'main-with-bottom-nav': mobile }">
            <BannerReservaFueraRango v-if="showReservationBanner" />
            <v-container fluid :class="mobile ? 'pa-2' : 'pa-6'">
                <router-view />
            </v-container>
        </v-main>

        <!-- Modal de Confirmación de Logout -->
        <ModalConfirmacion v-model="showLogoutConfirm" title="Cerrar Sesión"
            message="¿Estás seguro de que deseas cerrar tu sesión actual?" confirmText="Cerrar Sesión"
            cancelText="Cancelar" type="warning" @confirm="performLogout" @cancel="showLogoutConfirm = false" />

        <NotificationPopup v-if="showNotifications" />

        <v-snackbar
            v-model="authStore.sessionWarning"
            color="warning"
            location="top"
            timeout="-1"
            multi-line
        >
            Tu sesión vence en unos minutos. Guarda lo que estés haciendo; al vencer tendrás que volver a entrar.
            <template #actions>
                <v-btn variant="text" @click="authStore.dismissSessionWarning()">
                    Entendido
                </v-btn>
            </template>
        </v-snackbar>
    </v-app>
</template>
<style scoped>
.header-modern {
    background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.85) 100%) !important;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    z-index: var(--layout-header-z, 1004) !important;
}

.logo-wrapper-header {
    background-color: white;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    padding: 4px;
    transition: all 0.3s ease;
}

.logo-wrapper-header:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15) !important;
}

.logo-wrapper-sidebar {
    width: 50px;
    height: 50px;
    padding: 4px;
    border: 1px solid rgba(0, 0, 0, 0.05);
}

.header-title {
    letter-spacing: 0.5px !important;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sidebar-title {
    letter-spacing: 0.5px;
}

.user-menu-btn {
    transition: all 0.3s ease;
}

.user-menu-btn :deep(.v-avatar) {
    border: 2px solid rgba(255, 255, 255, 0.85);
}

.user-menu-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
}

.logo-animate {
    transition: transform 0.3s ease;
}

.logo-animate:hover {
    transform: scale(1.05);
}

/* Espacio reservado solo cuando el banner fixed está visible (ver BannerReservaFueraRango) */

.sidebar-modern {
    background-color: #F8FAFC !important;
    border-right: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.sidebar-section-title {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748B;
}

.user-profile-card {
    transition: all 0.2s ease;
}

.user-profile-card:hover {
    background-color: rgba(99, 102, 241, 0.05);
}

.gap-3 {
    gap: 12px;
}

.border-dashed {
    border: 1px dashed rgba(99, 102, 241, 0.3) !important;
}

.main-with-bottom-nav {
    padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important;
}

.mobile-bottom-nav :deep(.v-btn) {
    min-width: 0 !important;
    max-width: none !important;
    height: 56px !important;
}

.mobile-bottom-nav :deep(.v-btn__content) {
    flex-direction: row !important;
}

.nav-profile-btn :deep(.v-avatar) {
    border: 2px solid rgba(255, 255, 255, 0.85);
    width: 26px !important;
    height: 26px !important;
}
</style>

<style>
/* Capas de layout:
   - Móvil: chrome (sidebar + bottom nav) muy arriba
   - Desktop: header > sidebar permanente > overlays del main */
:root {
  --mobile-chrome-z: 2200;
  --mobile-scrim-z: 2190;
  --mobile-bottom-nav-h: 56px;
  --layout-header-z: 1004;
  --layout-sidebar-z: 1003;
  --layout-content-overlay-z: 1000;
  --layout-sidebar-width: 280px;
}

.mobile-bottom-nav {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100vw !important;
    z-index: var(--mobile-chrome-z) !important;
    transform: translateZ(0);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.12);
}

/* En desktop el header (app-bar) debe quedar por encima del sidebar.
   El z-index alto solo aplica en móvil junto al bottom-nav. */
@media (max-width: 959px) {
  .v-navigation-drawer.sidebar-modern {
    z-index: var(--mobile-chrome-z) !important;
    pointer-events: auto !important;
    top: 0 !important;
    height: calc(100% - var(--mobile-bottom-nav-h) - env(safe-area-inset-bottom, 0px)) !important;
    max-height: calc(100% - var(--mobile-bottom-nav-h) - env(safe-area-inset-bottom, 0px)) !important;
    bottom: auto !important;
  }

  .v-navigation-drawer.sidebar-modern .v-navigation-drawer__content,
  .v-navigation-drawer.sidebar-modern .v-list,
  .v-navigation-drawer.sidebar-modern .v-list-item {
    pointer-events: auto !important;
    position: relative;
    z-index: 2;
  }

  /*
    El scrim en Vuetify 3 es HERMANO del drawer (no hijo).
    Si comparte el viewport completo con z-index alto, tapa los clics del menú.
    Lo limitamos al área a la derecha del sidebar.
  */
  .v-navigation-drawer__scrim {
    z-index: var(--mobile-scrim-z) !important;
    top: 0 !important;
    left: var(--layout-sidebar-width) !important;
    right: 0 !important;
    width: auto !important;
    bottom: calc(var(--mobile-bottom-nav-h) + env(safe-area-inset-bottom, 0px)) !important;
    height: auto !important;
    pointer-events: auto !important;
  }
}

@media (min-width: 960px) {
  /* Solo drawers permanentes: no bajar z-index de un temporary si hubiera mismatch de breakpoint */
  .v-navigation-drawer.sidebar-modern:not(.v-navigation-drawer--temporary) {
    z-index: var(--layout-sidebar-z) !important;
  }
}

/* Bloquear scroll/interacción del fondo con sidebar móvil abierto */
html.mobile-drawer-open,
html.mobile-drawer-open body {
  overflow: hidden !important;
  overscroll-behavior: none;
  width: 100%;
}

html.mobile-drawer-open body {
  position: fixed !important;
  left: 0;
  right: 0;
}

html.mobile-drawer-open .v-main {
  pointer-events: none !important;
  overflow: hidden !important;
  touch-action: none !important;
}

/* El botón ? no debe tapar el menú ni el footer */
html.mobile-drawer-open .tutorial-help-root {
  z-index: 1500 !important;
  pointer-events: none !important;
  opacity: 0 !important;
}

.mobile-bottom-nav .v-bottom-navigation__content {
    width: 100%;
    justify-content: stretch !important;
}

.mobile-bottom-nav .v-btn,
.mobile-bottom-nav .v-btn--active,
.mobile-bottom-nav .v-btn--selected {
    min-width: 0 !important;
    max-width: none !important;
    flex: 1 1 0 !important;
    width: 0 !important;
    height: 56px !important;
    padding: 0 !important;
    border-radius: 0 !important;
    transform: none !important;
}

.mobile-bottom-nav .v-btn .v-icon,
.mobile-bottom-nav .v-btn--active .v-icon,
.mobile-bottom-nav .v-btn--selected .v-icon {
    font-size: 26px !important;
    transform: none !important;
}

.mobile-bottom-nav .v-btn__content {
    flex-direction: row !important;
    width: 100%;
    justify-content: center;
}
</style>