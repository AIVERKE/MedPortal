<template>
    <div v-if="roles?.length" class="d-flex flex-wrap gap-1" :class="wrapperClass">
        <PacienteTipoChip
            v-for="role in roles"
            :key="role.tipoRol || role.tipo"
            :tipo="role.tipo"
            :label="role.label"
        />
    </div>
</template>

<script setup>
import PacienteTipoChip from './PacienteTipoChip.vue'

defineProps({
    roles: { type: Array, default: () => [] },
    wrapperClass: { type: String, default: 'mb-1' }
})
</script>
