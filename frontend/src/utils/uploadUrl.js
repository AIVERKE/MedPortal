export const resolveUploadUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('/assets/') || path.startsWith('data:') || path.startsWith('blob:')) return path
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
