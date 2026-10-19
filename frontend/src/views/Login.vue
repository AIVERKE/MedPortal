<template>
    <v-app>
        <v-main>
            <div class="login-wrapper bg-surface" :class="{ 'show-register': isRegistering }">
                <div class="views-container">
                    <!-- Vista de Login -->
                    <div class="view-item">
                        <LoginInicio @register="isRegistering = true" />
                    </div>

                    <!-- Vista de Registro: solo montar al abrir "Crear cuenta" -->
                    <div class="view-item">
                        <RegistrarLogin v-if="isRegistering" @back="isRegistering = false" />
                    </div>
                </div>
            </div>
        </v-main>
    </v-app>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import LoginInicio from '@/components/auth/LoginInicio.vue'
import RegistrarLogin from '@/components/register/RegistrarLogin.vue'

const route = useRoute()
const isRegistering = ref(false)

const syncRegisterMode = () => {
    isRegistering.value = route.query.register === '1' || route.query.mode === 'register'
}

onMounted(syncRegisterMode)
watch(() => route.query, syncRegisterMode)
</script>

<style scoped>
.login-wrapper {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    background: #f4f7fe;
}

.views-container {
    display: flex;
    width: 200vw;
    height: 100%;
    transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}

.view-item {
    width: 100vw;
    height: 100%;
}

.show-register .views-container {
    transform: translateX(-100vw);
}

@media (max-width: 960px) {
    .login-wrapper {
        height: auto;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .views-container {
        flex-direction: column;
        width: 100vw;
        height: auto;
        transform: none !important;
    }

    .view-item {
        width: 100vw;
        height: auto;
        display: none;
    }

    .view-item:first-child {
        display: block;
    }

    .show-register .view-item:first-child {
        display: none;
    }

    .show-register .view-item:last-child {
        display: block;
    }
}
</style>
