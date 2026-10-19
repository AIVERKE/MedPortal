/**
 * v-file-input de Vuetify puede devolver File o File[].
 * FormData.append castea un array a la cadena "[object File]",
 * así que hay que extraer la instancia File antes de adjuntarla.
 */
export const fileFromVuetifyInput = (value) => {
    if (Array.isArray(value)) return value[0] ?? null
    return value ?? null
}
