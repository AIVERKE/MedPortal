<!-- src/components/configuracion/ListaFeriados.vue -->
<template>
  <div>
    <v-card>
      <v-card-title>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="nuevoFeriado">
          Nuevo Feriado
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="feriados"
        :search="search"
        class="elevation-1"
      >
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

    <!-- Modal: el padre controla el show y pasa el feriado seleccionado -->
    <FeriadoModal
      :model-value="showModal"
      @update:model-value="val => showModal = val"
      :feriado="selectedFeriado"
      @save="onSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFeriadosStore } from '@/stores/feriados'
import FeriadoModal from '@/components/configuracion/FeriadoModal.vue'


const search = ref('')
const showModal = ref(false)
const selectedFeriado = ref(null)

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Descripcion', key: 'descripcion' },
  { title: 'Dia', key: 'dia' },
  { title: 'Mes', key: 'mes' },
  { title: 'Año', key: 'anio' },
  { title: 'Acciones', key: 'actions', sortable: false }
]

const store = useFeriadosStore()
const feriados = computed(() => store.feriados)
onMounted(() => {
  store.fetchFeriados()
})

/* acciones */
const nuevoFeriado = () => {
  selectedFeriado.value = null
  showModal.value = true
}

const editItem = (item) => {
  selectedFeriado.value = { ...item } // pasar copia
  showModal.value = true
}

const deleteItem = async (id) => {
  if (!confirm('¿Eliminar este feriado?')) return
  await store.deleteFeriado(id)
}


/* guarda (create/update) */
const onSave = async (payload) => {
  if (payload.id) {
    await store.updateFeriado(payload)
  } else {
    await store.addFeriado(payload)
  }

  selectedFeriado.value = null
  showModal.value = false
}

</script>
