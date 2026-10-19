<template>
    <div class="max-width-form mx-auto pb-8">
        <header class="mb-8">
            <h3 class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">
                Llenar formularios
            </h3>
            <p class="text-subtitle-2 font-weight-medium text-grey-darken-1 mb-0">
                Formularios publicados disponibles según tus permisos
            </p>
        </header>

        <v-card class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card position-relative" border>
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
                        style="max-width: 320px; min-width: 200px; flex: 1;"
                    />
                    <div class="d-flex flex-wrap ga-2">
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

        <div v-if="store.loading && !store.paraLlenar.length" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="40" />
        </div>

        <v-alert v-else-if="store.error && !store.paraLlenar.length" type="error" variant="tonal" class="mb-4">
            {{ store.error }}
        </v-alert>

        <v-alert
            v-else-if="!formulariosFiltrados.length"
            type="info"
            variant="tonal"
        >
            No hay formularios publicados disponibles para tu rol.
        </v-alert>

        <v-row v-else>
            <v-col
                v-for="form in formulariosFiltrados"
                :key="form.id"
                cols="12"
                sm="6"
                lg="4"
            >
                <v-card class="rounded-xl h-100 shadow-premium" border>
                    <v-card-text class="pa-5">
                        <div class="d-flex align-start ga-3 mb-3">
                            <v-avatar :color="form.avatarColor" rounded="lg" size="44">
                                <v-icon :icon="form.icon" :color="form.iconColor" />
                            </v-avatar>
                            <div class="min-width-0 flex-grow-1">
                                <p class="text-caption font-weight-bold text-uppercase text-grey-darken-1 mb-1">
                                    {{ form.categoriaLabel }}
                                </p>
                                <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1 text-truncate">
                                    {{ form.titulo }}
                                </h4>
                                <p class="text-caption text-grey-darken-1 mb-0 line-clamp-2">
                                    {{ form.descripcion || 'Sin descripción' }}
                                </p>
                            </div>
                        </div>
                        <div class="d-flex flex-wrap ga-2 mb-4">
                            <v-chip
                                v-if="form.visibilidadInstancias === 'privado'"
                                size="small"
                                color="warning"
                                variant="tonal"
                            >
                                Privado
                            </v-chip>
                            <v-chip size="small" variant="tonal">
                                {{ form.sectionCount }} secciones
                            </v-chip>
                        </div>
                        <v-btn
                            v-if="form.canFill"
                            color="primary"
                            variant="flat"
                            rounded="lg"
                            class="text-none font-weight-bold"
                            block
                            :to="`/llenar-formularios/${form.id}`"
                        >
                            Llenar
                        </v-btn>
                        <v-btn
                            v-else
                            color="primary"
                            variant="tonal"
                            rounded="lg"
                            class="text-none font-weight-bold"
                            block
                            disabled
                        >
                            Solo lectura (sin permiso Llenar)
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useFormulariosStore } from '@/stores/formularios'

const store = useFormulariosStore()
const search = ref('')
const filtroActivo = ref('todos')

const categorias = [
    { value: 'todos', label: 'Todos' },
    { value: 'historial', label: 'Historial clínico' },
    { value: 'encuesta', label: 'Encuesta' },
    { value: 'operativo', label: 'Operativo' },
]

const formulariosFiltrados = computed(() => {
    let list = store.paraLlenar
    if (filtroActivo.value !== 'todos') {
        list = list.filter((f) => f.categoria === filtroActivo.value)
    }
    const q = search.value.trim().toLowerCase()
    if (q) {
        list = list.filter(
            (f) =>
                f.titulo?.toLowerCase().includes(q) ||
                f.descripcion?.toLowerCase().includes(q),
        )
    }
    return list
})

async function load() {
    await store.fetchParaLlenar()
}

onMounted(load)
watch(filtroActivo, () => {
    /* local filter only */
})
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
