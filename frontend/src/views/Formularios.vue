<template>
    <div class="max-width-form mx-auto pb-8">
        <header class="d-flex align-end justify-space-between flex-wrap ga-4 mb-8">
            <div>
                <h3 class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">
                    Formularios
                </h3>
                <p class="text-subtitle-2 font-weight-medium text-grey-darken-1 mb-0">
                    Plantillas de historial clínico y formularios llenables
                </p>
            </div>
            <v-btn
                color="primary"
                rounded="lg"
                variant="flat"
                prepend-icon="mdi-plus"
                class="text-none font-weight-bold"
                :loading="creating"
                @click="crearFormulario"
            >
                Nuevo formulario
            </v-btn>
        </header>

        <v-card
            class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card position-relative"
            border
        >
            <div class="section-badge primary"></div>
            <v-card-text class="pa-4">
                <div class="d-flex flex-wrap align-center ga-3">
                    <v-text-field
                        v-model="search"
                        placeholder="Buscar formularios..."
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        rounded="lg"
                        class="search-field"
                        style="max-width: 320px; min-width: 200px; flex: 1;"
                    />

                    <div class="d-flex flex-wrap ga-2 flex-grow-1">
                        <v-chip
                            v-for="cat in categorias"
                            :key="cat.value"
                            :color="filtroActivo === cat.value ? 'primary' : undefined"
                            :variant="filtroActivo === cat.value ? 'flat' : 'tonal'"
                            class="font-weight-bold cursor-pointer"
                            @click="filtroActivo = cat.value"
                        >
                            {{ cat.label }}
                        </v-chip>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <div v-if="store.loading && !store.formularios.length" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="40" />
        </div>

        <v-alert
            v-else-if="store.error && !store.formularios.length"
            type="error"
            variant="tonal"
            class="mb-4"
        >
            {{ store.error }}
        </v-alert>

        <v-row v-else>
            <v-col
                v-for="form in formulariosFiltrados"
                :key="form.id"
                cols="12"
                sm="6"
                lg="4"
            >
                <v-card
                    class="fill-height rounded-xl overflow-hidden shadow-premium premium-card position-relative form-card cursor-pointer"
                    border
                    @click="openFormulario(form.id)"
                >
                    <div class="section-badge" :class="form.badge"></div>
                    <v-card-text class="d-flex flex-column pa-6 fill-height">
                        <div class="d-flex justify-space-between align-start mb-4">
                            <v-avatar :color="form.avatarColor" size="48" rounded="lg">
                                <v-icon :color="form.iconColor" size="26">{{ form.icon }}</v-icon>
                            </v-avatar>
                            <div class="d-flex flex-column align-end ga-1">
                                <v-chip
                                    :color="form.statusColor"
                                    size="small"
                                    variant="tonal"
                                    class="font-weight-black text-uppercase"
                                    style="letter-spacing: 0.05em;"
                                >
                                    {{ form.status }}
                                </v-chip>
                                <span
                                    v-if="form.hasUnpublishedChanges"
                                    class="text-caption text-warning font-weight-medium"
                                >
                                    Cambios sin publicar
                                </span>
                            </div>
                        </div>

                        <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-2 form-title">
                            {{ form.title }}
                        </h4>

                        <p
                            class="text-body-2 mt-auto mb-0"
                            :class="form.metaWarning ? 'text-warning font-weight-medium d-flex align-center ga-1' : 'text-grey-darken-1'"
                        >
                            <v-icon v-if="form.metaWarning" size="16" color="warning">mdi-pencil</v-icon>
                            {{ form.meta }}
                            <template v-if="!form.hasUnpublishedChanges && form.estado === 'publicado'">
                                · {{ form.sectionCount }} secciones
                            </template>
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col v-if="formulariosFiltrados.length === 0" cols="12">
                <v-card
                    class="rounded-xl overflow-hidden shadow-premium premium-card position-relative text-center"
                    border
                >
                    <div class="section-badge primary"></div>
                    <v-card-text class="pa-12">
                        <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-file-document-outline</v-icon>
                        <p class="text-body-1 text-grey-darken-1 mb-0">
                            No hay formularios que coincidan con la búsqueda
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFormulariosStore } from '@/stores/formularios'

const router = useRouter()
const store = useFormulariosStore()
const search = ref('')
const filtroActivo = ref('todos')
const creating = ref(false)

const categorias = [
    { value: 'todos', label: 'Todos' },
    { value: 'historial', label: 'Historial clínico' },
    { value: 'encuesta', label: 'Encuesta' },
    { value: 'operativo', label: 'Operativo' },
]

const formulariosFiltrados = computed(() => {
    const q = search.value.trim().toLowerCase()
    return store.formularios.filter((f) => {
        const matchCat = filtroActivo.value === 'todos' || f.categoria === filtroActivo.value
        const matchSearch = !q || (f.title || '').toLowerCase().includes(q)
        return matchCat && matchSearch
    })
})

async function loadFormularios() {
    try {
        await store.fetchAll()
    } catch {
        /* error in store */
    }
}

async function crearFormulario() {
    creating.value = true
    try {
        const form = await store.create()
        router.push(`/formularios/${form.id}`)
    } catch {
        /* error in store */
    } finally {
        creating.value = false
    }
}

function openFormulario(id) {
    router.push(`/formularios/${id}`)
}

onMounted(loadFormularios)

watch(filtroActivo, () => {
    /* local filter is enough; keep list from API */
})
</script>

<style scoped>
.max-width-form {
    max-width: 1200px;
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

.section-badge.success {
    background-color: rgb(var(--v-theme-success));
}

.section-badge.info {
    background-color: rgb(var(--v-theme-info));
}

.section-badge.warning {
    background-color: rgb(var(--v-theme-warning));
}

.form-card {
    transition: transform 0.25s ease;
}

.form-card:hover {
    transform: translateY(-4px);
}

.form-card:hover .form-title {
    color: rgb(var(--v-theme-primary));
}

.form-title {
    transition: color 0.2s ease;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.cursor-pointer {
    cursor: pointer;
}

.fill-height {
    height: 100%;
}
</style>
