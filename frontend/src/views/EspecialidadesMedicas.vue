<template>
    <div>
        <h1 class="text-h4 mb-4">Especialidades Medicas</h1>
        <v-card>
            <v-card-text>
                <h2 class="text-h5 mb-4">Lista de Especialidades Medicas</h2>

                <ListaEspecialidad />
            </v-card-text>
        </v-card>
    </div>
</template>
<script setup>
import ListaEspecialidad from '@/components/especialidades_medicas/ListaEspecialidad.vue'
</script>
