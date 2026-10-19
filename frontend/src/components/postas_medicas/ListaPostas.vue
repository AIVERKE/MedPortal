<template>
  <v-container fluid>
    <v-card flat class="mb-2">
      <v-card-title class="py-2 d-flex align-center">
        <div class="text-h6">Postas Médicas</div>
        <v-spacer />

        <div style="width: 300px">
          <v-text-field v-model="search" append-inner-icon="mdi-magnify" label="Buscar posta" variant="underlined"
            single-line hide-details density="compact" />
        </div>

        <v-btn color="primary" class="ml-4" prepend-icon="mdi-plus" @click="nuevoPosta">
          Nueva Posta
        </v-btn>
      </v-card-title>
    </v-card>

    <v-row dense>
      <!-- TREEVIEWS LIST -->
      <v-col cols="12" md="5">
        <div class="overflow-y-auto" style="max-height: calc(100vh - 200px)">
          <v-card v-for="posta in filteredPostas" :key="posta.id" flat border rounded class="mb-3">
            <v-treeview v-model:activated="active" v-model:opened="open" :items="getPostaTreeItems(posta)"
              item-title="name" item-value="id" activatable open-on-click rounded density="compact">
              <template #prepend="{ item }">
                <v-icon :icon="item.type === 'posta' ? 'mdi-hospital-building' : 'mdi-door-open'" />
              </template>
              <template #append="{ item }">
                <v-btn v-if="item.type === 'posta'" icon="mdi-information-outline" variant="text" size="x-small"
                  color="primary" @click.stop="verInfoPosta(item.id)" />
              </template>
            </v-treeview>
          </v-card>

          <v-alert v-if="filteredPostas.length === 0" type="info" variant="tonal" class="mt-4">
            No se encontraron postas médicas.
          </v-alert>
        </div>
      </v-col>

      <!-- DETAIL PANEL -->
      <v-col cols="12" md="7">
        <v-card class="pa-6 d-flex flex-column overflow-y-auto" height="100%" max-height="calc(100vh - 120px)" rounded
          flat border>
          <template v-if="!selected">
            <div class="d-flex flex-column align-center justify-center fill-height py-12">
              <v-icon icon="mdi-select-search" size="64" color="grey-lighten-1" class="mb-4" />
              <div class="text-h6 text-medium-emphasis">
                Selecciona una posta o consultorio
              </div>
              <div class="text-body-2 text-disabled">
                Explora el árbol de la izquierda para ver los detalles
              </div>
            </div>
          </template>

          <template v-else>
            <!-- INFO CONSULTORIO (Si aplica) -->
            <div v-if="selected.type === 'consultorio'" class="mb-8">
              <div class="d-flex justify-space-between align-center mb-4">
                <div class="text-h5 primary--text">
                  <v-icon icon="mdi-doctor" class="mr-2" color="primary" />
                  Consultorio {{ selected.consultorio.numeroConsultorio }}
                </div>
                <v-chip :color="selected.consultorio.activo ? 'success' : 'grey'" variant="flat">
                  {{ selected.consultorio.activo ? 'Habilitado' : 'No habilitado' }}
                </v-chip>
              </div>

              <v-row dense>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-disabled">Especialidad</div>
                  <div class="text-body-1">{{ selected.consultorio.especialidad?.nombre || 'General' }}</div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-disabled">Piso / Ubicación</div>
                  <div class="text-body-1">{{ selected.consultorio.pisoUbicacion || '—' }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="text-caption text-disabled">Descripción de Especialidad</div>
                  <div class="text-body-2">{{ selected.consultorio.especialidad?.descripcion || 'Sin descripción' }}
                  </div>
                </v-col>
              </v-row>

              <!-- BOTONES CONSULTORIO -->
              <div class="mt-4 d-flex gap-2">
                <v-btn color="primary" variant="outlined" prepend-icon="mdi-pencil" size="small"
                  @click="editConsultorio(selected.consultorio)">
                  Editar Consultorio
                </v-btn>
                <!-- <v-btn color="secondary" variant="outlined" prepend-icon="mdi-calendar-clock" size="small">
                  Ver Horarios
                </v-btn> -->
                <v-btn color="error" variant="outlined" prepend-icon="mdi-delete" size="small"
                  @click="eliminarConsultorio(selected.consultorio.id)">
                  Deshabilitar
                </v-btn>
              </div>

              <v-divider class="my-6" />
            </div>

            <!-- INFO POSTA -->
            <div>
              <div class="d-flex justify-space-between align-center mb-4">
                <div :class="selected.type === 'posta' ? 'text-h5' : 'text-h6'" class="d-flex align-center">
                  <v-icon icon="mdi-hospital-building" class="mr-2" color="primary" />
                  {{ selected.posta.nombre }}
                </div>
                <v-chip v-if="selected.type === 'posta'" :color="selected.posta.activo ? 'success' : 'error'"
                  variant="flat">
                  {{ selected.posta.activo ? 'Activa' : 'Inactiva' }}
                </v-chip>
              </div>

              <v-row dense>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-disabled">Código</div>
                  <div class="text-body-1">{{ selected.posta.codigo || '—' }}</div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-disabled">Teléfono</div>
                  <div class="text-body-1">{{ selected.posta.telefono || '—' }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="text-caption text-disabled">Dirección</div>
                  <div class="text-body-1">{{ selected.posta.direccion }}</div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-disabled">Horario Mañana</div>
                  <div class="text-body-1">
                    {{ selected.posta.horarioAtencionMananaInicio }} - {{ selected.posta.horarioAtencionMananaFin }}
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-disabled">Horario Tarde</div>
                  <div class="text-body-1">
                    {{ selected.posta.horarioAtencionTardeInicio }} - {{ selected.posta.horarioAtencionTardeFin }}
                  </div>
                </v-col>
              </v-row>

              <!-- BOTONES POSTA (MOCKUPS) -->
              <div class="mt-4 d-flex gap-2">
                <v-btn color="primary" variant="flat" prepend-icon="mdi-pencil" @click="editPosta(selected.posta)">
                  Editar Posta
                </v-btn>
                <v-btn color="success" variant="flat" prepend-icon="mdi-plus" @click="nuevoConsultorio(selected.posta)">
                  Agregar Consultorio
                </v-btn>
                <v-btn color="error" variant="tonal" prepend-icon="mdi-delete"
                  @click="eliminarPosta(selected.posta.id)">
                  Eliminar Posta
                </v-btn>
                <!-- <v-btn color="info" variant="text" prepend-icon="mdi-map-marker">
                  Ver en Mapa
                </v-btn> -->
              </div>
            </div>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <PostasModal :model-value="showModal" @update:model-value="val => showModal = val" :posta="selectedPosta"
      :save-handler="onSave" />

    <ConsultorioModal :model-value="showConsModal" @update:model-value="val => showConsModal = val"
      :consultorio="selectedCons" :posta-id="targetPostaId" :posta-nombre="targetPostaNombre"
      :save-handler="onSaveConsultorio" />

    <ModalConfirmacion v-model="showConfirm" :title="confirmTitle" :message="confirmMessage" type="error"
      @confirm="executeConfirm" @cancel="showConfirm = false" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConsultorioStore } from '@/stores/consultorios'
import { usePostasStore } from '@/stores/postas'
import PostasModal from '@/components/postas_medicas/PostaModal.vue'
import ConsultorioModal from '@/components/postas_medicas/ConsultorioModal.vue'
import ModalConfirmacion from '@/components/common/ModalConfirmación.vue'

const store = useConsultorioStore()
const postasStore = usePostasStore()

const search = ref('')
const showModal = ref(false)
const selectedPosta = ref(null)

const showConsModal = ref(false)
const selectedCons = ref(null)
const targetPostaId = ref(null)
const targetPostaNombre = ref('')

const active = ref([])
const open = ref([])
const showPostaInfoId = ref(null)

// Confirmación refs
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmPendingAction = ref(null)

// Combinar las postas con sus consultorios correspondientes
const groupedPostas = computed(() => {
  const allPostas = postasStore.postas || []
  const allConsultorios = store.consultorios || []

  // Mapa para agrupar rápidamente por ID de posta
  const postasMap = new Map()

  // Inicializar con todas las postas conocidas
  allPostas.forEach(p => {
    postasMap.set(p.id, {
      ...p,
      consultorios: []
    })
  })

  // Distribuir los consultorios en sus respectivas postas
  allConsultorios.forEach(c => {
    if (!c.posta) return
    const pId = c.posta.id

    if (!postasMap.has(pId)) {
      // Si el consultorio tiene una posta que no está en la lista general (cosa rara, pero posible)
      postasMap.set(pId, {
        ...c.posta,
        consultorios: []
      })
    }
    postasMap.get(pId).consultorios.push(c)
  })

  return Array.from(postasMap.values())
})

const filteredPostas = computed(() => {
  const postas = groupedPostas.value
  if (!search.value) return postas
  const s = search.value.toLowerCase()
  return postas.filter(p =>
    p.nombre?.toLowerCase().includes(s) ||
    p.consultorios?.some(c => c.especialidad?.nombre?.toLowerCase().includes(s))
  )
})

const getPostaTreeItems = (posta) => {
  return [
    {
      id: `posta-${posta.id}`,
      name: posta.nombre,
      type: 'posta',
      data: posta,
      children: (posta.consultorios || []).map(c => ({
        id: `cons-${c.id}`,
        name: `Consultorio ${c.numeroConsultorio} - ${c.especialidad?.nombre || 'Sin especialidad'}`,
        type: 'consultorio',
        data: c,
        parentPosta: posta
      }))
    }
  ]
}

const selected = computed(() => {
  if (!active.value.length) {
    showPostaInfoId.value = null
    return null
  }
  const selectedId = active.value[0]

  // Buscar el consultorio en las postas
  for (const p of groupedPostas.value) {
    const foundCons = (p.consultorios || []).find(c => `cons-${c.id}` === selectedId)
    if (foundCons) {
      // Si seleccionamos un consultorio, reseteamos el flag de info de posta explícita
      if (showPostaInfoId.value) showPostaInfoId.value = null
      return { type: 'consultorio', posta: p, consultorio: foundCons }
    }

    // Si es una posta Y se pidió ver info explícitamente a través del ícono
    if (`posta-${p.id}` === selectedId) {
      if (showPostaInfoId.value === selectedId) {
        return { type: 'posta', posta: p, consultorio: null }
      }
      return null // Clic normal en posta: no mostrar nada (requerimiento previo)
    }
  }
  return null
})

onMounted(async () => {
  // Cargar ambos datos en paralelo
  await Promise.all([
    postasStore.fetchPostas(),
    store.fetchConsultorios()
  ])
})

const nuevoPosta = () => {
  selectedPosta.value = null
  showModal.value = true
}

const editPosta = (item) => {
  selectedPosta.value = { ...item }
  showModal.value = true
}

const verInfoPosta = (id) => {
  showPostaInfoId.value = id
  active.value = [id]
}

const eliminarPosta = (id) => {
  confirmTitle.value = 'Eliminar Posta'
  confirmMessage.value = '¿Estás seguro de que deseas eliminar esta posta médica? Esta acción no se puede deshacer.'
  confirmPendingAction.value = async () => {
    await postasStore.deletePosta(id)
    active.value = []
  }
  showConfirm.value = true
}

const executeConfirm = async () => {
  if (confirmPendingAction.value) {
    await confirmPendingAction.value()
  }
  showConfirm.value = false
  confirmPendingAction.value = null
}

const editConsultorio = (item) => {
  selectedCons.value = { ...item }
  showConsModal.value = true
}

const eliminarConsultorio = (id) => {
  confirmTitle.value = 'Eliminar Consultorio'
  confirmMessage.value = '¿Estás seguro de que deseas eliminar este consultorio? Esta acción no se puede deshacer.'
  confirmPendingAction.value = async () => {
    await store.deleteConsultorio(id)
    active.value = []
  }
  showConfirm.value = true
}

const onSave = async (payload) => {
  if (payload.id) await postasStore.updatePosta(payload)
  else await postasStore.addPosta(payload)
  selectedPosta.value = null
}

const nuevoConsultorio = (posta) => {
  targetPostaId.value = posta.id
  targetPostaNombre.value = posta.nombre
  selectedCons.value = null
  showConsModal.value = true
}

const onSaveConsultorio = async (payload) => {
  let success
  if (payload.id) {
    success = await store.updateConsultorio(payload)
  } else {
    payload.idPosta = targetPostaId.value
    success = await store.addConsultorio(payload)
  }

  if (!success) {
    throw new Error(store.error || 'Error al guardar el consultorio')
  }

  showConsModal.value = false
  selectedCons.value = null
}
</script>