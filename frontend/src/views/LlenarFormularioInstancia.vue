<template>
    <div class="fill-shell">
        <header class="fill-header d-flex align-center justify-space-between flex-wrap ga-3 px-4 px-md-6 py-3">
            <div class="d-flex align-center ga-3 min-width-0">
                <v-btn
                    icon="mdi-arrow-left"
                    variant="text"
                    color="grey-darken-1"
                    rounded="lg"
                    to="/llenar-formularios"
                />
                <div class="min-width-0">
                    <p class="text-caption font-weight-bold text-uppercase text-grey-darken-1 mb-0"
                        style="letter-spacing: 0.06em;">
                        Llenar formulario
                        <span v-if="draftStatusLabel" class="text-warning"> · {{ draftStatusLabel }}</span>
                    </p>
                    <h1 class="text-h6 font-weight-bold text-grey-darken-4 text-truncate mb-0">
                        {{ formulario?.titulo || 'Formulario' }}
                    </h1>
                </div>
            </div>
            <div class="d-flex align-center ga-2 flex-shrink-0">
                <v-btn
                    variant="tonal"
                    color="primary"
                    rounded="lg"
                    class="text-none font-weight-bold"
                    :loading="savingDraft"
                    :disabled="!canSaveDraft || savingDraft || submitting"
                    @click="guardarBorrador(true)"
                >
                    {{ draftButtonLabel }}
                </v-btn>
                <v-btn
                    color="primary"
                    variant="flat"
                    rounded="lg"
                    class="text-none font-weight-bold"
                    :loading="submitting"
                    :disabled="!canEnviar || submitting || savingDraft"
                    @click="enviar"
                >
                    Enviar
                </v-btn>
            </div>
        </header>

        <div class="fill-body pa-4 pa-md-8">
            <div v-if="loading" class="text-center py-12">
                <v-progress-circular indeterminate color="primary" size="40" />
            </div>

            <v-alert v-else-if="error" type="error" variant="tonal" class="mx-auto" style="max-width: 720px;">
                {{ error }}
            </v-alert>

            <div v-else-if="formulario" class="fill-canvas mx-auto">
                <v-card class="mb-6 rounded-xl shadow-premium" border>
                    <v-card-text class="pa-6 pa-md-8">
                        <h2 class="text-h4 font-weight-black text-grey-darken-4 mb-2">
                            {{ formulario.titulo }}
                        </h2>
                        <p v-if="formulario.descripcion" class="text-body-1 text-grey-darken-1 mb-4">
                            {{ formulario.descripcion }}
                        </p>

                        <div class="d-flex flex-wrap ga-4">
                            <div>
                                <p class="text-caption text-grey-darken-1 mb-1">Quién llena</p>
                                <p class="text-body-2 font-weight-bold mb-0">
                                    {{ quienLlenaLabel }}
                                </p>
                            </div>
                            <div v-if="formulario.canFillForPatient" class="flex-grow-1" style="min-width: 240px;">
                                <p class="text-caption text-grey-darken-1 mb-1">Para quién llena</p>
                                <v-autocomplete
                                    v-model="paraQuienIdUsuario"
                                    :items="pacientesOptions"
                                    item-title="nombreCompleto"
                                    item-value="idUsuario"
                                    :custom-filter="filterPaciente"
                                    variant="outlined"
                                    density="comfortable"
                                    rounded="lg"
                                    hide-details="auto"
                                    placeholder="Buscar por nombre o CI"
                                    :loading="loadingPacientes || loadingContexto"
                                    clearable
                                >
                                    <template #item="{ props: itemProps, item }">
                                        <v-list-item v-bind="itemProps" :subtitle="item.raw.ci ? `CI: ${item.raw.ci}` : undefined">
                                            <template #prepend>
                                                <PersonaAvatar
                                                    :foto="item.raw.foto"
                                                    :nombres="item.raw.nombres"
                                                    :primer-apellido="item.raw.primerApellido"
                                                    :size="32"
                                                />
                                            </template>
                                        </v-list-item>
                                    </template>
                                </v-autocomplete>
                            </div>
                            <div v-else>
                                <p class="text-caption text-grey-darken-1 mb-1">Para quién llena</p>
                                <p class="text-body-2 font-weight-bold mb-0">
                                    {{ quienLlenaLabel }}
                                    <span class="text-caption text-grey font-weight-regular"> (tú mismo)</span>
                                </p>
                            </div>
                        </div>

                        <v-alert
                            v-if="contexto?.llenandoPor"
                            type="warning"
                            variant="tonal"
                            density="comfortable"
                            class="mt-5"
                        >
                            {{ contexto.llenandoPor.nombreCompleto }} está en proceso de llenado
                            de este formulario y no hay cupos disponibles.
                        </v-alert>

                        <v-alert
                            v-else-if="showSingleExistente"
                            type="warning"
                            variant="tonal"
                            density="comfortable"
                            class="mt-5"
                        >
                            <div class="d-flex flex-wrap align-center justify-space-between ga-3">
                                <div>
                                    <p class="text-body-2 font-weight-bold mb-1">
                                        Este paciente ya tiene este formulario enviado.
                                    </p>
                                    <p class="text-caption mb-0">
                                        Llenado por
                                        <strong>{{ contexto?.enviadoResumen?.quienLleno?.nombreCompleto || '—' }}</strong>
                                        <span v-if="contexto?.enviadoResumen?.updatedAt">
                                            · {{ formatDateTime(contexto.enviadoResumen.updatedAt) }}
                                        </span>
                                    </p>
                                </div>
                                <v-btn
                                    v-if="contexto?.enviadoResumen?.canView"
                                    color="primary"
                                    variant="flat"
                                    rounded="lg"
                                    class="text-none font-weight-bold"
                                    :to="`/llenar-formularios/instancias/${contexto.enviadoResumen.idInstancia}`"
                                >
                                    Ver llenado
                                </v-btn>
                            </div>
                        </v-alert>

                        <v-alert
                            v-else-if="showLimitedExistentes"
                            type="info"
                            variant="tonal"
                            density="comfortable"
                            class="mt-5"
                        >
                            <div class="d-flex flex-wrap align-center justify-space-between ga-3">
                                <div>
                                    <p class="text-body-2 font-weight-bold mb-1">
                                        Este paciente ya tiene {{ contexto.enviadosCount }}
                                        envío{{ contexto.enviadosCount === 1 ? '' : 's' }} de este formulario.
                                    </p>
                                    <p v-if="contexto.atLimit" class="text-caption mb-0">
                                        Se alcanzó el límite de envíos permitidos.
                                    </p>
                                </div>
                                <v-btn
                                    v-if="contexto.enviados?.length"
                                    color="primary"
                                    variant="tonal"
                                    rounded="lg"
                                    class="text-none font-weight-bold"
                                    @click="llenadosDialog = true"
                                >
                                    Ver llenados
                                </v-btn>
                            </div>
                        </v-alert>
                    </v-card-text>
                </v-card>

                <template v-if="showFillForm">
                <v-card
                    v-for="(section, sectionIndex) in sections"
                    :key="section.id || sectionIndex"
                    class="mb-6 rounded-xl shadow-premium"
                    border
                >
                    <v-card-text class="pa-6 pa-md-7">
                        <h3 class="text-subtitle-1 font-weight-black text-primary text-uppercase mb-1"
                            style="letter-spacing: 0.04em;">
                            {{ section.title || `Sección ${sectionIndex + 1}` }}
                        </h3>
                        <p v-if="section.description" class="text-body-2 text-grey-darken-1 mb-4">
                            {{ section.description }}
                        </p>
                        <v-divider v-if="section.description" class="mb-4" />

                        <div
                            v-for="field in section.fields || []"
                            :key="field.id"
                            class="mb-5"
                        >
                            <label class="text-body-2 font-weight-bold text-grey-darken-3 d-block mb-2">
                                {{ field.label || 'Pregunta sin título' }}
                                <span v-if="field.required" class="text-error">*</span>
                            </label>

                            <v-text-field
                                v-if="field.type === 'short_text' || field.type === 'number'"
                                v-model="respuestas[field.id]"
                                :type="field.type === 'number' ? 'number' : 'text'"
                                :placeholder="field.type === 'number' ? 'Valor numérico' : 'Tu respuesta'"
                                variant="outlined"
                                density="comfortable"
                                rounded="lg"
                                hide-details="auto"
                                :error="Boolean(fieldErrors[field.id])"
                                :error-messages="fieldErrors[field.id]"
                            />

                            <v-textarea
                                v-else-if="field.type === 'long_text'"
                                v-model="respuestas[field.id]"
                                placeholder="Tu respuesta"
                                variant="outlined"
                                density="comfortable"
                                rounded="lg"
                                rows="5"
                                hide-details="auto"
                                :error="Boolean(fieldErrors[field.id])"
                                :error-messages="fieldErrors[field.id]"
                            />

                            <v-menu
                                v-else-if="field.type === 'date'"
                                v-model="dateMenus[field.id]"
                                :close-on-content-click="false"
                                transition="scale-transition"
                                max-width="320"
                            >
                                <template #activator="{ props: menuProps }">
                                    <v-text-field
                                        v-bind="menuProps"
                                        :model-value="formatFechaDMY(respuestas[field.id])"
                                        placeholder="DD/MM/YYYY"
                                        prepend-inner-icon="mdi-calendar"
                                        readonly
                                        variant="outlined"
                                        density="comfortable"
                                        rounded="lg"
                                        hide-details="auto"
                                        :error="Boolean(fieldErrors[field.id])"
                                        :error-messages="fieldErrors[field.id]"
                                        clearable
                                        @click:clear.stop.prevent="respuestas[field.id] = null"
                                    />
                                </template>
                                <v-date-picker
                                    :model-value="pickerDate(respuestas[field.id])"
                                    hide-header
                                    color="primary"
                                    @update:model-value="(val) => onPickDate(field.id, val)"
                                />
                            </v-menu>

                            <v-radio-group
                                v-else-if="field.type === 'single_choice'"
                                v-model="respuestas[field.id]"
                                hide-details="auto"
                                :error="Boolean(fieldErrors[field.id])"
                                :error-messages="fieldErrors[field.id]"
                            >
                                <v-radio
                                    v-for="(option, idx) in field.options || []"
                                    :key="idx"
                                    :label="option || `Opción ${idx + 1}`"
                                    :value="option"
                                    color="primary"
                                />
                            </v-radio-group>

                            <div v-else-if="field.type === 'multiple_choice'">
                                <v-checkbox
                                    v-for="(option, idx) in field.options || []"
                                    :key="idx"
                                    :model-value="Array.isArray(respuestas[field.id]) && respuestas[field.id].includes(option)"
                                    :label="option || `Opción ${idx + 1}`"
                                    hide-details
                                    density="compact"
                                    color="primary"
                                    class="mb-1"
                                    @update:model-value="(checked) => toggleMulti(field.id, option, checked)"
                                />
                                <p v-if="fieldErrors[field.id]" class="text-caption text-error mt-1 mb-0">
                                    {{ fieldErrors[field.id] }}
                                </p>
                            </div>

                            <p v-if="field.helpText" class="text-caption text-grey-darken-1 mt-2 mb-0">
                                {{ field.helpText }}
                            </p>
                        </div>
                    </v-card-text>
                </v-card>
                </template>

                <v-alert v-if="submitError" type="error" variant="tonal" class="mb-4">
                    {{ submitError }}
                </v-alert>
            </div>
        </div>

        <v-dialog v-model="llenadosDialog" max-width="520" scrollable>
            <v-card rounded="xl">
                <v-card-title class="d-flex align-center justify-space-between pa-5">
                    <span class="font-weight-bold">Envíos anteriores</span>
                    <v-btn icon="mdi-close" variant="text" @click="llenadosDialog = false" />
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-4">
                    <v-list lines="two">
                        <v-list-item
                            v-for="inst in contexto?.enviados || []"
                            :key="inst.idInstancia"
                            rounded="lg"
                            class="mb-1"
                            :to="`/llenar-formularios/instancias/${inst.idInstancia}`"
                            @click="llenadosDialog = false"
                        >
                            <v-list-item-title class="font-weight-bold">
                                {{ formatDateTime(inst.updatedAt || inst.createdAt) }}
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

        <ModalMensaje
            v-model="showSuccessModal"
            :title="successTitle"
            :message="successMessage"
            type="success"
            @confirm="onSuccessConfirm"
        />
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalMensaje from '@/components/common/ModalMensaje.vue'
import PersonaAvatar from '@/components/common/PersonaAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { useFormulariosStore } from '@/stores/formularios'
import { usePersonasStore } from '@/stores/personas'

const PATIENT_ROLES = ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'CONSULTOR']

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const store = useFormulariosStore()
const personasStore = usePersonasStore()

const formulario = ref(null)
const contexto = ref(null)
const loading = ref(true)
const loadingPacientes = ref(false)
const loadingContexto = ref(false)
const savingDraft = ref(false)
const submitting = ref(false)
const error = ref(null)
const submitError = ref(null)
const respuestas = reactive({})
const fieldErrors = reactive({})
const dateMenus = reactive({})
const paraQuienIdUsuario = ref(null)
const pacientesOptions = ref([])
const draftId = ref(null)
const draftDirty = ref(false)
const draftStatus = ref('idle') // idle | dirty | saving | saved
const suppressAutosave = ref(false)
const llenadosDialog = ref(false)
const showSuccessModal = ref(false)
const successTitle = ref('')
const successMessage = ref('')
const successGoBack = ref(false)
let autosaveTimer = null

const sections = computed(() => formulario.value?.sections ?? [])

const quienLlenaLabel = computed(() => {
    const u = authStore.user
    if (!u) return 'Usuario actual'
    return [u.nombres, u.primerApellido, u.segundoApellido].filter(Boolean).join(' ')
})

const destinatarioListo = computed(() => {
    if (!formulario.value?.canFill) return false
    if (formulario.value.canFillForPatient) return Boolean(paraQuienIdUsuario.value)
    return true
})

const cupoEnviadosLleno = computed(() => {
    const enviados = contexto.value?.enviadosCount ?? 0
    const mode = formulario.value?.fillMode
    if (mode === 'single') return enviados >= 1
    if (mode === 'limited' && formulario.value?.fillLimit != null) {
        return enviados >= formulario.value.fillLimit
    }
    return false
})

const canSaveDraft = computed(() => {
    if (!destinatarioListo.value) return false
    if (contexto.value?.llenandoPor && !contexto.value?.miBorrador) return false
    if (cupoEnviadosLleno.value && !contexto.value?.miBorrador) return false
    return true
})

const canEnviar = computed(() => {
    if (!destinatarioListo.value) return false
    if (contexto.value?.llenandoPor) return false
    if (cupoEnviadosLleno.value) return false
    return true
})

const showFillForm = computed(() => {
    if (!formulario.value?.canFill) return false
    if (contexto.value?.llenandoPor && !contexto.value?.miBorrador) return false
    if (cupoEnviadosLleno.value && !contexto.value?.miBorrador) return false
    return destinatarioListo.value
})

const showSingleExistente = computed(
    () =>
        formulario.value?.fillMode === 'single' &&
        Boolean(contexto.value?.enviadoResumen || (contexto.value?.enviadosCount ?? 0) > 0),
)

const showLimitedExistentes = computed(
    () =>
        formulario.value?.fillMode === 'limited' &&
        (contexto.value?.enviadosCount ?? 0) > 0,
)

const draftStatusLabel = computed(() => {
    if (draftStatus.value === 'saving') return 'Guardando…'
    if (draftStatus.value === 'saved') return 'Borrador guardado'
    if (draftStatus.value === 'dirty') return 'Cambios sin guardar'
    return draftId.value ? 'Borrador' : ''
})

const draftButtonLabel = computed(() => {
    if (draftStatus.value === 'saving') return 'Guardando…'
    if (draftStatus.value === 'saved') return 'Guardado'
    return 'Guardar borrador'
})

function filterPaciente(_title, queryText, item) {
    const q = String(queryText || '').trim().toLowerCase()
    if (!q) return true
    const raw = item?.raw || {}
    return (
        String(raw.nombreCompleto || '').toLowerCase().includes(q) ||
        String(raw.ci || '').toLowerCase().includes(q)
    )
}

function formatFechaDMY(value) {
    if (!value) return ''
    const iso = String(value).slice(0, 10)
    const [y, m, d] = iso.split('-')
    if (!y || !m || !d) return ''
    return `${d}/${m}/${y}`
}

function formatDateTime(value) {
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

function pickerDate(value) {
    if (!value) return null
    const iso = String(value).slice(0, 10)
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
}

function onPickDate(fieldId, val) {
    const date = Array.isArray(val) ? val[0] : val
    if (!date) {
        respuestas[fieldId] = null
        dateMenus[fieldId] = false
        return
    }
    const d = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(d.getTime())) return
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    respuestas[fieldId] = `${yyyy}-${mm}-${dd}`
    dateMenus[fieldId] = false
}

function toggleMulti(fieldId, option, checked) {
    const current = Array.isArray(respuestas[fieldId]) ? [...respuestas[fieldId]] : []
    if (checked) {
        if (!current.includes(option)) current.push(option)
    } else {
        const idx = current.indexOf(option)
        if (idx >= 0) current.splice(idx, 1)
    }
    respuestas[fieldId] = current
}

function validateRequired() {
    Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
    let ok = true
    for (const section of sections.value) {
        for (const field of section.fields || []) {
            if (!field.required) continue
            const value = respuestas[field.id]
            const empty =
                value === undefined ||
                value === null ||
                value === '' ||
                (Array.isArray(value) && value.length === 0)
            if (empty) {
                fieldErrors[field.id] = 'Campo obligatorio'
                ok = false
            }
        }
    }
    return ok
}

function initEmptyRespuestas() {
    for (const section of formulario.value?.sections || []) {
        for (const field of section.fields || []) {
            if (field.type === 'multiple_choice') {
                respuestas[field.id] = []
            } else {
                respuestas[field.id] = null
            }
            dateMenus[field.id] = false
        }
    }
}

function applyRespuestas(source = {}) {
    suppressAutosave.value = true
    initEmptyRespuestas()
    for (const [key, value] of Object.entries(source || {})) {
        respuestas[key] = value
    }
    nextTick(() => {
        draftDirty.value = false
        draftStatus.value = draftId.value ? 'saved' : 'idle'
        suppressAutosave.value = false
    })
}

async function loadPacientes() {
    loadingPacientes.value = true
    try {
        await personasStore.fetchPersonasConUsuario()
        pacientesOptions.value = (personasStore.personasConUsuario || [])
            .filter((p) => {
                const rolesFromMap = (p.roles || []).map((r) => r.tipoRol || r.name)
                const rolesFromAsign =
                    (p.asignacionesRoles || [])
                        .filter((ar) => ar.activo !== false)
                        .map((ar) => ar.rol?.nombre) || []
                const roles = [...rolesFromMap, ...rolesFromAsign]
                return roles.some((r) => PATIENT_ROLES.includes(r)) && p.usuario?.idUsuario
            })
            .map((p) => ({
                idUsuario: p.usuario.idUsuario,
                nombres: p.nombres,
                primerApellido: p.primerApellido,
                segundoApellido: p.segundoApellido,
                nombreCompleto: [p.nombres, p.primerApellido, p.segundoApellido]
                    .filter(Boolean)
                    .join(' '),
                foto: p.foto,
                ci: p.ci || '',
            }))
            .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'))
    } finally {
        loadingPacientes.value = false
    }
}

async function refreshContexto() {
    if (!formulario.value?.idFormulario) return
    if (formulario.value.canFillForPatient && !paraQuienIdUsuario.value) {
        contexto.value = null
        draftId.value = null
        return
    }

    loadingContexto.value = true
    try {
        const data = await store.getContextoLlenado(
            formulario.value.idFormulario,
            formulario.value.canFillForPatient ? paraQuienIdUsuario.value : undefined,
        )
        contexto.value = data
        if (data?.miBorrador) {
            draftId.value = data.miBorrador.idInstancia
            applyRespuestas(data.miBorrador.respuestas || {})
        } else {
            draftId.value = null
            applyRespuestas({})
        }
    } catch (err) {
        submitError.value = err.message || 'No se pudo cargar el contexto del destinatario.'
    } finally {
        loadingContexto.value = false
    }
}

async function load() {
    loading.value = true
    error.value = null
    try {
        formulario.value = await store.getParaLlenarById(route.params.id)
        if (!formulario.value?.canFill) {
            error.value = 'No tienes permiso para llenar este formulario.'
            return
        }
        initEmptyRespuestas()
        if (formulario.value.canFillForPatient) {
            await loadPacientes()
        } else {
            await refreshContexto()
        }
    } catch (err) {
        error.value = err.message || 'No se pudo cargar el formulario.'
    } finally {
        loading.value = false
    }
}

function buildPayload(estado) {
    const payload = {
        respuestas: { ...respuestas },
        estado,
    }
    if (formulario.value.canFillForPatient) {
        payload.paraQuienIdUsuario = paraQuienIdUsuario.value
    }
    return payload
}

async function guardarBorrador(manual = false) {
    submitError.value = null
    if (!canSaveDraft.value) {
        if (manual) submitError.value = 'Selecciona el paciente destinatario.'
        return
    }

    savingDraft.value = true
    draftStatus.value = 'saving'
    try {
        let saved
        if (draftId.value) {
            saved = await store.updateInstancia(draftId.value, {
                respuestas: { ...respuestas },
                estado: 'guardado',
            })
        } else {
            saved = await store.createInstancia(
                formulario.value.idFormulario,
                buildPayload('guardado'),
            )
            draftId.value = saved.idInstancia
        }
        draftDirty.value = false
        draftStatus.value = 'saved'
        if (manual) {
            successTitle.value = 'Borrador guardado'
            successMessage.value = 'Tu avance quedó guardado. Solo tú puedes verlo hasta enviarlo.'
            successGoBack.value = false
            showSuccessModal.value = true
        }
    } catch (err) {
        draftStatus.value = draftDirty.value ? 'dirty' : 'idle'
        submitError.value = err.message || 'No se pudo guardar el borrador.'
    } finally {
        savingDraft.value = false
    }
}

async function enviar() {
    submitError.value = null
    if (!canEnviar.value) {
        submitError.value = contexto.value?.atLimit
            ? `Ese usuario ya tiene un formulario de "${formulario.value.titulo}" guardado.`
            : 'Selecciona el paciente destinatario.'
        return
    }
    if (!validateRequired()) {
        submitError.value = 'Completa los campos obligatorios.'
        return
    }

    submitting.value = true
    try {
        if (draftId.value) {
            await store.updateInstancia(draftId.value, {
                respuestas: { ...respuestas },
                estado: 'enviado',
            })
        } else {
            await store.createInstancia(
                formulario.value.idFormulario,
                buildPayload('enviado'),
            )
        }
        draftId.value = null
        draftDirty.value = false
        successTitle.value = 'Formulario enviado'
        successMessage.value = 'La instancia quedó registrada y ya es visible según los permisos del formulario.'
        successGoBack.value = true
        showSuccessModal.value = true
    } catch (err) {
        submitError.value = err.message || 'No se pudo enviar el formulario.'
    } finally {
        submitting.value = false
    }
}

function onSuccessConfirm() {
    showSuccessModal.value = false
    if (successGoBack.value) {
        router.push('/llenar-formularios')
    }
}

function scheduleAutosave() {
    if (suppressAutosave.value || !canSaveDraft.value) return
    draftDirty.value = true
    draftStatus.value = 'dirty'
    clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => {
        if (draftDirty.value && canSaveDraft.value) {
            guardarBorrador(false)
        }
    }, 2000)
}

watch(paraQuienIdUsuario, () => {
    refreshContexto()
})

watch(
    respuestas,
    () => {
        scheduleAutosave()
    },
    { deep: true },
)

onMounted(load)

onUnmounted(() => {
    clearTimeout(autosaveTimer)
})
</script>

<style scoped>
.fill-shell {
    min-height: calc(100vh - 64px);
    background: #f7f8fa;
}
.fill-header {
    position: sticky;
    top: 0;
    z-index: 5;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.fill-canvas {
    max-width: 720px;
}
</style>
