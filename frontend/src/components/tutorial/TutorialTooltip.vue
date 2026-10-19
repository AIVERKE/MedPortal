<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { getViewport } from '@/utils/tutorialViewport'

const props = defineProps({
  step: {
    type: Object,
    default: null,
  },
  rect: {
    type: Object,
    default: null,
  },
  stepIndex: {
    type: Number,
    default: 0,
  },
  totalSteps: {
    type: Number,
    default: 0,
  },
  canSkip: {
    type: Boolean,
    default: false,
  },
  showNext: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['next', 'skip', 'finish'])

const { mobile } = useDisplay()

const layout = computed(() => {
  if (props.step?.centered || !props.rect) {
    return { placement: 'center', style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } }
  }

  const vp = getViewport()
  const gap = 12
  const tooltipWidth = Math.min(320, vp.width - 24)
  const tooltipHeight = mobile.value ? 168 : 180
  const { top, left, width, height } = props.rect
  const bottomNav = mobile.value ? 64 : 0
  const safeTop = 12
  const safeBottom = bottomNav + 12

  const spaceAbove = top - safeTop
  const spaceBelow = vp.height - (top + height) - safeBottom
  const preferred = props.step?.placement || 'bottom'
  let placement = preferred

  if (mobile.value) {
    if (preferred === 'right' || preferred === 'left') {
      placement = spaceAbove >= tooltipHeight + gap || spaceAbove >= spaceBelow ? 'top' : 'bottom'
    }
    const targetNearBottom = top + height > vp.height - bottomNav - 24
    if (targetNearBottom) placement = 'top'
    else if (spaceBelow < tooltipHeight + gap && spaceAbove >= tooltipHeight + gap) placement = 'top'
    else if (spaceAbove < tooltipHeight + gap && spaceBelow >= tooltipHeight + gap) placement = 'bottom'
    else if (spaceAbove < tooltipHeight + gap && spaceBelow < tooltipHeight + gap) placement = 'dock'
  }

  if (placement === 'dock') {
    return {
      placement: 'dock',
      style: {
        top: `${safeTop}px`,
        left: '12px',
        width: `${vp.width - 24}px`,
        maxWidth: `${vp.width - 24}px`,
      },
    }
  }

  const clampLeft = (raw) => Math.min(Math.max(raw, 12), Math.max(12, vp.width - tooltipWidth - 12))

  if (placement === 'bottom') {
    return {
      placement,
      style: {
        top: `${Math.min(top + height + gap, vp.height - tooltipHeight - safeBottom)}px`,
        left: `${clampLeft(left + width / 2 - tooltipWidth / 2)}px`,
        width: `${tooltipWidth}px`,
      },
    }
  }

  if (placement === 'top') {
    return {
      placement,
      style: {
        top: `${Math.max(top - gap - tooltipHeight, safeTop)}px`,
        left: `${clampLeft(left + width / 2 - tooltipWidth / 2)}px`,
        width: `${tooltipWidth}px`,
      },
    }
  }

  if (placement === 'right') {
    return {
      placement,
      style: {
        top: `${Math.min(Math.max(top + height / 2 - tooltipHeight / 2, safeTop), vp.height - tooltipHeight - safeBottom)}px`,
        left: `${Math.min(left + width + gap, vp.width - tooltipWidth - 12)}px`,
        width: `${tooltipWidth}px`,
      },
    }
  }

  return {
    placement: 'left',
    style: {
      top: `${Math.min(Math.max(top + height / 2 - tooltipHeight / 2, safeTop), vp.height - tooltipHeight - safeBottom)}px`,
      left: `${Math.max(left - gap - tooltipWidth, 12)}px`,
      width: `${tooltipWidth}px`,
    },
  }
})

const placement = computed(() => layout.value.placement)
const tooltipStyle = computed(() => layout.value.style)
const arrowClass = computed(() => `tutorial-tooltip__arrow tutorial-tooltip__arrow--${placement.value}`)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="step"
      class="tutorial-tooltip"
      :class="{
        'tutorial-tooltip--centered': placement === 'center',
        'tutorial-tooltip--dock': placement === 'dock',
        'tutorial-tooltip--mobile': mobile,
      }"
      :style="tooltipStyle"
      role="dialog"
      aria-live="polite"
    >
      <div v-if="placement !== 'center' && placement !== 'dock'" :class="arrowClass" />

      <div class="tutorial-tooltip__header">
        <v-icon icon="mdi-gamepad-variant" color="primary" size="22" class="me-2" />
        <span class="tutorial-tooltip__step">{{ stepIndex + 1 }} / {{ totalSteps }}</span>
      </div>

      <h3 class="tutorial-tooltip__title">{{ step.title }}</h3>
      <p class="tutorial-tooltip__message">{{ step.message }}</p>

      <div class="tutorial-tooltip__actions">
        <v-btn
          v-if="canSkip"
          variant="text"
          color="grey-darken-1"
          class="text-none font-weight-bold"
          size="small"
          @click="$emit('skip')"
        >
          Omitir
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="showNext"
          color="primary"
          variant="flat"
          class="text-none font-weight-bold"
          size="small"
          rounded="lg"
          @click="step.advanceOn === 'finish' ? $emit('finish') : $emit('next')"
        >
          {{ step.advanceOn === 'finish' ? 'Finalizar' : 'Siguiente' }}
        </v-btn>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tutorial-tooltip {
  position: fixed;
  z-index: 2700;
  width: min(320px, calc(100vw - 24px));
  background: #fff;
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  pointer-events: auto;
  transition: all 0.25s ease;
}

.tutorial-tooltip--centered {
  text-align: center;
}

.tutorial-tooltip--mobile {
  max-height: min(42vh, 280px);
  overflow: auto;
}

.tutorial-tooltip--dock {
  text-align: left;
}

.tutorial-tooltip__header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.tutorial-tooltip__step {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(var(--v-theme-primary), 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tutorial-tooltip__title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0 0 8px;
  line-height: 1.3;
}

.tutorial-tooltip__message {
  font-size: 0.9rem;
  color: #5a5a72;
  margin: 0 0 14px;
  line-height: 1.5;
}

.tutorial-tooltip__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tutorial-tooltip__arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  transform: rotate(45deg);
  box-shadow: -2px -2px 4px rgba(0, 0, 0, 0.06);
}

.tutorial-tooltip__arrow--bottom {
  top: -6px;
  left: 50%;
  margin-left: -6px;
}

.tutorial-tooltip__arrow--top {
  bottom: -6px;
  left: 50%;
  margin-left: -6px;
}

.tutorial-tooltip__arrow--right {
  left: -6px;
  top: 50%;
  margin-top: -6px;
}

.tutorial-tooltip__arrow--left {
  right: -6px;
  top: 50%;
  margin-top: -6px;
}
</style>
