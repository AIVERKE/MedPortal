<template>
    <v-card flat class="fill-height d-flex flex-column">
        <v-card-title class="d-flex align-center py-4 px-6 ga-4 flex-wrap">
            <v-text-field v-model="search" append-icon="mdi-magnify" label="Buscar personas sin usuario" single-line
                hide-details density="comfortable" variant="underlined" class="max-width-300" />

            <v-select v-model="roleFilter" :items="roleOptions" item-title="label" item-value="value"
                variant="underlined" density="comfortable" hide-details class="max-width-200"
                prepend-inner-icon="mdi-filter-variant" label="Filtrar por rol"></v-select>

            <v-spacer />
            <v-btn color="primary" prepend-icon="mdi-plus" @click="$emit('add')">
                Nueva Persona
            </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <!-- Data Table -->
        <v-data-table v-model:selected="selectedRows" :headers="headers" :items="filteredUsers" hover
            class="flex-grow-1" @click:row="(event, { item }) => $emit('select', item)">
            <template #[`item.fullName`]="{ item }">
                <div class="d-flex align-center py-2">
                    <PersonaAvatar :foto="item.foto" :nombres="item.nombres"
                        :primer-apellido="item.primerApellido" :size="32" class="mr-3" />
                    <span class="font-weight-medium text-truncate" style="max-width: 200px">
                        {{ item.nombres }} {{ item.primerApellido }} {{ item.segundoApellido || '' }}
                    </span>
                </div>
            </template>

            <template v-slot:item.genero="{ item }">
                <v-chip size="small" :color="getGenderColor(item.genero)" variant="tonal" class="font-weight-bold">
                    {{ item.genero }}
                </v-chip>
            </template>

            <template v-slot:item.activo="{ item }">
                <v-chip size="small" :color="item.activo ? 'success' : 'error'" variant="flat" class="font-weight-bold">
                    {{ item.activo ? 'ACTIVO' : 'INACTIVO' }}
                </v-chip>
            </template>

            <template #[`item.ci`]="{ item }">
                <span class="text-body-2">{{ item.ci }}</span>
            </template>

            <template #[`item.email`]="{ item }">
                <span class="text-body-2 text-grey-darken-1">{{ item.email }}</span>
            </template>

            <template #[`item.roles`]="{ item }">
                <div class="d-flex ga-1 justify-center flex-wrap">
                    <v-chip v-for="role in item.roles" :key="role.idRol" :color="getRoleColor(role.tipoRol)"
                        size="x-small" class="font-weight-bold" variant="tonal">
                        {{ role.tipoRol.toUpperCase() }}
                    </v-chip>
                </div>
            </template>

            <template #[`item.actions`]="{ item }">
                <div class="d-flex justify-end ga-2">
                    <v-tooltip text="Editar Datos Personales" location="top">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon="mdi-pencil" variant="text" color="info" size="small"
                                @click.stop="$emit('edit-personal', item)"></v-btn>
                        </template>
                    </v-tooltip>

                    <v-tooltip v-if="isSuperusuario" text="Eliminar" location="top">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon="mdi-delete" variant="text" color="error" size="small"
                                @click.stop="confirmDelete(item)"></v-btn>
                        </template>
                    </v-tooltip>

                </div>
            </template>

            <template #no-data>
                <div class="pa-12 d-flex flex-column align-center justify-center text-center">
                    <v-icon size="48" color="grey-lighten-2">mdi-account-search-outline</v-icon>
                    <div class="text-h6 text-grey-lighten-1 mt-4">No se encontraron personas</div>
                </div>
            </template>
        </v-data-table>

        <!-- Delete Confirmation -->
        <ModalConfirmación v-model="dialogDelete" title="Eliminar Persona"
            :message="`¿Estás seguro de que deseas eliminar a ${userToDelete?.nombres} ${userToDelete?.primerApellido}? Esta acción no se puede deshacer.`"
            type="error" confirmText="Eliminar" @confirm="deleteUserConfirm" @cancel="dialogDelete = false" />
    </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePersonasStore } from '@/stores/personas';
import { useAuthStore } from '@/stores/auth';
import ModalConfirmación from '@/components/common/ModalConfirmación.vue';
import PersonaAvatar from '@/components/common/PersonaAvatar.vue';


const emit = defineEmits(['select', 'add', 'delete', 'edit-personal']);

const personasStore = usePersonasStore();
const authStore = useAuthStore();
const search = ref('');
const roleFilter = ref('TODOS');
const selectedRows = ref([]);
const dialogDelete = ref(false);
const userToDelete = ref(null);

const isSuperusuario = computed(() => authStore.user?.rol === 'SUPERUSUARIO');


const roleOptions = [
    { label: 'Todos los roles', value: 'TODOS' },
    { label: 'Doctor', value: 'doctor' },
    { label: 'Director', value: 'director' },
    { label: 'Docente', value: 'teacher' },
    { label: 'Estudiante', value: 'student' },
    { label: 'Administrativo', value: 'administrativo' },
    { label: 'Consultor', value: 'consultor' },
    { label: 'Superusuario', value: 'superusuario' }
];

const headers = [
    { title: 'Persona', key: 'fullName', align: 'start', minWidth: '250px' },
    { title: 'Identificación', key: 'ci', align: 'start' },
    { title: 'Email', key: 'email', align: 'start' },
    { title: 'Género', key: 'genero', sortable: true },
    { title: 'Estado', key: 'activo', sortable: true },
    { title: 'Roles', key: 'roles', align: 'center', sortable: false, width: '150px' },
    { title: 'Acciones', key: 'actions', align: 'end', sortable: false, width: '120px' },
];

const users = computed(() => personasStore.personasSinUsuario);

function getInitials(nombres, apellidos) {
    if (!nombres || !apellidos) return '??';
    const n = nombres.charAt(0) || '';
    const a = apellidos.charAt(0) || '';
    return `${n}${a}`.toUpperCase();
}

function getGenderColor(genero) {
    const g = genero?.toLowerCase();
    if (g === 'masculino' || g === 'm') return 'blue';
    if (g === 'femenino' || g === 'f') return 'pink';
    return 'grey';
}

function getRoleColor(tipoRol) {
    const r = tipoRol?.toLowerCase();
    if (r?.includes('estudiante')) return 'yellow-darken-2';
    if (r?.includes('docente')) return 'orange-darken-1';
    if (r?.includes('administrativo')) return 'green-darken-1';
    if (r?.includes('consultor')) return 'light-green-darken-1';
    if (r?.includes('director')) return 'purple-darken-1';
    if (r?.includes('superusuario')) return 'cyan-darken-1';
    if (r?.includes('doctor')) return 'blue-darken-1';
    return 'grey';
}

function confirmDelete(item) {
    userToDelete.value = item;
    dialogDelete.value = true;
}

const filteredUsers = computed(() => {
    let list = [...users.value];

    if (roleFilter.value !== 'TODOS') {
        const filter = roleFilter.value.toLowerCase();
        list = list.filter(u => u.roles && u.roles.some(r => r.tipoRol.toLowerCase().includes(filter)));
    }

    if (search.value) {
        const s = search.value.toLowerCase().trim();
        list = list.filter(u => {
            const fullName = `${u.nombres} ${u.primerApellido} ${u.segundoApellido || ''}`.toLowerCase();
            const ci = (u.ci || '').toString().toLowerCase();
            const email = (u.email || '').toLowerCase();
            return fullName.includes(s) || ci.includes(s) || email.includes(s);
        });
    }

    return list;
});

function deleteUserConfirm() {
    emit('delete', userToDelete.value);
    dialogDelete.value = false;
    userToDelete.value = null;
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

:deep(.v-data-table__tr--hover) {
    cursor: pointer;
}
</style>
