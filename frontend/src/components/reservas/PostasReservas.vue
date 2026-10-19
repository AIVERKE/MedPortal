<!-- src/components/Reservas/PostasReservas.vue -->
<template>
  <div>
    <v-card class="pa-4">

      <!-- Volver -->
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        @click="$emit('volver')"
      >
        Cambiar especialidad
      </v-btn>

      <h2 class="mt-2 mb-4">Seleccione un consultorio para: <i>{{ especialidad.nombre }}</i></h2>

      <!-- Buscador -->
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Buscar consultorio o posta"
        single-line
        hide-details
        class="mb-6"
      />

      <!-- POSTAS -->
      <div
        v-for="posta in postasFiltradas"
        :key="posta.idPosta"
        class="mb-8"
      >

        <!-- =========================
             DATOS POSTA (PADRE)
        ========================== -->
        <v-card elevation="2" rounded="xl" class="pa-4 mb-4">

          <!-- Nombre -->
          <div class="text-h6 font-weight-bold mb-3">
            {{ posta.nombre }}
          </div>

          <!-- Dirección -->
          <div class="d-flex align-center text-body-2 mb-1">
            <v-icon icon="mdi-map-marker-outline" size="18" class="me-2" />
            {{ posta.direccion || 'Sin dirección' }}
          </div>

          <!-- Teléfono -->
          <div class="d-flex align-center text-body-2 mb-2">
            <v-icon icon="mdi-phone-outline" size="18" class="me-2" />
            {{ posta.telefono || 'Sin teléfono' }}
          </div>

          <!-- Horario Mañana -->
          <div class="d-flex align-center text-caption mb-1">
            <v-icon icon="mdi-weather-sunset-up" size="16" class="me-2" />
            Mañana:
            {{ posta.horarioAtencionMananaInicio }} -
            {{ posta.horarioAtencionMananaFin }}
          </div>

          <!-- Horario Tarde -->
          <div class="d-flex align-center text-caption mb-4">
            <v-icon icon="mdi-weather-sunset-down" size="16" class="me-2" />
            Tarde:
            {{ posta.horarioAtencionTardeInicio }} -
            {{ posta.horarioAtencionTardeFin }}
          </div>

          <!-- =========================
               CONSULTORIOS (HIJOS)
          ========================== -->
          <div class="text-subtitle-1 mb-3 font-weight-medium">
            Consultorios:
          </div>

          <v-row>
            <v-col
              v-for="consultorio in consultoriosFiltrados(posta)"
              :key="consultorio.idConsultorio"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <v-card
                class="consultorio-card"
                elevation="3"
                rounded="xl"
              >
                <v-card-title class="card-header d-flex align-center">
                  <v-icon icon="mdi-door" size="18" class="me-2" />
                  {{ consultorio.numeroConsultorio }}
                </v-card-title>

                <v-card-text class="card-content">

                  <!-- Piso -->
                  <div class="d-flex align-center text-body-2 mb-2">
                    <v-icon icon="mdi-office-building-outline" size="18" class="me-2" />
                    Piso: {{ consultorio.pisoUbicacion }}
                  </div>

                  <!-- Fecha habilitación -->
                  <div class="d-flex align-center text-caption">
                    <v-icon icon="mdi-calendar-check-outline" size="16" class="me-2" />
                    Habilitado desde:
                    {{ consultorio.fechaHabilitacion }}
                  </div>

                </v-card-text>

                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-check-circle-outline"
                    @click="$emit('select', { posta, consultorio })"
                  >
                    Seleccionar
                  </v-btn>
                </v-card-actions>

              </v-card>
            </v-col>
          </v-row>

        </v-card>

      </div>

    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePostasStore } from '@/stores/postas'

/* =========================
   PROPS
========================= */
const props = defineProps({
    especialidad: {
        type: Object,
        required: true
    }
})

defineEmits(['select', 'volver'])

/* =========================
   STORE
========================= */
const store = usePostasStore()
const search = ref('')

const postas = computed(() => store.postas)

/* =========================
   FILTRAR POSTAS ACTIVAS
========================= */
const postasFiltradas = computed(() => {
    return postas.value.filter(p =>
        p.activo === true
    )
})

/* =========================
   FILTRAR CONSULTORIOS
========================= */
const consultoriosFiltrados = (posta) => {
    if (!posta.consultorios) return []

    return posta.consultorios.filter(c =>
        c.activo === true &&
        (
            c.numeroConsultorio.toLowerCase().includes(search.value.toLowerCase()) ||
            posta.nombre.toLowerCase().includes(search.value.toLowerCase())
        )
    )
}

/* =========================
   CARGAR POSTAS POR ESPECIALIDAD
========================= */
onMounted(async () => {
    await store.fetchPostasPorEspecialidad(props.especialidad.id)
})
</script>


<style scoped>

.posta-card {
  height: 280px; 
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.posta-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.consultorio-card {
  height: 200px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.consultorio-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.card-header {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 1),
    rgba(99, 102, 241, 0.1)
  );
  color: white;
  font-weight: 500;
}

.card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}


.descripcion {
  display: -webkit-box;
  -webkit-line-clamp: 2; 
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.descripcion.expanded {
  display: block;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-right: 4px;
}

.expand-btn-container {
  margin-top: 4px;
  flex-shrink: 0;
}

</style>

