<script setup>

import { computed, onMounted, ref, watch } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

import { useConsultoresStore } from '@/stores/consultores'

import { useDoctoresStore } from '@/stores/doctores'

import defaultAvatar from '@/assets/usuario_default.webp'

import ModalCambiarContrasena from '@/components/cuenta/ModalCambiarContrasena.vue'

import ModalEditarDatosPersonales from '@/components/cuenta/ModalEditarDatosPersonales.vue'

import ModalEditarUsuario from '@/components/cuenta/ModalEditarUsuario.vue'

import ModalConfirmacion from '@/components/common/ModalConfirmación.vue'

import ModalMensaje from '@/components/common/ModalMensaje.vue'

import ModalInformacionConsultorContrato from '@/components/usuarios/ModalInformacionConsultorContrato.vue'

import ModalRegistrarEstudiante from '@/components/cuenta/ModalRegistrarEstudiante.vue'

import ModalRegistrarDocente from '@/components/cuenta/ModalRegistrarDocente.vue'

import ModalRegistrarAdministrativo from '@/components/cuenta/ModalRegistrarAdministrativo.vue'

import ModalRegistrarConsultor from '@/components/cuenta/ModalRegistrarConsultor.vue'



const API_BASE = import.meta.env.VITE_API_URL



const authStore = useAuthStore()

const doctoresStore = useDoctoresStore()

const consultoresStore = useConsultoresStore()

const route = useRoute()

const router = useRouter()



const user = computed(() => authStore.user)

const mustChangePassword = computed(() => user.value?.mustChangePassword === true)



const fullName = computed(() => {

    const u = user.value

    if (!u) return '-'

    return [u.nombres, u.primerApellido, u.segundoApellido].filter(Boolean).join(' ').trim() || '-'

})



const initials = computed(() => {

    const n = user.value?.nombres

    return n ? n.substring(0, 2).toUpperCase() : '??'

})



const resolveUploadUrl = (path) => {

    if (!path) return null

    if (path.startsWith('http://') || path.startsWith('https://')) return path

    const base = (API_BASE || '').replace(/\/$/, '')

    return `${base}${path.startsWith('/') ? path : `/${path}`}`

}



const avatarSrc = computed(() => {

    if (photoPreview.value) return photoPreview.value

    return resolveUploadUrl(user.value?.foto) || defaultAvatar

})



const display = (value) => (value != null && String(value).trim() !== '' ? value : '-')



const isDoctor = computed(() => user.value?.rol === 'DOCTOR')

const doctor = computed(() => user.value?.doctor ?? null)

const showDoctorSection = computed(() => isDoctor.value && !!doctor.value)

const doctorContactoForm = ref({
    telefonoEmergencia: '',
    compartirTelefonoEmergencia: false,
})

const savingDoctorContacto = ref(false)

const syncDoctorContactoForm = () => {
    const d = doctor.value
    doctorContactoForm.value = {
        telefonoEmergencia: d?.telefonoEmergencia || '',
        compartirTelefonoEmergencia: Boolean(d?.compartirTelefonoEmergencia),
    }
}

watch(doctor, syncDoctorContactoForm, { immediate: true })

const guardarContactoDoctor = async () => {
    savingDoctorContacto.value = true
    try {
        await doctoresStore.updateContactoMios({
            telefonoEmergencia: doctorContactoForm.value.telefonoEmergencia,
            compartirTelefonoEmergencia: doctorContactoForm.value.compartirTelefonoEmergencia,
        })
        await authStore.fetchProfile()
        syncDoctorContactoForm()
        successTitle.value = 'Contacto actualizado'
        successMessage.value = 'Teléfono de emergencia y preferencia de compartir guardados.'
        showSuccessModal.value = true
    } catch (err) {
        errorTitle.value = 'No se pudo guardar'
        errorMessage.value = err?.message || 'Error al actualizar el contacto.'
        showErrorModal.value = true
    } finally {
        savingDoctorContacto.value = false
    }
}



const isEstudiante = computed(() => user.value?.rol === 'ESTUDIANTE')

const estudiante = computed(() => user.value?.estudiante ?? null)

const showEstudianteSection = computed(() => isEstudiante.value && !!estudiante.value)

const isDocente = computed(() => user.value?.rol === 'DOCENTE')

const docente = computed(() => user.value?.docente ?? null)

const showDocenteSection = computed(() => isDocente.value && !!docente.value)

const isAdministrativo = computed(() => user.value?.rol === 'ADMINISTRATIVO')

const administrativo = computed(() => user.value?.administrativo ?? null)

const showAdministrativoSection = computed(() => isAdministrativo.value && !!administrativo.value)

const isConsultor = computed(() => user.value?.rol === 'CONSULTOR')

const consultor = computed(() => user.value?.consultor ?? null)

const tiposPaciente = [

    { value: 'ESTUDIANTE', label: 'Estudiante', icon: 'mdi-school' },

    { value: 'DOCENTE', label: 'Docente', icon: 'mdi-human-male-board' },

    { value: 'ADMINISTRATIVO', label: 'Administrativo', icon: 'mdi-desk' },

    { value: 'CONSULTOR', label: 'Consultor', icon: 'mdi-briefcase' },

]

const PACIENTE_ROLES = ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'CONSULTOR']

const tiposPacienteRegistrados = computed(() => {

    const u = user.value

    if (!u) return []

    const registrados = []

    // Solo perfiles vinculados: tener el rol asignado/activo no implica datos registrados.

    if (u.estudiante) registrados.push('ESTUDIANTE')

    if (u.docente) registrados.push('DOCENTE')

    if (u.administrativo) registrados.push('ADMINISTRATIVO')

    if (u.consultor) registrados.push('CONSULTOR')

    return registrados

})

const tiposPacienteFaltantes = computed(() =>

    tiposPaciente.filter((tipo) => !tiposPacienteRegistrados.value.includes(tipo.value))

)

const rolesPacienteAsignados = computed(() => {

    const roles = Array.isArray(user.value?.roles) ? user.value.roles : []

    return roles.filter((r) => PACIENTE_ROLES.includes((r.nombre || '').toUpperCase()))

})

const canSwitchPatientRole = computed(() => rolesPacienteAsignados.value.length > 1)

const pendingRegisterTipo = ref(null)

const showRegisterConfirm = ref(false)

const showModalEstudiante = ref(false)

const showModalDocente = ref(false)

const showModalAdministrativo = ref(false)

const showModalConsultorRegistro = ref(false)

const switchingRole = ref(false)

const registerConfirmMessage = computed(() => {

    const label = pendingRegisterTipo.value?.label || 'este rol'

    return `Se abrirá un espacio para registrar tus datos como ${label}. Debes completar la información y subir los documentos requeridos para ser tratado como ${label} en el sistema.`

})

const requestRegisterTipo = (tipo) => {

    pendingRegisterTipo.value = tipo

    showRegisterConfirm.value = true

}

const cancelRegisterConfirm = () => {

    showRegisterConfirm.value = false

    pendingRegisterTipo.value = null

}

const confirmRegisterTipo = () => {

    showRegisterConfirm.value = false

    const tipo = pendingRegisterTipo.value?.value

    pendingRegisterTipo.value = null

    if (tipo === 'ESTUDIANTE') showModalEstudiante.value = true

    else if (tipo === 'DOCENTE') showModalDocente.value = true

    else if (tipo === 'ADMINISTRATIVO') showModalAdministrativo.value = true

    else if (tipo === 'CONSULTOR') showModalConsultorRegistro.value = true

}

const onRolRegistrado = async (data) => {

    try {

        if (data?.idRol) {

            await authStore.switchRole(data.idRol)

        } else {

            await authStore.fetchProfile()

        }

        await loadContratos()

        successTitle.value = 'Rol registrado'

        successMessage.value = data?.message || 'Los datos del rol se guardaron correctamente.'

        showSuccessModal.value = true

    } catch (err) {

        await authStore.fetchProfile()

        await loadContratos()

        errorTitle.value = 'Rol registrado con aviso'

        errorMessage.value = err.message || 'Los datos se guardaron, pero no se pudo activar el nuevo rol automáticamente.'

        showErrorModal.value = true

    }

}

const onSwitchRole = async (role) => {

    if (!role?.idRol || role.idRol === user.value?.rolId) return

    switchingRole.value = true

    try {

        await authStore.switchRole(role.idRol)

        await loadContratos()

    } catch (err) {

        errorTitle.value = 'No se pudo cambiar el rol'

        errorMessage.value = err.message || 'Ocurrió un error inesperado.'

        showErrorModal.value = true

    } finally {

        switchingRole.value = false

    }

}

const showContratosSection = computed(() => isConsultor.value && !!consultor.value)

const contratos = ref([])

const loadingContratos = ref(false)

const showContratoModal = ref(false)

const selectedContrato = ref(null)

const pendingContrato = ref(null)

const formatContratoDate = (value) => {

    if (!value) return '-'

    return String(value).slice(0, 10)

}

const loadContratos = async () => {

    if (!showContratosSection.value || !user.value?.idPersona) {

        contratos.value = []

        return

    }

    loadingContratos.value = true

    try {

        contratos.value = await consultoresStore.fetchContratosByPersona(user.value.idPersona)

    } catch (err) {

        errorTitle.value = 'No se pudieron cargar los contratos'

        errorMessage.value = err.message || 'Ocurrió un error inesperado.'

        showErrorModal.value = true

        contratos.value = []

    } finally {

        loadingContratos.value = false

    }

}

const openCreateContrato = () => {

    selectedContrato.value = null

    showContratoModal.value = true

}

const openEditContrato = (contrato) => {

    selectedContrato.value = contrato

    showContratoModal.value = true

}

const requestDeleteContrato = (contrato) => {

    pendingContrato.value = contrato

    pendingAction.value = 'delete-contrato'

    confirmTitle.value = 'Eliminar contrato'

    confirmMessage.value = `¿Deseas eliminar el contrato "${contrato.cargo || ''}"? Esta acción no se puede deshacer.`

    confirmType.value = 'warning'

    showConfirmModal.value = true

}

const onContratoSaved = async () => {

    await loadContratos()

}



// --- Modales ---

const showPasswordModal = ref(false)

const showPersonalModal = ref(false)

const showUsernameModal = ref(false)

const pendingProfile = ref(null)

const pendingUsername = ref(null)

const showConfirmModal = ref(false)

const showSuccessModal = ref(false)

const showErrorModal = ref(false)

const showForcePasswordInfo = ref(false)

const wasForcedPasswordChange = ref(false)

const redirectAfterPasswordChange = ref(false)



const confirmTitle = ref('')

const confirmMessage = ref('')

const confirmType = ref('warning')

const successTitle = ref('')

const successMessage = ref('')

const errorTitle = ref('')

const errorMessage = ref('')



const pendingAction = ref(null)

const pendingPassword = ref(null)

const saving = ref(false)



// --- Foto ---

const photoInputRef = ref(null)

const selectedPhoto = ref(null)

const photoPreview = ref(null)



const triggerPhotoSelect = () => {

    photoInputRef.value?.click()

}



const onPhotoSelected = (event) => {

    const file = event.target.files?.[0]

    if (!file) return



    const allowed = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowed.includes(file.type)) {

        errorTitle.value = 'Formato no válido'

        errorMessage.value = 'Solo se permiten imágenes JPG, PNG o WEBP.'

        showErrorModal.value = true

        event.target.value = ''

        return

    }

    if (file.size > 2 * 1024 * 1024) {

        errorTitle.value = 'Archivo muy grande'

        errorMessage.value = 'La imagen debe pesar máximo 2MB.'

        showErrorModal.value = true

        event.target.value = ''

        return

    }



    selectedPhoto.value = file

    photoPreview.value = URL.createObjectURL(file)

    event.target.value = ''

}



const requestPhotoUpdate = () => {

    if (!selectedPhoto.value) {

        triggerPhotoSelect()

        return

    }

    pendingAction.value = 'photo'

    confirmTitle.value = 'Actualizar foto de perfil'

    confirmMessage.value = '¿Deseas guardar la nueva foto de perfil?'

    confirmType.value = 'warning'

    showConfirmModal.value = true

}



// --- Documentos estudiante ---

const pdfMatricula = ref(null)

const pdfCarnet = ref(null)



const requestDocumentsUpdate = () => {

    if (!pdfMatricula.value && !pdfCarnet.value) {

        errorTitle.value = 'Sin archivos'

        errorMessage.value = 'Selecciona al menos un documento PDF para actualizar.'

        showErrorModal.value = true

        return

    }

    pendingAction.value = 'documents'

    confirmTitle.value = 'Actualizar documentos'

    confirmMessage.value = '¿Deseas reemplazar los documentos académicos seleccionados?'

    confirmType.value = 'warning'

    showConfirmModal.value = true

}



// --- Contraseña ---

const onPasswordSubmit = (payload) => {

    pendingPassword.value = payload

    pendingAction.value = 'password'

    confirmTitle.value = 'Confirmar cambio de contraseña'

    confirmMessage.value = '¿Estás seguro de que deseas cambiar tu contraseña?'

    confirmType.value = 'warning'

    showConfirmModal.value = true

}



const onPersonalSubmit = (payload) => {

    pendingProfile.value = payload

    pendingAction.value = 'profile'

    confirmTitle.value = 'Confirmar datos personales'

    confirmMessage.value = '¿Deseas guardar los cambios en tus datos personales?'

    confirmType.value = 'warning'

    showConfirmModal.value = true

}



const onUsernameSubmit = (username) => {

    pendingUsername.value = username

    pendingAction.value = 'username'

    confirmTitle.value = 'Confirmar cambio de usuario'

    confirmMessage.value = `¿Deseas cambiar tu usuario a «${username}»?`

    confirmType.value = 'warning'

    showConfirmModal.value = true

}



const executePendingAction = async () => {

    showConfirmModal.value = false

    saving.value = true



    try {

        if (pendingAction.value === 'password' && pendingPassword.value) {

            await authStore.changePassword(

                pendingPassword.value.currentPassword,

                pendingPassword.value.newPassword,

                pendingPassword.value.confirmPassword,

            )

            showPasswordModal.value = false

            pendingPassword.value = null

            redirectAfterPasswordChange.value = wasForcedPasswordChange.value

            wasForcedPasswordChange.value = false

            successTitle.value = 'Contraseña actualizada'

            successMessage.value = 'Tu contraseña fue cambiada correctamente. Ya puedes continuar usando el sistema.'

            showSuccessModal.value = true

        } else if (pendingAction.value === 'photo' && selectedPhoto.value) {

            await authStore.updateProfilePhoto(selectedPhoto.value)

            selectedPhoto.value = null

            if (photoPreview.value) {

                URL.revokeObjectURL(photoPreview.value)

                photoPreview.value = null

            }

            successTitle.value = 'Foto actualizada'

            successMessage.value = 'Tu foto de perfil fue actualizada correctamente.'

            showSuccessModal.value = true

        } else if (pendingAction.value === 'documents') {

            await authStore.updateEstudianteDocumentos({

                pdfMatricula: pdfMatricula.value,

                pdfCarnet: pdfCarnet.value,

            })

            pdfMatricula.value = null

            pdfCarnet.value = null

            successTitle.value = 'Documentos actualizados'

            successMessage.value = 'Tus documentos académicos fueron actualizados correctamente.'

            showSuccessModal.value = true

        } else if (pendingAction.value === 'delete-contrato' && pendingContrato.value) {

            await consultoresStore.deleteContrato(pendingContrato.value.idContratoConsultor)

            pendingContrato.value = null

            await loadContratos()

            successTitle.value = 'Contrato eliminado'

            successMessage.value = 'El contrato fue eliminado correctamente.'

            showSuccessModal.value = true

        } else if (pendingAction.value === 'profile' && pendingProfile.value) {

            await authStore.updateProfile(pendingProfile.value)

            showPersonalModal.value = false

            pendingProfile.value = null

            successTitle.value = 'Datos actualizados'

            successMessage.value = 'Tus datos personales fueron actualizados correctamente.'

            showSuccessModal.value = true

        } else if (pendingAction.value === 'username' && pendingUsername.value) {

            await authStore.updateUsername(pendingUsername.value)

            showUsernameModal.value = false

            pendingUsername.value = null

            successTitle.value = 'Usuario actualizado'

            successMessage.value = 'Tu nombre de usuario fue actualizado correctamente.'

            showSuccessModal.value = true

        }

    } catch (err) {

        errorTitle.value = 'No se pudo completar la acción'

        errorMessage.value = err.message || 'Ocurrió un error inesperado.'

        showErrorModal.value = true

    } finally {

        saving.value = false

        pendingAction.value = null

    }

}



const cancelConfirm = () => {

    showConfirmModal.value = false

    if (pendingAction.value === 'password') {

        pendingPassword.value = null

    }

    if (pendingAction.value === 'delete-contrato') {

        pendingContrato.value = null

    }

    if (pendingAction.value === 'profile') {

        pendingProfile.value = null

    }

    if (pendingAction.value === 'username') {

        pendingUsername.value = null

    }

    pendingAction.value = null

}



const redirectToHome = () => {

    const rol = user.value?.rol

    if (rol === 'DOCTOR') router.push('/doctor/home')

    else if (rol === 'DIRECTOR') router.push('/director/home')

    else router.push('/home')

}



const onSuccessModalConfirm = () => {

    showSuccessModal.value = false

    if (redirectAfterPasswordChange.value) {

        redirectAfterPasswordChange.value = false

        redirectToHome()

    }

}



const onForcePasswordInfoConfirm = () => {

    showForcePasswordInfo.value = false

    showPasswordModal.value = true

}



onMounted(async () => {

    await authStore.fetchProfile()

    await loadContratos()

    const shouldForce = route.query.cambiarContrasena === '1' || user.value?.mustChangePassword

    if (shouldForce) {

        wasForcedPasswordChange.value = true

        showForcePasswordInfo.value = true

    }

})

</script>



<template>

    <div class="max-width-form mx-auto pb-8">

        <header class="d-flex align-center justify-space-between flex-wrap ga-3 mb-8 mt-2">

            <div>

                <h3 class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">

                    Administrar cuenta

                </h3>

                <p class="text-subtitle-2 font-weight-medium text-grey-darken-1">

                    Datos personales y acceso al sistema

                </p>

            </div>

            <div class="d-flex align-center flex-wrap ga-2">

                <v-menu v-if="canSwitchPatientRole" location="bottom end">

                    <template #activator="{ props }">

                        <v-btn v-bind="props" color="secondary" variant="tonal" rounded="lg"

                            class="text-none font-weight-bold" prepend-icon="mdi-account-switch"

                            :loading="switchingRole">

                            {{ display(user?.rol) }}

                        </v-btn>

                    </template>

                    <v-list density="comfortable" min-width="220">

                        <v-list-item v-for="role in rolesPacienteAsignados" :key="role.idRol"

                            :title="role.nombre" :active="role.idRol === user?.rolId"

                            prepend-icon="mdi-badge-account-outline" @click="onSwitchRole(role)" />

                    </v-list>

                </v-menu>

                <v-chip v-else color="secondary" variant="tonal" class="font-weight-bold text-uppercase">

                    {{ display(user?.rol) }}

                </v-chip>

                <v-menu v-if="tiposPacienteFaltantes.length" location="bottom end">

                    <template #activator="{ props }">

                        <v-btn v-bind="props" color="primary" variant="tonal" rounded="lg"

                            class="text-none font-weight-bold" prepend-icon="mdi-account-plus-outline">

                            Registrar datos de:

                        </v-btn>

                    </template>

                    <v-list density="comfortable" min-width="220">

                        <v-list-item v-for="tipo in tiposPacienteFaltantes" :key="tipo.value"

                            :title="tipo.label" :prepend-icon="tipo.icon"

                            @click="requestRegisterTipo(tipo)" />

                    </v-list>

                </v-menu>

            </div>

        </header>



        <v-alert v-if="mustChangePassword" type="warning" variant="tonal" rounded="xl" class="mb-6"

            title="Debes cambiar tu contraseña"

            text="Tu contraseña fue reestablecida por un administrador y coincide con tu usuario (CI). Por seguridad, debes establecer una nueva contraseña antes de continuar." />



        <v-sheet v-if="user" border rounded="xl" class="pa-6 mb-6 profile-hero shadow-premium">

            <div class="d-flex align-center flex-wrap ga-6">

                <div class="avatar-wrapper position-relative">

                    <v-avatar size="96" class="profile-avatar elevation-4">

                        <v-img :src="avatarSrc" cover alt="Foto de perfil" />

                    </v-avatar>

                    <v-btn icon="mdi-camera" size="small" color="primary" class="avatar-edit-btn" elevation="2"

                        @click="triggerPhotoSelect" title="Cambiar foto" />

                    <input ref="photoInputRef" type="file" accept="image/jpeg,image/png,image/webp" class="d-none"

                        @change="onPhotoSelected" />

                </div>

                <div class="flex-grow-1">

                    <h4 class="text-h5 font-weight-black text-grey-darken-4 mb-1">{{ fullName }}</h4>

                    <p class="text-body-2 text-grey-darken-1 mb-3">{{ display(user.email) }}</p>

                    <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">

                        {{ display(user.rol) }}

                    </v-chip>

                    <div v-if="selectedPhoto" class="mt-4">

                        <v-btn color="primary" variant="flat" rounded="lg" size="small" class="text-none"

                            :loading="saving" prepend-icon="mdi-upload" @click="requestPhotoUpdate">

                            Actualizar foto

                        </v-btn>

                        <v-btn variant="text" size="small" class="text-none ms-2" @click="selectedPhoto = null; photoPreview = null">

                            Cancelar

                        </v-btn>

                    </div>

                </div>

            </div>

        </v-sheet>



        <v-skeleton-loader v-else type="article, card" class="mb-6" />



        <template v-if="user">

            <div class="account-cards-grid">

            <v-card class="rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>

                <div class="section-badge primary"></div>

                <v-card-item class="pb-1 pt-4">

                    <template v-slot:prepend>

                        <v-avatar color="primary-lighten-4" size="40">

                            <v-icon color="primary">mdi-account-circle</v-icon>

                        </v-avatar>

                    </template>

                    <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">

                        Datos personales

                    </v-card-title>

                    <template #append>

                        <v-btn color="primary" variant="tonal" rounded="lg" size="small"

                            class="text-none font-weight-bold" prepend-icon="mdi-pencil"

                            @click="showPersonalModal = true">

                            Editar

                        </v-btn>

                    </template>

                </v-card-item>



                <v-card-text class="pa-4">

                    <v-row dense>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Carnet de identidad</label>

                                <p>{{ display(user.ci) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="12" md="8">

                            <div class="info-item">

                                <label>Nombres y apellidos</label>

                                <p>{{ fullName }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Género</label>

                                <p>{{ display(user.genero) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Celular</label>

                                <p>{{ display(user.celular) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="12" md="4">

                            <div class="info-item">

                                <label>Email</label>

                                <p>{{ display(user.email) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12">

                            <div class="info-item">

                                <label>Dirección</label>

                                <p>{{ display(user.direccion) }}</p>

                            </div>

                        </v-col>

                    </v-row>

                </v-card-text>

            </v-card>



            <v-card v-if="showEstudianteSection"

                class="rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>

                <div class="section-badge warning"></div>

                <v-card-item class="pb-1 pt-4">

                    <template v-slot:prepend>

                        <v-avatar color="warning-lighten-4" size="40">

                            <v-icon color="warning">mdi-school</v-icon>

                        </v-avatar>

                    </template>

                    <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">

                        Datos de estudiante

                    </v-card-title>

                </v-card-item>



                <v-card-text class="pa-4">

                    <v-row dense>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Registro universitario</label>

                                <p>{{ display(estudiante.registroUniversitario) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Facultad</label>

                                <p>{{ display(estudiante.facultad) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Carrera</label>

                                <p>{{ display(estudiante.carrera) }}</p>

                            </div>

                        </v-col>

                    </v-row>

                </v-card-text>

            </v-card>



            <v-alert v-else-if="isEstudiante && !estudiante" type="info" variant="tonal" rounded="xl" class="account-alert"

                title="Sin registro de estudiante"

                text="Tu rol es ESTUDIANTE, pero no hay un perfil de estudiante vinculado a tu persona. Usa «Registrar datos de» o contacta a un administrador." />



            <v-card v-if="showEstudianteSection"

                class="rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>

                <div class="section-badge warning"></div>

                <v-card-item class="pb-1 pt-4">

                    <template v-slot:prepend>

                        <v-avatar color="warning-lighten-4" size="40">

                            <v-icon color="warning">mdi-file-document-multiple</v-icon>

                        </v-avatar>

                    </template>

                    <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">

                        Documentos académicos

                    </v-card-title>

                </v-card-item>



                <v-card-text class="pa-4">

                    <v-row dense class="mb-4">

                        <v-col cols="12" sm="6">

                            <div class="info-item">

                                <label>PDF matrícula actual</label>

                                <p v-if="estudiante?.documentoMatriculaUrl">

                                    <a :href="resolveUploadUrl(estudiante.documentoMatriculaUrl)" target="_blank"

                                        rel="noopener" class="doc-link">

                                        Ver documento

                                    </a>

                                </p>

                                <p v-else>-</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6">

                            <div class="info-item">

                                <label>PDF carnet actual</label>

                                <p v-if="estudiante?.documentoCarnetUrl">

                                    <a :href="resolveUploadUrl(estudiante.documentoCarnetUrl)" target="_blank"

                                        rel="noopener" class="doc-link">

                                        Ver documento

                                    </a>

                                </p>

                                <p v-else>-</p>

                            </div>

                        </v-col>

                    </v-row>



                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">REEMPLAZAR PDF

                        MATRÍCULA</v-label>

                    <v-file-input v-model="pdfMatricula" accept="application/pdf" prepend-icon="mdi-file-pdf-box"

                        variant="outlined" density="comfortable" rounded="lg" class="mb-3" hide-details="auto"

                        clearable />



                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">REEMPLAZAR PDF

                        CARNET</v-label>

                    <v-file-input v-model="pdfCarnet" accept="application/pdf" prepend-icon="mdi-file-pdf-box"

                        variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details="auto"

                        clearable />



                    <v-btn color="warning" variant="flat" rounded="lg" class="text-none font-weight-bold"

                        prepend-icon="mdi-upload" :loading="saving" @click="requestDocumentsUpdate">

                        Actualizar documentos

                    </v-btn>

                </v-card-text>

            </v-card>



            <v-card v-if="showDocenteSection"

                class="rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>

                <div class="section-badge warning"></div>

                <v-card-item class="pb-1 pt-4">

                    <template v-slot:prepend>

                        <v-avatar color="warning-lighten-4" size="40">

                            <v-icon color="warning">mdi-human-male-board</v-icon>

                        </v-avatar>

                    </template>

                    <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">

                        Datos de docente

                    </v-card-title>

                </v-card-item>



                <v-card-text class="pa-4">

                    <v-row dense>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Número de ítem</label>

                                <p>{{ display(docente.numeroItem) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Facultad</label>

                                <p>{{ display(docente.facultad) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Interino / Contratado</label>

                                <p>{{ display(docente.interinoContratado) }}</p>

                            </div>

                        </v-col>

                    </v-row>

                </v-card-text>

            </v-card>



            <v-alert v-else-if="isDocente && !docente" type="info" variant="tonal" rounded="xl" class="account-alert"

                title="Sin registro de docente"

                text="Tu rol es DOCENTE, pero no hay un perfil de docente vinculado a tu persona. Usa «Registrar datos de» o contacta a un administrador." />



            <v-card v-if="showAdministrativoSection"

                class="rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>

                <div class="section-badge success"></div>

                <v-card-item class="pb-1 pt-4">

                    <template v-slot:prepend>

                        <v-avatar color="success-lighten-4" size="40">

                            <v-icon color="success">mdi-desk</v-icon>

                        </v-avatar>

                    </template>

                    <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">

                        Datos de administrativo

                    </v-card-title>

                </v-card-item>



                <v-card-text class="pa-4">

                    <v-row dense>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Número de ítem</label>

                                <p>{{ display(administrativo.numeroItem) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Unidad</label>

                                <p>{{ display(administrativo.unidad) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Cargo</label>

                                <p>{{ display(administrativo.cargo) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Estado laboral</label>

                                <p>{{ display(administrativo.estadoLaboral) }}</p>

                            </div>

                        </v-col>

                    </v-row>

                </v-card-text>

            </v-card>



            <v-alert v-else-if="isAdministrativo && !administrativo" type="info" variant="tonal" rounded="xl" class="account-alert"

                title="Sin registro de administrativo"

                text="Tu rol es ADMINISTRATIVO, pero no hay un perfil administrativo vinculado a tu persona. Usa «Registrar datos de» o contacta a un administrador." />



            <v-card v-if="showDoctorSection"

                class="rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>

                <div class="section-badge info"></div>

                <v-card-item class="pb-1 pt-4">

                    <template v-slot:prepend>

                        <v-avatar color="info-lighten-4" size="40">

                            <v-icon color="info">mdi-stethoscope</v-icon>

                        </v-avatar>

                    </template>

                    <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">

                        Datos de doctor

                    </v-card-title>

                </v-card-item>



                <v-card-text class="pa-4">

                    <v-row dense>

                        <v-col cols="12" sm="6" md="8">

                            <div class="info-item">

                                <label>Especialidad médica</label>

                                <p>{{ display(doctor.especialidad?.nombre) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Matrícula profesional</label>

                                <p>{{ display(doctor.matriculaProfesional) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Título profesional</label>

                                <p>{{ display(doctor.tituloProfesional) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Universidad de origen</label>

                                <p>{{ display(doctor.universidadOrigen) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Teléfono de emergencia</label>

                                <v-text-field
                                    v-model="doctorContactoForm.telefonoEmergencia"
                                    variant="outlined"
                                    density="compact"
                                    hide-details="auto"
                                    rounded="lg"
                                    placeholder="Ej: 71234567"
                                    class="mt-1"
                                />

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Compartir con pacientes</label>

                                <v-switch
                                    v-model="doctorContactoForm.compartirTelefonoEmergencia"
                                    color="primary"
                                    hide-details
                                    class="mt-1"
                                    label="Visible al reservar cita"
                                />

                            </div>

                        </v-col>

                        <v-col cols="12" class="d-flex justify-end">

                            <v-btn
                                color="primary"
                                variant="flat"
                                rounded="xl"
                                class="text-none font-weight-bold"
                                :loading="savingDoctorContacto"
                                @click="guardarContactoDoctor"
                            >
                                Guardar contacto
                            </v-btn>

                        </v-col>

                        <v-col cols="12">

                            <div class="info-item">

                                <label>Experiencia profesional</label>

                                <p>{{ display(doctor.experienciaProfesional) }}</p>

                            </div>

                        </v-col>

                    </v-row>

                </v-card-text>

            </v-card>



            <v-alert v-else-if="isDoctor && !doctor" type="info" variant="tonal" rounded="xl" class="account-alert"

                title="Sin registro de doctor"

                text="Tu rol es DOCTOR, pero no hay un perfil médico vinculado a tu persona. Contacta a un administrador." />



            <v-card v-if="showContratosSection"

                class="rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>

                <div class="section-badge warning"></div>

                <v-card-item class="pb-1 pt-4">

                    <template v-slot:prepend>

                        <v-avatar color="warning-lighten-4" size="40">

                            <v-icon color="warning">mdi-file-certificate-outline</v-icon>

                        </v-avatar>

                    </template>

                    <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">

                        Contratos de consultor

                    </v-card-title>

                    <template v-slot:append>

                        <v-btn color="warning" variant="flat" size="small" rounded="lg"

                            class="text-none font-weight-bold" prepend-icon="mdi-plus"

                            @click="openCreateContrato">

                            Nuevo contrato

                        </v-btn>

                    </template>

                </v-card-item>

                <v-card-text class="pa-4">

                    <div v-if="loadingContratos" class="text-body-2 text-medium-emphasis py-4">

                        Cargando contratos...

                    </div>

                    <div v-else-if="!contratos.length" class="text-body-2 text-medium-emphasis py-4">

                        No tienes contratos registrados.

                    </div>

                    <v-list v-else border rounded="lg" class="pa-0">

                        <v-list-item v-for="contrato in contratos" :key="contrato.idContratoConsultor"

                            class="px-4 py-3">

                            <v-list-item-title class="text-body-2 font-weight-bold">

                                {{ display(contrato.cargo) }}

                            </v-list-item-title>

                            <v-list-item-subtitle class="text-caption">

                                {{ display(contrato.unidad) }} ·

                                {{ formatContratoDate(contrato.fechaInicioContrato) }} -

                                {{ formatContratoDate(contrato.fechaFinContrato) }}

                            </v-list-item-subtitle>

                            <template v-slot:append>

                                <v-btn v-if="contrato.documentoContratoUrl" icon="mdi-file-pdf-box" variant="text"

                                    size="small" color="primary" :href="resolveUploadUrl(contrato.documentoContratoUrl)"

                                    target="_blank" rel="noopener" title="Ver PDF" />

                                <v-btn icon="mdi-pencil" variant="text" size="small" color="info"

                                    title="Editar" @click="openEditContrato(contrato)" />

                                <v-btn icon="mdi-delete" variant="text" size="small" color="error"

                                    title="Eliminar" @click="requestDeleteContrato(contrato)" />

                            </template>

                        </v-list-item>

                    </v-list>

                </v-card-text>

            </v-card>



            <v-alert v-else-if="isConsultor && !consultor" type="info" variant="tonal" rounded="xl" class="account-alert"

                title="Sin registro de consultor"

                text="Tu rol es CONSULTOR, pero no hay un perfil de consultor vinculado a tu persona. Contacta a un administrador." />



            <v-card class="rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>

                <div class="section-badge success"></div>

                <v-card-item class="pb-1 pt-4">

                    <template v-slot:prepend>

                        <v-avatar color="success-lighten-4" size="40">

                            <v-icon color="success">mdi-shield-account</v-icon>

                        </v-avatar>

                    </template>

                    <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">

                        Datos de acceso

                    </v-card-title>

                </v-card-item>



                <v-card-text class="pa-4">

                    <v-row dense>

                        <v-col cols="12" sm="6" md="4">

                            <div class="info-item">

                                <label>Usuario</label>

                                <p>{{ display(user.username) }}</p>

                            </div>

                        </v-col>

                        <v-col cols="12" sm="6" md="6">

                            <div class="info-item">

                                <label>Rol activo</label>

                                <p>{{ display(user.rol) }}</p>

                            </div>

                        </v-col>

                    </v-row>

                    <div class="d-flex flex-wrap ga-2 mt-2">

                        <v-btn color="primary" variant="tonal" rounded="lg" class="text-none font-weight-bold"

                            prepend-icon="mdi-account-edit" @click="showUsernameModal = true">

                            Editar usuario

                        </v-btn>

                        <v-btn color="primary" variant="tonal" rounded="lg" class="text-none font-weight-bold"

                            prepend-icon="mdi-lock-reset" @click="showPasswordModal = true">

                            Cambiar contraseña

                        </v-btn>

                    </div>

                </v-card-text>

            </v-card>

            </div>

        </template>



        <ModalInformacionConsultorContrato v-model="showContratoModal"

            :consultor-id="consultor?.idConsultor" :contrato="selectedContrato" @saved="onContratoSaved" />



        <ModalConfirmacion v-model="showRegisterConfirm"

            title="Registrar datos de rol"

            :message="registerConfirmMessage"

            type="warning"

            confirm-text="Continuar"

            cancel-text="Cancelar"

            @confirm="confirmRegisterTipo"

            @cancel="cancelRegisterConfirm" />



        <ModalRegistrarEstudiante v-model="showModalEstudiante" @saved="onRolRegistrado" />



        <ModalRegistrarDocente v-model="showModalDocente" @saved="onRolRegistrado" />



        <ModalRegistrarAdministrativo v-model="showModalAdministrativo" @saved="onRolRegistrado" />



        <ModalRegistrarConsultor v-model="showModalConsultorRegistro" @saved="onRolRegistrado" />



        <ModalCambiarContrasena v-model="showPasswordModal" :mandatory="mustChangePassword"

            @submit="onPasswordSubmit" />



        <ModalEditarDatosPersonales v-model="showPersonalModal" :user="user"

            @submit="onPersonalSubmit" />



        <ModalEditarUsuario v-model="showUsernameModal" :username="user?.username || ''"

            @submit="onUsernameSubmit" />



        <ModalConfirmacion v-model="showConfirmModal" :title="confirmTitle" :message="confirmMessage"

            :type="confirmType" confirm-text="Confirmar" cancel-text="Cancelar" @confirm="executePendingAction"

            @cancel="cancelConfirm" />



        <ModalMensaje v-model="showForcePasswordInfo" title="Contraseña reestablecida" type="warning"

            message="Un administrador reestableció tu contraseña. Como aún coincide con tu usuario (CI), debes crear una nueva contraseña para continuar."

            button-text="Cambiar contraseña" @confirm="onForcePasswordInfoConfirm" />



        <ModalMensaje v-model="showSuccessModal" :title="successTitle" :message="successMessage" type="success"

            @confirm="onSuccessModalConfirm" />



        <ModalMensaje v-model="showErrorModal" :title="errorTitle" :message="errorMessage" type="error"

            @confirm="showErrorModal = false" />

    </div>

</template>



<style scoped>

.max-width-form {

    max-width: 1200px;

}



.account-cards-grid {

    display: grid;

    grid-template-columns: 1fr;

    gap: 1.5rem;

}



@media (min-width: 960px) {

    .account-cards-grid {

        grid-template-columns: 1fr 1fr;

        align-items: start;

    }

}



.account-alert {

    margin-bottom: 0;

}



.profile-hero {

    background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);

}



.avatar-wrapper {

    display: inline-block;

}



.profile-avatar {

    background-color: rgb(var(--v-theme-primary));

    border: 3px solid white;

}



.avatar-edit-btn {

    position: absolute;

    bottom: 0;

    right: 0;

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



.info-item {

    margin-bottom: 8px;

}



.info-item label {

    display: block;

    font-size: 0.65rem;

    font-weight: 800;

    text-transform: uppercase;

    color: #94a3b8;

    letter-spacing: 0.05em;

    margin-bottom: 2px;

}



.info-item p {

    font-size: 0.95rem;

    font-weight: 600;

    color: #334155;

    margin: 0;

}



.doc-link {

    color: rgb(var(--v-theme-primary));

    text-decoration: none;

    font-weight: 600;

}



.doc-link:hover {

    text-decoration: underline;

}

</style>

