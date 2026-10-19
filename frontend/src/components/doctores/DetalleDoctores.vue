<template>
    <v-card flat class="fill-height d-flex flex-column bg-white">
        <!-- Header -->
        <v-card-title class="px-6 py-4 border-b d-flex align-center justify-space-between">
            <div>
                <h2 class="text-h6 font-weight-bold text-slate-900">Detalle del Médico</h2>
                <p class="text-caption text-grey-darken-1">Portal de Gestión de Médicos</p>
            </div>
            <v-btn icon="mdi-close" variant="text" color="grey" @click="$emit('close')"></v-btn>
        </v-card-title>

        <!-- Content -->
        <v-card-text class="pa-6 overflow-y-auto">
            <div class="space-y-8">
                <!-- Doctor Summary -->
                <section>
                    <v-sheet color="blue-lighten-5" rounded="xl" class="pa-4 d-flex align-center ga-4 mb-4">
                        <PersonaAvatar :foto="avatarFoto" :nombres="avatarNombres"
                            :primer-apellido="avatarPrimerApellido" :size="64" rounded="lg" />
                        <div>
                            <h3 class="text-subtitle-1 font-weight-bold text-slate-900">{{ doctor?.nombre
                                || 'Selecciona un médico' }}</h3>
                            <p class="text-caption font-weight-bold text-purple-darken-1 mb-1">{{ doctor?.especialidad
                                || '-' }}</p>
                            <div class="d-flex align-center ga-1 text-caption text-grey">
                                <v-icon size="14">mdi-badge-account-outline</v-icon>
                                <span>ID: #{{ doctor?.id || '---' }}</span>
                            </div>
                        </div>
                    </v-sheet>

                    <v-row dense>
                        <v-col cols="12">
                            <v-sheet border rounded="lg" class="pa-4 experiencia-sheet">
                                <p class="text-overline text-grey-lighten-1 font-weight-bold lh-1 mb-2">Experiencia</p>
                                <div class="experiencia-texto text-body-2 font-weight-bold">
                                    {{ doctor?.experiencia || 'No especificada' }}
                                </div>
                            </v-sheet>
                        </v-col>
                    </v-row>
                </section>

                <!-- "Horarios" Section -->
                <section class="mt-6">
                    <div class="d-flex align-center ga-3 mb-4">
                        <v-icon color="primary">mdi-calendar-clock</v-icon>
                        <span class="text-overline font-weight-black text-grey-darken-1">Horarios ({{
                            misAsignaciones.length }})</span>
                        <v-spacer />
                        <v-btn icon="mdi-plus" size="x-small" color="primary" variant="tonal" @click="abrirCrear" />
                    </div>

                    <v-expansion-panels v-if="misAsignaciones.length > 0" flat v-model="selectedAsignacionId"
                        class="ga-3">
                        <v-expansion-panel v-for="asig in misAsignaciones" :key="asig.id" :value="asig.id"
                            bg-color="grey-lighten-4" border rounded="xl" elevation="0">
                            <v-expansion-panel-title class="py-4">
                                <div class="d-flex flex-column ga-1 flex-grow-1">
                                    <span class="text-body-2 font-weight-black text-primary">{{ asig.turno }}</span>
                                    <span class="text-caption text-grey-darken-1">{{ asig.diasSemana }} • {{
                                        asig.horaInicio }} - {{ asig.horaFin }}</span>
                                </div>
                                <v-btn icon="mdi-pencil-outline" size="x-small" variant="tonal" color="primary"
                                    class="me-2" @click.stop="abrirEditar(asig)" />
                                <v-btn icon="mdi-delete-outline" size="x-small" variant="tonal" color="error"
                                    @click.stop="confirmarEliminarAsignacion(asig)" />
                            </v-expansion-panel-title>

                            <v-expansion-panel-text>
                                <div class="pt-2 border-t mt-2">
                                    <div class="space-y-3">
                                        <div class="d-flex justify-space-between align-center">
                                            <span class="text-caption text-grey">Consultorio</span>
                                            <span class="text-body-2 font-weight-bold text-slate-900">
                                                {{ asig.consultorio?.posta?.nombre }} - {{
                                                    asig.consultorio?.numeroConsultorio }}
                                            </span>
                                        </div>
                                        <div class="d-flex justify-space-between align-center">
                                            <span class="text-caption text-grey">Duración de Cita</span>
                                            <v-chip size="x-small" color="secondary" variant="tonal">
                                                {{ asig.duracionCita }} min
                                            </v-chip>
                                        </div>
                                        <div class="d-flex justify-space-between align-center">
                                            <span class="text-caption text-grey">Cupos Disponibles</span>
                                            <span class="text-body-2 font-weight-bold text-slate-900">{{
                                                asig.cuposDisponibles }}</span>
                                        </div>
                                    </div>
                                </div>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>

                    <v-sheet v-else border rounded="xl" class="pa-8 text-center bg-grey-lighten-4 border-dashed">
                        <v-icon size="32" color="grey-lighten-1" class="mb-2">mdi-calendar-blank</v-icon>
                        <p class="text-caption text-grey-darken-1">No hay horarios registrados</p>
                    </v-sheet>
                </section>

                <!-- Información Personal -->
                <section class="mt-6">
                    <div class="d-flex align-center ga-3 mb-4">
                        <v-icon color="primary">mdi-account-details-outline</v-icon>
                        <span class="text-overline font-weight-black text-grey-darken-1">Información Personal</span>
                        <v-spacer />
                        <v-btn icon="mdi-pencil-outline" size="x-small" color="primary" variant="tonal"
                            @click="showModalPersonal = true" />
                    </div>
                    <v-sheet border rounded="xl" class="pa-4 bg-slate-50">
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <div class="mb-3">
                                    <p class="text-overline text-grey mb-0">C.I.</p>
                                    <p class="text-body-2 font-weight-bold">{{ personasStore.selectedPersona?.ci || '-'
                                        }}</p>
                                </div>
                                <div class="mb-3">
                                    <p class="text-overline text-grey mb-0">Género</p>
                                    <p class="text-body-2 font-weight-bold">{{ personasStore.selectedPersona?.genero ||
                                        '-' }}</p>
                                </div>
                                <div>
                                    <p class="text-overline text-grey mb-0">Fecha de Nacimiento</p>
                                    <p class="text-body-2 font-weight-bold">{{
                                        personasStore.selectedPersona?.fechaNacimiento || '-' }}</p>
                                </div>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <div class="mb-3">
                                    <p class="text-overline text-grey mb-0">Celular</p>
                                    <p class="text-body-2 font-weight-bold">{{ personasStore.selectedPersona?.celular ||
                                        'No registrado' }}</p>
                                </div>
                                <div class="mb-3">
                                    <p class="text-overline text-grey mb-0">Email</p>
                                    <p class="text-body-2 font-weight-bold text-truncate">{{
                                        personasStore.selectedPersona?.email || 'No registrado' }}</p>
                                </div>
                                <div>
                                    <p class="text-overline text-grey mb-0">Dirección</p>
                                    <p class="text-body-2 font-weight-bold">{{ personasStore.selectedPersona?.direccion
                                        || 'No especificada' }}</p>
                                </div>
                            </v-col>
                        </v-row>
                    </v-sheet>
                </section>

                <!-- Información Académica / Profesional -->
                <section class="mt-6">
                    <div class="d-flex align-center ga-3 mb-4">
                        <v-icon color="primary">mdi-school-outline</v-icon>
                        <span class="text-overline font-weight-black text-grey-darken-1">Información Académica -
                            Profesional</span>
                        <v-spacer />
                        <v-btn icon="mdi-pencil-outline" size="x-small" color="primary" variant="tonal"
                            @click="showModalAcademica = true" />
                    </div>
                    <v-sheet border rounded="xl" class="pa-4 bg-slate-50">
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <div class="mb-3">
                                    <p class="text-overline text-grey mb-0">Matrícula Profesional</p>
                                    <p class="text-body-2 font-weight-bold">{{ rawDoctor?.matriculaProfesional || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-overline text-grey mb-0">Título Profesional</p>
                                    <p class="text-body-2 font-weight-bold">{{ rawDoctor?.tituloProfesional || '-' }}
                                    </p>
                                </div>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <div class="mb-3">
                                    <p class="text-overline text-grey mb-0">Universidad de Origen</p>
                                    <p class="text-body-2 font-weight-bold">{{ rawDoctor?.universidadOrigen || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-overline text-grey mb-0">Teléfono de Emergencia</p>
                                    <p class="text-body-2 font-weight-bold">{{ rawDoctor?.telefonoEmergencia || '-' }}
                                    </p>
                                </div>
                            </v-col>
                        </v-row>
                    </v-sheet>
                </section>

            </div>
        </v-card-text>

        <!-- Footer -->
        <v-card-actions class="pa-6 border-t d-flex ga-3">
            <v-btn variant="outlined" color="grey" class="flex-1 text-none font-weight-bold" rounded="lg"
                @click="$emit('close')">
                Cancelar
            </v-btn>
            <v-btn color="error" variant="tonal" class="flex-1 text-none font-weight-bold" rounded="lg"
                @click="showDeleteConfirm = true">
                Eliminar Médico
            </v-btn>
            <v-btn color="primary" class="flex-[2] text-none font-weight-bold" rounded="lg"
                @click="showConfirmacion = true">
                Confirmar Asignación
            </v-btn>
        </v-card-actions>
    </v-card>

    <!-- Modal Editar / Crear Turno -->
    <ModalEditarTurno v-model="modalAbierto" :turno="turnoEditando" :id-doctor="doctor?.id" @saved="onTurnoGuardado" />
    <ModalEditarTurno v-model="modalCrear" :id-doctor="doctor?.id" @saved="onTurnoGuardado" />

    <!-- Modales de Información -->
    <ModalInformacionPersonal v-model="showModalPersonal" :persona="personasStore.selectedPersona"
        @saved="onPersonalSaved" />
    <ModalInformacionAcademica v-model="showModalAcademica" :doctor="rawDoctor"
        @save="data => prepareConfirm(data, 'academica')" />

    <!-- Flujo de confirmación -->
    <ModalConfirmación v-model="showConfirmacion" title="¿Estás seguro?"
        message="¿Deseas guardar los cambios realizados en la información del médico?" type="warning"
        confirm-text="Aceptar" @confirm="onConfirm" @cancel="showConfirmacion = false" />

    <ModalMensaje v-model="showMessage" title="Aviso" message="Información actualizada correctamente." type="success"
        @confirm="showMessage = false" />

    <ModalConfirmación v-model="showDeleteConfirm" title="¿Eliminar médico?"
        message="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer." type="error"
        confirm-text="Eliminar" @confirm="onDeleteConfirm" @cancel="showDeleteConfirm = false" />

    <ModalConfirmación v-model="showDeleteAsignacionConfirm" title="¿Eliminar horario?"
        message="¿Estás seguro de que deseas eliminar este horario de atención?" type="error" confirm-text="Eliminar"
        @confirm="onDeleteAsignacionConfirm" @cancel="showDeleteAsignacionConfirm = false" />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAsignacionDoctoresStore } from '@/stores/asignacion_doctores_consultorio';
import { useDoctoresStore } from '@/stores/doctores';
import { usePersonasStore } from '@/stores/personas';
import ModalEditarTurno from '@/components/doctores/ModalEditarTurno.vue';
import ModalInformacionPersonal from '@/components/doctores/ModalInformacionPersonal.vue';
import ModalInformacionAcademica from '@/components/doctores/ModalInformacionAcademica.vue';
import ModalConfirmación from '@/components/common/ModalConfirmación.vue';
import ModalMensaje from '@/components/common/ModalMensaje.vue';
import PersonaAvatar from '@/components/common/PersonaAvatar.vue';

const asignacionStore = useAsignacionDoctoresStore();
const doctoresStore = useDoctoresStore();
const personasStore = usePersonasStore();

const props = defineProps({
    doctor: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['close', 'confirm']);

const selectedAsignacionId = ref(null);
const modalAbierto = ref(false);
const turnoEditando = ref(null);
const modalCrear = ref(false);
const rawDoctor = ref(null);

const showModalPersonal = ref(false);
const showModalAcademica = ref(false);
const showConfirmacion = ref(false);
const showMessage = ref(false);
const showDeleteConfirm = ref(false);
const showDeleteAsignacionConfirm = ref(false);
const asigParaEliminar = ref(null);
const pendingUpdate = ref(null);
const updateType = ref(null);

const personaData = computed(() => {
    return personasStore.selectedPersona
        || rawDoctor.value?.persona
        || null
})

const avatarFoto = computed(() => personaData.value?.foto || props.doctor?.foto || null)

const avatarNombres = computed(() =>
    personaData.value?.nombres || props.doctor?.nombres || '')

const avatarPrimerApellido = computed(() =>
    personaData.value?.primerApellido || props.doctor?.primerApellido || '')

const prepareConfirm = (data, type) => {
    pendingUpdate.value = data;
    updateType.value = type;
    showConfirmacion.value = true;
};

const onPersonalSaved = async () => {
    const idPersona = personasStore.selectedPersona?.id || personasStore.selectedPersona?.idPersona || personasStore.selectedPersona?.id_persona;
    if (idPersona) {
        await personasStore.fetchPersonaById(idPersona);
    }
};

const onConfirm = async () => {
    showConfirmacion.value = false;
    try {
        if (updateType.value === 'personal') {
            const idPersona = personasStore.selectedPersona?.id || personasStore.selectedPersona?.idPersona || personasStore.selectedPersona?.id_persona;
            if (idPersona) {
                await personasStore.updatePersona(idPersona, pendingUpdate.value);
            }
        } else if (updateType.value === 'academica') {
            const idDoctor = props.doctor?.id;
            if (idDoctor) {
                await doctoresStore.updateDoctor(idDoctor, pendingUpdate.value);
            }
        }

        // Refrescar datos
        if (props.doctor?.id) {
            const doc = await doctoresStore.fetchDoctorById(props.doctor.id);
            if (doc) {
                rawDoctor.value = doc;
                if (doc.persona) {
                    personasStore.selectedPersona = doc.persona;
                }
            }
        }

        showModalPersonal.value = false;
        showModalAcademica.value = false;
        showMessage.value = true;
    } catch (error) {
        console.error('Error al actualizar:', error);
    }
};

const onDeleteConfirm = async () => {
    showDeleteConfirm.value = false;
    try {
        if (props.doctor?.id) {
            await doctoresStore.deleteDoctor(props.doctor.id);
            emit('close'); // Cerrar el detalle
            await doctoresStore.fetchDoctores(); // Refrescar lista
        }
    } catch (error) {
        console.error('Error al eliminar doctor:', error);
    }
};

const confirmarEliminarAsignacion = (asig) => {
    asigParaEliminar.value = asig;
    showDeleteAsignacionConfirm.value = true;
};

const onDeleteAsignacionConfirm = async () => {
    showDeleteAsignacionConfirm.value = false;
    if (asigParaEliminar.value) {
        try {
            await asignacionStore.deleteAsignacion(asigParaEliminar.value.id);
            // El store ya filtra localmente, pero por si acaso refrescamos
            await asignacionStore.fetchAsignaciones();
        } catch (error) {
            console.error('Error al eliminar asignación:', error);
        } finally {
            asigParaEliminar.value = null;
        }
    }
};

const misAsignaciones = computed(() => {
    if (!props.doctor?.id) return [];
    return asignacionStore.asignaciones.filter(a => a.idDoctor === props.doctor.id);
});

watch(() => props.doctor?.id, async (newVal) => {
    selectedAsignacionId.value = null;
    rawDoctor.value = null;
    personasStore.selectedPersona = null;

    if (newVal) {
        try {
            const doc = await doctoresStore.fetchDoctorById(newVal);
            if (doc) {
                rawDoctor.value = doc;

                // Intentar obtener persona del objeto doctor
                if (doc.persona && (doc.persona.idPersona || doc.persona.id)) {
                    personasStore.selectedPersona = doc.persona;
                } else {
                    // Si no está la persona completa, buscarla por ID
                    const idPersona = doc.idPersona || doc.id_persona || (doc.persona && (doc.persona.idPersona || doc.persona.id));
                    if (idPersona) {
                        await personasStore.fetchPersonaById(idPersona);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching doctor or persona details:', error);
        }
    }
}, { immediate: true });

const abrirEditar = (asig) => {
    turnoEditando.value = asig;
    modalAbierto.value = true;
};

const abrirCrear = () => {
    modalCrear.value = true;
};

const onTurnoGuardado = async () => {
    await asignacionStore.fetchAsignaciones();
};

const selectedClinic = ref('c1');
const notes = ref('');
</script>

<style scoped>
.space-y-8>*+* {
    margin-top: 2rem;
}

.lh-1 {
    line-height: 1;
}

.experiencia-sheet {
    min-height: 140px;
}

.experiencia-texto {
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 220px;
    overflow-y: auto;
    line-height: 1.45;
}

:deep(.v-selection-control) {
    display: none !important;
}

.v-card--outlined {
    border-width: 2px !important;
}
</style>
