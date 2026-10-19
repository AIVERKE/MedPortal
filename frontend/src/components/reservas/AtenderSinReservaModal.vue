<template>
    <v-dialog v-model="internalValue" max-width="600" persistent>
        <v-card class="rounded-xl overflow-hidden shadow-premium d-flex flex-column" style="max-height: 90vh;">
            <!-- Header with Gradient Area -->
            <v-sheet :color="isEmergency ? 'error' : 'primary'"
                class="pa-4 pa-sm-6 text-center position-relative overflow-hidden">
                <div class="header-overlay"></div>
                <v-avatar color="white" :size="$vuetify.display.xs ? 48 : 64" class="mb-3 elevation-4">
                    <v-icon :color="isEmergency ? 'error' : 'primary'" :size="$vuetify.display.xs ? 24 : 32">
                        {{ isEmergency ? 'mdi-alert-circle' : 'mdi-account-search' }}
                    </v-icon>
                </v-avatar>
                <h2 class="text-h6 text-sm-h5 font-weight-black text-white position-relative">
                    {{ isEmergency ? 'Atención de Emergencia' : 'Atención Sin Reserva' }}
                </h2>
                <p class="text-caption text-sm-subtitle-2 text-white opacity-80 position-relative">
                    {{ isEmergency
                        ? 'Busca un paciente para atención inmediata de emergencia'
                        : 'Busca un paciente para iniciar su atención inmediata' }}
                </p>

                <v-btn icon="mdi-close" variant="text" color="white" @click="close" class="position-absolute"
                    style="top: 8px; right: 8px;"></v-btn>
            </v-sheet>

            <v-card-text class="pa-8 overflow-y-auto flex-grow-1">
                <v-window v-model="step">
                    <!-- PASO 1: Búsqueda del Paciente -->
                    <v-window-item :value="1">
                        <!-- Search Section -->
                        <div class="mb-8">
                            <div class="d-flex align-center gap-2 mb-3">
                                <v-icon color="primary" size="small">mdi-magnify</v-icon>
                                <span class="text-caption font-weight-bold text-uppercase text-primary"
                                    style="letter-spacing: 1px;">
                                    Buscador de Pacientes *
                                </span>
                            </div>
                            <v-autocomplete v-model="selectedPersona" :items="personaItems"
                                :loading="personasStore.loading" item-title="fullName" item-value="idPersona"
                                placeholder="Ingresa Nombre o CI..." variant="outlined" color="primary" rounded="lg"
                                :rules="requiredRules" return-object :custom-filter="customFilter"
                                @update:model-value="handleSelection">
                                <template v-slot:item="{ props, item }">
                                    <v-list-item v-bind="props" :title="item.raw.fullName"
                                        :subtitle="item.raw.isOther ? 'Ingresar manualmente' : 'CI: ' + item.raw.ci">
                                        <template v-slot:prepend>
                                            <v-avatar
                                                :color="item.raw.isOther ? 'success-lighten-5' : 'primary-lighten-5'"
                                                size="32">
                                                <v-icon :color="item.raw.isOther ? 'success' : 'primary'" size="18">
                                                    {{ item.raw.isOther ? 'mdi-plus-circle-outline' : 'mdi-account' }}
                                                </v-icon>
                                            </v-avatar>
                                        </template>
                                    </v-list-item>
                                </template>
                            </v-autocomplete>
                        </div>

                        <v-divider class="mb-8"></v-divider>

                        <!-- Data Fields -->
                        <v-row>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.nombres" label="Nombres *" variant="outlined"
                                    :readonly="!isManual" density="comfortable" color="primary" rounded="lg"
                                    prepend-inner-icon="mdi-account-outline" :rules="requiredRules"
                                    :hide-details="!isManual"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.ci" label="Carnet de Identidad *" variant="outlined"
                                    :readonly="!isManual" density="comfortable" color="primary" rounded="lg"
                                    prepend-inner-icon="mdi-card-account-details-outline" :rules="requiredRules"
                                    :hide-details="!isManual"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.primerApellido" label="Apellido Paterno *" variant="outlined"
                                    :readonly="!isManual" density="comfortable" color="primary"
                                    rounded="lg" :rules="requiredRules" :hide-details="!isManual"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.segundoApellido" label="Apellido Materno *" variant="outlined"
                                    :readonly="!isManual" density="comfortable" color="primary"
                                    rounded="lg" :rules="requiredRules" :hide-details="!isManual"></v-text-field>
                            </v-col>
                        </v-row>
                    </v-window-item>

                    <!-- PASO 2: Detalles de Emergencia -->
                    <v-window-item :value="2">
                        <div class="d-flex align-center gap-2 mb-6">
                            <v-icon color="error" size="small">mdi-alert-circle</v-icon>
                            <span class="text-caption font-weight-bold text-uppercase text-error"
                                style="letter-spacing: 1px;">
                                Detalles de la Emergencia
                            </span>
                        </div>
                        <v-row>
                            <v-col cols="12" sm="6">
                                <v-menu
                                    v-model="menuFechaEmergencia"
                                    :close-on-content-click="false"
                                    transition="scale-transition"
                                    max-width="320"
                                >
                                    <template #activator="{ props: menuProps }">
                                        <v-text-field
                                            v-bind="menuProps"
                                            :model-value="formatFechaDMY(emergencyForm.fechaAtencion)"
                                            label="Fecha de Atención *"
                                            prepend-inner-icon="mdi-calendar"
                                            readonly
                                            variant="outlined"
                                            density="comfortable"
                                            color="primary"
                                            rounded="lg"
                                            :rules="requiredRules"
                                        />
                                    </template>
                                    <v-date-picker
                                        v-model="fechaEmergenciaPicker"
                                        hide-header
                                        color="error"
                                        title="Fecha de Atención"
                                    />
                                </v-menu>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="emergencyForm.horaInicio" type="time" label="Hora de Inicio *"
                                    variant="outlined" density="comfortable" color="primary"
                                    rounded="lg" :rules="requiredRules"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="emergencyForm.horaFin" type="time" label="Hora de Fin *"
                                    variant="outlined" density="comfortable" color="primary"
                                    rounded="lg" :rules="requiredRules"></v-text-field>
                            </v-col>
                            <v-col cols="12">
                                <v-textarea v-model="emergencyForm.descripcionCaso" label="Descripción del Caso *"
                                    variant="outlined" density="comfortable" color="primary" rounded="lg"
                                    rows="3" :rules="requiredRules"></v-textarea>
                            </v-col>
                        </v-row>
                    </v-window-item>

                    <!-- PASO 3: Detalles Atencion Sin Reserva -->
                    <v-window-item :value="3">
                        <div class="d-flex align-center gap-2 mb-6">
                            <v-icon color="success" size="small">mdi-stethoscope</v-icon>
                            <span class="text-caption font-weight-bold text-uppercase text-success"
                                style="letter-spacing: 1px;">
                                Detalles de la Atención
                            </span>
                        </div>
                        <v-row>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.nombres" label="Paciente *" variant="outlined" readonly
                                    density="comfortable" color="primary" rounded="lg" hide-details></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="sinReservaForm.doctorNombre" label="Doctor *" variant="outlined"
                                    readonly density="comfortable" color="primary" rounded="lg"
                                    hide-details></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="sinReservaForm.especialidadNombre" label="Especialidad *"
                                    variant="outlined" readonly density="comfortable" color="primary"
                                    rounded="lg" hide-details></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="sinReservaForm.postaNombre" label="Posta *" variant="outlined"
                                    readonly density="comfortable" color="primary" rounded="lg"
                                    hide-details></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-menu
                                    v-model="menuFechaSinReserva"
                                    :close-on-content-click="false"
                                    transition="scale-transition"
                                    max-width="320"
                                >
                                    <template #activator="{ props: menuProps }">
                                        <v-text-field
                                            v-bind="menuProps"
                                            :model-value="formatFechaDMY(sinReservaForm.fechaAtendido)"
                                            label="Fecha de Atención *"
                                            prepend-inner-icon="mdi-calendar"
                                            readonly
                                            variant="outlined"
                                            density="comfortable"
                                            color="primary"
                                            rounded="lg"
                                            :rules="requiredRules"
                                        />
                                    </template>
                                    <v-date-picker
                                        v-model="fechaSinReservaPicker"
                                        hide-header
                                        color="success"
                                        title="Fecha de Atención"
                                    />
                                </v-menu>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="sinReservaForm.horaAtendido" type="time" label="Hora de Inicio *"
                                    variant="outlined" density="comfortable" color="primary"
                                    rounded="lg" :rules="requiredRules"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="sinReservaForm.horaFin" type="time" label="Hora de Fin *"
                                    variant="outlined" density="comfortable" color="primary"
                                    rounded="lg" :rules="requiredRules"></v-text-field>
                            </v-col>
                            <v-col cols="12">
                                <v-textarea v-model="sinReservaForm.observaciones" label="Observaciones *"
                                    variant="outlined" density="comfortable" color="primary" rounded="lg"
                                    rows="3" :rules="requiredRules"></v-textarea>
                            </v-col>
                        </v-row>
                    </v-window-item>
                </v-window>
            </v-card-text>

            <v-divider></v-divider>

            <div class="pa-4 pa-sm-6">
                <!-- Botones Paso 1 -->
                <v-row dense v-if="step === 1">
                    <v-col cols="12" v-if="isEmergency">
                        <v-btn block color="error" rounded="lg" elevation="2" class="text-none font-weight-bold"
                            :disabled="!selectedPersona" @click="goToStep2" prepend-icon="mdi-arrow-right"
                            style="white-space: normal; height: auto; min-height: 48px;">
                            Siguiente Paso
                        </v-btn>
                    </v-col>
                    <!-- 
                    <v-col cols="12" v-if="!isEmergency">
                        <v-btn block color="primary" rounded="lg" elevation="2" class="text-none font-weight-bold"
                            :disabled="!selectedPersona" @click="confirmar" prepend-icon="mdi-stethoscope"
                            style="white-space: normal; height: auto; min-height: 48px;">
                            Iniciar Historial Médico
                        </v-btn>
                    </v-col>
                    <v-col cols="12" v-if="!isEmergency">
                        <v-btn block color="deep-purple-lighten-1" rounded="lg" elevation="2"
                            class="text-none font-weight-bold" :disabled="!selectedPersona" @click="confirmarPsicologia"
                            prepend-icon="mdi-brain" style="white-space: normal; height: auto; min-height: 48px;">
                            Iniciar Consulta Psicología
                        </v-btn>
                    </v-col>
                    -->
                    <v-col cols="12" v-if="!isEmergency">
                        <v-btn block color="success" rounded="lg" elevation="2" class="text-none font-weight-bold"
                            :disabled="!selectedPersona" @click="goToStep2SinReserva" prepend-icon="mdi-arrow-right"
                            style="white-space: normal; height: auto; min-height: 48px;">
                            Siguiente
                        </v-btn>
                    </v-col>
                    <v-col cols="12">
                        <v-btn block variant="tonal" color="grey" rounded="lg" class="text-none font-weight-medium"
                            @click="close" prepend-icon="mdi-close">
                            Cancelar
                        </v-btn>
                    </v-col>
                </v-row>

                <!-- Botones Paso 2 -->
                <v-row dense v-else-if="step === 2">
                    <v-col cols="12" sm="6">
                        <v-btn block variant="tonal" color="grey" rounded="lg" class="text-none font-weight-medium"
                            @click="step = 1" prepend-icon="mdi-arrow-left" style="height: auto; min-height: 48px;">
                            Atrás
                        </v-btn>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-btn block color="error" rounded="lg" elevation="2" class="text-none font-weight-bold"
                            @click="terminarEmergencia" prepend-icon="mdi-check-all" :loading="isSubmitting"
                            style="white-space: normal; height: auto; min-height: 48px;">
                            Terminar Emergencia
                        </v-btn>
                    </v-col>
                </v-row>

                <!-- Botones Paso 3 -->
                <v-row dense v-else-if="step === 3">
                    <v-col cols="12" sm="6">
                        <v-btn block variant="tonal" color="grey" rounded="lg" class="text-none font-weight-medium"
                            @click="step = 1" prepend-icon="mdi-arrow-left" style="height: auto; min-height: 48px;">
                            Cancelar
                        </v-btn>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-btn block color="success" rounded="lg" elevation="2" class="text-none font-weight-bold"
                            @click="terminarSinReserva" prepend-icon="mdi-check-all" :loading="isSubmitting"
                            style="white-space: normal; height: auto; min-height: 48px;">
                            Atender
                        </v-btn>
                    </v-col>
                </v-row>
            </div>
        </v-card>
    </v-dialog>

    <ModalConfirmación v-model="showConfirmSinReserva" title="Confirmar atención" :message="confirmSinReservaMessage"
        type="warning" confirm-text="Sí, Atender" cancel-text="Cancelar" @confirm="confirmarSinReserva"
        @cancel="showConfirmSinReserva = false" />

    <ModalConfirmación v-model="showConfirmEmergencia" title="Confirmar emergencia" :message="confirmEmergenciaMessage"
        type="error" confirm-text="Sí, Registrar" cancel-text="Cancelar" @confirm="confirmarEmergencia"
        @cancel="showConfirmEmergencia = false" />

    <ModalMensaje v-model="showResultModal" :title="resultModalTitle" :message="resultModalMessage"
        :type="resultModalType" :button-text="resultModalType === 'success' ? 'Aceptar' : 'Entendido'"
        @confirm="onResultModalConfirm" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePersonasStore } from '@/stores/personas'
import { useEmergenciasStore } from '@/stores/emergencias'
import { useAuthStore } from '@/stores/auth'
import { useReservasStore } from '@/stores/reservas'
import { useAsignacionDoctoresStore } from '@/stores/asignacion_doctores_consultorio'
import ModalConfirmación from '@/components/common/ModalConfirmación.vue'
import ModalMensaje from '@/components/common/ModalMensaje.vue'

const props = defineProps({
    modelValue: Boolean,
    isEmergency: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'emergency-created'])

const router = useRouter()
const personasStore = usePersonasStore()
const emergenciasStore = useEmergenciasStore()
const authStore = useAuthStore()
const reservasStore = useReservasStore()
const asignacionStore = useAsignacionDoctoresStore()

// --- State ---
const step = ref(1)
const selectedPersona = ref(null)
const isManual = ref(false)
const isSubmitting = ref(false)
const showConfirmSinReserva = ref(false)
const showConfirmEmergencia = ref(false)
const showResultModal = ref(false)
const resultModalTitle = ref('')
const resultModalMessage = ref('')
const resultModalType = ref('success')

const form = ref({
    idPersona: null,
    nombres: '',
    primerApellido: '',
    segundoApellido: '',
    ci: ''
})

const emergencyForm = ref({
    fechaAtencion: '',
    horaInicio: '',
    horaFin: '',
    descripcionCaso: ''
})

const sinReservaForm = ref({
    fechaAtendido: '',
    horaAtendido: '',
    horaFin: '',
    observaciones: '',
    doctorNombre: '',
    especialidadNombre: '',
    postaNombre: ''
})

const requiredRules = [(v) => !!String(v ?? '').trim() || 'Campo obligatorio']

const menuFechaEmergencia = ref(false)
const menuFechaSinReserva = ref(false)

const formatFechaDMY = (fechaIso) => {
    if (!fechaIso) return ''
    const [y, m, d] = String(fechaIso).slice(0, 10).split('-')
    if (!y || !m || !d) return String(fechaIso)
    return `${d}/${m}/${y}`
}

const toLocalIsoDate = (val) => {
    if (!val) return ''
    const date = val instanceof Date ? val : new Date(val)
    if (Number.isNaN(date.getTime())) return ''
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const fechaEmergenciaPicker = computed({
    get() {
        if (!emergencyForm.value.fechaAtencion) return null
        return new Date(`${emergencyForm.value.fechaAtencion}T00:00:00`)
    },
    set(val) {
        if (!val) return
        emergencyForm.value.fechaAtencion = toLocalIsoDate(val)
        menuFechaEmergencia.value = false
    },
})

const fechaSinReservaPicker = computed({
    get() {
        if (!sinReservaForm.value.fechaAtendido) return null
        return new Date(`${sinReservaForm.value.fechaAtendido}T00:00:00`)
    },
    set(val) {
        if (!val) return
        sinReservaForm.value.fechaAtendido = toLocalIsoDate(val)
        menuFechaSinReserva.value = false
    },
})

const normalizeHora = (hora) => {
    if (!hora) return ''
    return hora.length === 5 ? `${hora}:00` : hora
}

const showIncompleteModal = (message) => {
    resultModalTitle.value = 'Datos incompletos'
    resultModalMessage.value = message
    resultModalType.value = 'warning'
    showResultModal.value = true
}

const isManualPatientComplete = () => {
    return !!(
        form.value.nombres?.trim() &&
        form.value.primerApellido?.trim() &&
        form.value.segundoApellido?.trim() &&
        form.value.ci?.trim()
    )
}

// --- Computed ---
const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const personaItems = computed(() => {
    const base = personasStore.personas.map(p => ({
        ...p,
        fullName: `${p.nombres} ${p.primerApellido} ${p.segundoApellido || ''}`.trim(),
        isOther: false
    }))

    if (props.isEmergency) {
        base.unshift({
            idPersona: 'OTRO',
            fullName: 'OTRO (Paciente no registrado)',
            isOther: true,
            nombres: '',
            primerApellido: '',
            segundoApellido: '',
            ci: ''
        })
    }

    return base
})

const customFilter = (value, query, item) => {
    if (query == null) return true
    const search = query.toLowerCase().trim()
    const name = (item.raw.fullName || '').toLowerCase()
    const ci = (item.raw.ci || '').toLowerCase()
    return name.includes(search) || ci.includes(search)
}

const pacienteNombre = computed(() => {
    return `${form.value.nombres} ${form.value.primerApellido} ${form.value.segundoApellido || ''}`.trim()
})

const confirmSinReservaMessage = computed(() => {
    return `¿Confirmas registrar la atención sin reserva del paciente ${pacienteNombre.value}?`
})

const confirmEmergenciaMessage = computed(() => {
    return `¿Confirmas registrar la emergencia del paciente ${pacienteNombre.value}?`
})

// --- Methods ---
const close = () => {
    internalValue.value = false
    selectedPersona.value = null
    isManual.value = false
    step.value = 1
    showConfirmSinReserva.value = false
    showConfirmEmergencia.value = false
    showResultModal.value = false
    resetForm()
}

const resetForm = () => {
    form.value = {
        idPersona: null,
        nombres: '',
        primerApellido: '',
        segundoApellido: '',
        ci: ''
    }

    const now = new Date()
    const tzoffset = (now).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString()

    emergencyForm.value = {
        fechaAtencion: localISOTime.substring(0, 10),
        horaInicio: localISOTime.substring(11, 16),
        horaFin: '',
        descripcionCaso: ''
    }

    sinReservaForm.value = {
        fechaAtendido: '',
        horaAtendido: '',
        horaFin: '',
        observaciones: '',
        doctorNombre: '',
        especialidadNombre: '',
        postaNombre: ''
    }
}

const handleSelection = (persona) => {
    if (persona) {
        if (persona.idPersona === 'OTRO') {
            isManual.value = true
            resetForm()
        } else {
            isManual.value = false
            form.value = {
                idPersona: persona.idPersona,
                nombres: persona.nombres,
                primerApellido: persona.primerApellido,
                segundoApellido: persona.segundoApellido,
                ci: persona.ci
            }
        }
    } else {
        isManual.value = false
        resetForm()
    }
}

const confirmar = () => {
    if (!selectedPersona.value) return
    if (isManual.value && !isManualPatientComplete()) {
        showIncompleteModal('Completa todos los datos del paciente (nombres, apellidos y CI).')
        return
    }

    router.push({
        path: '/doctor/historial-medico',
        query: {
            pacienteId: isManual.value ? 'NEW' : form.value.idPersona,
            nombre: `${form.value.nombres} ${form.value.primerApellido} ${form.value.segundoApellido || ''}`.trim(),
            ci: form.value.ci
        }
    })
    close()
}

const confirmarPsicologia = () => {
    if (!selectedPersona.value) return
    if (isManual.value && !isManualPatientComplete()) {
        showIncompleteModal('Completa todos los datos del paciente (nombres, apellidos y CI).')
        return
    }

    router.push({
        path: '/doctor/historial-medico',
        query: {
            pacienteId: isManual.value ? 'NEW' : form.value.idPersona,
            nombre: `${form.value.nombres} ${form.value.primerApellido} ${form.value.segundoApellido || ''}`.trim(),
            ci: form.value.ci,
            type: 'psicologia'
        }
    })
    close()
}

const goToStep2 = () => {
    if (!selectedPersona.value) return
    if (isManual.value && !isManualPatientComplete()) {
        showIncompleteModal('Completa todos los datos del paciente (nombres, apellidos y CI).')
        return
    }

    const now = new Date()
    const tzoffset = (now).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString()

    emergencyForm.value.fechaAtencion = localISOTime.substring(0, 10)
    emergencyForm.value.horaInicio = localISOTime.substring(11, 16)

    step.value = 2
}

const terminarEmergencia = () => {
    if (!selectedPersona.value) return

    const { fechaAtencion, horaInicio, horaFin, descripcionCaso } = emergencyForm.value
    if (!fechaAtencion?.trim() || !horaInicio?.trim() || !horaFin?.trim() || !descripcionCaso?.trim()) {
        showIncompleteModal('Todos los campos de la emergencia son obligatorios.')
        return
    }

    showConfirmEmergencia.value = true
}

const confirmarEmergencia = async () => {
    showConfirmEmergencia.value = false

    const idPersona = authStore.user?.idPersona

    const payload = {
        idPersona,
        nombrePaciente: pacienteNombre.value,
        fechaAtencion: emergencyForm.value.fechaAtencion,
        horaInicio: normalizeHora(emergencyForm.value.horaInicio),
        horaFin: normalizeHora(emergencyForm.value.horaFin),
        descripcionCaso: emergencyForm.value.descripcionCaso.trim()
    }

    isSubmitting.value = true
    try {
        await emergenciasStore.createEmergencia(payload)
        resultModalTitle.value = 'Emergencia registrada'
        resultModalMessage.value = `La emergencia del paciente ${pacienteNombre.value} fue registrada correctamente.`
        resultModalType.value = 'success'
        showResultModal.value = true
    } catch (error) {
        resultModalTitle.value = 'No se pudo atender'
        resultModalMessage.value = error.message || 'Ocurrió un error al registrar la emergencia.'
        resultModalType.value = 'error'
        showResultModal.value = true
        console.error('Error al crear emergencia:', error)
    } finally {
        isSubmitting.value = false
    }
}

const postaIdFromAsignacion = (asignacion) => {
    const posta = asignacion?.consultorio?.posta
    if (!posta) return null
    const id = posta.idPosta ?? posta.idPostaMedica ?? posta.id
    return id == null || id === '' ? null : id
}

const asignacionActivaDoctor = async () => {
    const idDoctor = authStore.user?.doctor?.idDoctor
    if (idDoctor == null) return null

    const list = await asignacionStore.fetchAsignaciones()

    return list.find((asignacion) =>
        Number(asignacion.idDoctor) === Number(idDoctor) && asignacion.activo !== false
    ) || null
}

const showAtencionError = (message) => {
    resultModalTitle.value = 'No se pudo atender'
    resultModalMessage.value = message
    resultModalType.value = 'error'
    showResultModal.value = true
}

const goToStep2SinReserva = async () => {
    if (!selectedPersona.value) return
    if (isManual.value && !isManualPatientComplete()) {
        showIncompleteModal('Completa todos los datos del paciente (nombres, apellidos y CI).')
        return
    }

    const now = new Date()
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString()

    sinReservaForm.value.fechaAtendido = localISOTime.substring(0, 10)
    sinReservaForm.value.horaAtendido = localISOTime.substring(11, 16)

    const doctorObj = authStore.user?.doctor || {}
    const docPersona = doctorObj.persona || authStore.user || {}
    const asignacion = await asignacionActivaDoctor()
    const posta = asignacion?.consultorio?.posta
    sinReservaForm.value.doctorNombre = `${docPersona.nombres || ''} ${docPersona.primerApellido || ''}`.trim() || authStore.user?.nombres || 'Doctor'
    sinReservaForm.value.especialidadNombre = doctorObj.especialidad?.nombre || asignacion?.especialidad?.nombre || 'Especialidad No Definida'
    sinReservaForm.value.postaNombre = posta?.nombre || doctorObj.posta?.nombre || 'Sin posta asignada'

    step.value = 3
}

const terminarSinReserva = () => {
    if (!selectedPersona.value) return

    const { fechaAtendido, horaAtendido, horaFin, observaciones } = sinReservaForm.value
    if (!fechaAtendido?.trim() || !horaAtendido?.trim() || !horaFin?.trim() || !observaciones?.trim()) {
        showIncompleteModal('Todos los campos de la atención son obligatorios, incluyendo hora de inicio y hora de fin.')
        return
    }

    showConfirmSinReserva.value = true
}

const confirmarSinReserva = async () => {
    showConfirmSinReserva.value = false

    const idPersona = authStore.user?.idPersona
    const doctorObj = authStore.user?.doctor || {}
    const asignacion = await asignacionActivaDoctor()
    const idPosta = postaIdFromAsignacion(asignacion)
        ?? doctorObj.posta?.idPosta
        ?? doctorObj.posta?.idPostaMedica
        ?? null
    const idEspecialidad = doctorObj.especialidad?.idEspecialidadMedica
        ?? asignacion?.idEspecialidad
        ?? asignacion?.especialidad?.idEspecialidadMedica
        ?? null

    if (!idPosta) {
        showAtencionError('Posta médica no encontrada')
        return
    }
    if (!idEspecialidad) {
        showAtencionError('No se pudo determinar la especialidad del doctor.')
        return
    }

    const payload = {
        idUsuario: selectedPersona.value.idPersona,
        idEspecialidad,
        idPosta,
        idPersona,
        fechaAtendido: sinReservaForm.value.fechaAtendido,
        horaAtendido: normalizeHora(sinReservaForm.value.horaAtendido),
        horaFinCita: normalizeHora(sinReservaForm.value.horaFin),
        observaciones: sinReservaForm.value.observaciones.trim()
    }

    isSubmitting.value = true
    try {
        const result = await reservasStore.createReservaSinReserva(payload)
        if (result.success) {
            emit('emergency-created')
            await router.push({
                path: '/doctor/historial-medico',
                query: {
                    pacienteId: isManual.value ? 'NEW' : form.value.idPersona,
                    nombre: pacienteNombre.value,
                    ci: form.value.ci
                }
            })
            close()
            return
        }
        showAtencionError(reservasStore.error || 'Ocurrió un error al registrar la atención sin reserva.')
        console.error('Error al registrar reserva sin reserva:', reservasStore.error)
    } catch (error) {
        showAtencionError(error.message || 'Ocurrió un error inesperado al registrar la atención sin reserva.')
        console.error('Error al atender sin reserva:', error)
    } finally {
        isSubmitting.value = false
    }
}

const onResultModalConfirm = () => {
    showResultModal.value = false
    if (resultModalType.value === 'success') {
        emit('emergency-created')
        close()
    }
}

onMounted(async () => {
    resetForm()
    if (personasStore.personas.length === 0) {
        await personasStore.fetchPersonas()
    }
})
</script>

<style scoped>
.shadow-premium {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}

.header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
    z-index: 0;
}

.gap-2 {
    gap: 8px;
}

.gap-3 {
    gap: 12px;
}

.primary-lighten-5 {
    background-color: #E8EAF6 !important;
}
</style>
