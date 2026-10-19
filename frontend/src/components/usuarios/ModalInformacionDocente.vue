<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="600"
        persistent scrollable class="rounded-xl">
        <v-card class="rounded-xl overflow-hidden shadow-premium">
            <!-- Header -->
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1 text-white">
                    <v-icon start class="ms-4">mdi-human-greeting-variant</v-icon>
                    <div class="text-h6 font-weight-bold text-wrap flex-grow-1 ms-2 me-2">
                        Información Docente
                    </div>
                    <v-spacer class="hidden-xs"></v-spacer>
                    <v-btn icon="mdi-close" variant="text" @click="close" class="ms-auto"></v-btn>
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6 pa-md-8 bg-slate-50">
                <v-form ref="formRef" lazy-validation @submit.prevent="handleSave">
                    <p class="text-subtitle-2 text-medium-emphasis mb-6">
                        Registra la información del cargo docente para este usuario.
                    </p>

                    <v-row>
                        <!-- Número Item -->
                        <v-col cols="12" sm="6">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-numeric</v-icon>
                                <span>Número de Ítem</span>
                            </div>
                            <v-text-field v-model="form.numeroItem" label="Ítem" variant="outlined" rounded="lg"
                                bg-color="white" placeholder="Ej: 44552"
                                :rules="[v => !!v || 'El número de ítem es requerido']" />
                        </v-col>

                        <!-- Facultad -->
                        <v-col cols="12" sm="6">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-domain</v-icon>
                                <span>Facultad</span>
                            </div>
                            <v-text-field v-model="form.facultad" label="Facultad" variant="outlined" rounded="lg"
                                bg-color="white" placeholder="Ej: Medicina"
                                :rules="[v => !!v || 'La facultad es requerida']" />
                        </v-col>

                        <!-- Tipo Contrato -->
                        <v-col cols="12">
                            <div class="section-title mb-2">
                                <v-icon size="16" class="me-2" color="primary">mdi-file-document-outline</v-icon>
                                <span>Situación Laboral / Tipo Contrato</span>
                            </div>
                            <v-select v-model="form.interinoContratado"
                                :items="['Titular', 'Interino', 'Contratado', 'Invitado']" label="Tipo"
                                variant="outlined" rounded="lg" bg-color="white"
                                :rules="[v => !!v || 'El tipo de contrato es requerido']" />
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
                    {{ isEdit ? 'Guardar Cambios' : 'Activar Docente' }}
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
import { useDocentesStore } from '@/stores/docentes';
import ModalMensaje from '../common/ModalMensaje.vue';

const props = defineProps({
    modelValue: Boolean,
    personaId: [Number, String],
    docente: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const docentesStore = useDocentesStore();
const formRef = ref(null);
const loading = ref(false);
const isEdit = computed(() => !!props.docente);

const form = ref({
    numeroItem: '',
    facultad: '',
    interinoContratado: 'Titular'
});

// Feedback refs
const msgShow = ref(false);
const msgTitle = ref('');
const msgContent = ref('');
const msgType = ref('success');

watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
        if (props.docente) {
            form.value = {
                numeroItem: props.docente.numeroItem || '',
                facultad: props.docente.facultad || '',
                interinoContratado: props.docente.interinoContratado || 'Titular'
            };
        } else {
            form.value = { numeroItem: '', facultad: '', interinoContratado: 'Titular' };
        }
    }
});

const close = () => emit('update:modelValue', false);

const handleSave = async () => {
    const { valid } = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;
    try {
        if (isEdit.value) {
            await docentesStore.updateDocente(props.docente.idDocente, { ...form.value });
            msgContent.value = 'Información docente actualizada correctamente.';
        } else {
            await docentesStore.createDocente({ ...form.value, idPersona: Number(props.personaId) });
            msgContent.value = 'Perfil docente activado correctamente.';
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
