<script setup>
import { onMounted, ref } from 'vue';
import { useAllNivelesMofStore } from '../../../stores/niveles_mof';

const nivelesAllMofStore = useAllNivelesMofStore();
const niveles = ref([]);
onMounted(async () => {
    await nivelesAllMofStore.getFetchNiveles();
    niveles.value = nivelesAllMofStore.niveles;
});

</script>
<template>
    <v-select label="Nivel" :items="niveles" item-title="description" item-value="value" variant="underlined"></v-select>
</template>
