<template>
    <v-card class="rounded-xl pa-6" elevation="0" border>
        <v-card-title class="text-h5 font-weight-bold mb-4 text-deep-purple">
            <v-icon color="deep-purple" class="mr-2">mdi-brain</v-icon>
            Notas Psicológicas (Confidencial)
        </v-card-title>

        <v-form ref="form" v-model="valid">
            <v-row>
                <v-col cols="12" md="4">
                    <v-text-field v-model="formData.nroSesion" label="N° de Sesión" type="number" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="8">
                    <v-text-field v-model="formData.fechaHora" label="Fecha y Hora" type="datetime-local"
                        variant="outlined" density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.motivoConsulta" label="Motivo de Consulta" variant="outlined" rows="3"
                        class="mb-4"></v-textarea>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.bitacoraConfidencial" label="Bitácora Confidencial"
                        placeholder="Detalles de la sesión..." variant="outlined" rows="5" class="mb-4"></v-textarea>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.diagnosticoPsicologico" label="Diagnóstico Psicológico"
                        variant="outlined" rows="3" class="mb-4"></v-textarea>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <div class="d-flex justify-end gap-3">
                <v-btn color="deep-purple" size="large" rounded="lg" class="text-none font-weight-bold" @click="submit">
                    Subir Historial
                    <v-icon end>mdi-cloud-upload</v-icon>
                </v-btn>
            </div>
        </v-form>
    </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue'

const valid = ref(false)
const formData = reactive({
    nroSesion: 1,
    fechaHora: new Date().toISOString().slice(0, 16),
    motivoConsulta: 'Ansiedad por exámenes.',
    bitacoraConfidencial: 'El paciente manifiesta estrés elevado...',
    diagnosticoPsicologico: 'Trastorno de ansiedad generalizada (Presunto)'
})

const emit = defineEmits(['submit'])

const submit = () => {
    emit('submit', formData)
}
</script>

<style scoped>
.gap-3 {
    gap: 12px;
}
</style>
