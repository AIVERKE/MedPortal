import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_URL

const mapNotification = (data) => ({
  id: data.idNotificacion,
  tipo: data.tipo,
  titulo: data.titulo,
  mensaje: data.mensaje,
  leida: data.leida,
  metadata: data.metadata ?? {},
  idReservaPaciente: data.reservaPaciente?.idReservaPaciente ?? data.metadata?.idReservaPaciente ?? null,
  fechaCreacion: data.fechaCreacion,
  fechaLeida: data.fechaLeida,
})

export const useNotificationsStore = defineStore('notifications', () => {
  const authStore = useAuthStore()
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const popupQueue = ref([])
  const currentPopup = ref(null)
  const shownPopupIds = ref(new Set())

  const enqueuePopups = (items) => {
    for (const item of items) {
      if (item.leida || shownPopupIds.value.has(item.id)) continue
      if (popupQueue.value.some((p) => p.id === item.id)) continue
      if (currentPopup.value?.id === item.id) continue
      popupQueue.value.push(item)
    }
    showNextPopup()
  }

  const showNextPopup = () => {
    if (currentPopup.value || popupQueue.value.length === 0) return
    currentPopup.value = popupQueue.value.shift()
  }

  const dismissCurrentPopup = async () => {
    if (!currentPopup.value) return
    const id = currentPopup.value.id
    shownPopupIds.value.add(id)
    currentPopup.value = null
    await markAsRead(id)
    showNextPopup()
  }

  const fetchNotifications = async (soloNoLeidas = false) => {
    loading.value = true
    error.value = null
    try {
      const query = soloNoLeidas ? '?soloNoLeidas=true' : ''
      const res = await fetch(`${API_BASE}/notificaciones${query}`, {
        headers: authStore.authHeaders(),
      })
      if (!res.ok) throw new Error('Error al cargar notificaciones')
      const data = await res.json()
      notifications.value = data.map(mapNotification)
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/notificaciones/no-leidas/count`, {
        headers: authStore.authHeaders(),
      })
      if (!res.ok) return
      const data = await res.json()
      unreadCount.value = data.count ?? 0
    } catch (err) {
      console.error('Error al obtener contador de notificaciones:', err)
    }
  }

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notificaciones/${id}/leida`, {
        method: 'PATCH',
        headers: authStore.authHeaders(),
      })
      if (!res.ok) throw new Error('No se pudo marcar la notificación como leída')

      const notif = notifications.value.find((n) => n.id === id)
      if (notif) notif.leida = true
      if (unreadCount.value > 0) unreadCount.value -= 1

      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false }
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notificaciones/marcar-todas-leidas`, {
        method: 'PATCH',
        headers: authStore.authHeaders(),
      })
      if (!res.ok) throw new Error('No se pudieron marcar las notificaciones')

      notifications.value.forEach((n) => { n.leida = true })
      unreadCount.value = 0
      popupQueue.value = []
      currentPopup.value = null

      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false }
    }
  }

  const poll = async () => {
    if (!authStore.token) return

    await fetchUnreadCount()

    const prevIds = new Set(notifications.value.filter((n) => !n.leida).map((n) => n.id))
    const result = await fetchNotifications(true)
    if (!result.success) return

    const newUnread = notifications.value.filter(
      (n) => !n.leida && !prevIds.has(n.id) && !shownPopupIds.value.has(n.id),
    )
    enqueuePopups(newUnread)
  }

  const reset = () => {
    notifications.value = []
    unreadCount.value = 0
    loading.value = false
    error.value = null
    popupQueue.value = []
    currentPopup.value = null
    shownPopupIds.value = new Set()
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    popupQueue,
    currentPopup,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    poll,
    dismissCurrentPopup,
    showNextPopup,
    reset,
  }
})
