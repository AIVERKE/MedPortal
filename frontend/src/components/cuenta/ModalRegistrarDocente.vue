<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="600"
        persistent scrollable>
        <v-card class="rounded-xl overflow-hidden">
            <v-card-title class="pa-0">
                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1 text-white">
                    <v-icon start class="ms-4">mdi-human-male-board</v-icon>
                    <div class="text-h6 font-weight-bold flex-grow-1 ms-2">Registrar datos de Docente</div>
                    <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
                </v-toolbar>
            </v-card-title>

            <v-card-text class="pa-6">
                <v-form ref="formRef" @submit.prevent="handleSave">
                    <v-row dense>
                        <v-col cols="12">
                            <v-text-field v-model="form.numeroItem" label="Número de ítem" variant="outlined"
                                rounded="lg" hide-details="auto" :rules="[requiredRule('Número de ítem')]" />
                        </v-col>
                        <v-col cols="12">
                            <v-select v-model="form.facultad"
                                :items="facultades.map(f => ({ title: f.nombre, value: f.nombre }))"
                                label="Facultad" variant="outlined" rounded="lg" hide-details="auto"
                                :rules="[requiredRule('Facultad')]" />
                        </v-col>
                        <v-col cols="12">
                            <v-select v-model="form.interinoContratado"
                                :items="[{ title: 'Interino', value: 'Interino' }, { title: 'Contratado', value: 'Contratado' }]"
                                label="Interino / Contratado" variant="outlined" rounded="lg" hide-details="auto"
                                :rules="[requiredRule('Tipo de cargo')]" />
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

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'saved'])

const authStore = useAuthStore()
const registroStore = useRegistroEstudianteStore()
const formRef = ref(null)
const loading = ref(false)
const facultades = ref([])
const form = ref({ numeroItem: '', facultad: '', interinoContratado: '' })

const msgShow = ref(false)
const msgTitle = ref('')
const msgContent = ref('')
const msgType = ref('success')
const savedOk = ref(false)

const requiredRule = (label) => (v) => !!v || `${label} es requerido`

watch(() => props.modelValue, async (open) => {
    if (open) {
        form.value = { numeroItem: '', facultad: '', interinoContratado: '' }
        savedOk.value = false
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
        const data = await authStore.registrarRolDocente({ ...form.value })
        savedOk.value = true
        msgTitle.value = 'Éxito'
        msgContent.value = data.message || 'Datos de docente registrados.'
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
