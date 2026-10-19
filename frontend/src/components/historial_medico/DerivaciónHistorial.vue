<template>
    <v-card class="rounded-xl pa-6" elevation="0" border>
        <v-card-title class="text-h5 font-weight-bold mb-4 text-orange-darken-3">
            <v-icon color="orange-darken-3" class="mr-2">mdi-account-arrow-right</v-icon>
            Referencia / Derivación Médica
        </v-card-title>

        <v-form ref="form" v-model="valid">
            <v-row>
                <v-col cols="12" md="6">
                    <v-select v-model="formData.especialidad" :items="especialidadesItems"
                        :loading="especialidadStore.loading" label="Especialidad de Destino" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field v-model="formData.fechaEmision" label="Fecha de Emisión" readonly variant="outlined"
                        density="comfortable" hide-details class="mb-4" bg-color="grey-lighten-4"></v-text-field>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.motivoReferencia" label="Motivo de Referencia" variant="outlined"
                        rows="3" class="mb-4"></v-textarea>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.diagnosticoPresuntivo" label="Diagnóstico Presuntivo"
                        variant="outlined" rows="2" class="mb-4"></v-textarea>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.resumenSalud" label="Resumen de Salud / Hallazgos" variant="outlined"
                        rows="4" class="mb-4"></v-textarea>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <div class="d-flex justify-between gap-3">
                <v-btn variant="text" color="grey" size="large" rounded="lg" class="text-none font-weight-bold"
                    @click="emit('prev')">
                    <v-icon start>mdi-arrow-left</v-icon>
                    Atrás
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="orange-darken-3" size="large" rounded="lg" class="text-none font-weight-bold"
                    @click="submit" :disabled="especialidadStore.loading">
                    Finalizar y Subir Derivación
                    <v-icon end>mdi-cloud-upload</v-icon>
                </v-btn>
            </div>
        </v-form>
    </v-card>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useEspecialidadStore } from '@/stores/especialidad'

const especialidadStore = useEspecialidadStore()
const valid = ref(false)

const formData = reactive({
    especialidad: '',
    fechaEmision: new Date().toLocaleDateString(),
    motivoReferencia: 'Se requiere valoración por especialista debido a soplo detectado.',
    diagnosticoPresuntivo: 'Valvulopatía a estudio.',
    resumenSalud: 'Paciente masculino de 25 años, sin antecedentes de importancia...'
})

const especialidadesItems = computed(() => {
    return especialidadStore.especialidades.map(e => e.nombre.toUpperCase())
})

const emit = defineEmits(['submit', 'prev'])

onMounted(async () => {
    if (especialidadStore.especialidades.length === 0) {
        await especialidadStore.fetchEspecialidades()
    }
    if (especialidadesItems.value.length > 0) {
        formData.especialidad = especialidadesItems.value[0]
    }
})

const submit = () => {
    emit('submit', formData)
}
</script>

<style scoped>
.gap-3 {
    gap: 12px;
}
</style>
