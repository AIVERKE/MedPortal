import {
  normalizeFechaCita,
  normalizeHoraCita,
  getReservaRawIdString,
} from '@/utils/reservaIdentity'

/** Estados que siguen ocupando cupo en agenda (alineado con backend). */
export const ESTADOS_OCUPAN_AGENDA = ['PENDIENTE', 'PRESENTE', 'ATRASO']

function toMinutes(timeStr) {
  const normalized = normalizeHoraCita(timeStr)
  const parts = normalized.split(':').map(Number)
  return parts[0] * 60 + (parts[1] || 0)
}

function slotsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB
}

function reservaSolapaEnFecha(r, fecha, horaInicio, horaFin) {
  if (!ESTADOS_OCUPAN_AGENDA.includes((r.estado || '').toUpperCase())) return false
  if (!r.horaInicioCita || !r.horaFinCita) return false
  if (normalizeFechaCita(r.fechaCita) !== fecha) return false
  return slotsOverlap(
    toMinutes(horaInicio),
    toMinutes(horaFin),
    toMinutes(r.horaInicioCita),
    toMinutes(r.horaFinCita),
  )
}

export function validarReagendacion({
  reservaActual,
  nuevoSlot,
  reservasPaciente,
  reservasDoctor,
  bloqueosDoctor,
}) {
  const rawIdActual = getReservaRawIdString(reservaActual)
  const fecha = normalizeFechaCita(nuevoSlot.fechaCita)
  const horaInicio = normalizeHoraCita(nuevoSlot.horaInicioCita)
  const horaFin = normalizeHoraCita(nuevoSlot.horaFinCita)

  const conflictoPaciente = (reservasPaciente || []).find((r) => {
    if (getReservaRawIdString(r) === rawIdActual) return false
    return reservaSolapaEnFecha(r, fecha, horaInicio, horaFin)
  })

  if (conflictoPaciente) {
    const doctorNombre = conflictoPaciente.doctor?.nombre || 'otro doctor'
    return {
      ok: false,
      tipo: 'paciente',
      mensaje: `El estudiante ya tiene una cita que se solapa el ${fecha} a las ${horaInicio.slice(0, 5)} con ${doctorNombre}. Elige otro horario.`,
    }
  }

  const nuevoStart = toMinutes(horaInicio)
  const nuevoEnd = toMinutes(horaFin)

  const conflictoDoctor = (reservasDoctor || []).find((r) => {
    if (getReservaRawIdString(r) === rawIdActual) return false
    return reservaSolapaEnFecha(r, fecha, horaInicio, horaFin)
  })

  if (conflictoDoctor) {
    return {
      ok: false,
      tipo: 'doctor',
      mensaje: 'Este horario ya está ocupado por otro paciente. Elige otro horario.',
    }
  }

  const conflictoBloqueo = (bloqueosDoctor || []).find((b) => {
    if (!b?.fecha || !b?.horaInicio || !b?.horaFin) return false
    if (normalizeFechaCita(b.fecha) !== fecha) return false
    return slotsOverlap(
      nuevoStart,
      nuevoEnd,
      toMinutes(b.horaInicio),
      toMinutes(b.horaFin),
    )
  })

  if (conflictoBloqueo) {
    return {
      ok: false,
      tipo: 'bloqueo',
      mensaje: 'Este horario no está disponible. Elige otro horario.',
    }
  }

  return { ok: true, tipo: null, mensaje: '' }
}
