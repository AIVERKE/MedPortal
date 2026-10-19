import { ref, onUnmounted, watch } from 'vue'
import { isInViewport, scrollTargetIntoView, visibleArea } from '@/utils/tutorialViewport'

const HIGHLIGHT_CLASS = 'tutorial-highlight-target'

function isDisplayed(el) {
  if (!el) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    return false
  }
  return el.getClientRects().length > 0
}

export function useTutorialTarget(getStep) {
  const rect = ref(null)
  const rings = ref([])
  const targetElement = ref(null)
  let resizeObserver = null
  let retryTimer = null
  let highlightedEls = []

  function clearHighlight() {
    highlightedEls.forEach((el) => el.classList.remove(HIGHLIGHT_CLASS))
    highlightedEls = []
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS)
    })
  }

  function resolveTargets(step) {
    if (!step?.target) return []

    let nodes = Array.from(document.querySelectorAll(step.target)).filter(isDisplayed)

    if (!nodes.length && step.targetFallback) {
      nodes = Array.from(document.querySelectorAll(step.targetFallback)).filter(isDisplayed)
    }

    if (!nodes.length && String(step.target).includes('nav-reservar')) {
      nodes = Array.from(document.querySelectorAll('[data-tour="nav-reservar"]')).filter(isDisplayed)
    }

    if (!nodes.length && String(step.target).includes('nav-doctor-')) {
      const match = String(step.target).match(/nav-doctor-[\w-]+/)
      if (match) {
        nodes = Array.from(document.querySelectorAll(`[data-tour="${match[0]}"]`)).filter(isDisplayed)
      }
    }

    const onScreen = nodes.filter((el) => isInViewport(el))
    let ranked = (onScreen.length ? onScreen : nodes).sort((a, b) => visibleArea(b) - visibleArea(a))

    // En pasos de menú, preferir el ítem del sidebar sobre el bottom-nav.
    if (String(step.target || '').includes('nav-doctor-') || step.preferSidebarTourTarget) {
      const sidebarNodes = ranked.filter(
        (el) =>
          el.getAttribute('data-tour-surface') === 'sidebar' ||
          Boolean(el.closest('.v-navigation-drawer')),
      )
      if (sidebarNodes.length) ranked = sidebarNodes
    }

    return step.highlightAll ? ranked : ranked.slice(0, 1)
  }

  function resolveTarget(step) {
    return resolveTargets(step)[0] || null
  }

  function boundsToRect(bounds, padding) {
    return {
      top: bounds.top - padding,
      left: bounds.left - padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
    }
  }

  function unionRects(items) {
    const top = Math.min(...items.map((item) => item.top))
    const left = Math.min(...items.map((item) => item.left))
    const right = Math.max(...items.map((item) => item.left + item.width))
    const bottom = Math.max(...items.map((item) => item.top + item.height))
    return {
      top,
      left,
      width: right - left,
      height: bottom - top,
    }
  }

  function updateRect() {
    const step = getStep()
    if (!step || step.centered || !step.target) {
      rect.value = null
      rings.value = []
      targetElement.value = null
      clearHighlight()
      return
    }

    const els = resolveTargets(step)
    if (!els.length) {
      rect.value = null
      rings.value = []
      targetElement.value = null
      clearHighlight()
      return
    }

    targetElement.value = els[0]
    clearHighlight()
    els.forEach((el) => el.classList.add(HIGHLIGHT_CLASS))
    highlightedEls = els

    const padding = step.padding ?? (window.innerWidth < 960 ? 6 : 8)
    const itemRects = els.map((el) => boundsToRect(el.getBoundingClientRect(), padding))
    rings.value = itemRects
    const combined = itemRects.length === 1 ? itemRects[0] : unionRects(itemRects)
    const vpW = window.innerWidth
    const vpH = window.innerHeight
    const maxTop = Math.max(0, combined.top)
    const maxLeft = Math.max(0, combined.left)
    rect.value = {
      top: maxTop,
      left: maxLeft,
      width: Math.min(combined.width, vpW - maxLeft),
      height: Math.min(combined.height, vpH - maxTop),
    }
  }

  function waitForTarget(step, timeout = 15000) {
    return new Promise((resolve) => {
      const start = Date.now()

      const tryFind = () => {
        const els = resolveTargets(step)
        if (els.length) {
          scrollTargetIntoView(els[0])
          window.setTimeout(() => {
            updateRect()
            resolve(els[0])
          }, 80)
          return
        }
        if (Date.now() - start >= timeout) {
          resolve(null)
          return
        }
        retryTimer = window.setTimeout(tryFind, 150)
      }

      tryFind()
    })
  }

  function attachObservers() {
    detachObservers()
    resizeObserver = new ResizeObserver(() => updateRect())
    resizeObserver.observe(document.documentElement)
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    window.visualViewport?.addEventListener('resize', updateRect)
    window.visualViewport?.addEventListener('scroll', updateRect)
  }

  function detachObservers() {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    window.removeEventListener('scroll', updateRect, true)
    window.removeEventListener('resize', updateRect)
    window.visualViewport?.removeEventListener('resize', updateRect)
    window.visualViewport?.removeEventListener('scroll', updateRect)
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    clearHighlight()
  }

  watch(getStep, () => {
    updateRect()
  })

  onUnmounted(detachObservers)

  return {
    rect,
    rings,
    targetElement,
    updateRect,
    waitForTarget,
    resolveTarget,
    attachObservers,
    detachObservers,
    clearHighlight,
  }
}

export { HIGHLIGHT_CLASS }
