import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { resolveUploadUrl } from '@/utils/uploadUrl'
import {
  extractReservaRawId,
  mismaCita,
  getReservaIdPrefijado,
} from '@/utils/reservaIdentity'

const API_BASE = import.meta.env.VITE_API_URL

const PACIENTE_ROLES_ORDEN = ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'CONSULTOR']

const ROLE_LABELS = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  administrativo: 'Administrativo',
  consultor: 'Consultor',
}

const resolveRolesPaciente = (persona) => {
  if (!persona?.asignacionesRoles?.length) return []

  const activos = persona.asignacionesRoles.filter((ar) => ar.activo !== false)
  const nombres = new Set(
    activos
      .map((ar) => (ar.rol?.nombre || '').toUpperCase().trim())
      .filter((nombre) => PACIENTE_ROLES_ORDEN.includes(nombre))
  )

  return PACIENTE_ROLES_ORDEN
    .filter((nombre) => nombres.has(nombre))
    .map((nombre) => {
      const tipo = nombre.toLowerCase()
      return { tipo, label: ROLE_LABELS[tipo] || nombre, tipoRol: nombre }
    })
}

const buildPacienteFromUsuario = (usuario) => {
  if (!usuario || typeof usuario !== 'object') return null

  const persona = usuario.persona
  const roles = resolveRolesPaciente(persona)
  const estudiante = persona?.estudiante
  const consultor = persona?.consultor
  const esEstudiante = roles.some((r) => r.tipo === 'estudiante') || !!estudiante
  const esConsultor = roles.some((r) => r.tipo === 'consultor') || !!consultor

  const paciente = {
    id: usuario.idUsuario || usuario.id_usuario,
    nombre: persona
      ? `${persona.nombres || ''} ${persona.primerApellido || ''} ${persona.segundoApellido || ''}`.trim()
      : (usuario.nombres || usuario.nombre)
        ? `${usuario.nombres || usuario.nombre || ''} ${usuario.primerApellido || ''} ${usuario.segundoApellido || ''}`.trim()
        : (usuario.username || 'Paciente'),
    nombres: persona?.nombres || usuario.nombres || usuario.nombre || '',
    primerApellido: persona?.primerApellido || usuario.primerApellido || '',
    foto: resolveUploadUrl(
      persona?.foto || persona?.imagen || usuario.foto || usuario.imagen,
    ),
    roles,
    esEstudiante,
    esConsultor,
    registroUniversitario: null,
    documentoMatriculaUrl: null,
    documentoCarnetUrl: null,
    contratos: []
  }

  if (estudiante) {
    paciente.registroUniversitario = estudiante.registroUniversitario ?? null
    paciente.documentoMatriculaUrl = resolveUploadUrl(estudiante.documentoMatriculaUrl)
    paciente.documentoCarnetUrl = resolveUploadUrl(estudiante.documentoCarnetUrl)
  }

  if (consultor?.contratos?.length) {
    paciente.contratos = consultor.contratos.map((c) => ({
      idContratoConsultor: c.idContratoConsultor,
      cargo: c.cargo || null,
      unidad: c.unidad || null,
      idServicio: c.idServicio ?? null,
      fechaInicioContrato: c.fechaInicioContrato || null,
      fechaFinContrato: c.fechaFinContrato || null,
      documentoContratoUrl: resolveUploadUrl(c.documentoContratoUrl)
    }))
  }

  return paciente
}

export const useReservasStore = defineStore('reservas', () => {
  const authStore = useAuthStore()
  const reservas = ref([])
  const loading = ref(false)
  const error = ref(null)

  /* =====================================================
   * NORMALIZADOR
   * ===================================================== */
  const normalizeFechaCita = (raw) => {
    if (!raw) return null
    if (typeof raw === 'string') return raw.includes('T') ? raw.slice(0, 10) : raw
    if (raw instanceof Date) return raw.toISOString().slice(0, 10)
    return String(raw).slice(0, 10)
  }

  const mapReserva = (r) => {
    if (!r) return null

    const status = r.estado?.toUpperCase() || 'PENDIENTE';
    const isCancelled = ['CANCELADA', 'CANCELADO', 'RECHAZADA', 'ANULADA'].includes(status) || !!r.idReservaCancelada;
    const rawId = extractReservaRawId(r)
    const prefix = isCancelled ? 'cancelled_' : 'active_';

    return {
      id: rawId != null ? `${prefix}${rawId}` : null,
      rawId: rawId ?? null,
      idReservaPaciente: rawId ?? null,
      idUsuario: Number(r.idUsuario || r.usuario?.idUsuario || r.id_usuario) || null,
      idEspecialidad: r.idEspecialidad || r.especialidad?.idEspecialidadMedica || r.id_especialidad,
      especialidad: r.especialidad ? {
        id: r.especialidad.idEspecialidadMedica || r.especialidad.id_especialidad_medica,
        nombre: r.especialidad.nombre
      } : null,
      idPosta: r.idPosta || r.posta?.idPosta || r.id_posta,
      posta: r.posta ? {
        id: r.posta.idPosta,
        nombre: r.posta.nombre,
        direccion: r.posta.direccion
      } : null,
      idDoctor: r.idDoctor || (typeof r.doctor === 'object' ? r.doctor?.idDoctor : r.doctor) || r.id_doctor,
      doctor: (r.doctor && typeof r.doctor === 'object') ? {
        id: r.doctor.idDoctor || r.doctor.id_doctor,
        nombre: r.doctor.persona
          ? `${r.doctor.persona.nombres || ''} ${r.doctor.persona.primerApellido || ''} ${r.doctor.persona.segundoApellido || ''}`.trim()
          : (r.doctor.nombres || r.doctor.nombre)
            ? `${r.doctor.nombres || r.doctor.nombre || ''} ${r.doctor.primerApellido || ''} ${r.doctor.segundoApellido || ''}`.trim()
            : (r.doctorNombre || 'Médico Asignado'),
        imagen: resolveUploadUrl(
          r.doctor.persona?.foto || r.doctor.persona?.imagen || r.doctor.foto || r.doctor.imagen
        )
      } : (r.doctorNombre ? { id: r.idDoctor || r.doctor, nombre: r.doctorNombre, imagen: null } : null),
      paciente: (r.usuario && typeof r.usuario === 'object')
        ? buildPacienteFromUsuario(r.usuario)
        : (r.username ? {
          id: r.idUsuario || r.usuario,
          nombre: r.username,
          nombres: r.username || '',
          primerApellido: '',
          foto: null,
          roles: [],
          esEstudiante: false,
          esConsultor: false,
          registroUniversitario: null,
          documentoMatriculaUrl: null,
          documentoCarnetUrl: null,
          contratos: []
        } : null),
      consulta: r.consulta ? {
        id: r.consulta.idConsultaMedica,
        peso: r.consulta.pesoKl,
        talla: r.consulta.estaturaCm,
        presion: r.consulta.presionArterial,
        temperatura: r.consulta.temperatura,
        frecuencia: r.consulta.frecuenciaCardiaca,
        motivo: r.consulta.motivoConsulta || r.consulta.motivo_consulta,
        sintomas: r.consulta.sintomas
      } : null,
      fechaCita: normalizeFechaCita(r.fechaCita || r.fecha_cita),
      horaInicioCita: r.horaInicioCita || r.hora_inicio_cita,
      horaFinCita: r.horaFinCita || r.hora_fin_cita,
      fechaAtendido: r.fechaAtendido || r.fecha_atendido || null,
      horaAtendido: r.horaAtendido || r.hora_atendido || null,
      observaciones: r.observaciones,
      estado: r.estado || 'PENDIENTE',
      createdAt: r.createdAt || r.fechaSolicitud || r.fecha_solicitud || null,
      // Campos específicos para canceladas
      fechaCancelacion: r.fechaCancelacionCita || r.fecha_cancelacion_cita || null,
      motivoCancelacion: r.motivoCancelacion || r.motivo_cancelacion || null
    }
  }

  /* =====================================================
   * HELPERS
   * ===================================================== */
  const upsertReserva = (mappedData) => {
    if (!mappedData) return

    const index = mappedData.id
      ? reservas.value.findIndex((r) => r.id === mappedData.id)
      : mappedData.rawId != null
        ? reservas.value.findIndex((r) => String(r.rawId) === String(mappedData.rawId))
        : -1

    if (index !== -1) {
      const merged = { ...reservas.value[index], ...mappedData }
      if (mappedData.rawId == null && reservas.value[index].rawId != null) {
        merged.rawId = reservas.value[index].rawId
        merged.id = reservas.value[index].id
      }
      reservas.value[index] = merged
    } else {
      reservas.value.push(mappedData)
    }
  }

  /* =====================================================
   * GET ALL
   * ===================================================== */
  const fetchReservas = async () => {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(`${API_BASE}/reservas-pacientes`, {
        headers: authStore.authHeaders()
      })
      if (!res.ok) throw new Error()

      const response = await res.json()
      const data = Array.isArray(response) ? response : (response.data || [])
      const mapped = data.map(mapReserva)
      mapped.forEach(upsertReserva)

      return mapped
    } catch (err) {
      error.value = 'Error al cargar reservas'
      reservas.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  /* =====================================================
   * GET ONE
   * ===================================================== */
  const fetchReservaById = async (id) => {
    loading.value = true
    error.value = null

    const rawId = extractReservaRawId(id);
    if (rawId == null) {
      error.value = 'Error al obtener la reserva'
      loading.value = false
      return null
    }

    try {
      const res = await fetch(`${API_BASE}/reservas-pacientes/${rawId}`, {
        headers: authStore.authHeaders()
      })
      if (!res.ok) throw new Error()

      const data = await res.json()
      const mapped = mapReserva(data)
      if (mapped) upsertReserva(mapped)
      return mapped
    } catch (err) {
      error.value = 'Error al obtener la reserva'
      return null
    } finally {
      loading.value = false
    }
  }

  /* =====================================================
   * CREATE
   * ===================================================== */
  const createReserva = async (data) => {
    error.value = null

    try {
      const payload = {
        idUsuario: Number(data.idUsuario),
        idEspecialidad: Number(data.idEspecialidad),
        idPosta: Number(data.idPosta),
        idDoctor: Number(data.idDoctor),
        fechaCita: data.fechaCita,
        horaInicioCita: data.horaInicioCita,
        horaFinCita: data.horaFinCita,
        observaciones: data.observaciones
      }

      const requiredNumeric = ['idUsuario', 'idEspecialidad', 'idPosta', 'idDoctor']
      const invalidFields = requiredNumeric.filter((key) => Number.isNaN(payload[key]))

      if (invalidFields.length) {
        throw new Error(`Datos incompletos para la reserva: ${invalidFields.join(', ')}`)
      }

      const res = await fetch(`${API_BASE}/reservas-pacientes`, {
        method: 'POST',
        headers: authStore.authHeaders(),
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        // El backend de NestJS suele devolver el mensaje como string o array de strings
        let message = errorData.message || 'Error al crear la reserva'
        if (Array.isArray(message)) {
          message = message.join('. ')
        }
        const err = new Error(message)
        err.status = res.status
        throw err
      }

      const nuevaReserva = await res.json()
      upsertReserva(mapReserva(nuevaReserva))

      return { success: true }
    } catch (err) {
      error.value = err.message || 'Error al crear la reserva'
      return { success: false, status: err.status }
    }
  }

  /* =====================================================
   * CREATE SIN RESERVA
   * ===================================================== */
  const createReservaSinReserva = async (data) => {
    error.value = null

    try {
      const payload = {
        idUsuario: Number(data.idUsuario),
        idEspecialidad: Number(data.idEspecialidad),
        idPosta: Number(data.idPosta),
        idPersona: Number(data.idPersona),
        fechaAtendido: data.fechaAtendido,
        horaAtendido: data.horaAtendido,
        horaFinCita: data.horaFinCita,
        observaciones: data.observaciones
      }

      const res = await fetch(`${API_BASE}/reservas-pacientes/sin-reserva`, {
        method: 'POST',
        headers: authStore.authHeaders(),
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        let message = errorData.message || 'Error al crear la atención sin reserva'
        if (Array.isArray(message)) message = message.join('. ')
        const err = new Error(message)
        err.status = res.status
        throw err
      }

      const nuevaReserva = await res.json()
      upsertReserva(mapReserva(nuevaReserva))

      return { success: true, data: nuevaReserva }
    } catch (err) {
      error.value = err.message || 'Error al crear la atención sin reserva'
      return { success: false, status: err.status }
    }
  }

  /* =====================================================
   * UPDATE
   * ===================================================== */
  const updateReserva = async (id, data) => {
    error.value = null

    const rawId = extractReservaRawId(id);
    if (rawId == null) {
      error.value = 'No se pudo identificar la reserva'
      return { success: false, status: 400 }
    }

    try {
      const payload = {
        observaciones: data.observaciones,
        horaInicioCita: data.horaInicioCita,
        horaFinCita: data.horaFinCita
      }

      const res = await fetch(
        `${API_BASE}/reservas-pacientes/${rawId}`,
        {
          method: 'PUT',
          headers: authStore.authHeaders(),
          body: JSON.stringify(payload)
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        let message = errorData.message || 'Error al actualizar la reserva'
        if (Array.isArray(message)) {
          message = message.join('. ')
        }
        const err = new Error(message)
        err.status = res.status
        throw err
      }

      const actualizada = await res.json()
      upsertReserva(mapReserva(actualizada))

      return { success: true }
    } catch (err) {
      error.value = err.message || 'Error al actualizar la reserva'
      return { success: false, status: err.status }
    }
  }

  /* =====================================================
   * DELETE (CANCELAR)
   * ===================================================== */
  const deleteReserva = async (id, motivo) => {
    error.value = null

    const rawId = extractReservaRawId(id);
    if (rawId == null) {
      error.value = 'No se pudo identificar la reserva'
      return false
    }

    try {
      const mensaje = typeof motivo === 'string' ? motivo.trim() : ''
      const res = await fetch(
        `${API_BASE}/reservas-pacientes/${rawId}/cancelar`,
        {
          method: 'PATCH',
          headers: authStore.authHeaders(),
          body: JSON.stringify(mensaje ? { motivo: mensaje } : {}),
        }
      )

      if (res.status === 401) {
        error.value = 'Tu sesión expiró. Vuelve a entrar para continuar.'
        return false
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        let message = errorData.message || 'Error al cancelar la reserva'
        if (Array.isArray(message)) message = message.join('. ')
        error.value = message
        return false
      }

      reservas.value = reservas.value.filter(r => r.id !== id)

      return true
    } catch (err) {
      error.value = 'Error al cancelar la reserva'
      return false
    }
  }

  const cancelarReservaDoctor = async (idOrReserva, motivo) => {
    error.value = null

    const rawId = extractReservaRawId(idOrReserva);
    if (rawId == null) {
      error.value = 'No se pudo identificar la reserva a cancelar'
      return { success: false, status: 400 }
    }

    try {
      const res = await fetch(
        `${API_BASE}/reservas-pacientes/${rawId}/cancelar`,
        {
          method: 'PATCH',
          headers: authStore.authHeaders(),
          body: JSON.stringify(
            typeof motivo === 'string' && motivo.trim()
              ? { motivo: motivo.trim() }
              : {},
          ),
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        let message = errorData.message || 'Error al cancelar la reserva'
        if (Array.isArray(message)) message = message.join('. ')
        const err = new Error(message)
        err.status = res.status
        throw err
      }

      reservas.value = reservas.value.filter(r => String(extractReservaRawId(r)) !== String(rawId))

      return { success: true }
    } catch (err) {
      error.value = err.message || 'Error al cancelar la reserva'
      return { success: false, status: err.status }
    }
  }

  const reagendarReserva = async (idOrReserva, data) => {
    error.value = null

    const rawId = extractReservaRawId(idOrReserva);
    if (rawId == null) {
      error.value = 'No se pudo identificar la reserva a reagendar'
      return { success: false, status: 400 }
    }

    try {
      const mensaje = typeof data.motivo === 'string' ? data.motivo.trim() : ''
      const payload = {
        fechaCita: data.fechaCita,
        horaInicioCita: data.horaInicioCita,
        horaFinCita: data.horaFinCita,
        ...(mensaje ? { motivo: mensaje } : {}),
      }

      const res = await fetch(
        `${API_BASE}/reservas-pacientes/${rawId}/reagendar`,
        {
          method: 'PATCH',
          headers: authStore.authHeaders(),
          body: JSON.stringify(payload)
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        let message = errorData.message || 'Error al reagendar la reserva'
        if (typeof message === 'object' && message.message) message = message.message
        if (Array.isArray(message)) message = message.join('. ')
        const err = new Error(message)
        err.status = res.status
        throw err
      }

      const actualizada = await res.json()
      upsertReserva(mapReserva(actualizada))

      return { success: true, data: actualizada }
    } catch (err) {
      error.value = err.message || 'Error al reagendar la reserva'
      return { success: false, status: err.status }
    }
  }

  /* =====================================================
   * MARK AS ATENDIDO
   * ===================================================== */
  const markAsAtendido = async (idOrReserva, data) => {
    error.value = null

    const rawId = extractReservaRawId(idOrReserva);
    if (rawId == null) {
      error.value = 'No se pudo identificar la reserva'
      return { success: false, status: 400 }
    }

    try {
      const res = await fetch(
        `${API_BASE}/reservas-pacientes/${rawId}/atendido`,
        {
          method: 'PATCH',
          headers: authStore.authHeaders(),
          body: JSON.stringify({
            fechaAtendido: data.fechaAtendido,
            horaAtendido: data.horaAtendido
          })
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        let message = errorData.message || 'Error al cambiar estado a atendido'
        if (Array.isArray(message)) message = message.join('. ')
        const err = new Error(message)
        err.status = res.status
        throw err
      }

      const actualizada = await res.json().catch(() => null)
      if (actualizada) {
        upsertReserva(mapReserva(actualizada))
      } else {
        fetchReservaById(rawId)
      }

      return { success: true }
    } catch (err) {
      error.value = err.message || 'Error al cambiar estado a atendido'
      return { success: false, status: err.status }
    }
  }

  /* =====================================================
   * MARK AS PRESENT (ATENDER)
   * ===================================================== */
  const markAsPresent = async (idOrReserva) => {
    error.value = null

    const rawId = extractReservaRawId(idOrReserva);
    if (rawId == null) {
      error.value = 'No se pudo identificar la reserva'
      return { success: false, status: 400 }
    }

    try {
      const res = await fetch(
        `${API_BASE}/reservas-pacientes/${rawId}/presente`,
        {
          method: 'PATCH',
          headers: authStore.authHeaders()
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        let message = errorData.message || 'Error al cambiar estado a presente'
        if (Array.isArray(message)) {
          message = message.join('. ')
        }
        const err = new Error(message)
        err.status = res.status
        throw err
      }

      const actualizada = await res.json().catch(() => null)
      if (actualizada) {
        upsertReserva(mapReserva(actualizada))
      } else {
        // Fallback: re-fetch entry
        fetchReservaById(rawId)
      }

      return { success: true }
    } catch (err) {
      error.value = err.message || 'Error al cambiar estado a presente'
      return { success: false, status: err.status }
    }
  }

  /* =====================================================
   * GET LOCAL
   * ===================================================== */
  const getReserva = (id) => {
    return reservas.value.find(r => r.id === id) || null
  }

  /* =====================================================
   * GET BY DOCTOR
   * ===================================================== */
  const fetchReservasByDoctor = async (idPersona) => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/reservas-pacientes/doctor/${idPersona}`, {
        headers: authStore.authHeaders()
      })
      if (!res.ok) throw new Error()
      const response = await res.json()
      const data = Array.isArray(response) ? response : (response.data || [])
      const mapped = data.map((r) =>
        mapReserva({
          ...r,
          idReservaPaciente: r.idReservaPaciente ?? r.id_reserva_paciente,
        }),
      )

      mapped.forEach(upsertReserva)
      return mapped
    } catch (err) {
      error.value = 'Error al cargar reservas del doctor'
      return []
    } finally {
      loading.value = false
    }
  }

  /* =====================================================
   * GET BY USUARIO
   * ===================================================== */
  const fetchReservasByUsuario = async (idUsuario) => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/reservas-pacientes/usuario/${idUsuario}`, {
        headers: authStore.authHeaders()
      })
      if (!res.ok) throw new Error()
      const response = await res.json()
      const data = Array.isArray(response) ? response : (response.data || [])
      const mapped = data.map((r) => {
        const enriched = {
          ...r,
          idUsuario,
          idReservaPaciente: r.idReservaPaciente ?? r.id_reserva_paciente,
          idReservaCancelada: r.idReservaCancelada ?? r.id_reserva_cancelada,
        }
        return mapReserva(enriched)
      })

      mapped.forEach(upsertReserva)
      return mapped
    } catch (err) {
      error.value = 'Error al cargar reservas del usuario'
      return []
    } finally {
      loading.value = false
    }
  }

  /* =====================================================
   * GET PROGRAMADAS BY USUARIO
   * ===================================================== */
  const fetchReservasProgramadasByUsuario = async (idUsuario) => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/reservas-pacientes/usuario/${idUsuario}/programadas`, {
        headers: authStore.authHeaders()
      })
      if (!res.ok) throw new Error()
      const response = await res.json()
      const data = Array.isArray(response) ? response : (response.data || [])

      const mapped = data.map((r) => {
        const enriched = {
          ...r,
          idUsuario,
          idReservaPaciente: r.idReservaPaciente ?? r.id_reserva_paciente,
        }
        return mapReserva(enriched)
      })

      mapped.forEach(upsertReserva)
      return mapped
    } catch (err) {
      error.value = 'Error al cargar reservas programadas'
      return []
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    reservas.value = []
    loading.value = false
    error.value = null
  }

  const ensureReservaIdentificada = async (reserva, idPersona) => {
    if (!reserva) return null

    let rawId = extractReservaRawId(reserva)
    if (rawId != null) {
      return {
        reserva,
        rawId,
        id: getReservaIdPrefijado(reserva) ?? `active_${rawId}`,
      }
    }

    if (!idPersona) return null

    const delDoctor = await fetchReservasByDoctor(idPersona)
    const match = (delDoctor || []).find((r) => mismaCita(r, reserva) && extractReservaRawId(r))
    if (!match) return null

    rawId = extractReservaRawId(match)
    return {
      reserva: { ...reserva, ...match },
      rawId,
      id: getReservaIdPrefijado(match) ?? `active_${rawId}`,
    }
  }

  return {
    reservas,
    loading,
    error,
    fetchReservas,
    fetchReservaById,
    fetchReservasByDoctor,
    fetchReservasByUsuario,
    fetchReservasProgramadasByUsuario,
    createReserva,
    createReservaSinReserva,
    updateReserva,
    deleteReserva,
    cancelarReservaDoctor,
    reagendarReserva,
    markAsPresent,
    markAsAtendido,
    getReserva,
    reset,
    resolveReservaApiId: extractReservaRawId,
    ensureReservaIdentificada,
  }
})
