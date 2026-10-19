<template>
    <v-list-item
        class="px-4 py-3 mb-2 bg-white rounded-lg border hover-bg-surface-light cursor-pointer"
        :class="[itemClass, { 'selected-item': selected }]"
        @click="$emit('click')"
    >
        <template v-slot:prepend>
            <PersonaAvatar
                :foto="res.paciente?.foto"
                :nombres="res.paciente?.nombres || res.paciente?.nombre"
                :primer-apellido="res.paciente?.primerApellido"
                :color="avatarColor"
                :size="48"
                rounded="lg"
                class="mr-3"
            />
        </template>
        <PacienteTipoChips :roles="res.paciente?.roles" />
        <v-list-item-title class="text-body-2 font-weight-bold text-high-emphasis mb-1">
            {{ res.paciente?.nombre || 'Paciente' }}
        </v-list-item-title>
        <v-list-item-subtitle>
            <slot name="subtitle" />
        </v-list-item-subtitle>
    </v-list-item>
</template>

<script setup>
import PacienteTipoChips from './PacienteTipoChips.vue'
import PersonaAvatar from '@/components/common/PersonaAvatar.vue'

defineProps({
    res: { type: Object, required: true },
    selected: { type: Boolean, default: false },
    avatarColor: { type: String, required: true },
    avatarTextClass: { type: String, default: '' },
    itemClass: { type: String, default: '' },
    getInitials: { type: Function, required: true }
})

defineEmits(['click'])
</script>
