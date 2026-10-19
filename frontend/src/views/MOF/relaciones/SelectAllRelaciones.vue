<script setup>
import { onMounted, ref } from 'vue';
import { useAllRelacionesMofStore } from '../../../stores/relaciones_mof';


const relacionesAllUnidadesStore = useAllRelacionesMofStore();
const relaciones = ref([]);

onMounted(async () => {
    await relacionesAllUnidadesStore.getFetchRelaciones();
    relaciones.value = relacionesAllUnidadesStore.relaciones;
});
</script>
<template>
    <v-select label="Relación" :items="relaciones" item-title="description" item-value="value" variant="underlined"></v-select>
</template>