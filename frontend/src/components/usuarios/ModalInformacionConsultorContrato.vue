<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="650"
        persistent scrollable class="rounded-xl">
        <v-card class="rounded-xl overflow-hidden shadow-premium">
            <!-- Header -->
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1 text-white">
                    <v-icon start class="ms-4">mdi-file-certificate</v-icon>
                    <div class="text-h6 font-weight-bold text-wrap flex-grow-1 ms-2 me-2">
                        Detalle de Contrato (Consultor)
                    </div>
                    <v-spacer class="hidden-xs"></v-spacer>
                    <v-btn icon="mdi-close" variant="text" @click="close" class="ms-auto"></v-btn>
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6 pa-md-8 bg-slate-50">
                <v-form ref="formRef" lazy-validation @submit.prevent="handleSave">
                    <p class="text-subtitle-2 text-medium-emphasis mb-6">
                        Define los términos y vigencia del contrato de consultoría.
                    </p>

                    <v-row>
                        <!-- Cargo -->
                        <v-col cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-account-tie-outline</v-icon>
                                <span>Cargo o Función</span>
                            </div>
                            <v-text-field v-model="form.cargo" label="Cargo" variant="outlined" rounded="lg"
                                bg-color="white" placeholder="Ej: Consultor Técnico en Salud"
                                :rules="[v => !!v || 'El cargo es requerido']" />
                        </v-col>

                        <!-- Unidad -->
                        <v-col cols="12" sm="6">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-office-building-outline</v-icon>
                                <span>Unidad / Área</span>
                            </div>
                            <v-text-field v-model="form.unidad" label="Unidad" variant="outlined" rounded="lg"
                                bg-color="white" placeholder="Ej: Dirección de Salud"
                                :rules="[v => !!v || 'La unidad es requerida']" />
                        </v-col>

                        <!-- Tipo de Servicio -->
                        <v-col cols="12" sm="6">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-briefcase-variant-outline</v-icon>
                                <span>Tipo de Servicio (ID)</span>
                            </div>
                            <v-text-field v-model.number="form.idServicio" label="ID Servicio" type="number"
                                variant="outlined" rounded="lg" bg-color="white" placeholder="101"
                                :rules="[v => !!v || 'El tipo de servicio es requerido']" />
                        </v-col>

                        <!-- Fechas -->
                        <v-col cols="12" sm="6">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-calendar-start</v-icon>
                                <span>Fecha Inicio</span>
                            </div>
                            <v-text-field v-model="form.fechaInicioContrato" type="date" label="Inicio"
                                variant="outlined" rounded="lg" bg-color="white"
                                :rules="[v => !!v || 'La fecha de inicio es requerida']" />
                        </v-col>

                        <v-col cols="12" sm="6">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-calendar-end</v-icon>
                                <span>Fecha Fin</span>
                            </div>
                            <v-text-field v-model="form.fechaFinContrato" type="date" label="Fin" variant="outlined"
                                rounded="lg" bg-color="white" :rules="[v => !!v || 'La fecha de fin es requerida']" />
                        </v-col>

                        <!-- Documento PDF -->
                        <v-col cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-file-pdf-box</v-icon>
                                <span>Documento PDF (máx. 3MB)</span>
                            </div>
                            <p v-if="isEdit && currentPdfUrl" class="text-body-2 mb-3">
                                <a :href="currentPdfUrl" target="_blank" rel="noopener" class="text-primary font-weight-medium">
                                    Ver PDF actual
                                </a>
                            </p>
                            <v-file-input v-model="form.pdfContrato" accept="application/pdf"
                                prepend-icon="mdi-file-pdf-box" label="PDF del contrato" variant="outlined"
                                rounded="lg" bg-color="white" show-size hide-details="auto"
                                :rules="[pdfRule]" />
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
                    {{ isEdit ? 'Guardar Cambios' : 'Registrar Contrato' }}
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
import { useConsultoresStore } from '@/stores/consultores';
import ModalMensaje from '../common/ModalMensaje.vue';

const API_BASE = import.meta.env.VITE_API_URL;
const PDF_CONTRATO_MAX = 3 * 1024 * 1024;

const props = defineProps({
    modelValue: Boolean,
    consultorId: [Number, String],
    contrato: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const consultoresStore = useConsultoresStore();
const formRef = ref(null);
const loading = ref(false);
const isEdit = computed(() => !!props.contrato);

const form = ref({
    cargo: '',
    unidad: '',
    idServicio: null,
    fechaInicioContrato: '',
    fechaFinContrato: '',
    pdfContrato: null
});

const currentPdfUrl = computed(() => {
    const path = props.contrato?.documentoContratoUrl;
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = (API_BASE || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
});

const pdfRule = (v) => {
    const file = Array.isArray(v) ? v[0] : v;
    if (!file) {
        return isEdit.value ? true : 'El PDF de contrato es obligatorio';
    }
    if (file.type !== 'application/pdf') return 'El archivo debe ser un PDF';
    if (file.size > PDF_CONTRATO_MAX) return 'El PDF no debe superar 3MB';
    return true;
};

const msgShow = ref(false);
const msgTitle = ref('');
const msgContent = ref('');
const msgType = ref('success');

watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
        if (props.contrato) {
            form.value = {
                cargo: props.contrato.cargo || '',
                unidad: props.contrato.unidad || '',
                idServicio: props.contrato.idServicio || null,
                fechaInicioContrato: String(props.contrato.fechaInicioContrato || '').slice(0, 10),
                fechaFinContrato: String(props.contrato.fechaFinContrato || '').slice(0, 10),
                pdfContrato: null
            };
        } else {
            form.value = {
                cargo: '',
                unidad: '',
                idServicio: null,
                fechaInicioContrato: '',
                fechaFinContrato: '',
                pdfContrato: null
            };
        }
    }
});

const close = () => emit('update:modelValue', false);

const handleSave = async () => {
    const { valid } = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;
    try {
        const pdfFile = Array.isArray(form.value.pdfContrato)
            ? form.value.pdfContrato[0]
            : form.value.pdfContrato;
        const payload = {
            cargo: form.value.cargo,
            unidad: form.value.unidad,
            idServicio: Number(form.value.idServicio),
            fechaInicioContrato: form.value.fechaInicioContrato,
            fechaFinContrato: form.value.fechaFinContrato,
            pdfContrato: pdfFile || undefined
        };

        if (isEdit.value) {
            await consultoresStore.updateContrato(props.contrato.idContratoConsultor, payload);
            msgContent.value = 'Contrato actualizado correctamente.';
        } else {
            await consultoresStore.createContrato({
                ...payload,
                idConsultor: Number(props.consultorId)
            });
            msgContent.value = 'Contrato registrado correctamente.';
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
</style>
