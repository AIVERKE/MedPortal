<template>
    <v-card class="rounded-xl">
        <v-card-title class="d-flex flex-wrap align-center ga-3">
            <v-text-field v-model="search" label="Buscar facultad" prepend-inner-icon="mdi-magnify" single-line
                hide-details variant="outlined" density="compact" class="flex-grow-1" />
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Nueva facultad</v-btn>
        </v-card-title>

        <v-data-table :headers="headers" :items="store.facultades" :search="search" :loading="store.loading">
            <template #item.activo="{ value }">
                <v-chip :color="value ? 'success' : 'error'" variant="tonal" size="small">
                    {{ value ? 'Activo' : 'Inactivo' }}
                </v-chip>
            </template>
            <template #item.actions="{ item }">
                <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(item)" />
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDelete(item)" />
            </template>
        </v-data-table>

        <FacultadModal v-model="showModal" :facultad="selected" :loading="store.loading" @save="save" />
        <ModalConfirmación v-model="showDelete" title="Eliminar facultad"
            :message="`¿Eliminar la facultad ${selected?.nombre || ''}?`" confirm-text="Eliminar" cancel-text="Cancelar"
            type="warning" @confirm="remove" @cancel="showDelete = false" />
        <ModalMensaje v-model="showError" title="Error" :message="store.error || 'Ocurrió un error'" type="error"
            button-text="Entendido" @confirm="showError = false" />
    </v-card>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useFacultadesStore } from '@/stores/facultades'
import FacultadModal from './FacultadModal.vue'
import ModalConfirmación from '@/components/common/ModalConfirmación.vue'
import ModalMensaje from '@/components/common/ModalMensaje.vue'

const store = useFacultadesStore()
const search = ref('')
const showModal = ref(false)
const showDelete = ref(false)
const showError = ref(false)
const selected = ref(null)

const headers = [
    { title: 'ID', key: 'id' },
    { title: 'Nombre', key: 'nombre' },
    { title: 'Estado', key: 'activo' },
    { title: 'Acciones', key: 'actions', sortable: false }
]

watch(() => store.error, (val) => {
    if (val) showError.value = true
})

onMounted(() => {
    store.fetchFacultades(true)
})

const openCreate = () => {
    selected.value = null
    showModal.value = true
}

const openEdit = (item) => {
    selected.value = { ...item }
    showModal.value = true
}

const confirmDelete = (item) => {
    selected.value = item
    showDelete.value = true
}

const save = async (payload) => {
    let ok = false
    if (selected.value?.id) {
        ok = await store.updateFacultad(selected.value.id, payload)
    } else {
        ok = await store.addFacultad(payload)
    }
    if (ok) showModal.value = false
}

const remove = async () => {
    if (!selected.value?.id) return
    const ok = await store.deleteFacultad(selected.value.id)
    if (ok) showDelete.value = false
}
</script>
