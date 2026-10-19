<script setup>
import { onMounted, ref } from 'vue';
import { useAllTiposMofStore } from '../../../stores/tipos_mof';

const tiposAllMofStore = useAllTiposMofStore();
const tipos = ref([]);
onMounted(async () => {
    await tiposAllMofStore.getFetchTipos();
    tipos.value = tiposAllMofStore.tipos;
});
</script>
<template>
    <v-select label="Tipos" :items="tipos" item-title="description" item-value="value" variant="underlined"></v-select>
</template>