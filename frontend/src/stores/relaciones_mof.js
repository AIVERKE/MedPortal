import { defineStore } from "pinia";
import { ref } from "vue";

export const useAllRelacionesMofStore = defineStore(
    "relaciones_mof",
    () => {
        const relaciones = ref([]);
        const loading = ref(false);
        const error = ref(null);
        const API_URL = "https://correspondencia.fcpn.edu.bo/umsa-core/api/v1/mof/relaciones";

        const getFetchRelaciones = async () => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                relaciones.value = data.data;
            } catch (err) {
                error.value = err.message;
            } finally {
                loading.value = false;
            }
        }
        return{
            relaciones,
            error,
            loading,
            getFetchRelaciones
        }
    }
);