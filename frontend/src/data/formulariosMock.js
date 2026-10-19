export const formPermissionOptions = [
    {
        key: 'canView',
        title: 'Ver',
        description: 'Consultar instancias ya guardadas, sin modificarlas.',
    },
    {
        key: 'canFill',
        title: 'Llenar',
        description: 'Crear una instancia nueva de este formulario.',
    },
    {
        key: 'canEdit',
        title: 'Editar',
        description: 'Modificar y guardar una instancia existente.',
    },
    {
        key: 'canDelete',
        title: 'Eliminar',
        description: 'Anular o borrar una instancia.',
    },
]

export const emptyRolePermissions = {
    canView: false,
    canFill: false,
    canEdit: false,
    canDelete: false,
}

export const fullRolePermissions = {
    canView: true,
    canFill: true,
    canEdit: true,
    canDelete: true,
}

export const DEFAULT_FULL_PERM_ROLES = new Set([
    'SUPERUSUARIO',
    'DIRECTOR',
])

export const visibilidadInstanciasOptions = [
    {
        value: 'publico',
        title: 'Público',
        description: 'Cualquier rol con permiso Ver puede consultar las instancias.',
    },
    {
        value: 'privado',
        title: 'Privado',
        description: 'Solo quien llenó la instancia puede verla (p. ej. notas psicológicas).',
    },
]

export const fillModeOptions = [
    {
        value: 'single',
        title: 'Llenado único',
        description: 'Solo una instancia del formulario en el sistema. Siempre editable.',
    },
    {
        value: 'limited',
        title: 'Cantidad limitada',
        description: 'Hasta N instancias del formulario, cada una editable.',
    },
    {
        value: 'unlimited',
        title: 'Sin límite',
        description: 'Todas las instancias que se necesiten, cada una editable.',
    },
]

export const fieldTypeLabels = {
    short_text: 'Texto corto',
    long_text: 'Texto largo',
    single_choice: 'Opción única',
    multiple_choice: 'Opción múltiple',
    date: 'Fecha',
    number: 'Número',
}

export const fieldTypeIcons = {
    short_text: 'mdi-form-textbox',
    long_text: 'mdi-text-long',
    single_choice: 'mdi-radiobox-marked',
    multiple_choice: 'mdi-checkbox-multiple-marked-outline',
    date: 'mdi-calendar-month-outline',
    number: 'mdi-numeric',
}

export const fieldTypeOptions = Object.entries(fieldTypeLabels).map(([value, title]) => ({
    value,
    title,
}))

export function countFormFields(formulario) {
    if (!formulario?.sections) return 0
    return formulario.sections.reduce((total, section) => total + (section.fields?.length ?? 0), 0)
}
