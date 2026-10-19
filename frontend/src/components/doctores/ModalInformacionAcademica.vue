<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="600"
        persistent scrollable class="rounded-xl">
        <v-card class="rounded-xl overflow-hidden shadow-premium">
            <!-- Header -->
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1">
                    <v-icon start class="ms-4">mdi-school</v-icon>
                    <div class="text-h6 font-weight-bold text-wrap flex-grow-1 ms-2 me-2">
                        Editar Información Académica - Profesional
                    </div>
                    <v-spacer class="hidden-xs"></v-spacer>
                    <v-btn icon="mdi-close" variant="text" @click="close" class="ms-auto"></v-btn>
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6 pa-md-8 bg-slate-50">
                <v-form ref="formRef" lazy-validation @submit.prevent="handleSave">
                    <p class="text-subtitle-2 text-medium-emphasis mb-6">
                        {{ isCreateMode ?
                            'Completa los datos para registrar un nuevo médico.' :
                            "Modifica los datos profesionales del médico.Recuerda que la matrícula es única y obligatoria."
                        }}
                    </p>

                    <v-row>
                        <!-- Persona Selection (Only in Create Mode) -->
                        <v-col cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-account-search</v-icon>
                                <span>Persona en este Registro</span>
                            </div>
                            <div class="d-flex ga-2 align-center" v-if="isCreateMode">
                                <v-autocomplete v-model="form.id_persona" :items="personasItems" item-title="fullName"
                                    item-value="idPersona" label="Persona" variant="outlined" rounded="lg"
                                    bg-color="white" placeholder="Buscar por nombre o C.I..."
                                    :loading="personasStore.loading"
                                    :rules="[v => !!v || 'Debes seleccionar una persona']">
                                    <template v-slot:item="{ props, item }">
                                        <v-list-item v-bind="props" :title="item.raw.fullName"
                                            :subtitle="`C.I. ${item.raw.ci}`"></v-list-item>
                                    </template>
                                </v-autocomplete>
                                <v-btn icon="mdi-plus" color="primary" variant="tonal" rounded="lg" class="mb-5"
                                    @click="abrirCrearPersona"></v-btn>
                            </div>
                            <v-sheet v-else border rounded="lg" class="pa-3 mb-5 bg-white d-flex align-center ga-3">
                                <v-avatar color="primary-lighten-4" size="40">
                                    <v-icon color="primary">mdi-account</v-icon>
                                </v-avatar>
                                <div>
                                    <p class="text-body-2 font-weight-bold mb-0">
                                        {{ props.doctor?.nombre || `${props.doctor?.persona?.nombres} ${props.doctor?.persona?.primerApellido}` }}
                                    </p>
                                    <p class="text-caption text-grey-darken-1 mb-0">
                                        ID Persona: {{ form.id_persona }}
                                    </p>
                                </div>
                            </v-sheet>

                            <!-- User Management Status -->
                            <v-sheet border rounded="xl" class="pa-4 user-status-card mb-4"
                                :class="{ 'no-user': !hasUser }">
                                <div class="d-flex align-center justify-space-between flex-wrap ga-3">
                                    <div class="d-flex align-center ga-3">
                                        <v-icon :color="hasUser ? 'success' : 'warning'" size="28">
                                            {{ hasUser ? 'mdi-account-check' : 'mdi-account-alert' }}
                                        </v-icon>
                                        <div>
                                            <p class="text-caption font-weight-black text-uppercase tracking-wider mb-0"
                                                :class="hasUser ? 'text-success' : 'text-warning'">
                                                {{ hasUser ? 'Cuenta de Usuario Activa' : 'Sin Cuenta de Usuario' }}
                                            </p>
                                            <p class="text-caption text-grey-darken-1 mb-0">
                                                {{ hasUser ? 'La persona ya tiene acceso al sistema.' :
                                                    'La persona no podrá iniciar sesión.' }}
                                            </p>
                                        </div>
                                    </div>
                                    <v-btn :variant="hasUser ? 'outlined' : 'flat'"
                                        :color="hasUser ? 'primary' : 'warning'" rounded="lg" class="text-none px-4"
                                        size="small" @click="showConfirmUser = true" :disabled="!form.id_persona"
                                        :loading="loadingUserCheck">
                                        {{ hasUser ? 'Reestablecer Usuario' : 'Crear Usuario' }}
                                    </v-btn>
                                </div>
                            </v-sheet>
                        </v-col>

                        <!-- Especialidad Selection -->
                        <v-col cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-medical-bag</v-icon>
                                <span>Especialidad Médica</span>
                            </div>
                            <v-select v-model="form.id_especialidad_medica" :items="especialidadStore.especialidades"
                                item-title="nombre" item-value="id" label="Especialidad" variant="outlined" rounded="lg"
                                bg-color="white" :loading="especialidadStore.loading"
                                :rules="[v => !!v || 'La especialidad es requerida']" />
                        </v-col>
                        <!-- Matrícula Profesional -->
                        <v-col cols="12" sm="6">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-certificate-outline</v-icon>
                                <span>Matrícula Profesional</span>
                            </div>
                            <v-text-field v-model="form.matriculaProfesional" label="Matrícula" variant="outlined"
                                rounded="lg" bg-color="white" placeholder="Ej: MAT-12345"
                                :rules="[v => !!v || 'La matrícula es requerida']" />
                        </v-col>

                        <!-- Universidad de Origen -->
                        <v-col cols="12" sm="6">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-town-hall</v-icon>
                                <span>Universidad de Origen</span>
                            </div>
                            <v-text-field v-model="form.universidadOrigen" label="Universidad" variant="outlined"
                                rounded="lg" bg-color="white" placeholder="Ej: UMSA"
                                :rules="[v => !!v || 'La universidad es requerida']" />
                        </v-col>

                        <!-- Título Profesional -->
                        <v-col cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-account-tie-outline</v-icon>
                                <span>Título Profesional obtenido</span>
                            </div>
                            <v-text-field v-model="form.tituloProfesional" label="Título" variant="outlined"
                                rounded="lg" bg-color="white" placeholder="Ej: Médico Cirujano"
                                :rules="[v => !!v || 'El título es requerido']" />
                        </v-col>

                        <!-- Teléfono de Emergencia -->
                        <v-col cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-phone-alert-outline</v-icon>
                                <span>Teléfono de Emergencia</span>
                            </div>
                            <v-text-field v-model="form.telefonoEmergencia" label="Tel. Emergencia" variant="outlined"
                                rounded="lg" bg-color="white" placeholder="Ej: 71234567" />
                            <v-switch
                                v-model="form.compartirTelefonoEmergencia"
                                color="primary"
                                hide-details
                                class="mt-2"
                                label="Compartir teléfono de emergencia con pacientes al reservar"
                            />
                        </v-col>

                        <!-- Experiencia Profesional -->
                        <v-col cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-history</v-icon>
                                <span>Experiencia Profesional</span>
                            </div>
                            <v-textarea v-model="form.experienciaProfesional" label="Experiencia" variant="outlined"
                                rounded="lg" bg-color="white" rows="4"
                                placeholder="Detalla la trayectoria profesional, especialidades previas, etc..." />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-divider />

            <!-- Actions -->
            <v-card-actions class="pa-6 d-flex gap-3">
                <v-btn variant="text" color="grey-darken-1" rounded="xl" class="text-none font-weight-bold flex-grow-1"
                    size="large" @click="close">
                    Cancelar
                </v-btn>
                <v-btn color="primary" variant="flat" rounded="xl" class="text-none font-weight-bold flex-grow-1"
                    size="large" elevation="4" @click="handleSave">
                    Guardar Cambios
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- Modal para crear nueva persona -->
        <ModalInformacionPersonal v-model="showCrearPersona" @save="onPersonaCreada" />

        <!-- Flujo de confirmación para Usuario -->
        <ModalConfirmación v-model="showConfirmUser" title="¿Crear/Restablecer Usuario?"
            message="Se configurará un usuario con sus credenciales iguales a su C.I. (usuario y contraseña). ¿Deseas continuar?"
            type="warning" confirm-text="Sí, Proceder" @confirm="toggleUser" @cancel="showConfirmUser = false" />

        <!-- Feedback UI -->
        <ModalMensaje v-model="msgShow" :title="msgTitle" :message="msgContent" :type="msgType" :hint="msgHint"
            @confirm="handleMsgConfirm" />
    </v-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useEspecialidadStore } from '@/stores/especialidad';
import { usePersonasStore } from '@/stores/personas';
import { useDoctoresStore } from '@/stores/doctores';
import { useUsuariosStore } from '@/stores/usuarios';
import ModalInformacionPersonal from './ModalInformacionPersonal.vue';
import ModalMensaje from '../common/ModalMensaje.vue';
import ModalConfirmación from '../common/ModalConfirmación.vue';

const props = defineProps({
    modelValue: Boolean,
    doctor: {
        type: Object,
        default: () => null
    }
});

const emit = defineEmits(['update:modelValue', 'save', 'saved']);

const especialidadStore = useEspecialidadStore();
const personasStore = usePersonasStore();
const doctoresStore = useDoctoresStore();
const usuariosStore = useUsuariosStore();

const formRef = ref(null);
const isCreateMode = computed(() => !props.doctor?.id && !props.doctor?.idDoctor);

const form = ref({
    id_persona: null,
    id_especialidad_medica: null,
    matriculaProfesional: '',
    universidadOrigen: '',
    tituloProfesional: '',
    telefonoEmergencia: '',
    experienciaProfesional: '',
    compartirTelefonoEmergencia: false,
});

// Feedback refs
const msgShow = ref(false);
const msgTitle = ref('');
const msgContent = ref('');
const msgType = ref('success');
const msgHint = ref('');

// User management refs
const showConfirmUser = ref(false);
const hasUser = ref(false);
const loadingUserCheck = ref(false);

const checkUserStatus = async (idPersona) => {
    if (!idPersona) {
        hasUser.value = false;
        return;
    }
    loadingUserCheck.value = true;
    try {
        const user = await usuariosStore.fetchUserByPersona(idPersona);
        hasUser.value = !!(user && !user.deletedAt);
    } catch (error) {
        hasUser.value = false;
    } finally {
        loadingUserCheck.value = false;
    }
};

watch(() => form.value.id_persona, (newVal) => {
    checkUserStatus(newVal);
});

const personasItems = computed(() => {
    return personasStore.personas.map(p => ({
        ...p,
        fullName: `${p.nombres} ${p.primerApellido} ${p.segundoApellido || ''}`.trim() + ` - ${p.ci}`
    }));
});

const showCrearPersona = ref(false);

const abrirCrearPersona = () => {
    showCrearPersona.value = true;
};

const onPersonaCreada = async (personaData, photoFile = null) => {
    try {
        const res = await personasStore.createPersona(personaData);
        if (res) {
            const idPersona = res.idPersona || res.id_persona || res.id;
            if (idPersona && photoFile) {
                await personasStore.updatePersonaFoto(idPersona, photoFile);
            }
            await personasStore.fetchPersonas();
            // Seleccionar la persona recién creada (asumiendo que res contiene el objeto creado o al menos el id)
            form.value.id_persona = idPersona;
            showCrearPersona.value = false;
        }
    } catch (error) {
        console.error('Error al crear persona:', error);
    }
};

onMounted(() => {
    especialidadStore.fetchEspecialidades();
    personasStore.fetchPersonas();
});


// Poblar formulario al abrir
watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
        const d = props.doctor;
        if (d && (d.id || d.idDoctor)) {
            form.value = {
                id_persona: d.idPersona || d.id_persona || (d.persona && d.persona.idPersona) || (d.persona && d.persona.id) || null,
                id_especialidad_medica: d.idEspecialidadMedica || d.id_especialidad_medica || (d.especialidad && d.especialidad.idEspecialidadMedica) || null,
                matriculaProfesional: d.matriculaProfesional || '',
                universidadOrigen: d.universidadOrigen || '',
                tituloProfesional: d.tituloProfesional || '',
                telefonoEmergencia: d.telefonoEmergencia || '',
                experienciaProfesional: d.experienciaProfesional || '',
                compartirTelefonoEmergencia: Boolean(d.compartirTelefonoEmergencia),
            };
        } else {
            form.value = {
                id_persona: null,
                id_especialidad_medica: null,
                matriculaProfesional: '',
                universidadOrigen: '',
                tituloProfesional: '',
                telefonoEmergencia: '',
                experienciaProfesional: '',
                compartirTelefonoEmergencia: false,
            };
        }
    }
});

const close = () => emit('update:modelValue', false);

const toggleUser = async () => {
    showConfirmUser.value = false;
    if (!form.value.id_persona) return;

    try {
        const persona = personasStore.personas.find(p => (p.idPersona || p.id_persona || p.id) === form.value.id_persona);
        if (!persona) throw new Error('No se encontró la información de la persona.');

        await usuariosStore.createUsuario({
            idPersona: Number(form.value.id_persona),
            username: persona.ci,
            password: persona.ci
        });

        msgTitle.value = 'Usuario Configurado';
        msgContent.value = `Se ha creado/reestablecido el usuario exitosamente con el CI: ${persona.ci}`;
        msgType.value = 'success';
        msgHint.value = '';
        msgShow.value = true;
        checkUserStatus(form.value.id_persona);
    } catch (error) {
        msgTitle.value = 'Error';
        msgContent.value = error.message || 'No se pudo configurar el usuario.';
        msgType.value = 'error';
        msgShow.value = true;
    }
};

const handleSave = async () => {
    const { valid } = await formRef.value.validate();
    if (valid) {
        msgHint.value = '';
        // Construir payload limpio (whitelist para el backend)
        const rawPayload = {
            idPersona: Number(form.value.id_persona),
            idEspecialidadMedica: Number(form.value.id_especialidad_medica),
            matriculaProfesional: form.value.matriculaProfesional,
            universidadOrigen: form.value.universidadOrigen,
            tituloProfesional: form.value.tituloProfesional,
            telefonoEmergencia: form.value.telefonoEmergencia,
            experienciaProfesional: form.value.experienciaProfesional,
            compartirTelefonoEmergencia: Boolean(form.value.compartirTelefonoEmergencia),
        };

        // Eliminar campos opcionales vacíos para evitar errores de validación
        const payload = Object.fromEntries(
            Object.entries(rawPayload).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
        );

        if (isCreateMode.value) {
            try {
                const res = await doctoresStore.createDoctor(payload);
                if (res) {
                    msgTitle.value = 'Éxito';
                    msgContent.value = 'Doctor registrado exitosamente.';
                    msgType.value = 'success';
                    
                    if (!hasUser.value) {
                        msgHint.value = 'AVISO: Esta persona aún no tiene una cuenta de usuario. Recuerda hacer clic en "Crear/Reestablecer Usuario".';
                    }

                    msgShow.value = true;
                    emit('saved');
                }
            } catch (error) {
                msgTitle.value = 'Error';
                msgContent.value = error.message || 'No se pudo registrar al doctor.';
                msgType.value = 'error';
                msgShow.value = true;
            }
        } else {
            // Para el modo edición (que se maneja en DetalleDoctores)
            if (!hasUser.value) {
                msgHint.value = 'AVISO: Esta persona aún no tiene una cuenta de usuario.';
            }
            emit('save', payload);
        }
    }
};

const handleMsgConfirm = () => {
    msgShow.value = false;
    // Si fue exitoso, cerramos el modal principal después de que el usuario confirme el mensaje
    if (msgType.value === 'success' && msgTitle.value === 'Éxito') {
        close();
    }
};
</script>

<style scoped>
.gap-3 {
    gap: 12px;
}

.section-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 800;
    color: #64748b;
    display: flex;
    align-items: center;
}

.shadow-premium {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}

:deep(.v-field__outline) {
    --v-field-border-opacity: 0.1;
}

.bg-slate-50 {
    background-color: #f8fafc !important;
}

.user-status-card {
    border: 1px dashed #cbd5e1;
    transition: all 0.3s ease;
}

.user-status-card.no-user {
    background-color: #fff7ed;
    border-color: #ffedd5;
}
</style>
