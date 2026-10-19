<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getViewport } from '@/utils/tutorialViewport'

defineProps({
  rect: {
    type: Object,
    default: null,
  },
  rings: {
    type: Array,
    default: () => [],
  },
  visible: {
    type: Boolean,
    default: false,
  },
})

const viewportW = ref(window.innerWidth)
const viewportH = ref(window.innerHeight)

function updateViewport() {
  const vp = getViewport()
  viewportW.value = vp.width
  viewportH.value = vp.height
}

onMounted(() => {
  window.addEventListener('resize', updateViewport)
  window.visualViewport?.addEventListener('resize', updateViewport)
  window.visualViewport?.addEventListener('scroll', updateViewport)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateViewport)
  window.visualViewport?.removeEventListener('resize', updateViewport)
  window.visualViewport?.removeEventListener('scroll', updateViewport)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="tutorial-fade">
      <div v-if="visible" class="tutorial-overlay-root" aria-hidden="true">
        <template v-if="rect">
          <div class="tutorial-overlay-panel tutorial-overlay-panel--top" :style="{ height: `${Math.max(rect.top, 0)}px` }" />
          <div
            class="tutorial-overlay-panel tutorial-overlay-panel--left"
            :style="{
              top: `${rect.top}px`,
              height: `${rect.height}px`,
              width: `${Math.max(rect.left, 0)}px`,
            }"
          />
          <div
            class="tutorial-overlay-panel tutorial-overlay-panel--right"
            :style="{
              top: `${rect.top}px`,
              left: `${rect.left + rect.width}px`,
              height: `${rect.height}px`,
              width: `${Math.max(viewportW - rect.left - rect.width, 0)}px`,
            }"
          />
          <div
            class="tutorial-overlay-panel tutorial-overlay-panel--bottom"
            :style="{
              top: `${rect.top + rect.height}px`,
              height: `${Math.max(viewportH - rect.top - rect.height, 0)}px`,
            }"
          />
          <div
            v-for="(ring, index) in (rings.length ? rings : (rect ? [rect] : []))"
            :key="index"
            class="tutorial-spotlight-ring"
            :style="{
              top: `${ring.top}px`,
              left: `${ring.left}px`,
              width: `${ring.width}px`,
              height: `${ring.height}px`,
            }"
          />
        </template>
        <div v-else class="tutorial-overlay-full" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tutorial-overlay-root {
  position: fixed;
  inset: 0;
  z-index: 2600;
  pointer-events: none;
}

.tutorial-overlay-panel,
.tutorial-overlay-full {
  position: fixed;
  background: rgba(0, 0, 0, 0.65);
  pointer-events: auto;
  touch-action: none;
  transition: all 0.25s ease;
}

.tutorial-overlay-panel--top {
  top: 0;
  left: 0;
  right: 0;
}

.tutorial-overlay-panel--bottom {
  left: 0;
  right: 0;
  bottom: 0;
}

.tutorial-overlay-full {
  inset: 0;
}

.tutorial-spotlight-ring {
  position: fixed;
  border: 2px solid rgb(var(--v-theme-primary));
  border-radius: 12px;
  box-shadow:
    0 0 0 4px rgba(var(--v-theme-primary), 0.25),
    0 0 24px rgba(var(--v-theme-primary), 0.45);
  pointer-events: none;
  animation: tutorial-pulse 2s ease-in-out infinite;
  transition: all 0.25s ease;
}

@keyframes tutorial-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 4px rgba(var(--v-theme-primary), 0.25),
      0 0 24px rgba(var(--v-theme-primary), 0.45);
  }
  50% {
    box-shadow:
      0 0 0 8px rgba(var(--v-theme-primary), 0.15),
      0 0 32px rgba(var(--v-theme-primary), 0.6);
  }
}

.tutorial-fade-enter-active,
.tutorial-fade-leave-active {
  transition: opacity 0.25s ease;
}

.tutorial-fade-enter-from,
.tutorial-fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* Marca visible del target (sirve también dentro del sidebar).
   Sin z-index alto para no tapar el menú con el contenido del dashboard. */
.tutorial-highlight-target {
  position: relative !important;
  pointer-events: auto !important;
  outline: 3px solid rgb(var(--v-theme-primary)) !important;
  outline-offset: 2px !important;
  box-shadow:
    0 0 0 6px rgba(var(--v-theme-primary), 0.22),
    0 0 20px rgba(var(--v-theme-primary), 0.45) !important;
  border-radius: 16px !important;
  z-index: 1 !important;
}
</style>
