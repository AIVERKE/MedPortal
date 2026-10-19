<template>
    <v-card class="rounded-xl pa-6" elevation="0" border>
        <v-card-title class="text-h5 font-weight-bold mb-4 text-pink-darken-1">
            <v-icon color="pink-darken-1" class="mr-2">mdi-female</v-icon>
            Antecedentes Gineco-Obstétricos
        </v-card-title>

        <v-form ref="form" v-model="valid">
            <v-row>
                <v-col cols="12" md="2">
                    <v-text-field v-model="formData.gesta" label="Gesta" type="number" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="2">
                    <v-text-field v-model="formData.para" label="Para" type="number" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="2">
                    <v-text-field v-model="formData.abortos" label="Abortos" type="number" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="2">
                    <v-text-field v-model="formData.irs" label="IRS (años)" type="number" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                    <v-text-field v-model="formData.menarca" label="Menarca (Fecha)" type="date" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                    <v-text-field v-model="formData.fum" label="FUM (Fecha)" type="date" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="2">
                    <v-text-field v-model="formData.ritmo" label="Ritmo" variant="outlined" density="comfortable"
                        hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-select v-model="formData.planificacionFamiliar" :items="['Si', 'No']"
                        label="Planificación Familiar" variant="outlined" density="comfortable" hide-details
                        class="mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field v-model="formData.causaAbandono" label="Causa de Abandono" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field v-model="formData.fup" label="FUP (Fecha Último Parto)" type="date" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field v-model="formData.fua" label="FUA (Fecha Último Aborto)" type="date"
                        variant="outlined" density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>

                <v-col cols="12">
                    <v-textarea v-model="formData.motivoConsulta" label="Motivo de la Consulta" variant="outlined"
                        rows="2" class="mb-4"></v-textarea>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.enfermedadActual" label="Enfermedad Actual" variant="outlined"
                        rows="3" class="mb-4"></v-textarea>
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
                <v-btn color="pink-darken-1" size="large" rounded="lg" class="text-none font-weight-bold"
                    @click="nextStep">
                    Ir a Examen Físico
                    <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
            </div>
        </v-form>
    </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue'

const valid = ref(false)
const formData = reactive({
    gesta: 0,
    para: 0,
    abortos: 0,
    irs: 18,
    menarca: '2010-06-15',
    fum: '2024-03-01',
    ritmo: '28/5',
    planificacionFamiliar: 'No',
    causaAbandono: 'N/A',
    fup: '',
    fua: '',
    motivoConsulta: 'Control prenatal.',
    enfermedadActual: 'Paciente asintomática.'
})

const emit = defineEmits(['next', 'prev'])

const nextStep = () => {
    emit('next', formData)
}
</script>

<style scoped>
.gap-3 {
    gap: 12px;
}
</style>
