<template>
    <v-card flat class="fill-height d-flex flex-column">
        <v-card-title class="d-flex align-center py-4 px-6 ga-4 flex-wrap">
            <div>
                <h3 class="text-h6 font-weight-bold text-slate-900">Registro de Médicos</h3>
                <p class="text-caption text-grey-darken-1">Gestionar asignaciones de especialistas y horarios de
                    consultorios</p>
            </div>

            <v-spacer />

            <div class="d-flex ga-3 align-center flex-wrap">
                <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Buscar por nombre o ID..."
                    single-line hide-details density="comfortable" variant="outlined" class="max-width-300" />
                <v-btn color="primary" prepend-icon="mdi-plus" class="text-none font-weight-bold" rounded="lg"
                    @click="$emit('add')">
                    Agregar Doctor
                </v-btn>
                <v-btn variant="outlined" prepend-icon="mdi-filter-variant" class="text-none">
                    Filtrar
                </v-btn>
            </div>
        </v-card-title>

        <v-divider></v-divider>

        <v-data-table :headers="headers" :items="doctoresStore.doctores" :search="search" :loading="loading" hover
            class="flex-grow-1" @click:row="(event, { item }) => $emit('select', item)">
            <template #[`item.nombre`]="{ item }">
                <div class="d-flex align-center py-2">
                    <PersonaAvatar :foto="item.foto" :nombres="item.nombres"
                        :primer-apellido="item.primerApellido" :size="40" rounded="lg" class="mr-3" />
                    <div>
                        <div class="font-weight-bold text-body-2">{{ item.nombre }}</div>
                        <div class="text-caption text-grey">{{ item.especialidad }}</div>
                    </div>
                </div>
            </template>

            <template #[`item.id`]="{ item }">
                <span class="text-body-2 font-weight-medium text-grey-darken-1">#{{ item.id }}</span>
            </template>

            <template #[`item.especialidad`]="{ item }">
                <div class="d-flex flex-wrap ga-1 max-width-200">
                    <v-chip :color="getSpecialtyColor(item.especialidad)" size="x-small"
                        class="font-weight-bold text-uppercase" variant="tonal">
                        {{ item.especialidad }}
                    </v-chip>
                </div>
            </template>

            <template #[`item.posta`]="{ item }">
                <span :class="!item.posta ? 'text-grey italic' : 'text-body-2'">
                    {{ item.posta || 'Sin asignar' }}
                </span>
            </template>



            <template #[`item.actions`]="{ item }">
                <v-btn variant="text" color="primary" size="small" class="text-none font-weight-bold"
                    @click.stop="$emit('select', item)">
                    Gestionar
                </v-btn>
            </template>
        </v-data-table>
    </v-card>
</template>
<script setup>
import { ref } from 'vue';
import { useDoctoresStore } from '@/stores/doctores';
import PersonaAvatar from '@/components/common/PersonaAvatar.vue';

const props = defineProps({
    loading: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['select', 'add']);
const doctoresStore = useDoctoresStore();

const search = ref('');

const headers = [
    { title: 'Nombre del Médico', key: 'nombre', align: 'start' },
    { title: 'ID de Empleado', key: 'id', align: 'start' },
    { title: 'Especialidad', key: 'especialidad', align: 'start' },
    { title: 'Consultorio Asignado', key: 'posta', align: 'start' },
    { title: 'Acciones', key: 'actions', align: 'end', sortable: false },
];

function getInitials(name) {
    return name
        .split(' ')
        .filter(n => !n.includes('.'))
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getSpecialtyColor(specialty) {
    const colors = {
        'Cardiología': 'blue',
        'Neurología': 'purple',
        'Pediatría': 'orange',
        'Medicina General': 'emerald',
    };
    return colors[specialty] || 'grey';
}
</script>

<style scoped>
.max-width-300 {
    max-width: 300px;
}

.max-width-200 {
    max-width: 200px;
}

:deep(.v-data-table-header th) {
    font-weight: 700 !important;
    text-transform: uppercase;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em;
    color: #64748b !important;
}

.text-emerald-darken-1 {
    color: #059669;
}

.bg-emerald {
    background-color: #10b981 !important;
}

:deep(.v-badge__badge.bg-emerald) {
    background-color: #10b981 !important;
}
</style>
