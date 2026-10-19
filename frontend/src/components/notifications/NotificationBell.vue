<template>
  <v-menu location="bottom end" :close-on-content-click="false" max-width="380">
    <template #activator="{ props }">
      <v-btn icon v-bind="props" color="white" class="mr-2">
        <v-badge
          :content="unreadCount"
          :model-value="unreadCount > 0"
          color="error"
          overlap
        >
          <v-icon size="26">mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card class="rounded-xl" min-width="320">
      <v-card-title class="d-flex align-center justify-space-between py-3 px-4">
        <span class="text-subtitle-1 font-weight-bold">Notificaciones</span>
        <v-btn
          v-if="unreadCount > 0"
          size="small"
          variant="text"
          color="primary"
          class="text-none"
          @click="handleMarkAll"
        >
          Marcar todas
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <div v-if="loading" class="pa-6 text-center">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
      </div>

      <div v-else-if="notifications.length === 0" class="pa-6 text-center text-medium-emphasis">
        <v-icon size="40" class="mb-2">mdi-bell-off-outline</v-icon>
        <p class="text-body-2 mb-0">No tienes notificaciones</p>
      </div>

      <v-list v-else density="compact" class="py-0" max-height="360" style="overflow-y: auto;">
        <v-list-item
          v-for="item in notifications.slice(0, 10)"
          :key="item.id"
          :class="{ 'bg-indigo-lighten-5': !item.leida }"
          @click="handleItemClick(item)"
        >
          <template #prepend>
            <v-icon :color="item.leida ? 'grey' : 'primary'" size="20">
              {{ getIcon(item.tipo) }}
            </v-icon>
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ item.titulo }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption mt-1">
            {{ truncate(item.mensaje, 80) }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications'

const notificationsStore = useNotificationsStore()
const { notifications, unreadCount, loading } = storeToRefs(notificationsStore)

onMounted(() => {
  notificationsStore.fetchNotifications()
})

const getIcon = (tipo) => {
  if (tipo === 'CITA_NUEVA_RESERVA') return 'mdi-calendar-check'
  if (tipo?.includes('RESUMEN')) return 'mdi-clipboard-text-clock-outline'
  if (tipo?.includes('1H')) return 'mdi-bell-ring-outline'
  return 'mdi-calendar-clock'
}

const truncate = (text, max) => {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

const handleItemClick = async (item) => {
  if (!item.leida) {
    await notificationsStore.markAsRead(item.id)
  }
}

const handleMarkAll = async () => {
  await notificationsStore.markAllAsRead()
  await notificationsStore.fetchNotifications()
}
</script>
