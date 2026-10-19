<script setup>
import { computed, onMounted, ref, defineProps } from 'vue';
import { useAllUnidadesMofStore } from '../../../stores/unidades_mof';

const props = defineProps({
    type: {
        type: String,
        default: 'select'//valor por defecto para select normal
    },
    excludeId: {
        type: [Number, null],
        default: null
    }
});

const undadesAllUnidadesStore = useAllUnidadesMofStore();
const unidades = ref([]);


onMounted(async () => {
    await undadesAllUnidadesStore.getFetchUnidades();
    unidades.value = undadesAllUnidadesStore.unidades;
});


// Filtrar la unidad actual si se proporciona excludeId
const filteredUnidades = computed(() => {
    if (props.excludeId) {
        return undadesAllUnidadesStore.unidades.filter(u => u.id !== props.excludeId);
    }
    return undadesAllUnidadesStore.unidades;
});

//Adicionando las nuevas propiedades 
const autocompleteProps = computed(() => {
    if (props.type !== 'autocomplete') return {};
    return {
        clearable: true,
        chips: true,
        multiple: true
    }
});



</script>
<template>
    <component 
        :is="props.type === 'autocomplete' ? 'v-autocomplete' : 'v-select'"
        label="Unidades" 
        :items="filteredUnidades" 
        item-title="nombre" 
        item-value="id" 
        variant="underlined" 
        v-bind="autocompleteProps"
    />
</template>
