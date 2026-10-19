<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="500"
        persistent scrollable class="rounded-xl">
        <v-card class="rounded-xl overflow-hidden shadow-premium">
            <!-- Header -->
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1 text-white">
                    <v-icon start class="ms-4">mdi-file-document-edit</v-icon>
                    <div class="text-h6 font-weight-bold text-wrap flex-grow-1 ms-2 me-2">
                        Información Consultor
                    </div>
                    <v-spacer class="hidden-xs"></v-spacer>
                    <v-btn icon="mdi-close" variant="text" @click="close" class="ms-auto"></v-btn>
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6 pa-md-8 bg-slate-50 text-center">
                <v-icon size="64" color="primary" class="mb-4">mdi-account-tie-outline</v-icon>
                <p class="text-subtitle-1 font-weight-bold mb-2">¿Activar perfil de Consultor?</p>
                <p class="text-body-2 text-medium-emphasis mb-6">
                    Se creará el registro de consultor para esta persona. Luego podrás añadir sus contratos específicos.
                </p>
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
                    Activar
                </v-btn>
            </v-card-actions>
        </v-card>
        <!-- Feedback UI -->
        <ModalMensaje v-model="msgShow" :title="msgTitle" :message="msgContent" :type="msgType"
            @confirm="handleMsgConfirm" />
    </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useConsultoresStore } from '@/stores/consultores';
import ModalMensaje from '../common/ModalMensaje.vue';

const props = defineProps({
    modelValue: Boolean,
    personaId: [Number, String]
});

const emit = defineEmits(['update:modelValue', 'saved']);

const consultoresStore = useConsultoresStore();
const loading = ref(false);

// Feedback refs
const msgShow = ref(false);
const msgTitle = ref('');
const msgContent = ref('');
const msgType = ref('success');

const close = () => emit('update:modelValue', false);

const handleSave = async () => {
    loading.value = true;
    try {
        await consultoresStore.createConsultor({ idPersona: Number(props.personaId) });
        msgTitle.value = 'Éxito';
        msgContent.value = 'Perfil de consultor activado correctamente.';
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
.shadow-premium {
    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.1) !important;
}

.bg-slate-50 {
    background-color: #f8fafc !important;
}
</style>
