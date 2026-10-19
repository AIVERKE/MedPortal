export const APP_NAME = import.meta.env.VITE_APP_TITLE || 'MedPortal+'
export const APP_TAGLINE = import.meta.env.VITE_APP_TAGLINE || 'Tu salud universitaria'

export function getAppPageTitle(suffix) {
    return suffix ? `${APP_NAME} - ${suffix}` : APP_NAME
}
