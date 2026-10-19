<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'
import TutorialProvider from './components/tutorial/TutorialProvider.vue'

const route = useRoute()
const usePublicLayout = computed(
    () => route.meta?.publicLayout === true || route.name === 'login' || route.name === 'landing',
)
</script>

<template>
    <TutorialProvider />
    <router-view v-if="usePublicLayout" />
    <app-layout v-else />
</template>
