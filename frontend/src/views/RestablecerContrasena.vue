<template>
  <v-app>
    <v-main class="bg-surface">
      <div class="page-wrap d-flex align-center justify-center pa-4">
        <v-card max-width="440" width="100%" rounded="lg" elevation="2" class="pa-6 pa-md-8">
          <div class="text-center mb-6">
            <h1 class="text-h5 font-weight-bold mb-1">Restablecer contraseña</h1>
            <p class="text-body-2 text-medium-emphasis">
              Elige una contraseña nueva de al menos 8 caracteres.
            </p>
          </div>

          <v-alert v-if="!token" type="warning" variant="tonal" class="mb-4" density="comfortable">
            El enlace no incluye un token válido. Solicita uno nuevo desde «Olvidé mi contraseña».
          </v-alert>

          <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4" density="comfortable">
            {{ successMessage }}
          </v-alert>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4" density="comfortable">
            {{ errorMessage }}
          </v-alert>

          <v-form v-if="token && !done" @submit.prevent="onSubmit">
            <v-label class="mb-2 text-caption text-medium-emphasis font-weight-bold">
              NUEVA CONTRASEÑA
            </v-label>
            <v-text-field
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              variant="outlined"
              color="primary"
              class="mb-4"
              rounded="lg"
              hide-details="auto"
              density="comfortable"
              :disabled="loading"
            />

            <v-label class="mb-2 text-caption text-medium-emphasis font-weight-bold">
              CONFIRMAR CONTRASEÑA
            </v-label>
            <v-text-field
              v-model="confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock-check-outline"
              :append-inner-icon="showConfirm ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showConfirm = !showConfirm"
              variant="outlined"
              color="primary"
              class="mb-6"
              rounded="lg"
              hide-details="auto"
              density="comfortable"
              :disabled="loading"
            />

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              rounded="lg"
              :loading="loading"
              :disabled="!canSubmit"
            >
              Guardar contraseña
            </v-btn>
          </v-form>

          <div class="text-center mt-6">
            <router-link to="/login" class="text-decoration-none text-primary text-body-2 font-weight-medium">
              Ir al inicio de sesión
            </router-link>
          </div>
        </v-card>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value.trim() : ''
})

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const done = ref(false)

const canSubmit = computed(
  () =>
    token.value &&
    newPassword.value.length >= 8 &&
    newPassword.value === confirmPassword.value,
)

const onSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden.'
    return
  }
  if (newPassword.value.length < 8) {
    errorMessage.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  loading.value = true
  try {
    const data = await authStore.resetPassword({
      token: token.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    })
    done.value = true
    successMessage.value =
      data?.message || 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.'
  } catch (e) {
    errorMessage.value = e.message || 'No se pudo restablecer la contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-wrap {
  min-height: 100vh;
  background: #f4f7fe;
}
</style>
