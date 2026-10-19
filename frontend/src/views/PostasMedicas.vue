<template>
    <div>
        <h1 class="text-h4 mb-4">Postas Medicas</h1>
        <v-card>
            <v-card-text>
                <h2 class="text-h5 mb-4">Lista de Postas Medicas</h2>

                <ListaPostas />
            </v-card-text>
        </v-card>
    </div>
</template>
<script setup>
import ListaPostas from '@/components/postas_medicas/ListaPostas.vue'
</script>