<template>
  <v-app>
    <v-main class="bg-surface">
      <div class="page-wrap d-flex align-center justify-center pa-4">
        <v-card max-width="440" width="100%" rounded="lg" elevation="2" class="pa-6 pa-md-8">
          <div class="text-center mb-6">
            <h1 class="text-h5 font-weight-bold mb-1">¿Olvidaste tu contraseña?</h1>
            <p class="text-body-2 text-medium-emphasis">
              Ingresa tu CI o usuario. Si la cuenta existe y tiene correo registrado, te enviaremos un enlace de recuperación.
            </p>
          </div>

          <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4" density="comfortable">
            {{ successMessage }}
          </v-alert>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4" density="comfortable">
            {{ errorMessage }}
          </v-alert>

          <v-form @submit.prevent="onSubmit">
            <v-label class="mb-2 text-caption text-medium-emphasis font-weight-bold">
              USUARIO O CÉDULA DE IDENTIDAD
            </v-label>
            <v-text-field
              v-model="username"
              prepend-inner-icon="mdi-account-outline"
              placeholder="Usuario o número de documento"
              variant="outlined"
              color="primary"
              class="mb-4"
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
              :disabled="!username.trim()"
            >
              Enviar enlace
            </v-btn>
          </v-form>

          <div class="text-center mt-6">
            <router-link to="/login" class="text-decoration-none text-primary text-body-2 font-weight-medium">
              Volver al inicio de sesión
            </router-link>
          </div>
        </v-card>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const username = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const onSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  loading.value = true
  try {
    const data = await authStore.forgotPassword(username.value.trim())
    successMessage.value =
      data?.message ||
      'Si el usuario existe y tiene un correo registrado, enviaremos instrucciones para restablecer la contraseña.'
  } catch (e) {
    errorMessage.value = e.message || 'No se pudo procesar la solicitud.'
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
