const TIMEZONE = 'America/La_Paz';

export function getLaPazDateParts(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value || 0);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
  };
}

export function formatLaPazDateKey(date: Date = new Date()): string {
  const { year, month, day } = getLaPazDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function normalizeDateStr(date: Date | string | null): string {
  if (!date) return '';
  if (typeof date === 'string') {
    return date.includes('T') ? date.slice(0, 10) : date;
  }
  return date.toISOString().slice(0, 10);
}

export function formatTimeShort(timeStr: string | null): string {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
}

export function parseAppointmentDateTime(
  fechaCita: Date | string | null,
  horaInicioCita: string | null,
): Date | null {
  const dateStr = normalizeDateStr(fechaCita);
  if (!dateStr || !horaInicioCita) return null;

  const timePart = horaInicioCita.substring(0, 8);
  return new Date(`${dateStr}T${timePart}-04:00`);
}

export function formatDisplayDate(fechaCita: Date | string | null): string {
  const dateStr = normalizeDateStr(fechaCita);
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function isWithinWindow(
  targetMs: number,
  nowMs: number,
  windowMinutes: number,
): boolean {
  const diff = Math.abs(targetMs - nowMs);
  return diff <= windowMinutes * 60 * 1000;
}

export function getPersonaFullName(persona?: {
  nombres?: string;
  primerApellido?: string;
  segundoApellido?: string;
} | null): string {
  if (!persona) return 'Paciente';
  return [persona.nombres, persona.primerApellido, persona.segundoApellido]
    .filter(Boolean)
    .join(' ')
    .trim();
}
