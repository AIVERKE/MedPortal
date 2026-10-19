import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

const CATEGORIA_META = {
    historial: {
        icon: 'mdi-clipboard-text-outline',
        avatarColor: 'success-lighten-4',
        iconColor: 'success',
        badge: 'success',
        label: 'Historial clínico',
    },
    encuesta: {
        icon: 'mdi-clipboard-check-outline',
        avatarColor: 'info-lighten-4',
        iconColor: 'info',
        badge: 'info',
        label: 'Encuesta',
    },
    operativo: {
        icon: 'mdi-clipboard-list-outline',
        avatarColor: 'primary-lighten-4',
        iconColor: 'primary',
        badge: 'primary',
        label: 'Operativo',
    },
}

export { CATEGORIA_META }

function mapListItem(form) {
    const meta = CATEGORIA_META[form.categoria] ?? {
        icon: 'mdi-file-document-outline',
        avatarColor: 'grey-lighten-3',
        iconColor: 'grey-darken-1',
        badge: 'primary',
        label: 'Sin categoría',
    }

    const status = form.estado === 'publicado' ? 'Publicado' : 'Borrador'
    const statusColor = form.estado === 'publicado' ? 'success' : 'warning'
    const sectionCount = form.sectionCount ?? 0
    const fieldCount = form.fieldCount ?? 0

    let metaText = `${sectionCount} secciones · ${fieldCount} campos`
    if (form.hasUnpublishedChanges) {
        metaText = 'Cambios sin publicar'
    } else if (form.estado === 'borrador') {
        metaText = 'En edición'
    }

    return {
        id: form.idFormulario ?? form.id,
        idFormulario: form.idFormulario ?? form.id,
        title: form.titulo ?? form.title,
        titulo: form.titulo ?? form.title,
        descripcion: form.descripcion ?? '',
        categoria: form.categoria,
        categoriaLabel: meta.label,
        estado: form.estado,
        status,
        statusColor,
        badge: form.estado === 'publicado' ? 'success' : meta.badge,
        icon: meta.icon,
        avatarColor: meta.avatarColor,
        iconColor: meta.iconColor,
        meta: metaText,
        metaWarning: Boolean(form.hasUnpublishedChanges) || form.estado === 'borrador',
        sectionCount,
        fieldCount,
        hasPublished: Boolean(form.hasPublished),
        hasUnpublishedChanges: Boolean(form.hasUnpublishedChanges),
        fillMode: form.fillMode,
        fillLimit: form.fillLimit,
        visibilidadInstancias: form.visibilidadInstancias ?? 'publico',
        publicadoEn: form.publicadoEn,
        guardadoEn: form.guardadoEn,
        updatedAt: form.updatedAt,
        canView: form.canView,
        canFill: form.canFill,
        canEdit: form.canEdit,
        canDelete: form.canDelete,
    }
}

function mapDetail(form) {
    const base = mapListItem(form)
    return {
        ...base,
        ...form,
        id: form.idFormulario ?? form.id,
        idFormulario: form.idFormulario ?? form.id,
        title: form.titulo ?? form.title,
        titulo: form.titulo ?? form.title,
        formHeaderTitle: form.titulo ?? form.formHeaderTitle,
        builderDescription: form.descripcion ?? form.builderDescription ?? '',
        sections: form.sections ?? form.definicionBorrador?.sections ?? [],
        definicionBorrador: form.definicionBorrador ?? { sections: [] },
        definicionPublicada: form.definicionPublicada ?? null,
        permisos: form.permisos ?? [],
        fillMode: form.fillMode ?? 'single',
        fillLimit: form.fillLimit ?? 1,
        visibilidadInstancias: form.visibilidadInstancias ?? 'publico',
        auditoria: form.auditoria ?? { ultimoGuardado: null, ultimaPublicacion: null },
    }
}

async function parseError(res) {
    let message = 'Error en la solicitud'
    try {
        const data = await res.json()
        if (Array.isArray(data?.message)) message = data.message.join(', ')
        else if (data?.message) message = data.message
    } catch {
        /* ignore */
    }
    throw new Error(message)
}

export const useFormulariosStore = defineStore('formularios', () => {
    const authStore = useAuthStore()
    const formularios = ref([])
    const paraLlenar = ref([])
    const current = ref(null)
    const sidebarAccess = ref({
        showLlenarFormularios: false,
        showFormulariosPacientes: false,
    })
    const pacientesResumen = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const error = ref(null)

    const fetchAll = async ({ categoria, search } = {}) => {
        loading.value = true
        error.value = null
        try {
            const params = new URLSearchParams()
            if (categoria && categoria !== 'todos') params.set('categoria', categoria)
            if (search?.trim()) params.set('search', search.trim())
            const qs = params.toString()
            const res = await fetch(`${API_BASE}/formularios${qs ? `?${qs}` : ''}`, {
                headers: authStore.authHeaders(),
            })
            if (!res.ok) await parseError(res)
            const data = await res.json()
            formularios.value = data.map(mapListItem)
            return formularios.value
        } catch (err) {
            error.value = err.message || 'Error al cargar formularios'
            throw err
        } finally {
            loading.value = false
        }
    }

    const fetchSidebarAccess = async () => {
        try {
            const res = await fetch(`${API_BASE}/formularios/sidebar-access`, {
                headers: authStore.authHeaders(),
            })
            if (!res.ok) await parseError(res)
            sidebarAccess.value = await res.json()
            return sidebarAccess.value
        } catch {
            sidebarAccess.value = {
                showLlenarFormularios: false,
                showFormulariosPacientes: false,
            }
            return sidebarAccess.value
        }
    }

    const fetchParaLlenar = async ({ categoria, search } = {}) => {
        loading.value = true
        error.value = null
        try {
            const params = new URLSearchParams()
            if (categoria && categoria !== 'todos') params.set('categoria', categoria)
            if (search?.trim()) params.set('search', search.trim())
            const qs = params.toString()
            const res = await fetch(
                `${API_BASE}/formularios/para-llenar${qs ? `?${qs}` : ''}`,
                { headers: authStore.authHeaders() },
            )
            if (!res.ok) await parseError(res)
            const data = await res.json()
            paraLlenar.value = data.map(mapListItem)
            return paraLlenar.value
        } catch (err) {
            error.value = err.message || 'Error al cargar formularios'
            throw err
        } finally {
            loading.value = false
        }
    }

    const getParaLlenarById = async (id) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/formularios/para-llenar/${id}`, {
                headers: authStore.authHeaders(),
            })
            if (!res.ok) await parseError(res)
            const data = await res.json()
            return {
                ...mapDetail(data),
                sections: data.sections ?? data.definicionPublicada?.sections ?? [],
                canFillForPatient: Boolean(data.canFillForPatient),
            }
        } catch (err) {
            error.value = err.message || 'Error al cargar formulario'
            throw err
        } finally {
            loading.value = false
        }
    }

    const createInstancia = async (idFormulario, payload) => {
        saving.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/formularios/${idFormulario}/instancias`, {
                method: 'POST',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload),
            })
            if (!res.ok) await parseError(res)
            return await res.json()
        } catch (err) {
            error.value = err.message || 'Error al guardar instancia'
            throw err
        } finally {
            saving.value = false
        }
    }

    const getContextoLlenado = async (idFormulario, paraQuienIdUsuario) => {
        const params = new URLSearchParams()
        if (paraQuienIdUsuario) {
            params.set('paraQuienIdUsuario', String(paraQuienIdUsuario))
        }
        const qs = params.toString()
        const res = await fetch(
            `${API_BASE}/formularios/para-llenar/${idFormulario}/contexto${qs ? `?${qs}` : ''}`,
            { headers: authStore.authHeaders() },
        )
        if (!res.ok) await parseError(res)
        return await res.json()
    }

    const getInstancia = async (id, versionId) => {
        loading.value = true
        error.value = null
        try {
            const params = new URLSearchParams()
            if (versionId) params.set('version', String(versionId))
            const qs = params.toString()
            const res = await fetch(
                `${API_BASE}/formularios/instancias/${id}${qs ? `?${qs}` : ''}`,
                { headers: authStore.authHeaders() },
            )
            if (!res.ok) await parseError(res)
            return await res.json()
        } catch (err) {
            error.value = err.message || 'Error al cargar instancia'
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateInstancia = async (id, payload) => {
        saving.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/formularios/instancias/${id}`, {
                method: 'PATCH',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload),
            })
            if (!res.ok) await parseError(res)
            return await res.json()
        } catch (err) {
            error.value = err.message || 'Error al actualizar instancia'
            throw err
        } finally {
            saving.value = false
        }
    }

    const saveEditDraft = async (id, respuestas) => {
        saving.value = true
        error.value = null
        try {
            const body =
                respuestas !== undefined ? { respuestas } : {}
            const res = await fetch(
                `${API_BASE}/formularios/instancias/${id}/borrador-edicion`,
                {
                    method: 'POST',
                    headers: authStore.authHeaders(),
                    body: JSON.stringify(body),
                },
            )
            if (!res.ok) await parseError(res)
            return await res.json()
        } catch (err) {
            error.value = err.message || 'Error al guardar borrador de edición'
            throw err
        } finally {
            saving.value = false
        }
    }

    const commitEdit = async (id, respuestas) => {
        saving.value = true
        error.value = null
        try {
            const res = await fetch(
                `${API_BASE}/formularios/instancias/${id}/guardar-edicion`,
                {
                    method: 'POST',
                    headers: authStore.authHeaders(),
                    body: JSON.stringify({ respuestas }),
                },
            )
            if (!res.ok) await parseError(res)
            return await res.json()
        } catch (err) {
            error.value = err.message || 'Error al guardar cambios'
            throw err
        } finally {
            saving.value = false
        }
    }

    const discardEditDraft = async (id) => {
        const res = await fetch(
            `${API_BASE}/formularios/instancias/${id}/borrador-edicion`,
            {
                method: 'DELETE',
                headers: authStore.authHeaders(),
            },
        )
        if (!res.ok) await parseError(res)
        return await res.json()
    }

    const restoreInstancia = async (id) => {
        const res = await fetch(
            `${API_BASE}/formularios/instancias/${id}/recuperar`,
            {
                method: 'POST',
                headers: authStore.authHeaders(),
            },
        )
        if (!res.ok) await parseError(res)
        return await res.json()
    }

    const removeInstancia = async (id) => {
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/formularios/instancias/${id}`, {
                method: 'DELETE',
                headers: authStore.authHeaders(),
            })
            if (!res.ok) await parseError(res)
            return true
        } catch (err) {
            error.value = err.message || 'Error al eliminar instancia'
            throw err
        }
    }

    const fetchPacientesResumen = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/formularios/pacientes-resumen`, {
                headers: authStore.authHeaders(),
            })
            if (!res.ok) await parseError(res)
            pacientesResumen.value = await res.json()
            return pacientesResumen.value
        } catch (err) {
            error.value = err.message || 'Error al cargar pacientes'
            throw err
        } finally {
            loading.value = false
        }
    }

    const fetchPacienteInstancias = async (idUsuario, categoria) => {
        loading.value = true
        error.value = null
        try {
            const params = new URLSearchParams()
            if (categoria) params.set('categoria', categoria)
            const qs = params.toString()
            const res = await fetch(
                `${API_BASE}/formularios/pacientes/${idUsuario}/instancias${qs ? `?${qs}` : ''}`,
                { headers: authStore.authHeaders() },
            )
            if (!res.ok) await parseError(res)
            return await res.json()
        } catch (err) {
            error.value = err.message || 'Error al cargar instancias'
            throw err
        } finally {
            loading.value = false
        }
    }

    const create = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/formularios`, {
                method: 'POST',
                headers: authStore.authHeaders(),
            })
            if (!res.ok) await parseError(res)
            const data = await res.json()
            const mapped = mapDetail(data)
            current.value = mapped
            return mapped
        } catch (err) {
            error.value = err.message || 'Error al crear formulario'
            throw err
        } finally {
            loading.value = false
        }
    }

    const getById = async (id) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/formularios/${id}`, {
                headers: authStore.authHeaders(),
            })
            if (!res.ok) await parseError(res)
            const data = await res.json()
            current.value = mapDetail(data)
            return current.value
        } catch (err) {
            error.value = err.message || 'Error al cargar formulario'
            current.value = null
            throw err
        } finally {
            loading.value = false
        }
    }

    const save = async (id, payload) => {
        saving.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/formularios/${id}`, {
                method: 'PATCH',
                headers: authStore.authHeaders(),
                body: JSON.stringify(payload),
            })
            if (!res.ok) await parseError(res)
            const data = await res.json()
            current.value = mapDetail(data)
            return current.value
        } catch (err) {
            error.value = err.message || 'Error al guardar'
            throw err
        } finally {
            saving.value = false
        }
    }

    const publish = async (id) => {
        saving.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/formularios/${id}/publish`, {
                method: 'POST',
                headers: authStore.authHeaders(),
            })
            if (!res.ok) await parseError(res)
            const data = await res.json()
            current.value = mapDetail(data)
            return current.value
        } catch (err) {
            error.value = err.message || 'Error al publicar'
            throw err
        } finally {
            saving.value = false
        }
    }

    const revertToPublished = async (id) => {
        saving.value = true
        error.value = null
        try {
            const res = await fetch(
                `${API_BASE}/formularios/${id}/revert-to-published`,
                {
                    method: 'POST',
                    headers: authStore.authHeaders(),
                },
            )
            if (!res.ok) await parseError(res)
            const data = await res.json()
            current.value = mapDetail(data)
            return current.value
        } catch (err) {
            error.value = err.message || 'Error al revertir a la versión publicada'
            throw err
        } finally {
            saving.value = false
        }
    }

    const remove = async (id) => {
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/formularios/${id}`, {
                method: 'DELETE',
                headers: authStore.authHeaders(),
            })
            if (!res.ok) await parseError(res)
            formularios.value = formularios.value.filter((f) => f.id !== Number(id))
            if (current.value?.id === Number(id)) current.value = null
            return true
        } catch (err) {
            error.value = err.message || 'Error al eliminar'
            throw err
        }
    }

    const preview = async (id, version = 'draft') => {
        error.value = null
        try {
            const res = await fetch(
                `${API_BASE}/formularios/${id}/preview?version=${version}`,
                { headers: authStore.authHeaders() },
            )
            if (!res.ok) await parseError(res)
            return await res.json()
        } catch (err) {
            error.value = err.message || 'Error al cargar vista previa'
            throw err
        }
    }

    return {
        formularios,
        paraLlenar,
        current,
        sidebarAccess,
        pacientesResumen,
        loading,
        saving,
        error,
        fetchAll,
        fetchSidebarAccess,
        fetchParaLlenar,
        getParaLlenarById,
        getContextoLlenado,
        createInstancia,
        getInstancia,
        updateInstancia,
        saveEditDraft,
        commitEdit,
        discardEditDraft,
        restoreInstancia,
        removeInstancia,
        fetchPacientesResumen,
        fetchPacienteInstancias,
        create,
        getById,
        save,
        publish,
        revertToPublished,
        remove,
        preview,
    }
})
