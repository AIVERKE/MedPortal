export const extractReservaRawId = (value) => {
  if (value == null) return null

  if (typeof value === 'object') {
    const source = value.reservaPaciente ?? value.reserva ?? value
    const r = source === value ? value : { ...value, ...source }
    const direct = [
      r.rawId,
      r.idReservaPaciente,
      r.idReservaCancelada,
      r.idReserva,
      r.id_reserva_paciente,
      r.id_reserva_cancelada,
      r.id_reserva,
    ].find((v) => v != null && v !== '' && String(v) !== 'undefined')

    if (direct != null) return direct

    if (typeof r.id === 'string' && r.id.includes('_')) {
      const part = r.id.split('_').pop()
      if (part && part !== 'undefined' && !Number.isNaN(Number(part))) {
        return Number(part)
      }
    }

    if (typeof r.id === 'number') return r.id
    return null
  }

  if (typeof value === 'number' && !Number.isNaN(value)) return value

  if (typeof value === 'string') {
    if (value === 'undefined' || value === 'null' || value === '') return null
    if (value.includes('_')) {
      const part = value.split('_').pop()
      if (part && part !== 'undefined' && !Number.isNaN(Number(part))) {
        return Number(part)
      }
    }
    if (!Number.isNaN(Number(value))) return Number(value)
  }

  return null
}

export const normalizeFechaCita = (value) => {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const str = String(value)
  return str.includes('T') ? str.slice(0, 10) : str.slice(0, 10)
}

export const normalizeHoraCita = (timeStr) => {
  if (!timeStr) return '00:00:00'
  const parts = String(timeStr).split(':')
  const h = String(parts[0] || '0').padStart(2, '0')
  const m = String(parts[1] || '0').padStart(2, '0')
  const s = String(parseInt(parts[2] || '0', 10) || 0).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export const getReservaIdPrefijado = (reserva) => {
  if (!reserva) return null
  if (reserva.id) return String(reserva.id)
  const rawId = extractReservaRawId(reserva)
  if (rawId == null) return null
  const status = (reserva.estado || '').toUpperCase()
  const isCancelled = ['CANCELADA', 'CANCELADO', 'RECHAZADA', 'ANULADA'].includes(status)
  const prefix = isCancelled ? 'cancelled_' : 'active_'
  return `${prefix}${rawId}`
}

export const mismaCita = (a, b) => {
  if (!a || !b) return false
  const mismaFecha = normalizeFechaCita(a.fechaCita) === normalizeFechaCita(b.fechaCita)
  const mismaHora = normalizeHoraCita(a.horaInicioCita) === normalizeHoraCita(b.horaInicioCita)
  if (!mismaFecha || !mismaHora) return false

  const usuarioA = a.idUsuario || a.paciente?.id
  const usuarioB = b.idUsuario || b.paciente?.id
  if (usuarioA && usuarioB && String(usuarioA) !== String(usuarioB)) return false

  return true
}

export const coincideReservaId = (reserva, reservaId) => {
  if (!reserva || reservaId == null || reservaId === '') return false
  const target = String(reservaId)
  if (reserva.id != null && String(reserva.id) === target) return true
  if (reserva.rawId != null && String(reserva.rawId) === target) return true
  if (reserva.rawId != null && `active_${reserva.rawId}` === target) return true
  if (reserva.rawId != null && `cancelled_${reserva.rawId}` === target) return true
  return false
}

export const buildReservaQuery = (reserva) => {
  const rawId = extractReservaRawId(reserva)
  const reservaId = getReservaIdPrefijado(reserva) ?? (rawId != null ? `active_${rawId}` : null)
  return {
    fecha: normalizeFechaCita(reserva?.fechaCita),
    reservaId,
  }
}

export const getReservaRawIdString = (reserva) => {
  const rawId = extractReservaRawId(reserva)
  return rawId != null ? String(rawId) : null
}

const CITA_DASHBOARD_KEY = 'medicina.citaDashboard'

export const guardarCitaDashboard = (reserva) => {
  try {
    sessionStorage.setItem(CITA_DASHBOARD_KEY, JSON.stringify(reserva))
  } catch {
    /* el detalle sigue disponible por query si el almacenamiento falla */
  }
}

export const tomarCitaDashboard = (reservaId) => {
  try {
    const raw = sessionStorage.getItem(CITA_DASHBOARD_KEY)
    sessionStorage.removeItem(CITA_DASHBOARD_KEY)
    if (!raw || reservaId == null || reservaId === '') return null
    const parsed = JSON.parse(raw)
    return coincideReservaId(parsed, reservaId) ? parsed : null
  } catch {
    return null
  }
}
