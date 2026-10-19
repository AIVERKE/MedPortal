<template>
  <div>
    <h1 class="text-h4 mb-4">Configuración</h1>
    <v-card>
      <v-card-text>
        <h2 class="text-h5 mb-4">Configuración de Horarios</h2>
        <ConfiguracionReservas />
        <h2 class="text-h5 mb-4">Configuración de Feriados</h2>
        <ListaFeriados />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import ConfiguracionReservas from '@/components/configuracion/ConfiguracionReservas.vue'
import ListaFeriados from '@/components/configuracion/ListaFeriados.vue'
</script>