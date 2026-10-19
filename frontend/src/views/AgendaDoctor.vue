<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReservasStore } from '@/stores/reservas'
import { useEmergenciasStore } from '@/stores/emergencias'
import { useAsignacionDoctoresStore } from '@/stores/asignacion_doctores_consultorio'
import { useDoctoresStore } from '@/stores/doctores'
import { usePersonasStore } from '@/stores/personas'
import { useTutorialStore } from '@/stores/tutorial'
import AgendaMes from '@/components/doctor/AgendaMes.vue'
import CalendarioAgendaDoctor from '@/components/doctor/CalendarioAgendaDoctor.vue'
import PersonaAvatar from '@/components/common/PersonaAvatar.vue'

const authStore = useAuthStore()
const reservasStore = useReservasStore()
const emergenciasStore = useEmergenciasStore()
const asignacionStore = useAsignacionDoctoresStore()
const doctoresStore = useDoctoresStore()
const personasStore = usePersonasStore()
const tutorialStore = useTutorialStore()
const route = useRoute()
const router = useRouter()
const { smAndDown } = useDisplay()
const isMobile = computed(() => smAndDown.value)

const vistaActual = ref('mes')
const fechaSeleccionada = ref('')
const loading = ref(true)
const doctorReservas = ref([])
const doctorEmergencias = ref([])
const mostrarExtrasAgenda = ref(false)
const AGENDA_DOCTOR_KEY = 'agenda-staff-doctor-id'
const doctorStaffId = ref(null)

const esVistaStaff = computed(() =>
  ['DIRECTOR', 'SUPERUSUARIO'].includes(authStore.user?.rol),
)

const doctoresAgenda = computed(() =>
  [...doctoresStore.doctores].sort((a, b) =>
    (a.nombre || '').localeCompare(b.nombre || '', 'es'),
  ),
)

const doctorStaffSeleccionado = computed(() =>
  doctoresStore.doctores.find((d) => Number(d.id) === Number(doctorStaffId.value)) || null,
)

const formatHora = (hora) => String(hora || '').slice(0, 5)

const idPersonaAgenda = () => {
  if (esVistaStaff.value) return doctorStaffSeleccionado.value?.idPersona ?? null
  return authStore.user?.idPersona ?? null
}

const buildDoctorProfile = (source, asignacionesDoctor) => {
  const asignacion = asignacionesDoctor[0] || null
  const horariosInicio = asignacionesDoctor.map((a) => a.horaInicio).filter(Boolean)
  const horariosFin = asignacionesDoctor.map((a) => a.horaFin).filter(Boolean)
  const postaFromAsignacion =
    asignacion?.consultorio?.posta?.idPosta ??
    asignacion?.consultorio?.posta?.idPostaMedica

  return {
    id: source.id,
    idDoctor: source.id,
    idPersona: source.idPersona,
    nombre: source.nombre,
    nombres: source.nombres,
    primerApellido: source.primerApellido,
    foto: source.foto,
    turno: asignacion?.turno || 'Mañana',
    asignacion: asignacion
      ? {
          ...asignacion,
          horaInicio: horariosInicio.sort()[0] || asignacion.horaInicio,
          horaFin: horariosFin.sort().reverse()[0] || asignacion.horaFin,
        }
      : null,
    asignaciones: asignacionesDoctor,
    posta: asignacion?.consultorio?.posta?.nombre || source.posta,
    idPosta: postaFromAsignacion,
  }
}

// Booking (agendar) state
const showAgendarModal = ref(false)
const searchPacienteQuery = ref('')
const pacienteSeleccionadoParaAgendar = ref(null)
const agendarPacienteInitial = ref(null)
const pendingSlotAgendar = ref(null)

watch(
  vistaActual,
  (vista) => {
    tutorialStore.setAgendaVista(vista)
  },
  { immediate: true },
)

watch(
  () => tutorialStore.active,
  (active) => {
    if (!active) return
    tutorialStore.setAgendaVista(vistaActual.value)
  },
)

const pacientesFiltrados = computed(() => {
  const q = searchPacienteQuery.value.toLowerCase().trim()
  if (!q) return []
  return personasStore.personasConUsuario.filter((p) => {
    const name = `${p.nombres || ''} ${p.primerApellido || ''} ${p.segundoApellido || ''}`.toLowerCase()
    const ci = (p.ci || '').toLowerCase()
    return name.includes(q) || ci.includes(q)
  })
})

const abrirAgendarModal = async () => {
  showAgendarModal.value = true
  searchPacienteQuery.value = ''
  pacienteSeleccionadoParaAgendar.value = null
  if (personasStore.personasConUsuario.length === 0) {
    await personasStore.fetchPersonasConUsuario()
  }
}

const onSolicitarAgendarDesdeSlot = async (slot) => {
  pendingSlotAgendar.value = slot || null
  await abrirAgendarModal()
}

const abrirAgendarDesdeHeader = async () => {
  pendingSlotAgendar.value = null
  await abrirAgendarModal()
}

const cerrarAgendarModal = () => {
  showAgendarModal.value = false
  searchPacienteQuery.value = ''
  pacienteSeleccionadoParaAgendar.value = null
  pendingSlotAgendar.value = null
}

const seleccionarPaciente = (p) => {
  pacienteSeleccionadoParaAgendar.value = p
  searchPacienteQuery.value = ''
}

const confirmarPacienteSeleccionado = () => {
  if (tutorialStore.isDemoGestionCitas) {
    cerrarAgendarModal()
    return
  }

  const p = pacienteSeleccionadoParaAgendar.value
  if (!p) return

  const idUsuarioPaciente =
    p.usuario?.idUsuario ??
    p.usuario?.id ??
    p.idUsuario ??
    null

  if (!idUsuarioPaciente) {
    console.error('No se pudo resolver idUsuario del paciente seleccionado', p)
    return
  }

  agendarPacienteInitial.value = {
    idUsuario: Number(idUsuarioPaciente),
    nombre: `${p.nombres || ''} ${p.primerApellido || ''} ${p.segundoApellido || ''}`.trim(),
    slot: pendingSlotAgendar.value || null,
  }

  pendingSlotAgendar.value = null
  showAgendarModal.value = false

  if (vistaActual.value === 'mes') {
    const today = new Date().toISOString().split('T')[0]
    fechaSeleccionada.value = today
    vistaActual.value = 'dia'
  }
}

watch(
  () => tutorialStore.currentStep?.id,
  (stepId, prevId) => {
    if (prevId === 'gestion-agendar-modal' && stepId !== prevId) {
      cerrarAgendarModal()
    }
  },
)

const doctorProfile = computed(() => {
  if (esVistaStaff.value) {
    const doc = doctorStaffSeleccionado.value
    if (!doc) return null
    const asignacionesDoctor = asignacionStore.asignaciones.filter(
      (a) => Number(a.idDoctor) === Number(doc.id) && a.activo !== false,
    )
    return buildDoctorProfile(
      {
        id: doc.id,
        idPersona: doc.idPersona,
        nombre: doc.nombre,
        nombres: doc.nombres,
        primerApellido: doc.primerApellido,
        foto: doc.foto,
        posta: doc.posta,
      },
      asignacionesDoctor,
    )
  }

  const user = authStore.user
  if (!user) return null

  const idDoctor = user.doctor?.idDoctor
  const asignacionesDoctor = asignacionStore.asignaciones.filter(
    (a) => a.idDoctor === idDoctor && a.activo !== false,
  )

  return buildDoctorProfile(
    {
      id: idDoctor,
      idPersona: user.idPersona,
      nombre: `${user.nombres || ''} ${user.primerApellido || ''} ${user.segundoApellido || ''}`.trim(),
      nombres: user.nombres,
      primerApellido: user.primerApellido,
      foto: user.foto,
    },
    asignacionesDoctor,
  )
})

const especialidad = computed(() => {
  if (esVistaStaff.value) {
    const doc = doctorStaffSeleccionado.value
    const defaultDuracion = Number(doc?.tiempoCitaPorDefecto)
    return {
      id: doc?.idEspecialidad,
      nombre: doc?.especialidad || 'Especialidad',
      tiempoCitaPorDefecto: Number.isFinite(defaultDuracion) && defaultDuracion > 0
        ? defaultDuracion
        : 30,
    }
  }

  const esp = authStore.user?.doctor?.especialidad
  const defaultDuracion = Number(esp?.tiempoCitaPorDefecto)
  return {
    id: esp?.idEspecialidadMedica,
    nombre: esp?.nombre || 'Especialidad',
    tiempoCitaPorDefecto: Number.isFinite(defaultDuracion) && defaultDuracion > 0
      ? defaultDuracion
      : 30,
  }
})

const fetchData = async () => {
  const idPersona = idPersonaAgenda()
  if (!idPersona) {
    doctorReservas.value = []
    doctorEmergencias.value = []
    loading.value = false
    return
  }

  loading.value = true
  try {
    await Promise.all([
      asignacionStore.asignaciones.length === 0
        ? asignacionStore.fetchAsignaciones()
        : Promise.resolve(),
      reservasStore.fetchReservasByDoctor(idPersona).then((data) => {
        doctorReservas.value = data || []
      }),
      emergenciasStore.fetchEmergenciasByDoctor(idPersona).then((data) => {
        doctorEmergencias.value = data || []
      }),
    ])
  } finally {
    loading.value = false
  }
}

watch(doctorStaffId, (id) => {
  if (!esVistaStaff.value) return
  if (id) sessionStorage.setItem(AGENDA_DOCTOR_KEY, String(id))
  else sessionStorage.removeItem(AGENDA_DOCTOR_KEY)
  vistaActual.value = 'mes'
  fetchData()
})

onMounted(async () => {
  if (esVistaStaff.value) {
    await Promise.all([
      doctoresStore.fetchDoctores(),
      asignacionStore.fetchAsignaciones(),
    ])
    const saved = Number(sessionStorage.getItem(AGENDA_DOCTOR_KEY))
    if (saved && doctoresStore.doctores.some((d) => Number(d.id) === saved)) {
      doctorStaffId.value = saved
    } else {
      loading.value = false
    }
  } else {
    await fetchData()
  }

  if (esVistaStaff.value) return

  const { agendarPacienteId, agendarPacienteNombre } = route.query
  if (agendarPacienteId && agendarPacienteNombre) {
    agendarPacienteInitial.value = {
      idUsuario: Number(agendarPacienteId),
      nombre: agendarPacienteNombre
    }
    router.replace({ path: route.path, query: {} })
    const today = new Date().toISOString().split('T')[0]
    fechaSeleccionada.value = today
    vistaActual.value = 'dia'
  }
})

const irADia = async (fecha) => {
  fechaSeleccionada.value = fecha
  vistaActual.value = 'dia'
  const idPersona = idPersonaAgenda()
  if (idPersona) {
    const data = await reservasStore.fetchReservasByDoctor(idPersona)
    doctorReservas.value = data ? [...data] : []
  }
}

const volverAMes = () => {
  vistaActual.value = 'mes'
}

const onActualizado = async () => {
  const idPersona = idPersonaAgenda()
  if (!idPersona) return
  const data = await reservasStore.fetchReservasByDoctor(idPersona)
  doctorReservas.value = data ? [...data] : []
}

const onFechaActualizada = (fecha) => {
  if (fecha) {
    fechaSeleccionada.value = fecha
  }
}
</script>

<template>
  <v-container fluid class="agenda-doctor-page" :class="{ 'agenda-doctor-page--mobile': isMobile }">
    <!-- Desktop Title Header -->
    <div v-if="!isMobile" class="d-flex flex-column flex-md-row justify-space-between align-md-center mb-6 gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold">{{ esVistaStaff ? 'Agenda' : 'Mi Agenda' }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">
          {{ esVistaStaff
            ? 'Horarios y citas del doctor seleccionado.'
            : 'Consulta tus citas, emergencias y atenciones sin reserva.' }}
        </p>
      </div>
      <div v-if="!esVistaStaff">
        <v-btn
          color="primary"
          prepend-icon="mdi-calendar-plus"
          rounded="lg"
          elevation="2"
          class="text-none font-weight-bold"
          data-tour="agenda-agendar-btn"
          @click="abrirAgendarDesdeHeader"
        >
          Agendar Cita
        </v-btn>
      </div>
    </div>

    <div v-else class="mb-3 d-flex align-center justify-space-between">
      <h1 class="text-h6 font-weight-bold mb-0">{{ esVistaStaff ? 'Agenda' : 'Mi Agenda' }}</h1>
      <v-btn
        v-if="!esVistaStaff"
        color="primary"
        size="small"
        prepend-icon="mdi-calendar-plus"
        rounded="lg"
        class="text-none font-weight-bold"
        data-tour="agenda-agendar-btn"
        @click="abrirAgendarDesdeHeader"
      >
        Agendar
      </v-btn>
    </div>

    <v-autocomplete
      v-if="esVistaStaff"
      v-model="doctorStaffId"
      :items="doctoresAgenda"
      item-title="nombre"
      item-value="id"
      label="Doctor"
      placeholder="Selecciona un doctor"
      prepend-inner-icon="mdi-doctor"
      variant="outlined"
      rounded="lg"
      clearable
      hide-details
      class="mb-4"
      :loading="doctoresStore.loading"
    >
      <template #item="{ props: itemProps, item }">
        <v-list-item v-bind="itemProps" :subtitle="item.raw.especialidad" />
      </template>
    </v-autocomplete>

    <v-overlay :model-value="loading" class="align-center justify-center" contained>
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-overlay>

    <v-sheet
      v-if="esVistaStaff && !loading && !doctorProfile"
      border
      rounded="xl"
      class="pa-8 text-center"
    >
      <v-icon size="40" color="primary" class="mb-2">mdi-calendar-account</v-icon>
      <p class="text-subtitle-1 font-weight-bold mb-1">Selecciona un doctor</p>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Elige un médico para ver sus horarios de atención y su agenda.
      </p>
    </v-sheet>

    <div v-if="!loading && doctorProfile">
      <div v-if="esVistaStaff" class="mb-4">
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon color="primary">mdi-calendar-clock</v-icon>
          <span class="text-overline font-weight-black text-medium-emphasis">
            Horarios de {{ doctorProfile.nombre }}
          </span>
        </div>
        <v-row v-if="doctorProfile.asignaciones?.length" dense>
          <v-col
            v-for="asig in doctorProfile.asignaciones"
            :key="asig.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card border flat rounded="xl" class="pa-4 h-100">
              <div class="text-body-2 font-weight-bold text-primary">{{ asig.turno || 'Turno' }}</div>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ asig.diasSemana || 'Todos los días' }}
              </div>
              <div class="text-body-2 font-weight-medium mt-2">
                {{ formatHora(asig.horaInicio) }} – {{ formatHora(asig.horaFin) }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ asig.consultorio?.posta?.nombre || doctorProfile.posta || 'Posta' }}
                <span v-if="asig.consultorio?.numeroConsultorio">
                  · Consultorio {{ asig.consultorio.numeroConsultorio }}
                </span>
                <span v-if="asig.duracionCita"> · {{ asig.duracionCita }} min</span>
              </div>
            </v-card>
          </v-col>
        </v-row>
        <v-sheet v-else border rounded="xl" class="pa-6 text-center">
          <p class="text-body-2 text-medium-emphasis mb-0">Este doctor no tiene horarios registrados.</p>
        </v-sheet>
      </div>

      <AgendaMes
        v-if="vistaActual === 'mes'"
        :reservas="doctorReservas"
        :emergencias="doctorEmergencias"
        v-model:mostrar-extras="mostrarExtrasAgenda"
        @seleccionar-dia="irADia"
      />

      <CalendarioAgendaDoctor
        v-else
        :key="doctorProfile.id"
        :fecha-seleccionada="fechaSeleccionada"
        :doctor="doctorProfile"
        :especialidad="especialidad"
        :reservas="doctorReservas"
        :emergencias="doctorEmergencias"
        v-model:mostrar-extras-agenda="mostrarExtrasAgenda"
        :agendar-paciente-initial="agendarPacienteInitial"
        :solo-lectura="esVistaStaff"
        @volver="volverAMes"
        @actualizado="onActualizado"
        @fecha-actualizada="onFechaActualizada"
        @cancelar-agendar="agendarPacienteInitial = null"
        @solicitar-agendar="onSolicitarAgendarDesdeSlot"
      />
    </div>

    <!-- Modal Buscar Paciente -->
    <v-dialog v-model="showAgendarModal" max-width="600" persistent class="rounded-xl">
      <v-card class="rounded-xl pa-4" data-tour="agenda-agendar-modal">
        <v-card-title class="d-flex justify-space-between align-center border-b pb-3 px-0 mx-4">
          <span class="text-h6 font-weight-black text-primary">Buscar Paciente para Agendar</span>
          <v-btn icon="mdi-close" variant="text" @click="cerrarAgendarModal"></v-btn>
        </v-card-title>

        <v-card-text class="py-4">
          <v-text-field
            v-model="searchPacienteQuery"
            label="Buscar por Nombre o CI"
            placeholder="Introduce CI o nombre del paciente..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            rounded="lg"
            hide-details
            class="mb-4"
          />

          <!-- Resultados de búsqueda -->
          <div v-if="pacientesFiltrados.length > 0" class="border rounded-lg overflow-hidden mb-4" style="max-height: 200px; overflow-y: auto;">
            <v-list density="comfortable">
              <v-list-item
                v-for="p in pacientesFiltrados"
                :key="p.idPersona"
                :title="`${p.nombres} ${p.primerApellido} ${p.segundoApellido || ''}`"
                :subtitle="`CI: ${p.ci || 'Sin CI'}`"
                class="border-b"
                @click="seleccionarPaciente(p)"
              >
                <template #prepend>
                  <PersonaAvatar :foto="p.foto" :nombres="p.nombres" :primer-apellido="p.primerApellido" :size="36" />
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Paciente Seleccionado Detalles -->
          <v-card v-if="pacienteSeleccionadoParaAgendar" variant="flat" color="blue-lighten-5" rounded="xl" class="pa-4">
            <div class="d-flex align-center">
              <PersonaAvatar
                :foto="pacienteSeleccionadoParaAgendar.foto"
                :nombres="pacienteSeleccionadoParaAgendar.nombres"
                :primer-apellido="pacienteSeleccionadoParaAgendar.primerApellido"
                :size="64"
                class="me-4 elevation-2 border"
              />
              <div>
                <div class="font-weight-black text-subtitle-1 text-primary">
                  {{ pacienteSeleccionadoParaAgendar.nombres }} {{ pacienteSeleccionadoParaAgendar.primerApellido }} {{ pacienteSeleccionadoParaAgendar.segundoApellido || '' }}
                </div>
                <div class="text-caption text-grey-darken-1">
                  CI: {{ pacienteSeleccionadoParaAgendar.ci }}
                </div>
                <div v-if="pacienteSeleccionadoParaAgendar.email" class="text-caption text-grey-darken-1">
                  Email: {{ pacienteSeleccionadoParaAgendar.email }}
                </div>
              </div>
            </div>
          </v-card>
        </v-card-text>

        <v-card-actions class="pt-2 d-flex gap-3 px-4 pb-2">
          <v-btn variant="text" color="grey-darken-1" rounded="lg" class="text-none font-weight-bold flex-grow-1" @click="cerrarAgendarModal">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            class="text-none font-weight-bold flex-grow-1"
            :disabled="!pacienteSeleccionadoParaAgendar"
            @click="confirmarPacienteSeleccionado"
          >
            Continuar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.agenda-doctor-page {
  padding: 0;
  max-width: 100%;
}

.agenda-doctor-page--mobile {
  width: 100%;
  overflow-x: hidden;
}
</style>
