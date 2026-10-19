import {
  formatLaPazDateKey,
  parseAppointmentDateTime,
  isWithinWindow,
} from './notification-date.util';

describe('notification-date.util', () => {
  it('parsea fecha y hora de cita', () => {
    const dt = parseAppointmentDateTime('2026-06-25', '10:00:00');
    expect(dt).not.toBeNull();
    expect(dt!.getUTCHours()).toBe(14); // 10:00 La Paz = 14:00 UTC
  });

  it('detecta ventana de tiempo', () => {
    const target = Date.now() + 5 * 60 * 1000;
    expect(isWithinWindow(target, Date.now(), 15)).toBe(true);
    expect(isWithinWindow(target, Date.now(), 2)).toBe(false);
  });

  it('genera clave de fecha La Paz', () => {
    const key = formatLaPazDateKey(new Date('2026-06-25T12:00:00Z'));
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
