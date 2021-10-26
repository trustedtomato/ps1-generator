export function getBoundingDocumentRect (el: Element): DOMRect {
  const clientRect = el.getBoundingClientRect()
  const left = clientRect.left + scrollX
  const right = clientRect.right + scrollX
  const top = clientRect.top + scrollY
  const bottom = clientRect.bottom + scrollY
  return {
    x: left,
    left,
    right,
    y: top,
    top,
    bottom,
    width: clientRect.width,
    height: clientRect.height,
    toJSON: null
  }
}