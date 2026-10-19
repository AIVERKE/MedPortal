<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="640"
        persistent scrollable class="rounded-xl">
        <v-card class="rounded-xl overflow-hidden shadow-premium">
            <!-- Header -->
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1 text-white">
                    <v-icon start class="ms-4">mdi-school</v-icon>
                    <div class="text-h6 font-weight-bold text-wrap flex-grow-1 ms-2 me-2">
                        Información Académica (Estudiante)
                    </div>
                    <v-spacer class="hidden-xs"></v-spacer>
                    <v-btn icon="mdi-close" variant="text" @click="close" class="ms-auto"></v-btn>
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6 pa-md-8 bg-slate-50">
                <v-form ref="formRef" lazy-validation @submit.prevent="handleSave">
                    <p class="text-subtitle-2 text-medium-emphasis mb-6">
                        Completa los datos académicos oficiales del estudiante para activar su perfil en el sistema.
                    </p>

                    <v-row>
                        <!-- RU -->
                        <v-col cols="12" sm="6">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-card-account-details-outline</v-icon>
                                <span>Registro Universitario (RU)</span>
                            </div>
                            <v-text-field v-model="form.registroUniversitario" label="RU" variant="outlined"
                                rounded="lg" bg-color="white" placeholder="Ej: 1729384"
                                :rules="[v => !!v || 'El RU es requerido']" />
                        </v-col>

                        <!-- Facultad -->
                        <v-col cols="12" sm="6">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-domain</v-icon>
                                <span>Facultad</span>
                            </div>
                            <v-select v-model="form.idFacultad"
                                :items="facultadesStore.facultades.map(f => ({ title: f.nombre, value: f.id }))"
                                label="Facultad" variant="outlined" rounded="lg" bg-color="white"
                                :loading="facultadesStore.loading"
                                :rules="[v => !!v || 'La facultad es requerida']"
                                @update:model-value="onFacultadChange" />
                        </v-col>

                        <!-- Carrera -->
                        <v-col cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-book-education-outline</v-icon>
                                <span>Carrera</span>
                            </div>
                            <v-select v-model="form.idCarrera"
                                :items="carrerasFiltradas.map(c => ({ title: c.nombre, value: c.id }))"
                                :disabled="!form.idFacultad" label="Carrera" variant="outlined" rounded="lg"
                                bg-color="white" :loading="carrerasStore.loading"
                                :rules="[v => !!v || 'La carrera es requerida']" />
                        </v-col>

                        <!-- Estado Académico -->
                        <v-col cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-list-status</v-icon>
                                <span>Estado Académico</span>
                            </div>
                            <v-select v-model="form.estadoAcademico"
                                :items="['Regular', 'Egresado', 'Suspendido', 'Pasantía']" label="Estado"
                                variant="outlined" rounded="lg" bg-color="white"
                                :rules="[v => !!v || 'El estado es requerido']" />
                        </v-col>

                        <!-- Documentos actuales (solo edición) -->
                        <v-col v-if="isEdit" cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-file-document-multiple</v-icon>
                                <span>Documentos actuales</span>
                            </div>
                            <v-row dense>
                                <v-col cols="12" sm="6">
                                    <div class="doc-current pa-3 rounded-lg border bg-white">
                                        <p class="text-caption font-weight-bold text-uppercase text-grey mb-1">PDF Matrícula</p>
                                        <a v-if="props.estudiante?.documentoMatriculaUrl"
                                            :href="resolveUploadUrl(props.estudiante.documentoMatriculaUrl)"
                                            target="_blank" rel="noopener" class="doc-link">
                                            Ver documento
                                        </a>
                                        <span v-else class="text-caption text-grey">No cargado</span>
                                    </div>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <div class="doc-current pa-3 rounded-lg border bg-white">
                                        <p class="text-caption font-weight-bold text-uppercase text-grey mb-1">PDF CI</p>
                                        <a v-if="props.estudiante?.documentoCarnetUrl"
                                            :href="resolveUploadUrl(props.estudiante.documentoCarnetUrl)"
                                            target="_blank" rel="noopener" class="doc-link">
                                            Ver documento
                                        </a>
                                        <span v-else class="text-caption text-grey">No cargado</span>
                                    </div>
                                </v-col>
                            </v-row>
                        </v-col>

                        <!-- Reemplazar documentos (solo edición) -->
                        <v-col v-if="isEdit" cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-file-replace</v-icon>
                                <span>Reemplazar documentos</span>
                            </div>
                            <v-file-input v-model="pdfMatricula" accept="application/pdf"
                                prepend-icon="mdi-file-pdf-box" label="Nuevo PDF matrícula (máx. 1MB)"
                                variant="outlined" rounded="lg" bg-color="white" clearable hide-details="auto"
                                class="mb-3" :rules="[optionalPdfRule('El PDF de matrícula', PDF_MATRICULA_MAX)]" />
                            <v-file-input v-model="pdfCarnet" accept="application/pdf"
                                prepend-icon="mdi-file-pdf-box" label="Nuevo PDF CI (máx. 3MB)"
                                variant="outlined" rounded="lg" bg-color="white" clearable hide-details="auto"
                                :rules="[optionalPdfRule('El PDF de CI', PDF_CARNET_MAX)]" />
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
                <v-btn color="primary" variant="flat" rounded="xl"
                    class="text-none font-weight-bold flex-grow-1 shadow-premium" size="large" elevation="4"
                    @click="handleSave" :loading="loading">
                    {{ isEdit ? 'Guardar Cambios' : 'Activar Estudiante' }}
                </v-btn>
            </v-card-actions>
        </v-card>
        <!-- Feedback UI -->
        <ModalMensaje v-model="msgShow" :title="msgTitle" :message="msgContent" :type="msgType"
            @confirm="handleMsgConfirm" />
    </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useEstudiantesStore } from '@/stores/estudiantes';
import { useFacultadesStore } from '@/stores/facultades';
import { useCarrerasStore } from '@/stores/carreras';
import { resolveUploadUrl } from '@/utils/uploadUrl';
import ModalMensaje from '../common/ModalMensaje.vue';

const props = defineProps({
    modelValue: Boolean,
    personaId: [Number, String],
    estudiante: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const estudiantesStore = useEstudiantesStore();
const facultadesStore = useFacultadesStore();
const carrerasStore = useCarrerasStore();
const formRef = ref(null);
const loading = ref(false);
const isEdit = computed(() => !!props.estudiante);

const PDF_MATRICULA_MAX = 1 * 1024 * 1024;
const PDF_CARNET_MAX = 3 * 1024 * 1024;

const form = ref({
    registroUniversitario: '',
    idFacultad: null,
    idCarrera: null,
    estadoAcademico: 'Regular'
});

const pdfMatricula = ref(null);
const pdfCarnet = ref(null);

const carrerasFiltradas = computed(() => {
    if (!form.value.idFacultad) return [];
    return carrerasStore.carreras.filter(c => c.idFacultad === form.value.idFacultad);
});

// Feedback refs
const msgShow = ref(false);
const msgTitle = ref('');
const msgContent = ref('');
const msgType = ref('success');

const optionalPdfRule = (label, maxBytes) => (v) => {
    if (!v) return true;
    const file = Array.isArray(v) ? v[0] : v;
    if (!file) return true;
    if (file.type !== 'application/pdf') return `${label} debe ser un PDF`;
    if (file.size > maxBytes) {
        const maxMb = maxBytes / (1024 * 1024);
        return `${label} no debe superar ${maxMb}MB`;
    }
    return true;
};

const resolveFacultadId = (estudiante) => {
    if (estudiante?.facultadCatalogo?.idFacultad) {
        return estudiante.facultadCatalogo.idFacultad;
    }
    const match = facultadesStore.facultades.find(
        f => f.nombre === estudiante?.facultad
    );
    return match?.id ?? null;
};

const resolveCarreraId = (estudiante) => {
    if (estudiante?.carreraCatalogo?.idCarrera) {
        return estudiante.carreraCatalogo.idCarrera;
    }
    const match = carrerasStore.carreras.find(
        c => c.nombre === estudiante?.carrera && c.idFacultad === form.value.idFacultad
    );
    return match?.id ?? null;
};

const onFacultadChange = async () => {
    form.value.idCarrera = null;
    if (!form.value.idFacultad) return;
    await carrerasStore.fetchCarreras({ facultadId: form.value.idFacultad, includeInactive: true });
};

const resetForm = () => {
    form.value = {
        registroUniversitario: '',
        idFacultad: null,
        idCarrera: null,
        estadoAcademico: 'Regular'
    };
    pdfMatricula.value = null;
    pdfCarnet.value = null;
};

const initForm = async () => {
    resetForm();
    await facultadesStore.fetchFacultades(true);

    if (props.estudiante) {
        form.value.registroUniversitario = props.estudiante.registroUniversitario || '';
        form.value.estadoAcademico = props.estudiante.estadoAcademico || 'Regular';

        const idFacultad = resolveFacultadId(props.estudiante);
        if (idFacultad) {
            form.value.idFacultad = idFacultad;
            await carrerasStore.fetchCarreras({ facultadId: idFacultad, includeInactive: true });
            form.value.idCarrera = resolveCarreraId(props.estudiante);
        }
    }
};

watch(() => props.modelValue, (isOpen) => {
    if (isOpen) initForm();
});

const close = () => emit('update:modelValue', false);

const handleSave = async () => {
    const { valid } = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;
    try {
        const payload = {
            registroUniversitario: form.value.registroUniversitario,
            idFacultad: form.value.idFacultad,
            idCarrera: form.value.idCarrera,
            estadoAcademico: form.value.estadoAcademico,
        };

        if (isEdit.value) {
            await estudiantesStore.updateEstudiante(props.estudiante.idEstudiante, payload);

            const matriculaFile = Array.isArray(pdfMatricula.value) ? pdfMatricula.value[0] : pdfMatricula.value;
            const carnetFile = Array.isArray(pdfCarnet.value) ? pdfCarnet.value[0] : pdfCarnet.value;

            if (matriculaFile || carnetFile) {
                await estudiantesStore.updateDocumentos(props.estudiante.idEstudiante, {
                    pdfMatricula: matriculaFile || undefined,
                    pdfCarnet: carnetFile || undefined,
                });
            }

            msgContent.value = 'Información académica actualizada correctamente.';
        } else {
            await estudiantesStore.createEstudiante({
                ...payload,
                idPersona: Number(props.personaId),
            });
            msgContent.value = 'Perfil de estudiante activado correctamente.';
        }

        msgTitle.value = 'Éxito';
        msgType.value = 'success';
        msgShow.value = true;
        emit('saved');
    } catch (error) {
        msgTitle.value = 'Error';
        msgContent.value = error.message || 'No se pudo procesar la solicitud.';
        msgType.value = 'error';
        msgShow.value = true;
    } finally {
        loading.value = false;
    }
};

const handleMsgConfirm = () => {
    msgShow.value = false;
    if (msgType.value === 'success') close();
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
    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.1) !important;
}

.bg-slate-50 {
    background-color: #f8fafc !important;
}

.doc-link {
    color: rgb(var(--v-theme-primary));
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
}

.doc-link:hover {
    text-decoration: underline;
}
</style>
