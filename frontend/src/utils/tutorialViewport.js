export function getViewport() {
  const visual = window.visualViewport
  return {
    width: visual?.width || window.innerWidth,
    height: visual?.height || window.innerHeight,
    offsetTop: visual?.offsetTop || 0,
    offsetLeft: visual?.offsetLeft || 0,
  }
}

export function visibleArea(el) {
  if (!el) return 0
  const r = el.getBoundingClientRect()
  const vp = getViewport()
  const left = Math.max(r.left, 0)
  const top = Math.max(r.top, 0)
  const right = Math.min(r.right, vp.width)
  const bottom = Math.min(r.bottom, vp.height)
  return Math.max(0, right - left) * Math.max(0, bottom - top)
}

export function isInViewport(el, minArea = 8) {
  return visibleArea(el) >= minArea
}

export function isInFixedLayer(el) {
  let node = el
  while (node && node !== document.body) {
    const position = window.getComputedStyle(node).position
    if (position === 'fixed') return true
    node = node.parentElement
  }
  return false
}

export function scrollTargetIntoView(el) {
  if (!el || isInFixedLayer(el)) return
  const vp = getViewport()
  const r = el.getBoundingClientRect()
  const topGap = 96
  const bottomGap = 88
  const fullyVisible = r.top >= topGap && r.bottom <= vp.height - bottomGap
  if (fullyVisible) return
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
}
