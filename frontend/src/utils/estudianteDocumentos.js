/**
 * Extrae timestamp (Date.now) embebido en nombres de archivo de uploads.
 * Ej: /uploads/registros/matricula_12_1734567890123_123.pdf
 */
export const extractTimestampFromUploadUrl = (url) => {
    if (!url) return null
    const match = url.match(/_(\d{13})_/)
    return match ? new Date(Number(match[1])) : null
}

/**
 * Fecha de sincronización: valor del API o máximo timestamp inferido de URLs de documentos.
 */
export const getFechaUltimaSincronizacionEstudiante = (estudiante) => {
    if (!estudiante) return null

    if (estudiante.fechaSincronizacion) {
        return new Date(estudiante.fechaSincronizacion)
    }

    const dates = [
        extractTimestampFromUploadUrl(estudiante.documentoMatriculaUrl),
        extractTimestampFromUploadUrl(estudiante.documentoCarnetUrl),
    ].filter(Boolean)

    if (!dates.length) return null
    return new Date(Math.max(...dates.map((d) => d.getTime())))
}

export const formatFechaEstudiante = (date) => {
    if (!date) return '-'
    return date.toLocaleDateString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
}
