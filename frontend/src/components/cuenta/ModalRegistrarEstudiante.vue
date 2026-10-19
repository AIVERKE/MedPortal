<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="650"
        persistent scrollable>
        <v-card class="rounded-xl overflow-hidden">
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1 text-white">
                    <v-icon start class="ms-4">mdi-school</v-icon>
                    <div class="text-h6 font-weight-bold flex-grow-1 ms-2">Registrar datos de Estudiante</div>
                    <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6">
                <v-form ref="formRef" @submit.prevent="handleSave">
                    <v-row dense>
                        <v-col cols="12">
                            <v-text-field v-model="form.registroUniversitario" label="Registro universitario"
                                type="number" variant="outlined" rounded="lg" hide-details="auto"
                                :rules="[requiredRule('El RU')]" />
                        </v-col>
                        <v-col cols="12">
                            <v-select v-model="form.idFacultad"
                                :items="facultades.map(f => ({ title: f.nombre, value: f.idFacultad }))"
                                label="Facultad" variant="outlined" rounded="lg" hide-details="auto"
                                :rules="[requiredRule('Facultad')]" @update:model-value="loadCarreras" />
                        </v-col>
                        <v-col cols="12">
                            <v-select v-model="form.idCarrera"
                                :items="carreras.map(c => ({ title: c.nombre, value: c.idCarrera }))"
                                label="Carrera" variant="outlined" rounded="lg" hide-details="auto"
                                :disabled="!form.idFacultad" :rules="[requiredRule('Carrera')]" />
                        </v-col>
                        <v-col cols="12">
                            <v-file-input v-model="form.pdfMatricula" accept="application/pdf"
                                label="PDF matrícula (máx. 1MB)" prepend-icon="mdi-file-pdf-box" variant="outlined"
                                rounded="lg" hide-details="auto"
                                :rules="[pdfRule('El PDF de matrícula', PDF_MATRICULA_MAX)]" />
                        </v-col>
                        <v-col cols="12">
                            <v-file-input v-model="form.pdfCarnet" accept="application/pdf"
                                label="PDF carnet (máx. 3MB)" prepend-icon="mdi-file-pdf-box" variant="outlined"
                                rounded="lg" hide-details="auto"
                                :rules="[pdfRule('El PDF de carnet', PDF_CARNET_MAX)]" />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-divider />
            <v-card-actions class="pa-4 d-flex ga-3">
                <v-btn variant="text" class="text-none flex-grow-1" size="large" @click="close">Cancelar</v-btn>
                <v-btn color="primary" class="text-none flex-grow-1" size="large" :loading="loading" @click="handleSave">
                    Guardar
                </v-btn>
            </v-card-actions>
        </v-card>
        <ModalMensaje v-model="msgShow" :title="msgTitle" :message="msgContent" :type="msgType"
            @confirm="onMsgConfirm" />
    </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRegistroEstudianteStore } from '@/stores/registroEstudiante'
import ModalMensaje from '@/components/common/ModalMensaje.vue'
import { fileFromVuetifyInput } from '@/utils/fileFromVuetifyInput'

const PDF_MATRICULA_MAX = 1 * 1024 * 1024
const PDF_CARNET_MAX = 3 * 1024 * 1024

const props = defineProps({
    modelValue: Boolean,
})
const emit = defineEmits(['update:modelValue', 'saved'])

const authStore = useAuthStore()
const registroStore = useRegistroEstudianteStore()
const formRef = ref(null)
const loading = ref(false)
const facultades = ref([])
const carreras = ref([])
const form = ref({
    registroUniversitario: '',
    idFacultad: null,
    idCarrera: null,
    pdfMatricula: null,
    pdfCarnet: null,
})

const msgShow = ref(false)
const msgTitle = ref('')
const msgContent = ref('')
const msgType = ref('success')
const savedOk = ref(false)

const requiredRule = (label) => (v) => !!v || `${label} es requerido`
const pdfRule = (label, maxBytes) => (v) => {
    const file = fileFromVuetifyInput(v)
    if (!file) return `${label} es obligatorio`
    if (file.type !== 'application/pdf') return `${label} debe ser un PDF`
    if (file.size > maxBytes) return `${label} no debe superar ${maxBytes / (1024 * 1024)}MB`
    return true
}

const resetForm = () => {
    form.value = {
        registroUniversitario: '',
        idFacultad: null,
        idCarrera: null,
        pdfMatricula: null,
        pdfCarnet: null,
    }
    carreras.value = []
    savedOk.value = false
}

const loadCarreras = async () => {
    form.value.idCarrera = null
    carreras.value = []
    if (!form.value.idFacultad) return
    carreras.value = await registroStore.fetchCarreras(form.value.idFacultad)
}

watch(() => props.modelValue, async (open) => {
    if (open) {
        resetForm()
        try {
            facultades.value = await registroStore.fetchFacultades()
        } catch {
            facultades.value = []
        }
    }
})

const close = () => emit('update:modelValue', false)

const handleSave = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return
    loading.value = true
    try {
        const pdfMatricula = fileFromVuetifyInput(form.value.pdfMatricula)
        const pdfCarnet = fileFromVuetifyInput(form.value.pdfCarnet)
        const data = await authStore.registrarRolEstudiante({
            registroUniversitario: form.value.registroUniversitario,
            idFacultad: form.value.idFacultad,
            idCarrera: form.value.idCarrera,
            pdfMatricula,
            pdfCarnet,
        })
        savedOk.value = true
        msgTitle.value = 'Éxito'
        msgContent.value = data.message || 'Datos de estudiante registrados.'
        msgType.value = 'success'
        msgShow.value = true
        emit('saved', data)
    } catch (error) {
        msgTitle.value = 'Error'
        msgContent.value = error.message || 'No se pudo registrar.'
        msgType.value = 'error'
        msgShow.value = true
    } finally {
        loading.value = false
    }
}

const onMsgConfirm = () => {
    msgShow.value = false
    if (savedOk.value) close()
}
</script>
