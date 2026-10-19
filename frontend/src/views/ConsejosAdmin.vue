<template>
    <v-container fluid class="pa-6">
        <!-- Header Section -->
        <v-row class="mb-6" align="center">
            <v-col cols="12" md="8">
                <h1 class="text-h4 font-weight-bold primary--text">
                    <v-icon color="primary" class="mr-2">mdi-lightbulb-on</v-icon>
                    Administrar Consejos del Día
                </h1>
                <p class="text-subtitle-1 text-grey-darken-1"> Gestiona los mensajes diarios de salud y bienestar para
                    los usuarios. </p>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
                <v-btn color="primary" prepend-icon="mdi-plus" size="large" elevation="2" rounded="lg"
                    @click="openCreateDialog">
                    Nuevo Consejo
                </v-btn>
            </v-col>
        </v-row>

        <!-- Data Table Card -->
        <v-card elevation="2" rounded="xl" class="overflow-hidden">
            <v-data-table :headers="headers" :items="consejos" :loading="loading" hover
                no-data-text="No hay consejos registrados" loading-text="Cargando consejos..." class="elevation-0">
                <template v-slot:item.fechaPublicacion="{ item }">
                    {{ formatDate(item.fechaPublicacion) }}
                </template>

                <template v-slot:item.categoria="{ item }">
                    <v-chip :color="getCategoryColor(item.categoria)" size="small" variant="flat"
                        class="font-weight-medium">
                        {{ item.categoria }}
                    </v-chip>
                </template>

                <template v-slot:item.contenido="{ item }">
                    <div class="text-truncate" style="max-width: 300px;">
                        {{ item.contenido }}
                    </div>
                </template>

                <template v-slot:item.actions="{ item }">
                    <div class="d-flex justify-end">
                        <v-tooltip text="Editar" location="top">
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" icon="mdi-pencil" variant="text" color="info" class="mr-2"
                                    @click="editItem(item)"></v-btn>
                            </template>
                        </v-tooltip>

                        <v-tooltip text="Eliminar" location="top">
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" icon="mdi-delete" variant="text" color="error"
                                    @click="confirmDelete(item)"></v-btn>
                            </template>
                        </v-tooltip>
                    </div>
                </template>
            </v-data-table>
        </v-card>

        <!-- Create/Edit Dialog -->
        <v-dialog v-model="dialog" max-width="600px" persistent>
            <v-card rounded="xl" class="pa-4">
                <v-card-title class="d-flex justify-space-between align-center px-0 mb-4">
                    <span class="text-h5 font-weight-bold">
                        {{ isEditing ? 'Editar Consejo' : 'Nuevo Consejo' }}
                    </span>
                    <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
                </v-card-title>

                <v-form ref="form" v-model="valid" @submit.prevent="saveConsejo">
                    <v-row>
                        <v-col cols="12">
                            <v-text-field v-model="editedItem.titulo" label="Título del Consejo" variant="outlined"
                                density="comfortable" :rules="[(v) => !!v || 'El título es requerido']" required
                                prepend-inner-icon="mdi-format-title"></v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-select v-model="editedItem.categoria" :items="categorias" label="Categoría"
                                variant="outlined" density="comfortable"
                                :rules="[(v) => !!v || 'La categoría es requerida']" required
                                prepend-inner-icon="mdi-tag-outline"></v-select>
                        </v-col>

                        <v-col cols="12">
                            <v-textarea v-model="editedItem.contenido" label="Contenido" variant="outlined"
                                density="comfortable" rows="4" :rules="[(v) => !!v || 'El contenido es requerido']"
                                required prepend-inner-icon="mdi-text-subject"></v-textarea>
                        </v-col>

                        <v-col cols="12">
                            <v-text-field v-model="editedItem.fechaPublicacion" label="Fecha de Publicación" type="date"
                                variant="outlined" density="comfortable"
                                :rules="[(v) => !!v || 'La fecha es requerida']" required
                                prepend-inner-icon="mdi-calendar"></v-text-field>
                        </v-col>
                    </v-row>

                    <v-card-actions class="px-0 mt-6">
                        <v-spacer></v-spacer>
                        <v-btn variant="text" color="grey-darken-1" class="px-6" @click="closeDialog">
                            Cancelar
                        </v-btn>
                        <v-btn type="submit" color="primary" variant="flat" class="px-8" :loading="store.loading"
                            :disabled="!valid">
                            {{ isEditing ? 'Actualizar' : 'Crear' }}
                        </v-btn>
                    </v-card-actions>
                </v-form>
            </v-card>
        </v-dialog>

        <!-- Delete Confirmation Dialog -->
        <ModalConfirmación v-model="dialogDelete" title="Eliminar Consejo"
            :message="`¿Estás seguro de que deseas eliminar el consejo '${editedItem.titulo}'? Esta acción no se puede deshacer.`"
            type="error" confirmText="Eliminar" @confirm="deleteItemConfirm" @cancel="closeDelete" />

        <!-- Snackbar for success/error messages -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" elevation="2" :timeout="3000">
            {{ snackbar.text }}
            <template v-slot:actions>
                <v-btn variant="text" @click="snackbar.show = false"> Cerrar </v-btn>
            </template>
            Sn </v-snackbar>
    </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useConsejoDelDiaStore } from '@/stores/consejo_del_dia'
import ModalConfirmación from '@/components/common/ModalConfirmación.vue'

const store = useConsejoDelDiaStore()

// State
const dialog = ref(false)
const dialogDelete = ref(false)
const valid = ref(false)
const form = ref(null)

const headers = [
    { title: 'Fecha', key: 'fechaPublicacion', align: 'start', sortable: true },
    { title: 'Título', key: 'titulo', align: 'start' },
    { title: 'Contenido', key: 'contenido', align: 'start' },
    { title: 'Categoría', key: 'categoria', align: 'center' },
    { title: 'Acciones', key: 'actions', align: 'end', sortable: false },
]

const categorias = ['Nutrición', 'Ejercicio', 'Salud Mental', 'Higiene', 'Prevención', 'General']

const defaultItem = {
    titulo: '',
    contenido: '',
    categoria: 'General',
    fechaPublicacion: new Date().toISOString().substr(0, 10),
}

const editedItem = reactive({ ...defaultItem })
const isEditing = ref(false)
const snackbar = reactive({
    show: false,
    text: '',
    color: 'success',
})

// Getters
const consejos = computed(() => store.consejos)
const loading = computed(() => store.loading)

// Lifecycle
onMounted(async () => {
    await store.fetchAllConsejos()
})

// Methods
const openCreateDialog = () => {
    isEditing.value = false
    Object.assign(editedItem, defaultItem)
    editedItem.fechaPublicacion = new Date().toISOString().substr(0, 10)
    dialog.value = true
}

const editItem = (item) => {
    isEditing.value = true
    Object.assign(editedItem, item)
    dialog.value = true
}

const confirmDelete = (item) => {
    Object.assign(editedItem, item)
    dialogDelete.value = true
}

const closeDialog = () => {
    dialog.value = false
    setTimeout(() => {
        Object.assign(editedItem, defaultItem)
        isEditing.value = false
    }, 300)
}

const closeDelete = () => {
    dialogDelete.value = false
}

const deleteItemConfirm = async () => {
    try {
        await store.deleteConsejo(editedItem.id)
        showSnackbar('Consejo eliminado correctamente', 'success')
        closeDelete()
    } catch (err) {
        showSnackbar('Error al eliminar el consejo', 'error')
    }
}

const saveConsejo = async () => {
    if (!valid.value) return

    const dataToSend = {
        titulo: editedItem.titulo,
        contenido: editedItem.contenido,
        categoria: editedItem.categoria,
        fechaPublicacion: editedItem.fechaPublicacion
    }

    try {
        if (isEditing.value) {
            await store.updateConsejo(editedItem.id, dataToSend)
            showSnackbar('Consejo actualizado correctamente', 'success')
        } else {
            await store.createConsejo(dataToSend)
            showSnackbar('Consejo creado correctamente', 'success')
        }
        closeDialog()
    } catch (err) {
        showSnackbar('Error al guardar el consejo', 'error')
    }
}

const showSnackbar = (text, color) => {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
}

const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

const getCategoryColor = (categoria) => {
    const map = {
        Nutrición: 'green-lighten-1',
        Ejercicio: 'blue-lighten-1',
        'Salud Mental': 'purple-lighten-1',
        Higiene: 'cyan-lighten-1',
        Prevención: 'orange-lighten-1',
        General: 'grey-lighten-1',
    }
    return map[categoria] || 'grey'
}
</script>

<style scoped>
.v-data-table {
    background: transparent !important;
}

:deep(.v-data-table__th) {
    font-weight: 700 !important;
    color: rgba(0, 0, 0, 0.6) !important;
    text-transform: uppercase;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em;
}

:deep(.v-data-table__td) {
    font-size: 0.95rem !important;
}

.primary--text {
    color: var(--v-theme-primary);
}
</style>
