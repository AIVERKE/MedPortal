<template>
  <v-container fluid>
    <v-card flat class="mb-2">
      <v-card-title class="py-2 d-flex align-center">
        <div class="text-h6">Consultorios - {{ postaNombre }}</div>
        <v-spacer></v-spacer>

        <div style="width: 300px">
          <v-text-field v-model="search" append-inner-icon="mdi-magnify" label="Buscar consultorio" variant="underlined"
            single-line hide-details density="compact" />
        </div>

        <v-btn color="primary" class="ml-4" prepend-icon="mdi-plus" @click="nuevoConsultorio">
          Nuevo
        </v-btn>
      </v-card-title>
    </v-card>

    <v-row dense>
      <!-- TREEVIEW -->
      <v-col cols="12" md="5">
        <v-treeview v-model:activated="active" v-model:opened="open" :items="treeItems" item-title="name"
          item-value="id" activatable open-on-click rounded density="compact" border>
          <template #prepend="{ item }">
            <v-icon icon="mdi-door"></v-icon>
          </template>
        </v-treeview>
      </v-col>

      <!-- DETAIL PANEL -->
      <v-col cols="12" md="7">
        <v-card class="pa-6 d-flex flex-column justify-center" height="100%" rounded flat border>
          <template v-if="!selected">
            <div class="text-subtitle-1 text-medium-emphasis">
              Selecciona un consultorio
            </div>
          </template>

          <template v-else>
            <div class="text-h5 mb-2">{{ selected.numeroConsultorio }}</div>

            <v-chip :color="selected.activo ? 'green' : 'red'" variant="flat" class="mb-4">
              {{ selected.activo ? 'Activo' : 'Inactivo' }}
            </v-chip>

            <v-text-field :model-value="selected.pisoUbicacion" label="Piso" readonly variant="solo" flat hide-details
              class="mb-2" />

            <v-text-field :model-value="selected.fechaHabilitacion" label="Fecha de habilitación" readonly
              variant="solo" flat hide-details class="mb-4" />

            <div>
              <v-btn color="primary" prepend-icon="mdi-pencil" class="mr-2" @click="editItem(selected)">
                Editar
              </v-btn>

              <v-btn color="error" prepend-icon="mdi-delete" @click="deleteItem(selected.id)">
                Eliminar
              </v-btn>
            </div>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <ConsultorioModal :model-value="showModal" @update:model-value="val => showModal = val"
      :consultorio="selectedConsultorio" :posta-id="postaId" :save-handler="onSave" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConsultorioStore } from '@/stores/consultorios'
import ConsultorioModal from '@/components/postas_medicas/ConsultorioModal.vue'

const props = defineProps({
  postaId: {
    type: [Number, String],
    required: true
  },
  postaNombre: {
    type: String,
    required: true
  }
})

const store = useConsultorioStore()

const search = ref('')
const showModal = ref(false)
const selectedConsultorio = ref(null)

const active = ref([])
const open = ref(['consultorios'])

onMounted(async () => {
  await store.fetchConsultorios()
})

/* FILTRO */
const filteredConsultorios = computed(() =>
  (store.consultorios || []).filter(c =>
    (Number(c.idPosta) === Number(props.postaId) || Number(c.posta?.id) === Number(props.postaId)) &&
    c.numeroConsultorio.toLowerCase().includes(search.value.toLowerCase())
  )
)

/* TREE STRUCTURE */
const treeItems = computed(() => [
  {
    id: 'consultorios',
    name: 'Consultorios',
    children: filteredConsultorios.value.map(c => ({
      id: c.id,
      name: `${c.numeroConsultorio} - ${c.pisoUbicacion}`
    }))
  }
])

/* SELECTED */
const selected = computed(() => {
  if (!active.value.length) return null
  return store.consultorios.find(c => c.id === active.value[0])
})

/* CRUD Mockups (Connecting to store) */
const nuevoConsultorio = () => {
  selectedConsultorio.value = null
  showModal.value = true
}

const editItem = (item) => {
  selectedConsultorio.value = { ...item }
  showModal.value = true
}

const deleteItem = async (id) => {
  if (!confirm('¿Eliminar este consultorio?')) return
  await store.deleteConsultorio(id)
  active.value = []
}

const onSave = async (payload) => {
  let success
  if (payload.id) {
    success = await store.updateConsultorio(payload)
  } else {
    payload.idPosta = Number(props.postaId)
    success = await store.addConsultorio(payload)
  }

  if (!success) {
    throw new Error(store.error || 'Error al guardar el consultorio')
  }

  selectedConsultorio.value = null
  showModal.value = false
}
</script>
