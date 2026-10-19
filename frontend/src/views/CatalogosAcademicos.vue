<template>
    <div>
        <h1 class="text-h4 mb-4">Catálogos Académicos</h1>
        <v-row>
            <v-col cols="12">
                <v-card class="mb-4">
                    <v-card-text>
                        <h2 class="text-h6 mb-4">Gestión de Facultades</h2>
                        <ListaFacultades />
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12">
                <v-card>
                    <v-card-text>
                        <h2 class="text-h6 mb-4">Gestión de Carreras</h2>
                        <ListaCarreras />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup>
import ListaFacultades from '@/components/catalogos_academicos/ListaFacultades.vue'
import ListaCarreras from '@/components/catalogos_academicos/ListaCarreras.vue'
</script>
