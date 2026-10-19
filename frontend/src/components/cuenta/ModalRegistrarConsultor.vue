<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="650"
        persistent scrollable>
        <v-card class="rounded-xl overflow-hidden">
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1 text-white">
                    <v-icon start class="ms-4">mdi-briefcase</v-icon>
                    <div class="text-h6 font-weight-bold flex-grow-1 ms-2">Registrar datos de Consultor</div>
                    <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6">
                <v-form ref="formRef" @submit.prevent="handleSave">
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="form.tipoServicio" label="Tipo de servicio" variant="outlined"
                                rounded="lg" hide-details="auto" :rules="[requiredRule('Tipo de servicio')]" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="form.unidad" label="Unidad" variant="outlined" rounded="lg"
                                hide-details="auto" :rules="[requiredRule('Unidad')]" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="form.fechaInicioContrato" type="date" label="Inicio de contrato"
                                variant="outlined" rounded="lg" hide-details="auto"
                                :rules="[requiredRule('Inicio de contrato')]" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="form.fechaFinContrato" type="date" label="Fin de contrato"
                                variant="outlined" rounded="lg" hide-details="auto"
                                :rules="[requiredRule('Fin de contrato')]" />
                        </v-col>
                        <v-col cols="12">
                            <v-text-field v-model="form.cargo" label="Cargo" variant="outlined" rounded="lg"
                                hide-details="auto" :rules="[requiredRule('Cargo')]" />
                        </v-col>
                        <v-col cols="12">
                            <v-file-input v-model="form.pdfContrato" accept="application/pdf"
                                label="PDF contrato (máx. 3MB)" prepend-icon="mdi-file-pdf-box" variant="outlined"
                                rounded="lg" hide-details="auto"
                                :rules="[pdfRule('El PDF de contrato', PDF_CONTRATO_MAX)]" />
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
import ModalMensaje from '@/components/common/ModalMensaje.vue'
import { fileFromVuetifyInput } from '@/utils/fileFromVuetifyInput'

const PDF_CONTRATO_MAX = 3 * 1024 * 1024

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'saved'])

const authStore = useAuthStore()
const formRef = ref(null)
const loading = ref(false)
const form = ref({
    tipoServicio: '',
    unidad: '',
    fechaInicioContrato: '',
    fechaFinContrato: '',
    cargo: '',
    pdfContrato: null,
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

watch(() => props.modelValue, (open) => {
    if (open) {
        form.value = {
            tipoServicio: '',
            unidad: '',
            fechaInicioContrato: '',
            fechaFinContrato: '',
            cargo: '',
            pdfContrato: null,
        }
        savedOk.value = false
    }
})

const close = () => emit('update:modelValue', false)

const handleSave = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return
    loading.value = true
    try {
        const pdfContrato = fileFromVuetifyInput(form.value.pdfContrato)
        const data = await authStore.registrarRolConsultor({
            tipoServicio: form.value.tipoServicio,
            unidad: form.value.unidad,
            fechaInicioContrato: form.value.fechaInicioContrato,
            fechaFinContrato: form.value.fechaFinContrato,
            cargo: form.value.cargo,
            pdfContrato,
        })
        savedOk.value = true
        msgTitle.value = 'Éxito'
        msgContent.value = data.message || 'Datos de consultor registrados.'
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
