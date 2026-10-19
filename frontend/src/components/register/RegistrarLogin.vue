<script setup>
import { ref, onMounted } from 'vue'
import logoDiv from '@/assets/LogoDiv.png'
import logoBS from '@/assets/LogoBS.jpeg'
import logoUmsa from '@/assets/Umsa-logo.svg'
import logoFCPN from '@/assets/EscudoFCPN.png'
import ModalMensaje from '@/components/common/ModalMensaje.vue'

import enfermeria from '@/assets/login/enfermeria.jpeg'
import fisioterapia from '@/assets/login/fisioterapia.jpeg'
import medicinaGeneral from '@/assets/login/medicina-general.jpeg'
import medicinaGeneral2 from '@/assets/login/medicina-general2.jpg.jpeg'
import odoontologia from '@/assets/login/odoontologia.jpeg'
import psicologia from '@/assets/login/psicologia.jpeg'
import { useRegistroEstudianteStore } from '@/stores/registroEstudiante'
import { APP_NAME } from '@/config/app'
import { fileFromVuetifyInput } from '@/utils/fileFromVuetifyInput'
import { userFacingErrorMessage } from '@/utils/networkError'

const carouselImages = [
    enfermeria,
    fisioterapia,
    medicinaGeneral,
    medicinaGeneral2,
    odoontologia,
    psicologia
]

const emit = defineEmits(['back'])
const registroStore = useRegistroEstudianteStore()

const currentStep = ref(1)
const registroType = ref('')
const formRef = ref(null)
const showErrorModal = ref(false)
const errorTitle = ref('No se pudo registrar')
const errorMessage = ref('')
const errorTimestamp = ref('')
const facultades = ref([])
const carreras = ref([])

const openErrorModal = (title, message, timestamp) => {
    errorTitle.value = title
    errorMessage.value = message
    errorTimestamp.value = timestamp || new Date().toISOString()
    showErrorModal.value = true
}

const form = ref({
    // Datos personales
    ci: '',
    nombres: '',
    paterno: '',
    materno: '',
    fechaNacimiento: '',
    genero: '',
    celular: '',
    email: '',
    direccion: '',

    // Estudiante
    registroUniversitario: '',
    idCarrera: null,
    idFacultad: null,
    pdfMatricula: null,
    pdfCarnet: null,

    // Docente
    numeroItemDocente: '',
    facultadDocente: '',
    interinoContratado: '',

    // Administrativo
    numeroItemAdmin: '',
    unidadAdmin: '',
    cargoAdmin: '',

    // Consultor
    tipoServicio: '',
    unidadConsultor: '',
    fechaInicioContrato: '',
    fechaFinContrato: '',
    cargoConsultor: '',
    pdfContrato: null,

    // Datos de usuario
    password: '',
    confirmPassword: '',
    captchaInput: '',
    captchaToken: ''
})

const showPass = ref(false)
const showConfirmPass = ref(false)
const showSuccessModal = ref(false)
const captchaText = ref('')

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value)
const requiredRule = (label) => (v) => !!trimmed(v) || `${label} es requerido`
const emailRule = (v) => /.+@.+\..+/.test(v) || 'E-mail debe ser válido'
const passwordRule = (v) => (v && v.length >= 8) || 'La contraseña debe tener mínimo 8 caracteres'
const confirmPasswordRule = (v) => v === form.value.password || 'Las contraseñas no coinciden'
const pdfRule = (label, maxBytes) => (v) => {
    const file = fileFromVuetifyInput(v)
    if (!file) return `${label} es obligatorio`
    if (file.type !== 'application/pdf') return `${label} debe ser un PDF`
    if (file.size > maxBytes) {
        const maxMb = maxBytes / (1024 * 1024)
        return `${label} no debe superar ${maxMb}MB`
    }
    return true
}

const PDF_MATRICULA_MAX = 1 * 1024 * 1024
const PDF_CARNET_MAX = 3 * 1024 * 1024
const PDF_CONTRATO_MAX = 3 * 1024 * 1024

const generateCaptcha = async () => {
    try {
        const data = await registroStore.fetchCaptcha()
        captchaText.value = data.captchaText
        form.value.captchaToken = data.captchaToken
        form.value.captchaInput = ''
    } catch (error) {
        openErrorModal(
            'No se pudo cargar el captcha',
            userFacingErrorMessage(error, 'No se pudo cargar el captcha. Intenta nuevamente.'),
            error?.timestamp
        )
    }
}

const registrationTypes = [
    { value: 'Estudiante', label: 'Estudiante', icon: 'mdi-school' },
    { value: 'Docente', label: 'Docente', icon: 'mdi-human-male-board' },
    { value: 'Administrativo', label: 'Administrativo', icon: 'mdi-desk' },
    { value: 'Consultor', label: 'Consultor', icon: 'mdi-briefcase' }
]

const selectType = (type) => {
    registroType.value = type
    currentStep.value = 2
}

const loadCarreras = async () => {
    carreras.value = []
    form.value.idCarrera = null
    if (!form.value.idFacultad) return
    try {
        carreras.value = await registroStore.fetchCarreras(form.value.idFacultad)
    } catch (error) {
        openErrorModal(
            'No se pudieron cargar carreras',
            userFacingErrorMessage(error, 'No se pudieron cargar las carreras. Intenta nuevamente.'),
            error?.timestamp
        )
    }
}

const validateCurrentStep = async () => {
    const validation = await formRef.value?.validate()
    if (!validation?.valid) return false

    if (currentStep.value === 4 && !form.value.captchaInput) {
        openErrorModal('No se pudo registrar', 'Debes completar la verificación antibot.')
        return false
    }

    return true
}

const nextStep = async () => {
    const valid = await validateCurrentStep()
    if (!valid) return
    if (currentStep.value < 4) currentStep.value++
}

const prevStep = () => {
    if (currentStep.value > 1) currentStep.value--
    else emit('back')
}

const appendField = (payload, key, value) => {
    payload.append(key, trimmed(value))
}

const basePayload = () => {
    const payload = new FormData()
    appendField(payload, 'ci', form.value.ci)
    appendField(payload, 'nombres', form.value.nombres)
    appendField(payload, 'primerApellido', form.value.paterno)
    appendField(payload, 'segundoApellido', form.value.materno)
    appendField(payload, 'fechaNacimiento', form.value.fechaNacimiento)
    appendField(payload, 'genero', form.value.genero)
    appendField(payload, 'celular', form.value.celular)
    appendField(payload, 'email', form.value.email)
    appendField(payload, 'direccion', form.value.direccion)
    appendField(payload, 'password', form.value.password)
    appendField(payload, 'confirmPassword', form.value.confirmPassword)
    appendField(payload, 'captchaInput', form.value.captchaInput)
    appendField(payload, 'captchaToken', form.value.captchaToken)
    return payload
}

const handleSubmit = async () => {
    const valid = await validateCurrentStep()
    if (!valid) return

    try {
        const payload = basePayload()

        if (registroType.value === 'Estudiante') {
            appendField(payload, 'registroUniversitario', form.value.registroUniversitario)
            appendField(payload, 'idFacultad', String(form.value.idFacultad))
            appendField(payload, 'idCarrera', String(form.value.idCarrera))
            appendField(payload, 'pdfMatricula', fileFromVuetifyInput(form.value.pdfMatricula))
            appendField(payload, 'pdfCarnet', fileFromVuetifyInput(form.value.pdfCarnet))
            await registroStore.registrarEstudiante(payload)
        } else if (registroType.value === 'Docente') {
            appendField(payload, 'numeroItem', form.value.numeroItemDocente)
            appendField(payload, 'facultad', form.value.facultadDocente)
            appendField(payload, 'interinoContratado', form.value.interinoContratado)
            await registroStore.registrarDocente(payload)
        } else if (registroType.value === 'Administrativo') {
            appendField(payload, 'numeroItem', form.value.numeroItemAdmin)
            appendField(payload, 'unidad', form.value.unidadAdmin)
            appendField(payload, 'cargo', form.value.cargoAdmin)
            await registroStore.registrarAdministrativo(payload)
        } else if (registroType.value === 'Consultor') {
            appendField(payload, 'tipoServicio', form.value.tipoServicio)
            appendField(payload, 'unidad', form.value.unidadConsultor)
            appendField(payload, 'fechaInicioContrato', form.value.fechaInicioContrato)
            appendField(payload, 'fechaFinContrato', form.value.fechaFinContrato)
            appendField(payload, 'cargo', form.value.cargoConsultor)
            appendField(payload, 'pdfContrato', fileFromVuetifyInput(form.value.pdfContrato))
            await registroStore.registrarConsultor(payload)
        }

        showSuccessModal.value = true
    } catch (error) {
        openErrorModal(
            'No se pudo registrar',
            userFacingErrorMessage(error, 'No se pudo completar el registro.'),
            error.timestamp
        )
        await generateCaptcha()
    }
}

const handleConfirmSuccess = () => {
    showSuccessModal.value = false
    emit('back')
}

onMounted(() => {
    generateCaptcha()
    registroStore.fetchFacultades().then((data) => {
        facultades.value = data
    }).catch((error) => {
        openErrorModal(
            'No se pudieron cargar facultades',
            userFacingErrorMessage(error, 'No se pudieron cargar facultades. Intenta nuevamente.'),
            error?.timestamp
        )
    })
})

const handleCancel = () => {
    emit('back')
}
</script>

<template>
    <v-card class="fill-height rounded-0 overflow-hidden" elevation="0">
        <v-row no-gutters class="fill-height w-100">
            <!-- Formulario a la izquierda -->
            <v-col cols="12" md="6" lg="5"
                class="bg-surface d-flex align-center justify-center position-relative scrollable-col">
                <div class="w-100 pa-6 pa-md-12 my-auto" style="max-width: 600px;">
                    <!-- Header: volver + marca (móvil) sin solaparse -->
                    <div class="mb-4 mb-md-6">
                        <v-btn variant="text" color="primary" prepend-icon="mdi-arrow-left"
                            class="text-none px-1 ms-n1" @click="handleCancel">
                            Volver al login
                        </v-btn>
                        <div class="d-md-none d-flex align-center justify-center gap-2 text-primary mt-2">
                            <img src="@/assets/logo_umsa_without_bg.png" alt="Logo UMSA"
                                style="height: 36px; width: auto; object-fit: contain;" />
                            <div class="text-h6 font-weight-bold">{{ APP_NAME }}</div>
                        </div>
                    </div>

                    <div class="text-center text-md-left mb-6">
                        <h2 class="text-h4 font-weight-bold text-high-emphasis mb-2 d-flex align-center justify-center justify-md-start flex-wrap gap-3">
                            Crear Cuenta
                            <span v-if="registroType" class="text-subtitle-1 font-weight-medium text-primary">
                                {{ registroType }}
                            </span>
                        </h2>
                        <p class="text-subtitle-1 text-medium-emphasis">
                            {{ currentStep === 1 ? 'Selecciona tu tipo' :
                                currentStep === 2 ? 'Datos personales' :
                                    currentStep === 3 ? 'Información de ' + registroType :
                                        'Configuración de cuenta' }}
                        </p>
                    </div>

                    <v-form ref="formRef" @submit.prevent="handleSubmit">
                        <!-- PASO 1: Selección de Tipo -->
                        <div v-if="currentStep === 1" class="d-flex flex-column gap-3 gap-md-4 py-2">
                            <v-hover v-for="type in registrationTypes" :key="type.value" v-slot="{ isHovering, props }">
                                <v-card v-bind="props" width="100%"
                                    class="d-flex align-center justify-space-between px-6 py-6 cursor-pointer transition-swing"
                                    :style="{ minHeight: '100px' }"
                                    :elevation="isHovering ? 8 : 2"
                                    :color="registroType === type.value ? 'primary' : 'surface'"
                                    @click="selectType(type.value)" rounded="xl">
                                    <div class="d-flex align-center gap-4">
                                        <v-icon :size="$vuetify.display.xs ? 28 : 32"
                                            :color="registroType === type.value ? 'white' : 'primary'">{{ type.icon
                                        }}</v-icon>
                                        <span class="text-body-1 font-weight-bold"
                                            :class="registroType === type.value ? 'text-white' : 'text-medium-emphasis'">{{
                                                type.label }}</span>
                                    </div>
                                    <v-icon :color="registroType === type.value ? 'white' : 'primary'"
                                        :icon="registroType === type.value ? 'mdi-check-circle' : 'mdi-chevron-right'"></v-icon>
                                </v-card>
                            </v-hover>
                        </div>

                        <!-- PASO 2: Datos Personales -->
                        <div v-if="currentStep === 2" class="step-container">
                            <v-row dense>
                                <v-col cols="12">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">CÉDULA
                                        DE
                                        IDENTIDAD</v-label>
                                    <v-text-field v-model="form.ci" variant="outlined" density="comfortable"
                                        rounded="lg" placeholder="Número de CI" hide-details="auto"
                                        :rules="[requiredRule('El CI')]"
                                        class="mb-2"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">NOMBRES</v-label>
                                    <v-text-field v-model="form.nombres" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto" class="mb-2"
                                        :rules="[requiredRule('Nombres')]"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="3">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">PATERNO</v-label>
                                    <v-text-field v-model="form.paterno" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto" class="mb-2"
                                        :rules="[requiredRule('Paterno')]"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="3">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">MATERNO</v-label>
                                    <v-text-field v-model="form.materno" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto" class="mb-2"
                                        :rules="[requiredRule('Materno')]"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">FECHA
                                        NACIMIENTO</v-label>
                                    <v-text-field v-model="form.fechaNacimiento" type="date" variant="outlined"
                                        density="comfortable" rounded="lg" hide-details="auto"
                                        :rules="[requiredRule('Fecha de nacimiento')]"
                                        class="mb-2"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">GÉNERO</v-label>
                                    <v-select v-model="form.genero"
                                        :items="[{ title: 'Femenino', value: 'F' }, { title: 'Masculino', value: 'M' }]"
                                        variant="outlined" density="comfortable" rounded="lg" hide-details="auto"
                                        :rules="[requiredRule('Género')]"
                                        class="mb-2"></v-select>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">CELULAR</v-label>
                                    <v-text-field v-model="form.celular" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto" class="mb-2"
                                        :rules="[requiredRule('Celular')]"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">EMAIL</v-label>
                                    <v-text-field v-model="form.email" type="email" variant="outlined"
                                        density="comfortable" rounded="lg" hide-details="auto"
                                        :rules="[requiredRule('Email'), emailRule]"
                                        class="mb-2"></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">DIRECCIÓN</v-label>
                                    <v-text-field v-model="form.direccion" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto" class="mb-2"
                                        :rules="[requiredRule('Dirección')]"></v-text-field>
                                </v-col>
                            </v-row>
                        </div>

                        <!-- PASO 3: Datos Específicos -->
                        <div v-if="currentStep === 3" class="step-container">
                            <!-- Estudiante -->
                            <v-row v-if="registroType === 'Estudiante'" dense>
                                <v-col cols="12">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">REGISTRO
                                        UNIVERSITARIO</v-label>
                                    <v-text-field v-model="form.registroUniversitario" type="number" variant="outlined"
                                        density="comfortable" rounded="lg" hide-details="auto"
                                        :rules="[requiredRule('El RU')]"
                                        class="mb-2"></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">FACULTAD</v-label>
                                    <v-select v-model="form.idFacultad"
                                        :items="facultades.map(f => ({ title: f.nombre, value: f.idFacultad }))"
                                        variant="outlined" density="comfortable" rounded="lg" hide-details="auto"
                                        class="mb-2" :rules="[requiredRule('Facultad')]" @update:model-value="loadCarreras"></v-select>
                                </v-col>
                                <v-col cols="12">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">CARRERA</v-label>
                                    <v-select v-model="form.idCarrera"
                                        :items="carreras.map(c => ({ title: c.nombre, value: c.idCarrera }))"
                                        :disabled="!form.idFacultad" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto" class="mb-2"
                                        :rules="[requiredRule('Carrera')]"></v-select>
                                </v-col>
                                <v-col cols="12">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">PDF
                                        MATRÍCULA (máx. 1MB)</v-label>
                                    <v-file-input v-model="form.pdfMatricula" accept="application/pdf"
                                        prepend-icon="mdi-file-pdf-box" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto"
                                        :rules="[pdfRule('El PDF de matrícula', PDF_MATRICULA_MAX)]"></v-file-input>
                                </v-col>
                                <v-col cols="12">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">PDF
                                        CARNET DE IDENTIDAD (máx. 3MB)</v-label>
                                    <v-file-input v-model="form.pdfCarnet" accept="application/pdf"
                                        prepend-icon="mdi-file-pdf-box" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto"
                                        :rules="[pdfRule('El PDF de carnet', PDF_CARNET_MAX)]"></v-file-input>
                                </v-col>
                            </v-row>

                            <!-- Docente -->
                            <v-row v-if="registroType === 'Docente'" dense>
                                <v-col cols="12">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">NÚMERO
                                        ITEM</v-label>
                                    <v-text-field v-model="form.numeroItemDocente" variant="outlined"
                                        density="comfortable" rounded="lg" hide-details="auto"
                                        class="mb-2"></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">FACULTAD</v-label>
                                    <v-select v-model="form.facultadDocente"
                                        :items="facultades.map(f => ({ title: f.nombre, value: f.nombre }))"
                                        variant="outlined" density="comfortable" rounded="lg" hide-details="auto"
                                        class="mb-2" :rules="[requiredRule('Facultad')]"></v-select>
                                </v-col>
                                <v-col cols="12">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">INTERINO /
                                        CONTRATADO</v-label>
                                    <v-select v-model="form.interinoContratado"
                                        :items="[{ title: 'Interino', value: 'Interino' }, { title: 'Contratado', value: 'Contratado' }]"
                                        variant="outlined" density="comfortable" rounded="lg" hide-details="auto"
                                        class="mb-2" :rules="[requiredRule('Tipo de cargo')]"></v-select>
                                </v-col>
                            </v-row>

                            <!-- Administrativo -->
                            <v-row v-if="registroType === 'Administrativo'" dense>
                                <v-col cols="12">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">NÚMERO
                                        ITEM</v-label>
                                    <v-text-field v-model="form.numeroItemAdmin" variant="outlined"
                                        density="comfortable" rounded="lg" hide-details="auto"
                                        class="mb-2"></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">UNIDAD</v-label>
                                    <v-text-field v-model="form.unidadAdmin" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto" class="mb-2"></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">CARGO</v-label>
                                    <v-text-field v-model="form.cargoAdmin" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto" class="mb-2"></v-text-field>
                                </v-col>
                            </v-row>

                            <!-- Consultor -->
                            <v-row v-if="registroType === 'Consultor'" dense>
                                <v-col cols="12" sm="6">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">TIPO DE
                                        SERVICIO *</v-label>
                                    <v-text-field v-model="form.tipoServicio" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto" class="mb-2"
                                        :rules="[requiredRule('Tipo de servicio')]"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">UNIDAD *</v-label>
                                    <v-text-field v-model="form.unidadConsultor" variant="outlined"
                                        density="comfortable" rounded="lg" hide-details="auto"
                                        class="mb-2" :rules="[requiredRule('Unidad')]"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">INICIO
                                        CONTRATO *</v-label>
                                    <v-text-field v-model="form.fechaInicioContrato" type="date" variant="outlined"
                                        density="comfortable" rounded="lg" hide-details="auto"
                                        class="mb-2" :rules="[requiredRule('Inicio de contrato')]"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">FIN
                                        CONTRATO *</v-label>
                                    <v-text-field v-model="form.fechaFinContrato" type="date" variant="outlined"
                                        density="comfortable" rounded="lg" hide-details="auto"
                                        class="mb-2" :rules="[requiredRule('Fin de contrato')]"></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">CARGO *</v-label>
                                    <v-text-field v-model="form.cargoConsultor" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto" class="mb-2"
                                        :rules="[requiredRule('Cargo')]"></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">PDF
                                        CONTRATO (máx. 3MB) *</v-label>
                                    <v-file-input v-model="form.pdfContrato" accept="application/pdf"
                                        prepend-icon="mdi-file-pdf-box" variant="outlined" density="comfortable"
                                        rounded="lg" hide-details="auto"
                                        :rules="[pdfRule('El PDF de contrato', PDF_CONTRATO_MAX)]"></v-file-input>
                                </v-col>
                            </v-row>
                        </div>

                        <!-- PASO 4: Datos de Usuario -->
                        <div v-if="currentStep === 4" class="step-container">
                            <v-row dense>
                                <v-col cols="12">
                                    <v-alert type="info" variant="tonal" density="comfortable" class="mb-2">
                                        Tu usuario será tu número de CI.
                                    </v-alert>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">CONTRASEÑA</v-label>
                                    <v-text-field v-model="form.password" :type="showPass ? 'text' : 'password'"
                                        prepend-inner-icon="mdi-lock-outline"
                                        :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
                                        @click:append-inner="showPass = !showPass" variant="outlined"
                                        density="comfortable" rounded="lg" hide-details="auto"
                                        :rules="[requiredRule('Contraseña'), passwordRule]"
                                        class="mb-2"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-label class="mb-1 text-caption text-medium-emphasis font-weight-bold">CONFIRMAR
                                        CONTRASEÑA</v-label>
                                    <v-text-field v-model="form.confirmPassword"
                                        :type="showConfirmPass ? 'text' : 'password'"
                                        prepend-inner-icon="mdi-lock-check-outline"
                                        :append-inner-icon="showConfirmPass ? 'mdi-eye-off' : 'mdi-eye'"
                                        @click:append-inner="showConfirmPass = !showConfirmPass" variant="outlined"
                                        density="comfortable" rounded="lg" hide-details="auto"
                                        :rules="[requiredRule('Confirmar contraseña'), confirmPasswordRule]"
                                        class="mb-2"></v-text-field>
                                </v-col>

                                <v-col cols="12">
                                    <v-label
                                        class="mb-1 text-caption text-medium-emphasis font-weight-bold">VERIFICACIÓN
                                        ANTIBOT</v-label>
                                    <div
                                        class="d-flex align-center gap-4 mb-2 bg-grey-lighten-4 pa-3 rounded-lg border">
                                        <div
                                            class="captcha-box text-h5 font-weight-black text-primary letter-spacing-widest">
                                            {{ captchaText }}
                                        </div>
                                        <v-btn icon="mdi-refresh" variant="text" size="small"
                                            @click="generateCaptcha"></v-btn>
                                        <v-text-field v-model="form.captchaInput" placeholder="Escribe el código"
                                            variant="outlined" density="compact" hide-details
                                            :rules="[requiredRule('Captcha')]"
                                            class="flex-grow-1"></v-text-field>
                                    </div>
                                </v-col>
                            </v-row>
                        </div>

                        <!-- Botones de Acción -->
                        <div class="d-flex gap-3 gap-md-4 mt-8">
                            <v-btn v-if="currentStep > 1" variant="tonal" color="medium-emphasis" size="x-large"
                                rounded="lg" class="flex-grow-1 text-none" height="56" @click="prevStep">
                                Atrás
                            </v-btn>
                            <v-btn v-if="currentStep === 1" variant="tonal" color="error" size="x-large" rounded="lg"
                                class="flex-grow-1 text-none" height="56" @click="handleCancel">
                                Cancelar
                            </v-btn>

                            <v-btn v-if="currentStep === 2 || currentStep === 3" color="primary" size="x-large"
                                rounded="lg" class="flex-grow-1 text-none" height="56" @click="nextStep">
                                Continuar
                            </v-btn>

                            <v-btn v-if="currentStep === 4" type="submit" color="primary" size="x-large" rounded="lg"
                                class="flex-grow-1 elevation-2 text-none" height="56" :loading="registroStore.loading">
                                <v-icon start icon="mdi-account-plus" class="mr-2"></v-icon>
                                Registrarme
                            </v-btn>
                        </div>

                        <!-- Modal de Éxito Mockup -->
                        <ModalMensaje v-model="showSuccessModal" title="¡Registro exitoso!"
                            message="Tu cuenta fue creada correctamente. Ya puedes iniciar sesión con tu número de CI y la contraseña que registraste."
                            type="success" buttonText="Entendido" @confirm="handleConfirmSuccess" />
                        <ModalMensaje v-model="showErrorModal" :title="errorTitle"
                            :message="errorMessage" :timestamp="errorTimestamp" type="error" buttonText="Entendido"
                            @confirm="showErrorModal = false" />

                        <!-- Mobile Footer consistencia con LoginInicio -->
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
                                style="font-size: 0.65rem !important;">UMSA - BIENESTAR
                                SOCIAL</span>
                        </div>
                    </v-form>
                </div>
            </v-col>

            <!-- Imagen a la derecha -->
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
                            Únete a nuestra<br />Comunidad Médica.
                        </h1>
                        <p class="text-h6 text-white opacity-90" style="max-width: 600px; line-height: 1.6;">
                            Gestiona tu salud y consultas de manera eficiente con las herramientas más
                            avanzadas.
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
        </v-row>
    </v-card>
</template>

<style scoped>
.scrollable-col {
    overflow-y: auto;
    max-height: 100vh;
}

@media (max-width: 960px) {
    .scrollable-col {
        min-height: 100dvh;
        max-height: none;
        overflow-y: visible;
        display: flex !important;
        flex-direction: column;
        justify-content: center;
        align-items: center;
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

.step-container {
    animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.captcha-box {
    background: repeating-linear-gradient(45deg,
            #f5f5f5,
            #f5f5f5 10px,
            #eeeeee 10px,
            #eeeeee 20px);
    padding: 10px 20px;
    border-radius: 8px;
    user-select: none;
    font-family: 'Courier New', Courier, monospace;
    text-decoration: line-through;
    font-style: italic;
}

.letter-spacing-widest {
    letter-spacing: 0.3em;
}

.v-card.cursor-pointer:hover {
    transform: translateY(-4px);
}

/* Custom scrollbar */
.scrollable-col::-webkit-scrollbar {
    width: 6px;
}

.scrollable-col::-webkit-scrollbar-track {
    background: transparent;
}

.scrollable-col::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 10px;
}

.scrollable-col::-webkit-scrollbar-thumb:hover {
    background: #bdbdbd;
}
</style>
