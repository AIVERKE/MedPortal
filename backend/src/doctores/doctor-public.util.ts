import { Doctor } from '../modules/medical/entities/doctor.entity';

/**
 * Oculta telefonoEmergencia en respuestas orientadas a pacientes
 * salvo que el doctor haya consentido compartirlo.
 */
export function sanitizeDoctorTelefonoPublico<T extends Partial<Doctor> | null | undefined>(
  doctor: T,
): T {
  if (!doctor || typeof doctor !== 'object') return doctor;
  if (doctor.compartirTelefonoEmergencia === true) {
    return doctor;
  }
  return {
    ...doctor,
    telefonoEmergencia: null,
  };
}

export function sanitizeAsignacionDoctorPublico<T extends { doctor?: Doctor | null }>(
  asignacion: T,
): T {
  if (!asignacion?.doctor) return asignacion;
  return {
    ...asignacion,
    doctor: sanitizeDoctorTelefonoPublico(asignacion.doctor),
  };
}
