<!-- src/components/especialidades_medicas/ListaEspecialidad.vue -->
<template>
  <div>
    <v-card>
      <v-card-title>
        <v-text-field v-model="search" append-icon="mdi-magnify" label="Buscar" single-line hide-details />
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-plus" @click="nuevaEspecialidad">
          Nueva especialidad
        </v-btn>
      </v-card-title>

      <v-data-table :headers="headers" :items="especialidades" :search="search" class="elevation-1">
        <template v-slot:item.visible="{ value }">
          <v-chip :color="value ? 'success' : 'error'" size="small" variant="tonal">
            {{ value ? 'Pasa por MG' : 'No pasa por MG' }}
          </v-chip>
        </template>

        <template v-slot:item.activo="{ value }">
          <v-chip :color="value ? 'success' : 'error'" size="small" variant="tonal">
            {{ value ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click="editItem(item)">
            mdi-pencil
          </v-icon>
          <v-icon small @click="deleteItem(item.id)">
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <!-- Modal -->
    <EspecialidadModal :model-value="showModal" @update:model-value="val => showModal = val"
      :especialidad="selectedEspecialidad" @save="onSave" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEspecialidadStore } from '@/stores/especialidad'
import EspecialidadModal from '@/components/especialidades_medicas/EspecialidadModal.vue'

const store = useEspecialidadStore()

const search = ref('')
const showModal = ref(false)
const selectedEspecialidad = ref(null)

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Nombre', key: 'nombre' },
  { title: 'Código', key: 'codigo' },
  { title: 'Tiempo promedio (min)', key: 'tiempoCitaPorDefecto' },
  { title: 'Pasa por Medicina General', key: 'visible' },
  { title: 'Activo', key: 'activo' },
  { title: 'Acciones', key: 'actions', sortable: false }
]

const especialidades = computed(() => store.especialidades)

onMounted(() => {
  store.fetchEspecialidades()
})

/* acciones */
const nuevaEspecialidad = () => {
  selectedEspecialidad.value = null
  showModal.value = true
}

const editItem = (item) => {
  selectedEspecialidad.value = { ...item } // copia para evitar mutaciones
  showModal.value = true
}

const deleteItem = async (id) => {
  if (!confirm('¿Eliminar esta especialidad médica?')) return
  await store.deleteEspecialidad(id)
}

/* guarda (create / update) */
const onSave = async (payload) => {
  if (payload.id) {
    await store.updateEspecialidad(payload)
  } else {
    await store.addEspecialidad(payload)
  }

  selectedEspecialidad.value = null
  showModal.value = false
}
</script>
