<template>
    <v-chip v-if="label" :color="chipColor" size="x-small" class="font-weight-bold text-uppercase" label>
        {{ label }}
    </v-chip>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    tipo: { type: String, default: null },
    label: { type: String, default: null }
})

const chipColor = computed(() => {
    const t = (props.tipo || props.label || '').toLowerCase()
    if (t.includes('estudiante')) return 'yellow-darken-2'
    if (t.includes('docente')) return 'orange-darken-1'
    if (t.includes('administrativo')) return 'green-darken-1'
    if (t.includes('consultor')) return 'light-green-darken-1'
    return 'grey'
})
</script>
