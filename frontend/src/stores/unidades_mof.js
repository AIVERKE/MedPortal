//  Create by: Jesus Reynaldo Perez Benavides 
//  phone: +591 73030203
//  mail: jperezbenavides@gmail.com

import { defineStore } from "pinia";
import { ref } from "vue";

export const useAllUnidadesMofStore = defineStore(
    "unidades_mof",
    () => {
        const unidades = ref([]);
        const loading = ref(false);
        const error = ref(null);

        const API_URL = "https://correspondencia.fcpn.edu.bo/umsa-core/api/v1/mof/unidades";

        const getFetchUnidades = async () => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(API_URL);
                //por si hay problemas de conexion al servidor
                if (!response) {
                    throw new Error('Error en el Servidor. Comuniquese con el administrador del sistema');
                }
                const data = await response.json();
                unidades.value = data.data;
            } catch (err) {
                error.value = err.message === 'Falla en fetch'
                    ? 'No se puede conectar al servidor. Comuniquese con el administrador del sistema.'
                    : err.message;

            } finally {
                loading.value = false;
            }
        };

        const createUnidad = async (dataForm) => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(
                    API_URL,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            // Aquí irían mis headers de autenticación si los necesitas
                        },
                        body: JSON.stringify(dataForm)
                    }
                );

                if (!response.ok) {
                    // Captura errores de la API (ej. 400, 500)
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al crear la unidad');
                }

                // Si la creación fue exitosa, actualiza el árbol
                // llamando a la función que ya tenías.
                await getFetchUnidades();
            } catch (err) {
                error.value = err.message === 'Falla en fetch'
                    ? 'No se puede conectar al servidor. Comuníquese con el administrador del sistema.'
                    : err.message;
                console.error("Error en createUnidad:", err);
            } finally {
                loading.value = false;
            }
        };

        const deleteUnidad = async (id) => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error('Error en el Servidor. Comuniquese con el administrador del sistema');
                }

                await getFetchUnidades();
            } catch (err) {
                error.value = err.message === 'Failed to fetch'
                    ? 'No se puede conectar al servidor. Comuníquese con el administrador del sistema.'
                    : err.message;
                console.error("Error en deleteUnidad:", err);
            } finally {
                loading.value = false;
            }
        };


        const getUnidadById = async (id) => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(`${API_URL}/${id}`);
                if (!response.ok) throw new Error('Error al obtener la unidad');
                const data = await response.json();
                return data.data;
            } catch (err) {
                error.value = 'No se puede obtener la unidad';
                return null;
            } finally {
                loading.value = false;
            }
        };

        const updateUnidad = async (id, dataForm) => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataForm)
                });

                if (!response.ok) throw new Error('Error al actualizar');
                await getFetchUnidades();
            } catch (err) {
                error.value = 'Error al actualizar';
            } finally {
                loading.value = false;
            }
        };

        const updateNodo = async (id, dataForm) => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(`${API_URL}/${id}/setparent`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataForm)
                });

                if (!response.ok) throw new Error('Error al actualizar');
                await getFetchUnidades();
            } catch (err) {
                error.value = 'Error al actualizar';
            } finally {
                loading.value = false;
            }
        };
        return {
            unidades,
            loading,
            error,
            getFetchUnidades,
            createUnidad,
            deleteUnidad,
            updateUnidad,
            getUnidadById,
            updateNodo
        }
    }
)



