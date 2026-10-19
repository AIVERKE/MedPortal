<script setup>
import { ref, watch, computed } from 'vue'
import { useAsignacionDoctoresStore } from '@/stores/asignacion_doctores_consultorio'
import { useConsultorioStore } from '@/stores/consultorios'
import { useEspecialidadStore } from '@/stores/especialidad'
import { usePostasStore } from '@/stores/postas'
import ModalMensaje from '../common/ModalMensaje.vue'
import ModalConfirmacion from '../common/ModalConfirmación.vue'
import { timeToMinutes } from '@/utils/slotTime'

// ── Props ──────────────────────────────────────────────────────────────
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    // Si se pasa `turno` (objeto asignacion) → modo EDITAR
    // Si se pasa `idDoctor` sin `turno`      → modo CREAR
    turno: { type: Object, default: () => null },
    idDoctor: { type: [Number, String], default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

// ── Stores ─────────────────────────────────────────────────────────────
const asignacionStore = useAsignacionDoctoresStore()
const consultorioStore = useConsultorioStore()
const especialidadStore = useEspecialidadStore()
const postasStore = usePostasStore()

// ── Modo (edit / create) ────────────────────────────────────────────────
const modoEditar = computed(() => !!props.turno?.id)

// ── Formulario ─────────────────────────────────────────────────────────
const formRef = ref(null)
const loading = ref(false)

const form = ref({
    turno: '',
    horaInicio: '',
    horaFin: '',
    duracionCita: null,
    cuposDisponibles: null,
    horasLibresMensuales: null,
    idPosta: null,
    idConsultorio: null,
    idEspecialidad: null,
})

const diasSeleccionados = ref([])

const diasSemanaOptions = [
    { label: 'L', value: 'LUNES' },
    { label: 'M', value: 'MARTES' },
    { label: 'X', value: 'MIERCOLES' },
    { label: 'J', value: 'JUEVES' },
    { label: 'V', value: 'VIERNES' },
    { label: 'S', value: 'SABADO' },
    { label: 'D', value: 'DOMINGO' },
]

// ── Estado para el modal de mensajes ──
const msgModal = ref({
    show: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => { }
})

const showImpactoConfirm = ref(false)
const impactoMensaje = ref('')
const pendingPayload = ref(null)

// ── Opciones selects ───────────────────────────────────────────────────
const postasItems = computed(() =>
    postasStore.postas.map(p => ({
        title: p.nombre,
        value: p.id,
    }))
)

// Filtramos consultorios por la posta seleccionada
const consultorioItems = computed(() => {
    if (!form.value.idPosta) return []
    return consultorioStore.consultorios
        .filter(c => c.idPosta === form.value.idPosta)
        .map(c => ({
            title: `N°${c.numeroConsultorio} (Piso ${c.pisoUbicacion ?? '-'})`,
            value: c.id,
        }))
})

const especialidadItems = computed(() =>
    especialidadStore.especialidades.map(e => ({
        title: e.nombre,
        value: e.id,
    }))
)

const especialidadSeleccionada = computed(() => {
    if (form.value.idEspecialidad) {
        const found = especialidadStore.especialidades.find((e) => e.id === form.value.idEspecialidad)
        if (found) return found
    }
    // Fallback al editar: especialidad anidada en el turno
    const espTurno = props.turno?.especialidad
    if (espTurno) {
        return {
            id: espTurno.idEspecialidadMedica ?? espTurno.id,
            nombre: espTurno.nombre,
            tiempoCitaPorDefecto: espTurno.tiempoCitaPorDefecto,
        }
    }
    return null
})

/** Guía promedio desde especialidades (no define el intervalo del turno). */
const tiempoPromedioEspecialidad = computed(() => {
    const d = Number(especialidadSeleccionada.value?.tiempoCitaPorDefecto)
    return Number.isFinite(d) && d > 0 ? d : null
})

const duracionCitaNum = computed(() => {
    const d = Number(form.value.duracionCita)
    return Number.isFinite(d) && d > 0 ? d : null
})

/**
 * Cupos = cuántos intervalos completos de duración caben entre hora inicio y fin.
 * Misma lógica que la agenda (residuos incompletos no cuentan).
 */
const cuposCalculados = computed(() => {
    const duracion = duracionCitaNum.value
    if (!duracion || !form.value.horaInicio || !form.value.horaFin) return null

    const inicioMin = timeToMinutes(form.value.horaInicio)
    const finMin = timeToMinutes(form.value.horaFin)
    if (finMin <= inicioMin) return 0

    return Math.floor((finMin - inicioMin) / duracion)
})

const hintPromedioEspecialidad = computed(() => {
    const nombre = especialidadSeleccionada.value?.nombre
    const minutos = tiempoPromedioEspecialidad.value
    if (!nombre || !minutos) return ''
    return `Para la especialidad ${nombre}, el tiempo promedio de consulta es de ${minutos} minutos.`
})

const tooltipCupos = computed(() => {
    const minutos = duracionCitaNum.value
    const cupos = cuposCalculados.value
    if (minutos == null || cupos == null) {
        return 'Los cupos se calculan según cuántos intervalos completos de la duración caben entre Hora Inicio y Hora Fin.'
    }
    return `Cupos máximos = intervalos completos de ${minutos} min entre ${form.value.horaInicio?.slice(0, 5) || '—'} y ${form.value.horaFin?.slice(0, 5) || '—'}. Actualmente: ${cupos} cupo(s). Los minutos sobrantes al final no cuentan.`
})

const reglasDuracion = [
    (v) => (v !== null && v !== '' && v !== undefined) || 'La duración es requerida',
    (v) => {
        const n = Number(v)
        return (Number.isFinite(n) && n > 0 && Number.isInteger(n)) || 'Ingresa un número entero mayor a 0'
    },
]

// Sync cupos calculados al formulario (para el payload de guardado)
watch(
    cuposCalculados,
    (cupos) => {
        form.value.cuposDisponibles = cupos
    },
    { immediate: true },
)

// Al elegir especialidad en modo crear, sugerir el promedio si aún no hay duración
watch(
    () => form.value.idEspecialidad,
    (idEsp, prevId) => {
        if (modoEditar.value) return
        if (!idEsp || idEsp === prevId) return
        if (form.value.duracionCita != null && form.value.duracionCita !== '') return
        if (tiempoPromedioEspecialidad.value) {
            form.value.duracionCita = tiempoPromedioEspecialidad.value
        }
    },
)

// Si cambia la posta, reseteamos el consultorio
watch(() => form.value.idPosta, (newVal, oldVal) => {
    if (oldVal !== null && newVal !== oldVal) {
        form.value.idConsultorio = null
    }
})

// ── Poblar formulario al abrir ─────────────────────────────────────────
watch(() => props.modelValue, async (open) => {
    if (!open) return

    // Cargar catálogos
    loading.value = true
    try {
        await Promise.all([
            postasStore.fetchPostas(),
            consultorioStore.fetchConsultorios(),
            especialidadStore.fetchEspecialidades()
        ])
    } finally {
        loading.value = false
    }

    if (props.turno) {
        // ── EDITAR ────────────────────────────────────────────────────────
        const t = props.turno
        const duracionGuardada = Number(t.duracionCita)
        form.value = {
            turno: t.turno ?? '',
            horaInicio: t.horaInicio ?? '',
            horaFin: t.horaFin ?? '',
            duracionCita: Number.isFinite(duracionGuardada) && duracionGuardada > 0
                ? duracionGuardada
                : null,
            cuposDisponibles: null,
            horasLibresMensuales: t.horasLibresMensuales ?? null,
            idPosta: t.consultorio?.posta?.id ?? null,
            idConsultorio: t.idConsultorio ?? null,
            idEspecialidad: t.idEspecialidad ?? null,
        }
        if (Array.isArray(t.diasSemana)) {
            diasSeleccionados.value = t.diasSemana
        } else if (typeof t.diasSemana === 'string') {
            diasSeleccionados.value = t.diasSemana.split(',').map(d => d.trim()).filter(Boolean)
        } else {
            diasSeleccionados.value = []
        }
    } else {
        // ── CREAR ─────────────────────────────────────────────────────────
        form.value = {
            turno: '', horaInicio: '', horaFin: '',
            duracionCita: null, cuposDisponibles: null,
            horasLibresMensuales: null,
            idPosta: null, idConsultorio: null, idEspecialidad: null,
        }

        // Auto-seleccionar especialidad del doctor y sugerir duración promedio
        if (props.idDoctor) {
            const doctoresStore = (await import('@/stores/doctores')).useDoctoresStore();
            const doc = doctoresStore.doctores.find(d => d.id === props.idDoctor);
            if (doc) {
                const esp = especialidadStore.especialidades.find(e => e.nombre === doc.especialidad);
                if (esp) {
                    form.value.idEspecialidad = esp.id;
                    const promedio = Number(esp.tiempoCitaPorDefecto)
                    if (Number.isFinite(promedio) && promedio > 0) {
                        form.value.duracionCita = promedio
                    }
                }
            }
        }

        diasSeleccionados.value = []
        if (formRef.value) formRef.value.resetValidation()
    }
})

// ── Acciones ──────────────────────────────────────────────────────────
const close = () => emit('update:modelValue', false)

const buildPayload = () => ({
    turno: form.value.turno,
    diasSemana: diasSeleccionados.value.join(', '),
    horaInicio: form.value.horaInicio,
    horaFin: form.value.horaFin,
    duracionCita: parseInt(duracionCitaNum.value, 10),
    cuposDisponibles: parseInt(cuposCalculados.value, 10),
    horasLibresMensuales:
        form.value.horasLibresMensuales === '' || form.value.horasLibresMensuales == null
            ? null
            : parseInt(form.value.horasLibresMensuales, 10),
})

const ejecutarGuardado = async (payload) => {
    loading.value = true
    try {
        let ok = false

        if (modoEditar.value) {
            ok = await asignacionStore.updateAsignacion(props.turno.id, payload)
        } else {
            ok = await asignacionStore.createAsignacion({
                ...payload,
                idDoctor: parseInt(props.idDoctor),
                idConsultorio: parseInt(form.value.idConsultorio),
                idEspecialidad: parseInt(form.value.idEspecialidad),
            })
        }

        if (ok) {
            msgModal.value = {
                show: true,
                title: '¡Operación Exitosa!',
                message: modoEditar.value
                    ? 'El turno ha sido actualizado correctamente.'
                    : 'El nuevo horario ha sido creado exitosamente.',
                type: 'success',
                onConfirm: () => {
                    msgModal.value.show = false
                    close()
                    emit('saved')
                },
            }
        } else {
            msgModal.value = {
                show: true,
                title: 'Error al Guardar',
                message: asignacionStore.error || 'No se pudo completar la operación. Por favor, revisa los datos e intenta de nuevo.',
                type: 'error',
                onConfirm: () => { msgModal.value.show = false },
            }
        }
    } catch (err) {
        msgModal.value = {
            show: true,
            title: 'Error Inesperado',
            message: err?.message || 'Ha ocurrido un error inesperado en el sistema.',
            type: 'error',
            onConfirm: () => { msgModal.value.show = false },
        }
    } finally {
        loading.value = false
        pendingPayload.value = null
    }
}

const confirmarImpactoYGuardar = async () => {
    showImpactoConfirm.value = false
    if (!pendingPayload.value) return
    await ejecutarGuardado(pendingPayload.value)
}

const cancelarImpacto = () => {
    showImpactoConfirm.value = false
    pendingPayload.value = null
    loading.value = false
}

const guardar = async () => {
    if (formRef.value) {
        const { valid } = await formRef.value.validate()
        if (!valid) return
    }
    if (!diasSeleccionados.value.length) {
        msgModal.value = {
            show: true,
            title: 'Atención',
            message: 'Por favor, selecciona al menos un día de atención.',
            type: 'warning',
            onConfirm: () => { msgModal.value.show = false },
        }
        return
    }

    if (!duracionCitaNum.value) {
        msgModal.value = {
            show: true,
            title: 'Atención',
            message: 'Indica la duración de cada cita en minutos para este turno.',
            type: 'warning',
            onConfirm: () => { msgModal.value.show = false },
        }
        return
    }

    if (cuposCalculados.value == null || cuposCalculados.value <= 0) {
        msgModal.value = {
            show: true,
            title: 'Atención',
            message: 'El rango horario no permite al menos un cupo completo con la duración indicada. Ajusta Hora Inicio / Hora Fin o la duración.',
            type: 'warning',
            onConfirm: () => { msgModal.value.show = false },
        }
        return
    }

    const payload = buildPayload()

    if (modoEditar.value) {
        loading.value = true
        const impacto = await asignacionStore.previsualizarImpactoTurno(props.turno.id, {
            horaInicio: payload.horaInicio,
            horaFin: payload.horaFin,
            diasSemana: payload.diasSemana,
        })
        loading.value = false

        if (impacto?.cantidad > 0) {
            pendingPayload.value = payload
            impactoMensaje.value =
                impacto.mensaje ||
                `Hay ${impacto.cantidad} cita(s) que quedan fuera del nuevo horario. Lo recomendable es reagendarlas.`
            showImpactoConfirm.value = true
            return
        }
    }

    await ejecutarGuardado(payload)
}
</script>

<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="560"
        persistent scrollable class="rounded-xl">
        <v-card class="rounded-xl overflow-hidden">

            <!-- Header -->
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark>
                    <v-icon start class="ms-4">
                        {{ modoEditar ? 'mdi-calendar-edit' : 'mdi-calendar-plus' }}
                    </v-icon>
                    <span class="text-h6 font-weight-bold">
                        {{ modoEditar ? 'Editar Turno' : 'Nuevo Horario' }}
                    </span>
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6 pa-md-8">
                <v-form ref="formRef" lazy-validation>

                    <p class="text-subtitle-2 text-medium-emphasis mb-6">
                        {{ modoEditar ? 'Modifica los datos del horario asignado al médico.'
                            : 'Completa la información para asignar un nuevo horario.' }}
                    </p>

                    <!-- SECCIÓN: TURNO -->
                    <div class="section-title mb-4">
                        <v-icon size="18" class="me-2" color="primary">mdi-weather-sunset-up</v-icon>
                        <span>Información del Turno</span>
                    </div>
                    <v-text-field v-model="form.turno" label="Descripción del turno" variant="outlined" rounded="lg"
                        bg-color="grey-lighten-5" prepend-inner-icon="mdi-clock-time-four-outline" class="mb-4"
                        placeholder="Ej: Mañana, Tarde, Nocturno..." :rules="[v => !!v || 'El turno es requerido']" />

                    <!-- SECCIÓN: DÍAS -->
                    <div class="section-title mb-4">
                        <v-icon size="18" class="me-2" color="primary">mdi-calendar-multiselect</v-icon>
                        <span>Días de Atención</span>
                    </div>
                    <div class="chips-wrapper pa-4 rounded-xl border bg-grey-lighten-5 mb-8">
                        <v-chip-group v-model="diasSeleccionados" multiple column>
                            <v-chip v-for="d in diasSemanaOptions" :key="d.value" :value="d.value" variant="flat"
                                :class="['day-chip', { 'active': diasSeleccionados.includes(d.value) }]">
                                <span class="font-weight-bold">{{ d.label }}</span>
                            </v-chip>
                        </v-chip-group>
                    </div>

                    <!-- SECCIÓN: HORARIO -->
                    <div class="section-title mb-4">
                        <v-icon size="18" class="me-2" color="primary">mdi-clock-outline</v-icon>
                        <span>Horario Académico</span>
                    </div>
                    <v-row class="mb-4">
                        <v-col cols="6">
                            <v-text-field v-model="form.horaInicio" label="Hora Inicio" type="time" variant="outlined"
                                rounded="lg" bg-color="white" prepend-inner-icon="mdi-clock-start"
                                :rules="[v => !!v || 'Requerido']" />
                        </v-col>
                        <v-col cols="6">
                            <v-text-field v-model="form.horaFin" label="Hora Fin" type="time" variant="outlined"
                                rounded="lg" bg-color="white" prepend-inner-icon="mdi-clock-end"
                                :rules="[v => !!v || 'Requerido']" />
                        </v-col>
                    </v-row>

                    <!-- SECCIÓN: CITAS -->
                    <div class="section-title mb-4">
                        <v-icon size="18" class="me-2" color="primary">mdi-stethoscope</v-icon>
                        <span>Capacidad de Atención</span>
                    </div>
                    <v-alert
                        v-if="hintPromedioEspecialidad"
                        type="info"
                        variant="tonal"
                        density="compact"
                        rounded="lg"
                        class="mb-4"
                        icon="mdi-information-outline"
                    >
                        {{ hintPromedioEspecialidad }}
                    </v-alert>
                    <v-row class="mb-4">
                        <v-col cols="6">
                            <v-text-field
                                v-model.number="form.duracionCita"
                                label="Duración (min)"
                                type="number"
                                min="1"
                                step="1"
                                variant="outlined"
                                rounded="lg"
                                bg-color="white"
                                prepend-inner-icon="mdi-timer-outline"
                                hide-details="auto"
                                :rules="reglasDuracion"
                                placeholder="Ej: 30"
                            />
                        </v-col>
                        <v-col cols="6">
                            <v-tooltip
                                location="top"
                                max-width="280"
                                open-on-hover
                                open-on-click
                                :close-on-content-click="false"
                            >
                                <template #activator="{ props: tipProps }">
                                    <v-text-field
                                        v-bind="tipProps"
                                        :model-value="cuposCalculados ?? ''"
                                        label="Cupos Máx."
                                        variant="outlined"
                                        rounded="lg"
                                        bg-color="grey-lighten-4"
                                        prepend-inner-icon="mdi-account-group-outline"
                                        append-inner-icon="mdi-information-outline"
                                        readonly
                                        hide-details="auto"
                                        :placeholder="!form.horaInicio || !form.horaFin || !duracionCitaNum ? 'Defina horario y duración' : '—'"
                                    />
                                </template>
                                <span>{{ tooltipCupos }}</span>
                            </v-tooltip>
                        </v-col>
                    </v-row>

                    <v-text-field
                        v-model.number="form.horasLibresMensuales"
                        label="Horas libres mensuales (override)"
                        type="number"
                        min="0"
                        variant="outlined"
                        rounded="lg"
                        bg-color="white"
                        prepend-inner-icon="mdi-calendar-clock"
                        class="mb-4"
                        hint="Vacío = usar cupo global de configuración. Solo aplica a Bloqueo Horarios."
                        persistent-hint
                        clearable
                    />

                    <!-- SECCIÓN: ASIGNACIÓN (solo en modo CREAR) -->
                    <template v-if="!modoEditar">
                        <v-divider class="my-6" />
                        <div class="section-title mb-4">
                            <v-icon size="18" class="me-2" color="primary">mdi-hospital-building</v-icon>
                            <span>Lugar de Atención</span>
                        </div>
                        <v-select v-model="form.idEspecialidad" :items="especialidadItems" label="Especialidad Médica"
                            variant="outlined" rounded="lg" bg-color="white" prepend-inner-icon="mdi-medical-bag"
                            class="mb-4" :loading="especialidadStore.loading" readonly
                            :rules="[v => !!v || 'La especialidad es requerida']" />

                        <v-select v-model="form.idPosta" :items="postasItems" label="Posta Médica" variant="outlined"
                            rounded="lg" bg-color="white" prepend-inner-icon="mdi-map-marker-outline" class="mb-4"
                            :loading="postasStore.loading" :rules="[v => !!v || 'La posta es requerida']" />

                        <v-select v-model="form.idConsultorio" :items="consultorioItems" label="Consultorio"
                            variant="outlined" rounded="lg" bg-color="white" prepend-inner-icon="mdi-door-open"
                            class="mb-4" :loading="consultorioStore.loading" :disabled="!form.idPosta"
                            :hint="!form.idPosta ? 'Primero selecciona una posta' : ''" persistent-hint
                            :rules="[v => !!v || 'El consultorio es requerido']" />
                    </template>

                </v-form>
            </v-card-text>

            <v-divider />

            <!-- ACCIONES -->
            <v-card-actions class="pa-6 d-flex gap-3">
                <v-btn variant="text" color="grey-darken-1" rounded="xl" class="text-none font-weight-bold flex-grow-1"
                    size="large" @click="close">
                    Cancelar
                </v-btn>
                <v-btn color="primary" variant="flat" rounded="xl" class="text-none font-weight-bold flex-grow-1"
                    size="large" elevation="4" @click="guardar" :loading="loading">
                    {{ modoEditar ? 'Guardar Cambios' : 'Crear Horario' }}
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- Modal de Mensajes Genérico -->
        <ModalMensaje v-model="msgModal.show" :title="msgModal.title" :message="msgModal.message" :type="msgModal.type"
            @confirm="msgModal.onConfirm" />

        <ModalConfirmacion
            v-model="showImpactoConfirm"
            title="Citas fuera del nuevo horario"
            :message="impactoMensaje"
            type="warning"
            confirm-text="Continuar"
            cancel-text="Cancelar"
            @confirm="confirmarImpactoYGuardar"
            @cancel="cancelarImpacto"
        />
    </v-dialog>
</template>

<style scoped>
.gap-3 {
    gap: 12px;
}

.section-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 800;
    color: rgb(var(--v-theme-medium-emphasis));
    display: flex;
    align-items: center;
}

.day-chip {
    width: 44px;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 12px !important;
    background: white !important;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.1) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: rgb(var(--v-theme-medium-emphasis));
}

.day-chip.active {
    background: rgb(var(--v-theme-primary)) !important;
    color: white !important;
    border-color: rgb(var(--v-theme-primary)) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3) !important;
}

:deep(.v-field__outline) {
    --v-field-border-opacity: 0.1;
}

:deep(.v-card-text) {
    scrollbar-width: thin;
    scrollbar-color: rgba(var(--v-theme-on-surface), 0.1) transparent;
}

:deep(.v-field--readonly) {
    cursor: help;
}

:deep(.v-alert) {
    font-size: 0.8125rem;
    line-height: 1.4;
}
</style>
