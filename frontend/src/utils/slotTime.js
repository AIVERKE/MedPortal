/**
 * Utilidades para rangos de slots de agenda/reserva.
 * Evita mostrar tramos incompletos al final del horario
 * (ej. 08:00-12:00 con citas de 45 min -> fin efectivo 11:45).
 */

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const parts = String(timeStr).split(':').map(Number)
  return (parts[0] || 0) * 60 + (parts[1] || 0)
}

export function minutesToTime(totalMinutes) {
  const safe = Math.max(0, Math.floor(totalMinutes))
  const h = Math.floor(safe / 60) % 24
  const m = safe % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

/**
 * Devuelve un slotMaxTime alineado al último intervalo completo desde slotMinTime.
 * Si no cabe ningún intervalo, mantiene slotMinTime.
 */
export function alignSlotMaxToCompleteIntervals(slotMinTime, slotMaxTime, intervalMinutes) {
  const interval = Number(intervalMinutes)
  if (!Number.isFinite(interval) || interval <= 0) return slotMaxTime

  const min = timeToMinutes(slotMinTime)
  const max = timeToMinutes(slotMaxTime)
  if (max <= min) return slotMaxTime

  const completeSpan = Math.floor((max - min) / interval) * interval
  return minutesToTime(min + completeSpan)
}
