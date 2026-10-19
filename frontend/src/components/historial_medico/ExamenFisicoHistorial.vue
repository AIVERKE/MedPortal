<template>
    <v-card class="rounded-xl pa-6" elevation="0" border>
        <v-card-title class="text-h5 font-weight-bold mb-4 text-teal-darken-1">
            <v-icon color="teal-darken-1" class="mr-2">mdi-human-check</v-icon>
            Examen Físico
        </v-card-title>

        <v-form ref="form" v-model="valid">
            <v-row>
                <v-col cols="12" md="2">
                    <v-text-field v-model="formData.pa" label="PA (Presión Arterial)" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="2">
                    <v-text-field v-model="formData.pulso" label="Pulso" variant="outlined" density="comfortable"
                        hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="2">
                    <v-text-field v-model="formData.temp" label="Temp (°C)" variant="outlined" density="comfortable"
                        hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field v-model="formData.peso" label="Peso (kg)" type="number" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field v-model="formData.talla" label="Talla (cm)" type="number" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <h3 class="text-subtitle-1 font-weight-bold text-teal-darken-2 mb-4">REVISIÓN POR SISTEMAS</h3>
            <v-table class="border rounded-lg mb-6">
                <thead>
                    <tr>
                        <th class="text-left font-weight-bold">Descripción</th>
                        <th class="text-center font-weight-bold" style="width: 100px;">PAT</th>
                        <th class="text-center font-weight-bold" style="width: 100px;">NOR</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in tableData" :key="index">
                        <td>{{ item.descripcion }}</td>
                        <td class="text-center">
                            <v-checkbox-btn v-model="item.pat" color="error" hide-details
                                @change="item.nor = !item.pat"></v-checkbox-btn>
                        </td>
                        <td class="text-center">
                            <v-checkbox-btn v-model="item.nor" color="success" hide-details
                                @change="item.pat = !item.nor"></v-checkbox-btn>
                        </td>
                    </tr>
                </tbody>
            </v-table>

            <v-row>
                <v-col cols="12">
                    <v-textarea v-model="formData.observaciones" label="Observaciones" variant="outlined" rows="2"
                        class="mb-4"></v-textarea>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.impresionDiagnostica" label="Impresión Diagnóstica" variant="outlined"
                        rows="2" class="mb-4"></v-textarea>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.conductaTratamiento" label="Conducta y Tratamiento" variant="outlined"
                        rows="3" class="mb-4"></v-textarea>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.evolucion" label="Evolución" variant="outlined" rows="5"
                        class="mb-4"></v-textarea>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <div class="d-flex justify-between gap-3 flex-wrap">
                <v-btn variant="text" color="grey" size="large" rounded="lg" class="text-none font-weight-bold"
                    @click="emit('prev')">
                    <v-icon start>mdi-arrow-left</v-icon>
                    Atrás
                </v-btn>
                <v-spacer></v-spacer>
                <div class="d-flex gap-3">
                    <v-btn color="orange-darken-2" variant="tonal" size="large" rounded="lg"
                        class="text-none font-weight-bold" @click="emit('derivar', formData)">
                        Derivar Paciente
                        <v-icon end>mdi-account-arrow-right</v-icon>
                    </v-btn>
                    <v-btn color="teal-darken-1" size="large" rounded="lg" class="text-none font-weight-bold"
                        @click="submit">
                        Finalizar y Subir
                        <v-icon end>mdi-check-all</v-icon>
                    </v-btn>
                </div>
            </div>
        </v-form>
    </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue'

const valid = ref(false)
const formData = reactive({
    pa: '120/80',
    pulso: '72 lpm',
    temp: '36.5',
    peso: 70,
    talla: 175,
    observaciones: 'Paciente en buen estado general.',
    impresionDiagnostica: 'Saludable.',
    conductaTratamiento: 'Control anual.',
    evolucion: 'Sin cambios significativos desde la última visita.'
})

const tableData = ref([
    { descripcion: 'Piel y mucosas', pat: false, nor: true },
    { descripcion: 'Agudeza visual', pat: false, nor: true },
    { descripcion: 'Agudeza auditiva', pat: false, nor: true },
    { descripcion: 'Tiroides', pat: false, nor: true },
    { descripcion: 'Corazón', pat: false, nor: true },
    { descripcion: 'Pulmones', pat: false, nor: true },
    { descripcion: 'Abdomen', pat: false, nor: true },
    { descripcion: 'Genitales', pat: false, nor: true },
    { descripcion: 'Extremidades', pat: false, nor: true }
])

const emit = defineEmits(['submit', 'prev', 'derivar'])

const submit = () => {
    emit('submit', { ...formData, table: tableData.value })
}
</script>

<style scoped>
.gap-3 {
    gap: 12px;
}
</style>
