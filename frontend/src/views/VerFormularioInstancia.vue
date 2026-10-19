<template>
    <div class="fill-shell">
        <header class="fill-header d-flex align-center justify-space-between flex-wrap ga-3 px-4 px-md-6 py-3">
            <div class="d-flex align-center ga-3 min-width-0">
                <v-btn
                    icon="mdi-arrow-left"
                    variant="text"
                    color="grey-darken-1"
                    rounded="lg"
                    @click="goBack"
                />
                <div class="min-width-0">
                    <p class="text-caption font-weight-bold text-uppercase text-grey-darken-1 mb-0"
                        style="letter-spacing: 0.06em;">
                        <span v-if="instancia?.eliminado">Instancia borrada</span>
                        <span v-else-if="isEditing">Editando instancia</span>
                        <span v-else-if="viewingHistorical">Versión histórica</span>
                        <span v-else>
                            Instancia {{ instancia?.estado === 'enviado' ? 'enviada' : 'guardada' }}
                        </span>
                    </p>
                    <h1 class="text-h6 font-weight-bold text-grey-darken-4 text-truncate mb-0">
                        {{ instancia?.formulario?.titulo || 'Formulario' }}
                    </h1>
                </div>
            </div>
            <div class="d-flex align-center ga-2 flex-shrink-0">
                <template v-if="isEditing">
                    <v-btn
                        variant="text"
                        class="text-none"
                        :disabled="saving || discarding"
                        @click="salirEdicion"
                    >
                        Salir
                    </v-btn>
                    <v-btn
                        variant="text"
                        color="error"
                        class="text-none"
                        :disabled="saving || discarding"
                        @click="cancelEditDialog = true"
                    >
                        Cancelar edición
                    </v-btn>
                    <v-btn
                        variant="tonal"
                        color="primary"
                        rounded="lg"
                        class="text-none font-weight-bold"
                        :loading="savingDraft"
                        :disabled="discarding"
                        @click="saveDraft(true)"
                    >
                        Guardar borrador
                    </v-btn>
                    <v-btn
                        color="primary"
                        variant="flat"
                        rounded="lg"
                        class="text-none font-weight-bold"
                        :loading="saving"
                        :disabled="discarding"
                        @click="guardarCambios"
                    >
                        Guardar cambios
                    </v-btn>
                </template>
                <template v-else>
                    <v-btn
                        v-if="instancia?.canEdit && !instancia?.eliminado && !viewingHistorical"
                        color="primary"
                        variant="flat"
                        rounded="lg"
                        class="text-none font-weight-bold"
                        prepend-icon="mdi-pencil"
                        @click="startEdit"
                    >
                        Editar
                    </v-btn>
                    <v-btn
                        v-if="instancia?.canDelete && !instancia?.eliminado && !viewingHistorical"
                        color="error"
                        variant="tonal"
                        rounded="lg"
                        class="text-none font-weight-bold"
                        prepend-icon="mdi-delete-outline"
                        @click="deleteDialog = true"
                    >
                        Eliminar
                    </v-btn>
                    <v-btn
                        v-if="instancia?.canDelete && instancia?.eliminado"
                        color="success"
                        variant="flat"
                        rounded="lg"
                        class="text-none font-weight-bold"
                        prepend-icon="mdi-restore"
                        @click="restoreDialog = true"
                    >
                        Recuperar
                    </v-btn>
                </template>
            </div>
        </header>

        <div class="fill-body pa-4 pa-md-8">
            <div v-if="loading" class="text-center py-12">
                <v-progress-circular indeterminate color="primary" size="40" />
            </div>

            <v-alert v-else-if="error" type="error" variant="tonal" class="mx-auto" style="max-width: 720px;">
                {{ error }}
            </v-alert>

            <div v-else-if="instancia" class="fill-canvas mx-auto">
                <v-alert
                    v-if="instancia.borradorEdicionPor && !isEditing"
                    type="warning"
                    variant="tonal"
                    class="mb-4"
                >
                    {{ instancia.borradorEdicionPor.nombreCompleto }} está en proceso de edición de esta instancia.
                </v-alert>

                <v-alert
                    v-else-if="instancia.borradorEdicion && !isEditing"
                    type="info"
                    variant="tonal"
                    class="mb-4"
                >
                    <div class="d-flex flex-wrap align-center justify-space-between ga-2">
                        <span>
                            Tienes un borrador de edición pendiente. Continúa con «Editar» para retomarlo.
                        </span>
                        <button
                            type="button"
                            class="text-body-2 font-weight-bold text-error text-decoration-underline"
                            style="background: none; border: none; cursor: pointer; padding: 0;"
                            :disabled="discarding"
                            @click="cancelEditDialog = true"
                        >
                            Cancelar edición
                        </button>
                    </div>
                </v-alert>

                <v-alert
                    v-if="instancia.eliminado"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                >
                    Esta instancia está marcada como borrada. Solo quienes tienen permiso Eliminar pueden verla y recuperarla.
                </v-alert>

                <v-card class="mb-6 rounded-xl shadow-premium" border>
                    <v-card-text class="pa-6 pa-md-8">
                        <h2 class="text-h4 font-weight-black text-grey-darken-4 mb-4">
                            {{ instancia.formulario?.titulo }}
                        </h2>
                        <div class="d-flex flex-wrap ga-6 mb-4">
                            <div>
                                <p class="text-caption text-grey-darken-1 mb-1">Para quién</p>
                                <p class="text-body-2 font-weight-bold mb-0">
                                    {{ instancia.paraQuien?.nombreCompleto || '—' }}
                                </p>
                            </div>
                            <div>
                                <p class="text-caption text-grey-darken-1 mb-1">Último editor</p>
                                <p class="text-body-2 font-weight-bold mb-0">
                                    {{ instancia.ultimoEditor?.nombreCompleto || instancia.quienLleno?.nombreCompleto || '—' }}
                                </p>
                            </div>
                            <div>
                                <p class="text-caption text-grey-darken-1 mb-1">Fecha</p>
                                <p class="text-body-2 font-weight-bold mb-0">
                                    {{ formatDateTime(instancia.ultimoEditor?.fecha || instancia.updatedAt) }}
                                </p>
                            </div>
                        </div>

                        <div v-if="editores.length" class="d-flex align-center ga-1">
                            <p class="text-caption font-weight-bold text-grey-darken-1 mb-0">
                                {{ editores.length === 1 ? 'Quién lo llenó' : 'Quiénes lo llenaron / editaron' }}
                            </p>
                            <v-menu
                                v-if="editores.length > 1"
                                location="bottom start"
                                :close-on-content-click="false"
                            >
                                <template #activator="{ props: menuProps }">
                                    <v-btn
                                        v-bind="menuProps"
                                        icon="mdi-information-outline"
                                        size="x-small"
                                        variant="text"
                                        color="grey-darken-1"
                                        aria-label="Ver historial de editores"
                                    />
                                </template>
                                <v-card min-width="280" max-width="360" rounded="lg" border>
                                    <v-list density="compact" class="py-1">
                                        <v-list-item
                                            v-for="editor in editoresSorted"
                                            :key="editor.idVersion"
                                            class="px-3"
                                            :active="Number(route.query.version) === editor.idVersion"
                                            @click="openVersion(editor.idVersion)"
                                        >
                                            <div class="d-flex align-center ga-2 text-body-2 w-100 min-width-0">
                                                <span class="font-weight-bold text-truncate">
                                                    {{ editor.nombreCompleto }}
                                                </span>
                                                <span class="text-caption text-grey-darken-1 flex-shrink-0">
                                                    {{ formatDateTime(editor.fecha) }}
                                                </span>
                                                <v-chip
                                                    v-if="editor.esUltimo"
                                                    size="x-small"
                                                    color="primary"
                                                    variant="tonal"
                                                    class="flex-shrink-0"
                                                >
                                                    Último
                                                </v-chip>
                                            </div>
                                        </v-list-item>
                                    </v-list>
                                </v-card>
                            </v-menu>
                            <p v-else class="text-body-2 font-weight-bold mb-0 ms-1">
                                {{ editores[0]?.nombreCompleto }}
                                <span class="text-caption text-grey font-weight-regular">
                                    · {{ formatDateTime(editores[0]?.fecha) }}
                                </span>
                            </p>
                        </div>
                    </v-card-text>
                </v-card>

                <template v-if="isEditing">
                    <v-card
                        v-for="(section, sectionIndex) in editSections"
                        :key="section.id || sectionIndex"
                        class="mb-6 rounded-xl shadow-premium"
                        border
                    >
                        <v-card-text class="pa-6 pa-md-7">
                            <h3 class="text-subtitle-1 font-weight-black text-primary text-uppercase mb-1">
                                {{ section.title || `Sección ${sectionIndex + 1}` }}
                                <v-chip v-if="section.isNew" size="x-small" color="info" variant="tonal" class="ms-2">
                                    Nueva
                                </v-chip>
                            </h3>
                            <div
                                v-for="field in section.fields || []"
                                :key="field.id"
                                class="mb-5"
                            >
                                <label class="text-body-2 font-weight-bold text-grey-darken-3 d-block mb-2">
                                    {{ field.label }}
                                    <span v-if="field.eliminated" class="text-caption text-warning">
                                        (campo eliminado del formulario)
                                    </span>
                                    <span v-else-if="field.required" class="text-error">*</span>
                                </label>

                                <template v-if="field.eliminated">
                                    <p class="text-body-2 mb-0">{{ formatRespuesta(field, editRespuestas[field.id]) }}</p>
                                </template>
                                <template v-else>
                                    <v-text-field
                                        v-if="field.type === 'short_text' || field.type === 'number'"
                                        v-model="editRespuestas[field.id]"
                                        :type="field.type === 'number' ? 'number' : 'text'"
                                        variant="outlined"
                                        density="comfortable"
                                        rounded="lg"
                                        hide-details="auto"
                                    />
                                    <v-textarea
                                        v-else-if="field.type === 'long_text'"
                                        v-model="editRespuestas[field.id]"
                                        variant="outlined"
                                        density="comfortable"
                                        rounded="lg"
                                        rows="5"
                                        hide-details="auto"
                                    />
                                    <v-menu
                                        v-else-if="field.type === 'date'"
                                        v-model="dateMenus[field.id]"
                                        :close-on-content-click="false"
                                        max-width="320"
                                    >
                                        <template #activator="{ props: menuProps }">
                                            <v-text-field
                                                v-bind="menuProps"
                                                :model-value="formatFechaDMY(editRespuestas[field.id])"
                                                placeholder="DD/MM/YYYY"
                                                prepend-inner-icon="mdi-calendar"
                                                readonly
                                                variant="outlined"
                                                density="comfortable"
                                                rounded="lg"
                                                hide-details="auto"
                                            />
                                        </template>
                                        <v-date-picker
                                            :model-value="pickerDate(editRespuestas[field.id])"
                                            hide-header
                                            color="primary"
                                            @update:model-value="(val) => onPickDate(field.id, val)"
                                        />
                                    </v-menu>
                                    <v-radio-group
                                        v-else-if="field.type === 'single_choice'"
                                        v-model="editRespuestas[field.id]"
                                        hide-details="auto"
                                    >
                                        <v-radio
                                            v-for="(option, idx) in field.options || []"
                                            :key="idx"
                                            :label="option"
                                            :value="option"
                                            color="primary"
                                        />
                                    </v-radio-group>
                                    <div v-else-if="field.type === 'multiple_choice'">
                                        <v-checkbox
                                            v-for="(option, idx) in field.options || []"
                                            :key="idx"
                                            :model-value="Array.isArray(editRespuestas[field.id]) && editRespuestas[field.id].includes(option)"
                                            :label="option"
                                            hide-details
                                            density="compact"
                                            color="primary"
                                            @update:model-value="(checked) => toggleMulti(field.id, option, checked)"
                                        />
                                    </div>
                                    <p v-else class="text-body-2 mb-0">
                                        {{ formatRespuesta(field, editRespuestas[field.id]) }}
                                    </p>
                                </template>
                            </div>
                        </v-card-text>
                    </v-card>
                </template>

                <template v-else>
                    <v-card
                        v-for="(section, sectionIndex) in displaySections"
                        :key="section.id || sectionIndex"
                        class="mb-6 rounded-xl shadow-premium"
                        border
                    >
                        <v-card-text class="pa-6 pa-md-7">
                            <h3 class="text-subtitle-1 font-weight-black text-primary text-uppercase mb-3">
                                {{ section.title || `Sección ${sectionIndex + 1}` }}
                                <v-chip v-if="section.isNew" size="x-small" color="info" variant="tonal" class="ms-2">
                                    Nueva (sin llenar)
                                </v-chip>
                            </h3>
                            <div
                                v-for="field in section.fields || []"
                                :key="field.id"
                                class="mb-4"
                            >
                                <p class="text-caption font-weight-bold text-grey-darken-2 mb-1">
                                    {{ field.label }}
                                    <span v-if="field.eliminated" class="text-warning"> · campo eliminado</span>
                                </p>
                                <p class="text-body-2 mb-0">
                                    {{ formatRespuesta(field, displayRespuestas[field.id] ?? field.value) }}
                                </p>
                            </div>
                        </v-card-text>
                    </v-card>
                </template>
            </div>
        </div>

        <ModalConfirmación
            v-model="cancelEditDialog"
            title="¿Cancelar edición?"
            message="Se descartará tu borrador de edición y otro usuario podrá editar esta instancia."
            type="warning"
            confirm-text="Cancelar edición"
            :loading="discarding"
            @confirm="confirmCancelEdit"
            @cancel="cancelEditDialog = false"
        />

        <ModalConfirmación
            v-model="deleteDialog"
            title="¿Eliminar instancia?"
            message="La instancia se marcará como borrada. Quienes tienen permiso Eliminar podrán recuperarla después."
            type="error"
            confirm-text="Eliminar"
            @confirm="confirmDelete"
            @cancel="deleteDialog = false"
        />

        <ModalConfirmación
            v-model="restoreDialog"
            title="¿Recuperar instancia?"
            message="Si no hay cupo disponible, se deshabilitará la última instancia editada para liberar espacio. También puedes eliminar otra instancia hábil antes de recuperar esta."
            type="warning"
            confirm-text="Recuperar"
            @confirm="confirmRestore"
            @cancel="restoreDialog = false"
        />

        <ModalMensaje
            v-model="showSuccess"
            :title="successTitle"
            :message="successMessage"
            type="success"
            @confirm="showSuccess = false"
        />
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalConfirmación from '@/components/common/ModalConfirmación.vue'
import ModalMensaje from '@/components/common/ModalMensaje.vue'
import { useFormulariosStore } from '@/stores/formularios'

const route = useRoute()
const router = useRouter()
const store = useFormulariosStore()

const instancia = ref(null)
const loading = ref(true)
const error = ref(null)
const isEditing = ref(false)
const saving = ref(false)
const savingDraft = ref(false)
const editRespuestas = reactive({})
const dateMenus = reactive({})
const deleteDialog = ref(false)
const restoreDialog = ref(false)
const cancelEditDialog = ref(false)
const discarding = ref(false)
const showSuccess = ref(false)
const successTitle = ref('')
const successMessage = ref('')
let autosaveTimer = null
let suppressAutosave = false
let editSession = 0
let pendingDraftSave = null

const viewingHistorical = computed(() => Boolean(route.query.version) && !isEditing.value)

const editores = computed(() => instancia.value?.editores || [])
const editoresSorted = computed(() =>
    [...editores.value].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
)

const displaySections = computed(() => {
    if (instancia.value?.versionSeleccionada?.sections) {
        return instancia.value.versionSeleccionada.sections
    }
    return instancia.value?.sections || []
})

const displayRespuestas = computed(() => {
    if (instancia.value?.versionSeleccionada?.respuestas) {
        return instancia.value.versionSeleccionada.respuestas
    }
    return instancia.value?.respuestas || {}
})

const editSections = computed(
    () => instancia.value?.borradorEdicion?.sections || instancia.value?.sections || [],
)

function formatDateTime(value) {
    if (!value) return '—'
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

function formatFechaDMY(value) {
    if (!value) return ''
    const iso = String(value).slice(0, 10)
    const [y, m, d] = iso.split('-')
    if (!y || !m || !d) return ''
    return `${d}/${m}/${y}`
}

function formatRespuesta(field, value) {
    if (value === null || value === undefined || value === '') return '—'
    if (field?.type === 'date') return formatFechaDMY(value) || '—'
    if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
    return String(value)
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
        editRespuestas[fieldId] = null
        dateMenus[fieldId] = false
        return
    }
    const d = date instanceof Date ? date : new Date(date)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    editRespuestas[fieldId] = `${yyyy}-${mm}-${dd}`
    dateMenus[fieldId] = false
}

function toggleMulti(fieldId, option, checked) {
    const current = Array.isArray(editRespuestas[fieldId]) ? [...editRespuestas[fieldId]] : []
    if (checked) {
        if (!current.includes(option)) current.push(option)
    } else {
        const idx = current.indexOf(option)
        if (idx >= 0) current.splice(idx, 1)
    }
    editRespuestas[fieldId] = current
}

function goBack() {
    if (route.query.version) {
        router.replace({ path: route.path, query: { ...route.query, version: undefined, edit: undefined } })
        return
    }
    if (isEditing.value) {
        salirEdicion()
        return
    }
    if (window.history.length > 1) router.back()
    else router.push('/formularios/pacientes')
}

function openVersion(idVersion) {
    if (isEditing.value) return
    router.replace({
        path: route.path,
        query: { ...route.query, version: String(idVersion), edit: undefined },
    })
}

async function load() {
    loading.value = true
    error.value = null
    try {
        const versionId = route.query.version ? Number(route.query.version) : undefined
        instancia.value = await store.getInstancia(route.params.id, versionId)
        if (
            route.query.edit === '1' &&
            instancia.value?.canEdit &&
            !discarding.value
        ) {
            await enterEditMode(false)
        }
    } catch (err) {
        error.value = err.message || 'No se pudo cargar la instancia.'
    } finally {
        loading.value = false
    }
}

async function startEdit() {
    await enterEditMode(true)
}

async function enterEditMode(updateQuery) {
    error.value = null
    clearTimeout(autosaveTimer)
    const session = ++editSession
    try {
        const updated = await store.saveEditDraft(route.params.id, undefined)
        if (session !== editSession) return
        instancia.value = updated
        suppressAutosave = true
        Object.keys(editRespuestas).forEach((k) => delete editRespuestas[k])
        const draft = updated.borradorEdicion?.respuestas
        const published = updated.respuestas || {}
        const source =
            draft && typeof draft === 'object' && Object.keys(draft).length > 0
                ? draft
                : published
        Object.assign(editRespuestas, JSON.parse(JSON.stringify(source)))
        isEditing.value = true
        if (updateQuery) {
            router.replace({ path: route.path, query: { edit: '1' } })
        }
        await nextTick()
        if (session !== editSession) return
        suppressAutosave = false
    } catch (err) {
        if (session !== editSession) return
        error.value = err.message || 'No se pudo iniciar la edición.'
        suppressAutosave = false
    }
}

async function saveDraft(manual = false) {
    if (!isEditing.value || discarding.value) return
    const session = editSession
    savingDraft.value = true
    const request = store.saveEditDraft(route.params.id, { ...editRespuestas })
    pendingDraftSave = request
    try {
        const updated = await request
        // Ignorar respuestas de un autosave viejo tras cancelar/salir/guardar.
        if (session !== editSession || !isEditing.value || discarding.value) return
        instancia.value = updated
        if (manual) {
            successTitle.value = 'Borrador guardado'
            successMessage.value = 'Tu edición quedó guardada. Solo tú puedes continuar editándola.'
            showSuccess.value = true
        }
    } catch (err) {
        if (session !== editSession || discarding.value) return
        error.value = err.message || 'No se pudo guardar el borrador.'
    } finally {
        if (pendingDraftSave === request) pendingDraftSave = null
        if (session === editSession) savingDraft.value = false
    }
}

async function guardarCambios() {
    saving.value = true
    error.value = null
    clearTimeout(autosaveTimer)
    suppressAutosave = true
    const session = editSession
    try {
        const updated = await store.commitEdit(route.params.id, { ...editRespuestas })
        editSession += 1
        instancia.value = updated
        isEditing.value = false
        router.replace({ path: route.path })
        successTitle.value = 'Cambios guardados'
        successMessage.value = 'Se creó una nueva versión de la instancia.'
        showSuccess.value = true
    } catch (err) {
        if (session === editSession) {
            error.value = err.message || 'No se pudieron guardar los cambios.'
        }
    } finally {
        saving.value = false
        suppressAutosave = false
    }
}

async function salirEdicion() {
    // El borrador persiste: no se descarta al salir.
    clearTimeout(autosaveTimer)
    suppressAutosave = true
    try {
        if (Object.keys(editRespuestas).length > 0) {
            await store.saveEditDraft(route.params.id, { ...editRespuestas })
        }
    } catch {
        /* ignore */
    }
    editSession += 1
    isEditing.value = false
    router.replace({ path: route.path })
    await load()
    suppressAutosave = false
}

async function confirmCancelEdit() {
    if (discarding.value) return
    discarding.value = true
    suppressAutosave = true
    error.value = null
    clearTimeout(autosaveTimer)
    // Invalidar cualquier autosave en vuelo antes de descartar.
    editSession += 1
    isEditing.value = false
    // Quitar ?edit=1 ya, para que un reload no vuelva a abrir el borrador.
    if (route.query.edit || route.query.version) {
        await router.replace({ path: route.path })
    }
    try {
        // Esperar a que un POST de borrador en curso termine; si no, puede
        // recrear el borrador después del DELETE.
        if (pendingDraftSave) {
            try {
                await pendingDraftSave
            } catch {
                /* ignore */
            }
        }
        const updated = await store.discardEditDraft(route.params.id)
        instancia.value = {
            ...updated,
            borradorEdicion: null,
            borradorEdicionPor: null,
        }
        cancelEditDialog.value = false
        successTitle.value = 'Edición cancelada'
        successMessage.value = 'Se descartó el borrador. Otro usuario ya puede editar esta instancia.'
        showSuccess.value = true
    } catch (err) {
        error.value = err.message || 'No se pudo cancelar la edición.'
        cancelEditDialog.value = false
        await load()
    } finally {
        discarding.value = false
        suppressAutosave = false
    }
}

async function confirmDelete() {
    deleteDialog.value = false
    try {
        await store.removeInstancia(route.params.id)
        successTitle.value = 'Instancia eliminada'
        successMessage.value = 'La instancia quedó marcada como borrada.'
        showSuccess.value = true
        await load()
    } catch (err) {
        error.value = err.message || 'No se pudo eliminar.'
    }
}

async function confirmRestore() {
    restoreDialog.value = false
    try {
        instancia.value = await store.restoreInstancia(route.params.id)
        successTitle.value = 'Instancia recuperada'
        successMessage.value = 'La instancia volvió a estar hábil. Si no había cupo, se deshabilitó la última instancia editada.'
        showSuccess.value = true
    } catch (err) {
        error.value = err.message || 'No se pudo recuperar.'
    }
}

watch(
    editRespuestas,
    () => {
        if (!isEditing.value || suppressAutosave) return
        clearTimeout(autosaveTimer)
        autosaveTimer = setTimeout(() => saveDraft(false), 2000)
    },
    { deep: true },
)

watch(
    () => [route.params.id, route.query.version],
    () => {
        if (!isEditing.value) load()
    },
)

onMounted(load)
onUnmounted(() => clearTimeout(autosaveTimer))
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
