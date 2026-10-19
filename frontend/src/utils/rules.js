export const rules = {
  required: value => !!value || 'Este campo es requerido',

  minLength: min => value =>
    (value && value.length >= min) || `Mínimo ${min} caracteres`,

  codigo: value => {
    if (!value) return 'El código es requerido';
    if (!/^[A-Z0-9-]+$/i.test(value)) return 'Solo letras, números y guiones';
    return true;
  },

  // Times: value in "HH:MM" format (string)
  minStartTime: (min = '00:00') => value => {
    if (!value) return 'La hora inicio es requerida';
    return value >= min || `La hora inicio no puede ser antes de ${min}`;
  },

  maxEndTime: (max = '23:59') => value => {
    if (!value) return 'La hora fin es requerida';
    return value <= max || `La hora fin no puede ser mayor que ${max}`;
  },

  // evita que sean iguales (usa value pasado y el otherRef para comparar)
  timeNotEqual: otherRef => value => {
    if (!value || !otherRef?.value) return true;
    return value !== otherRef.value || 'La hora inicio y fin no pueden ser iguales';
  },

  // asegura que inicio < fin; usa el value actual (que Vuetify pasa) y el endRef
  startBeforeEnd: (startRef, endRef) => value => {
    const s = value ?? startRef?.value
    const e = endRef?.value
    if (!s || !e) return true
    return s < e || 'La hora inicio debe ser antes que la hora fin'
  },

  // asegura que fin > inicio; usa el value actual (que Vuetify pasa) y el startRef
  endAfterStart: (startRef, endRef) => value => {
    const e = value ?? endRef?.value
    const s = startRef?.value
    if (!s || !e) return true
    return e > s || 'La hora fin debe ser después de la hora inicio'
  },

  // numérico sólo (entero no negativo)
  numericOnly: value => {
    if (value === null || value === undefined || value === '') return 'Este campo es requerido'
    return (/^\d+$/.test(String(value))) || 'Solo números enteros'
  },

  minAnticipation: (min = 0) => value => {
    if (value === null || value === undefined || value === '') return `La anticipación mínima es requerida y debe ser al menos ${min} días`
    return Number(value) >= min || `La anticipación mínima no puede ser menor a ${min} días`
  },

  maxAnticipation: (max = 30) => value => {
    if (value === null || value === undefined || value === '') return true
    return Number(value) <= max || `La anticipación máxima no puede ser mayor a ${max} días`
  },

  // valida que la anticipación mínima no sea mayor que la máxima
  minLessOrEqualMax: maxRef => value => {
    if (value === null || value === undefined || value === '') return true
    const maxVal = maxRef && typeof maxRef === 'object' && 'value' in maxRef ? maxRef.value : maxRef
    const max = Number(maxVal ?? 30)
    if (Number.isNaN(max)) return true
    return Number(value) <= max || 'La anticipación mínima no puede ser mayor a la máxima'
  },

  maxRequired: value => {
    return (value !== null && value !== undefined && value !== '') || 'La anticipación máxima debe estar definida'
  },

  maxGreaterOrEqualMin: minRef => value => {
    if (value === null || value === undefined || value === '') return 'La anticipación máxima es requerida'
    const minVal = minRef && typeof minRef === 'object' && 'value' in minRef ? minRef.value : minRef
    if (minVal === null || minVal === undefined) return true
    return Number(value) >= Number(minVal) || 'La anticipación máxima debe ser mayor o igual a la mínima'
  }
}