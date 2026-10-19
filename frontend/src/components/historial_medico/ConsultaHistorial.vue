<template>
    <v-card class="rounded-xl pa-6" elevation="0" border>
        <v-card-title class="text-h5 font-weight-bold mb-4">
            <v-icon color="primary" class="mr-2">mdi-clipboard-text-outline</v-icon>
            Consulta Médica
        </v-card-title>

        <v-form ref="form" v-model="valid">
            <v-row>
                <v-col cols="12" md="3">
                    <v-text-field v-model="formData.hcl" label="N° HCL" variant="outlined" density="comfortable"
                        hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field v-model="formData.facultad" label="Facultad" variant="outlined" density="comfortable"
                        hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field v-model="formData.carrera" label="Carrera" variant="outlined" density="comfortable"
                        hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field v-model="formData.fechaPrimeraConsulta" label="Fecha Primera Consulta" type="date"
                        variant="outlined" density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <h3 class="text-subtitle-1 font-weight-bold text-primary mb-4">DATOS GENERALES</h3>
            <v-row>
                <v-col cols="12" md="6">
                    <v-text-field v-model="formData.nombreCompleto" label="Nombres y Apellidos" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-select v-model="formData.sexo" :items="['M', 'F']" label="Sexo" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field v-model="formData.fechaNacimiento" label="Fecha de Nacimiento" type="date"
                        variant="outlined" density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                    <v-text-field v-model="formData.lugarNacimiento" label="Lugar de Nacimiento" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                    <v-select v-model="formData.estadoCivil" :items="['Casado', 'Soltero', 'Concubino']"
                        label="Estado Civil" variant="outlined" density="comfortable" hide-details
                        class="mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="4">
                    <v-text-field v-model="formData.fono" label="Teléfono/Celular" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field v-model="formData.domicilio" label="Domicilio Actual" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field v-model="formData.zona" label="Zona" variant="outlined" density="comfortable"
                        hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12">
                    <v-text-field v-model="formData.referenciaAccidente"
                        label="Persona de referencia en caso de accidente" placeholder="Nombre y Teléfono"
                        variant="outlined" density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <h3 class="text-subtitle-1 font-weight-bold text-primary mb-4">ANTECEDENTES PERSONALES NO PATOLÓGICOS</h3>
            <v-row>
                <v-col cols="12" md="4">
                    <v-select v-model="formData.vivienda" :items="['Propia', 'Alquilada', 'Cedida', 'Anticrético']"
                        label="Vivienda" variant="outlined" density="comfortable" hide-details class="mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="2">
                    <v-text-field v-model="formData.numHab" label="N° Hab" type="number" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="2">
                    <v-select v-model="formData.cocina" :items="['Si', 'No']" label="Cocina" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="2">
                    <v-select v-model="formData.agua" :items="['Si', 'No']" label="Agua Domiciliaria" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="2">
                    <v-select v-model="formData.servicioHigienico" :items="['Si', 'No']" label="S. Higiénico"
                        variant="outlined" density="comfortable" hide-details class="mb-4"></v-select>
                </v-col>

                <v-col cols="12" md="2">
                    <v-select v-model="formData.fuma" :items="['Si', 'No']" label="Fuma" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="4">
                    <v-select v-model="formData.alcohol" :items="['No', 'Si', 'Cerveza', 'Singani', 'Whisky', 'Otros']"
                        label="Bebidas Alcohólicas" variant="outlined" density="comfortable" hide-details
                        class="mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field v-model="formData.frecuenciaAlcohol" label="Frecuencia (.../mes)" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field v-model="formData.edadCompanera" label="Edad esposa/compañera" type="number"
                        variant="outlined" density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                    <v-text-field v-model="formData.ocupacion" label="Ocupación" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                    <v-text-field v-model="formData.profesion" label="Profesión" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                    <v-select v-model="formData.estudiante" :items="['Si', 'No']" label="Estudiante" variant="outlined"
                        density="comfortable" hide-details class="mb-4"></v-select>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <h3 class="text-subtitle-1 font-weight-bold text-primary mb-4">ANTECEDENTES PATOLÓGICOS Y FAMILIARES</h3>
            <v-row>
                <v-col cols="12">
                    <v-select v-model="formData.enfermedades" :items="enfermedadesList" label="Seleccionar Enfermedades"
                        multiple chips variant="outlined" density="comfortable"
                        placeholder="Añada enfermedades de la lista" class="mb-2"></v-select>
                </v-col>

                <v-col cols="12" v-if="formData.enfermedades.includes('OTROS')">
                    <div class="d-flex align-center gap-2">
                        <v-combobox v-model="formData.otraEnfermedad"
                            :items="enfermedadesList.filter(e => e !== 'OTROS')" label="Especifique otra enfermedad"
                            placeholder="Escriba para buscar o agregar..." variant="outlined" density="comfortable"
                            clearable class="mb-0 flex-grow-1" prepend-inner-icon="mdi-plus-circle-outline"
                            @keydown.enter.prevent="addOtraEnfermedad"></v-combobox>
                        <v-btn color="success" variant="elevated" icon="mdi-plus" class="rounded-lg"
                            title="Añadir a la lista" @click="addOtraEnfermedad"
                            :disabled="!formData.otraEnfermedad"></v-btn>
                    </div>
                    <p class="text-caption text-medium-emphasis mt-1 ml-1">
                        Presiona el botón + o Enter para añadir a la lista de enfermedades del paciente.
                    </p>
                </v-col>

                <v-col cols="12">
                    <v-textarea v-model="formData.observaciones" label="Observaciones" variant="outlined" rows="3"
                        class="mb-4"></v-textarea>
                </v-col>
                <v-col cols="12">
                    <v-textarea v-model="formData.antecedentesPatFam" label="Antecedentes Patológicos y Familiares"
                        variant="outlined" rows="3" class="mb-4"></v-textarea>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <div class="d-flex justify-end gap-3">
                <v-btn color="primary" size="large" rounded="lg" class="text-none font-weight-bold" @click="nextStep">
                    Ir a Antecedentes Gineco Obstétricos
                    <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
            </div>
        </v-form>
    </v-card>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const valid = ref(false)
const formData = reactive({
    hcl: '123456',
    facultad: 'Medicina',
    carrera: 'Enfermería',
    fechaPrimeraConsulta: new Date().toISOString().substr(0, 10),
    nombreCompleto: 'Juan Pérez Silva',
    sexo: 'M',
    fechaNacimiento: '1995-05-20',
    lugarNacimiento: 'La Paz',
    estadoCivil: 'Soltero',
    fono: '76543210',
    domicilio: 'Av. Villazón N° 1995',
    zona: 'Central',
    referenciaAccidente: 'María Pérez (Madre) - 78945612',
    vivienda: 'Propia',
    numHab: 3,
    cocina: 'Si',
    agua: 'Si',
    servicioHigienico: 'Si',
    fuma: 'No',
    alcohol: 'Si',
    frecuenciaAlcohol: '2',
    edadCompanera: '',
    ocupacion: 'Estudiante',
    profesion: 'Bachiller',
    estudiante: 'Si',
    enfermedades: ['HIPERTENSION', 'DIABETES'],
    otraEnfermedad: '',
    observaciones: 'Ninguna relevante.',
    antecedentesPatFam: 'Padre con hipertensión.'
})

const enfermedadesMock = [
    'Hipertension', 'tbc pulmonar', 'diabetes', 'patologia mamaria',
    'cardipatias', 'ets', 'varices', 'enf renales', 'hepatopatias',
    'tumores genitales', 'enf gastrointestinales', 'otros'
]

const enfermedadesList = computed(() => {
    return enfermedadesMock.map(e => e.toUpperCase())
})

const emit = defineEmits(['next'])

const addOtraEnfermedad = () => {
    if (!formData.otraEnfermedad) return

    // Normalizar a MAYÚSCULAS
    const nuevaEnfermedad = formData.otraEnfermedad.trim().toUpperCase()

    // Verificar si ya existe en la lista (case-insensitive ya que todo es UPPERCASE ahora)
    if (!formData.enfermedades.includes(nuevaEnfermedad)) {
        formData.enfermedades.push(nuevaEnfermedad)
    }

    // Limpiar el campo
    formData.otraEnfermedad = ''
}

const nextStep = () => {
    emit('next', formData)
}
</script>

<style scoped>
.gap-2 {
    gap: 8px;
}

.gap-3 {
    gap: 12px;
}
</style>
