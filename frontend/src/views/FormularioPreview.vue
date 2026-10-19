<template>
    <div class="preview-shell">
        <header class="preview-header d-flex align-center justify-space-between flex-wrap ga-3 px-4 px-md-6 py-3">
            <div class="d-flex align-center ga-3 min-width-0">
                <v-btn
                    icon="mdi-arrow-left"
                    variant="text"
                    color="grey-darken-1"
                    rounded="lg"
                    :to="`/formularios/${route.params.id}`"
                />
                <div class="min-width-0">
                    <p class="text-caption font-weight-bold text-uppercase text-grey-darken-1 mb-0"
                        style="letter-spacing: 0.06em;">
                        Vista previa — {{ versionLabel }}
                    </p>
                    <h1 class="text-h6 font-weight-bold text-grey-darken-4 text-truncate mb-0">
                        {{ preview?.titulo || 'Formulario' }}
                    </h1>
                </div>
            </div>
            <div class="d-flex align-center ga-2">
                <v-btn-toggle
                    v-model="version"
                    mandatory
                    density="comfortable"
                    color="primary"
                    rounded="lg"
                    divided
                >
                    <v-btn value="draft" class="text-none" size="small">Borrador</v-btn>
                    <v-btn value="published" class="text-none" size="small">Publicada</v-btn>
                </v-btn-toggle>
                <v-btn
                    color="primary"
                    variant="tonal"
                    rounded="lg"
                    class="text-none font-weight-bold"
                    :to="`/formularios/${route.params.id}`"
                >
                    Volver al editor
                </v-btn>
            </div>
        </header>

        <div class="preview-body pa-4 pa-md-8">
            <div v-if="loading" class="text-center py-12">
                <v-progress-circular indeterminate color="primary" size="40" />
            </div>

            <v-alert
                v-else-if="error"
                type="warning"
                variant="tonal"
                class="mx-auto"
                style="max-width: 720px;"
            >
                {{ error }}
                <template #append>
                    <v-btn
                        v-if="version === 'published'"
                        variant="text"
                        class="text-none"
                        @click="version = 'draft'"
                    >
                        Ver borrador
                    </v-btn>
                </template>
            </v-alert>

            <div v-else-if="preview" class="preview-canvas mx-auto">
                <v-card class="mb-6 rounded-xl shadow-premium position-relative overflow-hidden" border>
                    <div class="section-badge primary"></div>
                    <v-card-text class="pa-6 pa-md-8">
                        <h2 class="text-h4 font-weight-black text-grey-darken-4 mb-2">
                            {{ preview.titulo }}
                        </h2>
                        <p v-if="preview.descripcion" class="text-body-1 text-grey-darken-1 mb-0">
                            {{ preview.descripcion }}
                        </p>
                    </v-card-text>
                </v-card>

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
                                :type="field.type === 'number' ? 'number' : 'text'"
                                :placeholder="field.type === 'number' ? 'Valor numérico' : 'Tu respuesta'"
                                variant="outlined"
                                density="comfortable"
                                rounded="lg"
                                hide-details
                                disabled
                            />

                            <v-textarea
                                v-else-if="field.type === 'long_text'"
                                placeholder="Tu respuesta"
                                variant="outlined"
                                density="comfortable"
                                rounded="lg"
                                rows="3"
                                hide-details
                                disabled
                            />

                            <v-text-field
                                v-else-if="field.type === 'date'"
                                type="date"
                                variant="outlined"
                                density="comfortable"
                                rounded="lg"
                                hide-details
                                disabled
                            />

                            <v-radio-group
                                v-else-if="field.type === 'single_choice'"
                                hide-details
                                disabled
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
                                    :label="option || `Opción ${idx + 1}`"
                                    hide-details
                                    density="compact"
                                    color="primary"
                                    disabled
                                    class="mb-1"
                                />
                            </div>

                            <p v-if="field.helpText" class="text-caption text-grey-darken-1 mt-2 mb-0">
                                {{ field.helpText }}
                            </p>
                        </div>
                    </v-card-text>
                </v-card>

                <v-alert
                    v-if="!sections.length"
                    type="info"
                    variant="tonal"
                    class="text-caption"
                >
                    Esta versión aún no tiene secciones ni campos.
                </v-alert>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormulariosStore } from '@/stores/formularios'

const route = useRoute()
const router = useRouter()
const store = useFormulariosStore()

const preview = ref(null)
const loading = ref(false)
const error = ref(null)

const version = computed({
    get: () => (route.query.version === 'published' ? 'published' : 'draft'),
    set: (value) => {
        router.replace({
            path: route.path,
            query: { ...route.query, version: value },
        })
    },
})

const versionLabel = computed(() =>
    version.value === 'published' ? 'versión publicada' : 'borrador actual',
)

const sections = computed(() => preview.value?.definicion?.sections ?? [])

async function loadPreview() {
    loading.value = true
    error.value = null
    preview.value = null
    try {
        preview.value = await store.preview(route.params.id, version.value)
    } catch (err) {
        error.value = err.message || 'No se pudo cargar la vista previa.'
    } finally {
        loading.value = false
    }
}

watch(
    () => [route.params.id, route.query.version],
    () => loadPreview(),
    { immediate: true },
)
</script>

<style scoped>
.preview-shell {
    margin: -24px;
    min-height: calc(100vh - 75px - 48px);
    background: #f1f5f9;
    display: flex;
    flex-direction: column;
}

.preview-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 5;
}

.preview-body {
    flex: 1;
}

.preview-canvas {
    max-width: 720px;
}

.shadow-premium {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12) !important;
}

.section-badge {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    border-radius: 24px 24px 0 0;
    background-color: rgb(var(--v-theme-primary));
}

.min-width-0 {
    min-width: 0;
}
</style>
