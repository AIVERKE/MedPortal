const PATIENT_STORAGE_PREFIX = 'reservation_tutorial_completed_'
const DOCTOR_STORAGE_PREFIX = 'doctor_tutorial_'

export function getTutorialStorageKey(userId) {
  return `${PATIENT_STORAGE_PREFIX}${userId}`
}

export function hasCompletedTutorial(userId) {
  if (!userId) return true
  return localStorage.getItem(getTutorialStorageKey(userId)) === 'true'
}

export function markTutorialCompleted(userId) {
  if (!userId) return
  localStorage.setItem(getTutorialStorageKey(userId), 'true')
}

export function clearTutorialCompleted(userId) {
  if (!userId) return
  localStorage.removeItem(getTutorialStorageKey(userId))
}

export function getDoctorTutorialStorageKey(tutorialId, userId) {
  return `${DOCTOR_STORAGE_PREFIX}${tutorialId}_completed_${userId}`
}

export function hasCompletedDoctorTutorial(tutorialId, userId) {
  if (!userId || !tutorialId) return true
  return localStorage.getItem(getDoctorTutorialStorageKey(tutorialId, userId)) === 'true'
}

export function markDoctorTutorialCompleted(tutorialId, userId) {
  if (!userId || !tutorialId) return
  localStorage.setItem(getDoctorTutorialStorageKey(tutorialId, userId), 'true')
}

export function clearDoctorTutorialCompleted(tutorialId, userId) {
  if (!userId || !tutorialId) return
  localStorage.removeItem(getDoctorTutorialStorageKey(tutorialId, userId))
}
