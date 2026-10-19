<template>
    <div class="max-width-form mx-auto pb-8">
        <header class="mb-8">
            <h3 class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">
                Pacientes
            </h3>
            <p class="text-subtitle-2 font-weight-medium text-grey-darken-1 mb-0">
                Consulta el historial de citas y los formularios de cada paciente
            </p>
        </header>

        <v-card class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>
            <div class="section-badge primary"></div>
            <v-card-text class="pa-4">
                <v-text-field
                    v-model="search"
                    placeholder="Buscar paciente por nombre..."
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    rounded="lg"
                    style="max-width: 420px;"
                />
            </v-card-text>
        </v-card>

        <div v-if="store.loading && !store.pacientesResumen.length" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="40" />
        </div>

        <v-alert v-else-if="store.error && !store.pacientesResumen.length" type="error" variant="tonal">
            {{ store.error }}
        </v-alert>

        <v-alert v-else-if="!pacientesFiltrados.length" type="info" variant="tonal">
            No hay pacientes para mostrar.
        </v-alert>

        <v-card v-else class="rounded-xl shadow-premium" border>
            <v-list lines="two" class="py-0">
                <template v-for="(paciente, idx) in pacientesFiltrados" :key="paciente.idUsuario">
                    <v-list-item class="paciente-row px-4 py-3">
                        <template #prepend>
                            <PersonaAvatar
                                class="me-3"
                                :foto="paciente.foto"
                                :nombres="paciente.nombres"
                                :primer-apellido="paciente.primerApellido"
                                :size="44"
                            />
                        </template>

                        <v-list-item-title class="font-weight-bold text-grey-darken-4">
                            {{ paciente.nombreCompleto }}
                        </v-list-item-title>
                        <v-list-item-subtitle class="mt-2">
                            <div class="d-flex flex-wrap ga-2">
                                <v-btn
                                    size="small"
                                    rounded="lg"
                                    class="text-none font-weight-bold"
                                    color="secondary"
                                    variant="tonal"
                                    prepend-icon="mdi-history"
                                    @click="abrirHistorialCitas(paciente)"
                                >
                                    Historial de citas
                                </v-btn>
                                <v-btn
                                    v-for="cat in categoriasVisibles(paciente)"
                                    :key="cat.key"
                                    size="small"
                                    rounded="lg"
                                    class="text-none font-weight-bold"
                                    :color="cat.color"
                                    :variant="cat.count > 0 ? 'flat' : 'tonal'"
                                    @click="abrirCategoria(paciente, cat.key)"
                                >
                                    {{ cat.label }} ({{ cat.count }})
                                </v-btn>
                            </div>
                        </v-list-item-subtitle>
                    </v-list-item>
                    <v-divider v-if="idx < pacientesFiltrados.length - 1" />
                </template>
            </v-list>
        </v-card>

        <v-dialog v-model="dialogOpen" max-width="720" scrollable @after-leave="resetDialog">
            <v-card rounded="xl">
                <v-card-title class="d-flex align-center justify-space-between ga-3 pa-5">
                    <div class="d-flex align-center ga-2 min-width-0">
                        <v-btn
                            v-if="dialogView === 'instancias' || dialogView === 'eliminados'"
                            icon="mdi-arrow-left"
                            variant="text"
                            size="small"
                            @click="dialogView = 'formularios'"
                        />
                        <div class="min-width-0">
                            <p class="text-caption text-grey-darken-1 mb-0">
                                {{ dialogPaciente?.nombreCompleto }}
                            </p>
                            <h3 class="text-h6 font-weight-bold mb-0 text-truncate">
                                <template v-if="dialogView === 'instancias'">
                                    {{ selectedGroup?.titulo }}
                                </template>
                                <template v-else-if="dialogView === 'eliminados'">
                                    Eliminados · {{ selectedGroup?.titulo }}
                                </template>
                                <template v-else>
                                    {{ categoriaLabel(dialogCategoria) }}
                                </template>
                            </h3>
                        </div>
                    </div>
                    <v-btn icon="mdi-close" variant="text" @click="dialogOpen = false" />
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-5">
                    <div v-if="dialogLoading" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </div>
                    <v-alert v-else-if="dialogError" type="error" variant="tonal">
                        {{ dialogError }}
                    </v-alert>
                    <v-alert v-else-if="!dialogGrupos.length" type="info" variant="tonal">
                        No hay instancias visibles en esta categoría.
                    </v-alert>

                    <v-list v-else-if="dialogView === 'formularios'" lines="one">
                        <v-list-item
                            v-for="grupo in dialogGrupos"
                            :key="grupo.idFormulario"
                            rounded="lg"
                            class="mb-2"
                            @click="onGrupoClick(grupo)"
                        >
                            <v-list-item-title class="font-weight-bold d-flex align-center flex-wrap ga-2">
                                <span class="text-truncate">{{ grupo.titulo }}</span>
                                <v-chip
                                    v-if="grupo.countActivas > 0 || grupo.fillMode === 'single'"
                                    size="small"
                                    :color="grupoBadgeColor(grupo)"
                                    variant="tonal"
                                    class="flex-shrink-0"
                                >
                                    {{ grupoBadgeLabel(grupo) }}
                                </v-chip>
                                <v-chip
                                    v-if="grupo.canVerEliminados"
                                    size="small"
                                    color="error"
                                    variant="tonal"
                                    class="flex-shrink-0"
                                    @click.stop="abrirEliminados(grupo)"
                                >
                                    Ver eliminados ({{ grupo.countEliminadas }})
                                </v-chip>
                            </v-list-item-title>
                            <template #append>
                                <v-icon icon="mdi-chevron-right" />
                            </template>
                        </v-list-item>
                    </v-list>

                    <v-list v-else-if="dialogView === 'instancias'" lines="two">
                        <v-list-item
                            v-for="inst in selectedGroupInstancias"
                            :key="inst.idInstancia"
                            rounded="lg"
                            class="mb-2"
                            :to="`/llenar-formularios/instancias/${inst.idInstancia}`"
                            @click="dialogOpen = false"
                        >
                            <v-list-item-title class="font-weight-bold d-flex align-center flex-wrap ga-2">
                                <span>{{ formatDate(inst.updatedAt || inst.createdAt) }}</span>
                                <v-chip
                                    v-if="inst.esUltimo"
                                    size="x-small"
                                    color="primary"
                                    variant="tonal"
                                >
                                    Último
                                </v-chip>
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                Llenado por {{ inst.quienLleno?.nombreCompleto || '—' }}
                            </v-list-item-subtitle>
                            <template #append>
                                <v-icon icon="mdi-chevron-right" />
                            </template>
                        </v-list-item>
                    </v-list>

                    <v-list v-else lines="two">
                        <v-alert
                            v-if="!selectedGroupEliminadas.length"
                            type="info"
                            variant="tonal"
                            class="mb-0"
                        >
                            No hay instancias eliminadas.
                        </v-alert>
                        <v-list-item
                            v-for="inst in selectedGroupEliminadas"
                            :key="inst.idInstancia"
                            rounded="lg"
                            class="mb-2"
                            :to="`/llenar-formularios/instancias/${inst.idInstancia}`"
                            @click="dialogOpen = false"
                        >
                            <v-list-item-title class="font-weight-bold d-flex align-center flex-wrap ga-2">
                                <span class="text-error">[Borrado]</span>
                                <span>{{ formatDate(inst.updatedAt || inst.deletedAt || inst.createdAt) }}</span>
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                Llenado por {{ inst.quienLleno?.nombreCompleto || '—' }}
                            </v-list-item-subtitle>
                            <template #append>
                                <v-icon icon="mdi-chevron-right" />
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="citasDialogOpen" max-width="720" scrollable>
            <v-card rounded="xl">
                <v-card-title class="d-flex align-center justify-space-between ga-3 pa-5">
                    <div class="min-width-0">
                        <p class="text-caption text-grey-darken-1 mb-0">
                            {{ citasPaciente?.nombreCompleto }}
                        </p>
                        <h3 class="text-h6 font-weight-bold mb-0">
                            Historial de citas
                        </h3>
                    </div>
                    <v-btn icon="mdi-close" variant="text" @click="citasDialogOpen = false" />
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-5">
                    <div v-if="citasLoading" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </div>
                    <v-alert v-else-if="citasError" type="error" variant="tonal">
                        {{ citasError }}
                    </v-alert>
                    <v-alert v-else-if="!citasLista.length" type="info" variant="tonal">
                        Este paciente no tiene citas registradas.
                    </v-alert>
                    <v-list v-else lines="two" class="py-0">
                        <v-list-item
                            v-for="cita in citasLista"
                            :key="cita.id || `${cita.fechaCita}-${cita.horaInicioCita}`"
                            rounded="lg"
                            class="mb-2"
                            @click="irACita(cita)"
                        >
                            <v-list-item-title class="font-weight-bold d-flex align-center flex-wrap ga-2">
                                <span>{{ formatFechaCita(cita.fechaCita) }}</span>
                                <span class="text-medium-emphasis font-weight-medium">
                                    {{ formatHora(cita.horaInicioCita) }}
                                </span>
                                <v-chip
                                    size="x-small"
                                    :color="estadoCitaColor(cita.estado)"
                                    variant="tonal"
                                >
                                    {{ cita.estado || 'PENDIENTE' }}
                                </v-chip>
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                {{ cita.especialidad?.nombre || 'Consulta general' }}
                                · {{ cita.doctor?.nombre || 'Médico por asignar' }}
                            </v-list-item-subtitle>
                            <template #append>
                                <v-icon icon="mdi-chevron-right" />
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PersonaAvatar from '@/components/common/PersonaAvatar.vue'
import { CATEGORIA_META, useFormulariosStore } from '@/stores/formularios'
import { useReservasStore } from '@/stores/reservas'
import { buildReservaQuery, guardarCitaDashboard } from '@/utils/reservaIdentity'

const store = useFormulariosStore()
const reservasStore = useReservasStore()
const router = useRouter()
const search = ref('')

const dialogOpen = ref(false)
const dialogLoading = ref(false)
const dialogError = ref(null)
const dialogPaciente = ref(null)
const dialogCategoria = ref(null)
const dialogInstancias = ref([])
const dialogView = ref('formularios') // 'formularios' | 'instancias' | 'eliminados'
const selectedGroup = ref(null)

const citasDialogOpen = ref(false)
const citasLoading = ref(false)
const citasError = ref(null)
const citasPaciente = ref(null)
const citasLista = ref([])

const pacientesFiltrados = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return store.pacientesResumen
    return store.pacientesResumen.filter((p) =>
        p.nombreCompleto?.toLowerCase().includes(q),
    )
})

const dialogGrupos = computed(() => {
    const map = new Map()
    for (const inst of dialogInstancias.value) {
        const idFormulario = inst.idFormulario || inst.formulario?.idFormulario
        if (!idFormulario) continue
        if (!map.has(idFormulario)) {
            map.set(idFormulario, {
                idFormulario,
                titulo: inst.formulario?.titulo || `Formulario #${idFormulario}`,
                fillMode: inst.formulario?.fillMode || 'unlimited',
                instancias: [],
            })
        }
        map.get(idFormulario).instancias.push(inst)
    }

    return [...map.values()]
        .map((grupo) => {
            const sorted = [...grupo.instancias].sort(
                (a, b) =>
                    new Date(b.updatedAt || b.createdAt) -
                    new Date(a.updatedAt || a.createdAt),
            )
            const activas = sorted.filter((i) => !i.eliminado)
            const eliminadas = sorted.filter((i) => i.eliminado)
            const primaria = activas[0] || null
            const canDelete = sorted.some((i) => i.canDelete)
            return {
                ...grupo,
                count: activas.length,
                countActivas: activas.length,
                countEliminadas: eliminadas.length,
                instancias: activas,
                eliminadas,
                primaria,
                completo: primaria ? isInstanciaCompleta(primaria) : false,
                canVerEliminados: canDelete && eliminadas.length > 0,
            }
        })
        .filter((g) => g.countActivas > 0 || g.canVerEliminados)
        .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))
})

const selectedGroupInstancias = computed(() => {
    const list = selectedGroup.value?.instancias || []
    if (!list.length) return []
    const latestId = list[0]?.idInstancia
    return list.map((inst) => ({
        ...inst,
        esUltimo: inst.idInstancia === latestId,
    }))
})

const selectedGroupEliminadas = computed(() => selectedGroup.value?.eliminadas || [])

function categoriasVisibles(paciente) {
    const order = [
        { key: 'historial', label: 'Historial clínico', color: 'success' },
        { key: 'encuesta', label: 'Encuesta', color: 'info' },
        { key: 'operativo', label: 'Operativo', color: 'primary' },
    ]
    return order
        .filter((cat) => paciente.categorias?.[cat.key]?.visible)
        .map((cat) => ({
            ...cat,
            count: paciente.categorias?.[cat.key]?.count ?? 0,
        }))
}

function categoriaLabel(key) {
    return CATEGORIA_META[key]?.label || key
}

function formatFechaCita(value) {
    if (!value) return 'Sin fecha'
    const [year, month, day] = String(value).slice(0, 10).split('-')
    if (!year || !month || !day) return String(value)
    return `${day}/${month}/${year}`
}

function formatHora(value) {
    if (!value) return '--:--'
    return String(value).slice(0, 5)
}

function estadoCitaColor(estado) {
    const status = String(estado || '').toUpperCase()
    if (status === 'PENDIENTE' || status === 'PRESENTE') return 'warning'
    if (status === 'ATRASO' || status === 'ABANDONO') return 'error'
    if (['ATENDIDO', 'A-FUERA-HORARIO', 'A-SIN-RESERVA'].includes(status)) return 'success'
    if (['CANCELADA', 'CANCELADO', 'RECHAZADA', 'ANULADA'].includes(status)) return 'error'
    return 'primary'
}

function pacienteParaDashboard(paciente) {
    if (!paciente) return null
    return {
        id: paciente.idUsuario,
        nombre: paciente.nombreCompleto,
        nombres: paciente.nombres,
        primerApellido: paciente.primerApellido,
        foto: paciente.foto,
        roles: [],
    }
}

async function abrirHistorialCitas(paciente) {
    citasPaciente.value = paciente
    citasDialogOpen.value = true
    citasLoading.value = true
    citasError.value = null
    citasLista.value = []
    try {
        const data = await reservasStore.fetchReservasByUsuario(paciente.idUsuario)
        if (reservasStore.error && !data?.length) {
            citasError.value = reservasStore.error
            return
        }
        citasLista.value = [...(data || [])].sort((a, b) => {
            const fecha = String(b.fechaCita || '').localeCompare(String(a.fechaCita || ''))
            if (fecha !== 0) return fecha
            return String(b.horaInicioCita || '').localeCompare(String(a.horaInicioCita || ''))
        })
    } catch (err) {
        citasError.value = err.message || 'No se pudo cargar el historial de citas.'
    } finally {
        citasLoading.value = false
    }
}

function irACita(reserva) {
    const enriched = {
        ...reserva,
        idUsuario: reserva.idUsuario || citasPaciente.value?.idUsuario,
        paciente: reserva.paciente?.nombre
            ? reserva.paciente
            : pacienteParaDashboard(citasPaciente.value),
    }
    guardarCitaDashboard(enriched)
    citasDialogOpen.value = false
    router.push({
        path: '/doctor/home',
        query: buildReservaQuery(enriched),
    })
}

function formatDate(value) {
    if (!value) return ''
    try {
        return new Date(value).toLocaleString('es-BO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return String(value)
    }
}

function isEmptyValue(value) {
    if (value === null || value === undefined || value === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    return false
}

function isInstanciaCompleta(inst) {
    const sections = inst.sections || inst.definicionSnapshot?.sections || []
    const respuestas = inst.respuestas || {}
    for (const section of sections) {
        for (const field of section.fields || []) {
            if (field.eliminated) continue
            if (!field.required) continue
            const val = respuestas[field.id] ?? field.value
            if (isEmptyValue(val)) return false
        }
    }
    return true
}

function grupoBadgeLabel(grupo) {
    if (grupo.fillMode === 'single') {
        if (!grupo.primaria) return 'Sin activo'
        return grupo.completo ? 'Completo' : 'Incompleto'
    }
    return String(grupo.countActivas)
}

function grupoBadgeColor(grupo) {
    if (grupo.fillMode === 'single') {
        if (!grupo.primaria) return 'grey'
        return grupo.completo ? 'success' : 'warning'
    }
    return 'primary'
}

function onGrupoClick(grupo) {
    if (grupo.fillMode === 'single') {
        const target = grupo.primaria
        if (!target) {
            if (grupo.canVerEliminados) abrirEliminados(grupo)
            return
        }
        dialogOpen.value = false
        router.push(`/llenar-formularios/instancias/${target.idInstancia}`)
        return
    }
    if (!grupo.countActivas) {
        if (grupo.canVerEliminados) abrirEliminados(grupo)
        return
    }
    selectedGroup.value = grupo
    dialogView.value = 'instancias'
}

function abrirEliminados(grupo) {
    selectedGroup.value = grupo
    dialogView.value = 'eliminados'
}

function resetDialog() {
    dialogView.value = 'formularios'
    selectedGroup.value = null
    dialogInstancias.value = []
    dialogError.value = null
}

async function abrirCategoria(paciente, categoria) {
    dialogPaciente.value = paciente
    dialogCategoria.value = categoria
    dialogView.value = 'formularios'
    selectedGroup.value = null
    dialogOpen.value = true
    dialogLoading.value = true
    dialogError.value = null
    dialogInstancias.value = []
    try {
        dialogInstancias.value = await store.fetchPacienteInstancias(
            paciente.idUsuario,
            categoria,
        )
    } catch (err) {
        dialogError.value = err.message || 'No se pudieron cargar las instancias.'
    } finally {
        dialogLoading.value = false
    }
}

onMounted(() => {
    store.fetchPacientesResumen()
})
</script>

<style scoped>
.paciente-row :deep(.v-list-item__content) {
    overflow: visible;
}
</style>
