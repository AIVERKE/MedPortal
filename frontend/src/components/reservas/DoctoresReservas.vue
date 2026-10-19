<!-- src/components/Reservas/DoctoresReservas.vue -->
<template>
    <div>
        <header class="d-flex align-center justify-space-between flex-wrap ga-3 mb-8">
            <div>
                <v-btn variant="tonal" prepend-icon="mdi-arrow-left" color="primary" @click="$emit('volver')"
                    class="text-none font-weight-bold mb-3" rounded="lg" size="small">
                    Volver a especialidades
                </v-btn>
                <h3 class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">
                    Selección de doctores
                </h3>
                <p class="text-subtitle-2 font-weight-medium text-grey-darken-1">
                    Busca y selecciona un profesional disponible para
                    <span class="font-weight-bold text-primary">{{ especialidad?.nombre }}</span>
                </p>
            </div>
        </header>

        <v-card class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>
            <div class="section-badge primary"></div>
            <v-card-text class="pa-4">
                <v-text-field v-model="search" placeholder="Buscar doctor por nombre o especialidad..."
                    prepend-inner-icon="mdi-magnify" variant="outlined" rounded="lg" class="max-width-600"
                    hide-details density="comfortable" data-tour="reserva-doctor-search"></v-text-field>
            </v-card-text>
        </v-card>

        <div v-if="store.loading" class="d-flex justify-center py-12">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        </div>

        <div v-else>
            <!-- SECCIÓN: TU FRECUENTE -->
            <div v-if="doctoresStore.ultimoDoctor && !search" class="mb-10">
                <div class="d-flex align-center ga-3 mb-4">
                    <h2 class="text-subtitle-1 font-weight-black text-uppercase tracking-wider text-grey-darken-3">Tu frecuente</h2>
                </div>

                <v-card class="doctor-card-frecuente pa-4 rounded-xl overflow-hidden shadow-premium premium-card position-relative"
                    border @click="selectDoctor(doctoresStore.ultimoDoctor)"
                    :data-tour="isFrecuenteTourTarget ? 'reserva-doctor-card' : undefined">
                    <div class="section-badge primary"></div>
                    <v-chip color="primary" class="frecuente-chip" prepend-icon="mdi-heart" size="small" variant="tonal">
                        TU FRECUENTE
                    </v-chip>

                    <div class="d-flex flex-column flex-sm-row align-center align-sm-start ga-4 ga-sm-6 pt-4">
                        <PersonaAvatar :foto="doctoresStore.ultimoDoctor.foto"
                            :nombres="doctoresStore.ultimoDoctor.nombres"
                            :primer-apellido="doctoresStore.ultimoDoctor.primerApellido"
                            :size="$vuetify.display.xs ? 80 : 128" rounded="lg"
                            class="border-2 border-primary" />

                        <div class="flex-grow-1">
                            <div class="d-flex align-center ga-2">
                                <h3 class="text-h5 font-weight-bold text-grey-darken-4">{{ doctoresStore.ultimoDoctor.nombre }}</h3>
                                <v-icon color="primary" size="small">mdi-check-decagram</v-icon>
                            </div>
                            <p class="text-primary font-weight-bold mb-4">{{ doctoresStore.ultimoDoctor.especialidad }}</p>
                            <v-btn color="primary" block rounded="lg" class="text-none font-weight-bold mt-2"
                                variant="flat"
                                :data-tour="isFrecuenteTourTarget ? 'reserva-doctor-select' : undefined">
                                Seleccionar
                            </v-btn>
                        </div>
                    </div>
                </v-card>
            </div>

            <!-- SECCIÓN: TODOS LOS DOCTORES -->
            <div v-for="(docs, posta) in doctoresPorPosta" :key="posta" class="mb-10">
                <div class="d-flex align-center ga-3 mb-4">
                    <h2 class="text-subtitle-1 font-weight-black text-uppercase tracking-wider text-grey-darken-3">{{ posta }}</h2>
                    <v-chip color="primary" variant="tonal" class="font-weight-bold" size="small">
                        {{ docs.length }} DOCTORES
                    </v-chip>
                </div>

                <v-row>
                    <v-col v-for="doctor in docs" :key="doctor.id" cols="12" xl="6">
                        <v-card class="doctor-card pa-4 rounded-xl overflow-hidden shadow-premium premium-card position-relative"
                            border :class="{ 'opacity-60 grayscale': !doctor.disponible }"
                            :data-tour="doctor.disponible && Number(doctor.id) === firstTourDoctorId && !isFrecuenteTourTarget ? 'reserva-doctor-card' : undefined"
                            @click="doctor.disponible ? selectDoctor(doctor) : null">
                            <div class="section-badge primary"></div>
                            <div class="d-flex align-start ga-3 ga-sm-4">
                                <PersonaAvatar :foto="doctor.foto" :nombres="doctor.nombres"
                                    :primer-apellido="doctor.primerApellido"
                                    :size="$vuetify.display.xs ? 64 : 100" rounded="lg" />

                                <div class="flex-grow-1">
                                    <h3 class="text-h6 font-weight-bold text-grey-darken-4">{{ doctor.nombre }}</h3>
                                    <p class="text-primary text-subtitle-2 font-weight-bold">{{ doctor.especialidad }}
                                    </p>

                                    <v-btn :color="doctor.disponible ? 'primary' : 'grey'" block rounded="lg"
                                        class="text-none font-weight-bold mt-2"
                                        variant="flat" :disabled="!doctor.disponible"
                                        :data-tour="doctor.disponible && Number(doctor.id) === firstTourDoctorId && !isFrecuenteTourTarget ? 'reserva-doctor-select' : undefined">
                                        {{ doctor.disponible ? 'Seleccionar' : 'No Disponible' }}
                                    </v-btn>
                                </div>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
            </div>
        </div>
        <ModalTurno v-model="showTurnoModal" :doctor="selectedDoctorForModal" @confirm="handleConfirmTurno" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAsignacionDoctoresStore } from '@/stores/asignacion_doctores_consultorio'
import { useDoctoresStore } from '@/stores/doctores'
import { useAuthStore } from '@/stores/auth'
import { resolveUploadUrl } from '@/utils/uploadUrl'
import PersonaAvatar from '@/components/common/PersonaAvatar.vue'
import ModalTurno from './ModalTurno.vue'

const props = defineProps(['especialidad'])
const emit = defineEmits(['select', 'volver'])

const store = useAsignacionDoctoresStore()
const doctoresStore = useDoctoresStore()
const authStore = useAuthStore()
const search = ref('')

const showTurnoModal = ref(false)
const selectedDoctorForModal = ref(null)

onMounted(async () => {
    const idEspecialidad = props.especialidad?.id
    if (idEspecialidad) {
        await store.fetchAsignacionesByEspecialidad(idEspecialidad)
        const idUsuario = authStore.user?.idUsuario
        if (idUsuario) {
            await doctoresStore.fetchUltimoDoctor(idUsuario, idEspecialidad)
        }
    }
})

const filteredDoctores = computed(() => {
    // Asegurar que solo mostramos asignaciones de la especialidad actual
    let assignments = store.asignaciones.filter(a =>
        a.especialidad?.idEspecialidadMedica === props.especialidad?.id
    )

    if (search.value) {
        const s = search.value.toLowerCase()
        assignments = assignments.filter(a => {
            const nombreCompleto = `${a.doctor?.persona?.nombres} ${a.doctor?.persona?.primerApellido} ${a.doctor?.persona?.segundoApellido || ''}`.toLowerCase()
            return nombreCompleto.includes(s) || a.especialidad?.nombre?.toLowerCase().includes(s)
        })
    }

    // Agrupar por doctor y posta para mostrar una sola tarjeta
    const doctorCards = []
    const seen = new Set()

    assignments.forEach(a => {
        const key = `${a.doctor?.idDoctor}-${a.consultorio?.posta?.idPosta}`
        if (!seen.has(key)) {
            seen.add(key)

            // Todas las asignaciones para este doctor en esta especialidad
            const doctorAsignaciones = assignments.filter(asig =>
                asig.idDoctor === a.idDoctor &&
                asig.especialidad?.idEspecialidadMedica === a.especialidad?.idEspecialidadMedica
            )

            const persona = a.doctor?.persona || {}
            const fotoUrl = resolveUploadUrl(persona.foto) || null

            doctorCards.push({
                id: a.doctor?.idDoctor,
                idPersona: persona.idPersona ?? a.doctor?.persona?.idPersona ?? null,
                nombre: `${persona.nombres || ''} ${persona.primerApellido || ''}`.trim(),
                nombres: persona.nombres || '',
                primerApellido: persona.primerApellido || '',
                especialidad: a.especialidad?.nombre,
                posta: a.consultorio?.posta?.nombre,
                idPosta: a.consultorio?.posta?.idPosta ?? a.consultorio?.posta?.idPostaMedica,
                foto: fotoUrl,
                imagen: fotoUrl,
                disponible: a.activo,
                telefonoEmergencia: a.doctor?.telefonoEmergencia || null,
                compartirTelefonoEmergencia: Boolean(a.doctor?.compartirTelefonoEmergencia),
                asignaciones: doctorAsignaciones
            })
        }
    })

    return doctorCards
})

const doctoresPorPosta = computed(() => {
    const groups = {}
    filteredDoctores.value.forEach(doc => {
        if (!groups[doc.posta]) {
            groups[doc.posta] = []
        }
        groups[doc.posta].push(doc)
    })
    return groups
})

const firstTourDoctorId = computed(() => {
    const ultimo = doctoresStore.ultimoDoctor
    const ultimoId = ultimo?.id != null ? Number(ultimo.id) : null
    if (ultimoId != null) {
        const match = filteredDoctores.value.find((d) => Number(d.id) === ultimoId && d.disponible)
        if (match) return Number(match.id)
    }
    const firstAvailable = filteredDoctores.value.find((d) => d.disponible)
    return firstAvailable?.id != null ? Number(firstAvailable.id) : null
})

const isFrecuenteTourTarget = computed(() => {
    if (search.value) return false
    const ultimoId = doctoresStore.ultimoDoctor?.id
    return ultimoId != null && Number(ultimoId) === firstTourDoctorId.value
})

const buildDoctorWithAsignaciones = (doctor) => {
    if (!doctor) return null

    const fromList = filteredDoctores.value.find((d) => d.id === doctor.id)

    if (fromList) {
        return {
            ...doctor,
            ...fromList,
            asignaciones: fromList.asignaciones?.length
                ? fromList.asignaciones
                : doctor.asignaciones,
        }
    }

    if (doctor.asignaciones?.length) return doctor

    const asignaciones = store.asignaciones.filter(
        (a) =>
            a.idDoctor === doctor.id &&
            a.especialidad?.idEspecialidadMedica === props.especialidad?.id
    )

    const postaRef = asignaciones[0]?.consultorio?.posta

    return {
        ...doctor,
        asignaciones,
        posta: postaRef?.nombre || doctor.posta,
        idPosta: postaRef?.idPosta ?? postaRef?.idPostaMedica ?? doctor.idPosta,
    }
}

const selectDoctor = (doctor) => {
    selectedDoctorForModal.value = buildDoctorWithAsignaciones(doctor)
    showTurnoModal.value = true
}

const handleConfirmTurno = (asig) => {
    const postaRef = asig?.consultorio?.posta
    const selection = {
        ...selectedDoctorForModal.value,
        turno: asig.turno,
        asignacion: asig,
        posta: postaRef?.nombre || selectedDoctorForModal.value.posta,
        idPosta: postaRef?.idPosta ?? postaRef?.idPostaMedica ?? selectedDoctorForModal.value.idPosta,
    }
    emit('select', selection)
}
</script>


<style scoped>
.max-width-600 {
    max-width: 600px;
}

.shadow-premium {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12) !important;
}

.premium-card {
    background-color: white;
}

.section-badge {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
}

.section-badge.primary {
    background-color: rgb(var(--v-theme-primary));
}

.doctor-card-frecuente {
    position: relative;
    transition: box-shadow 0.2s ease;
    cursor: pointer;
}

.doctor-card-frecuente:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.18) !important;
}

.frecuente-chip {
    position: absolute;
    top: 16px;
    right: 16px;
    font-weight: 800;
    letter-spacing: 0.5px;
}

.doctor-card {
    transition: box-shadow 0.2s ease;
    cursor: pointer;
}

.doctor-card:hover:not(.opacity-60) {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.18) !important;
}

.opacity-60 {
    opacity: 0.6;
}

.grayscale {
    filter: grayscale(1);
}

.border-2 {
    border-width: 2px !important;
}
</style>
