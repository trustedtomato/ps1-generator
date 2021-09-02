export function createEventListener (
  el: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: EventListenerOptions | boolean
): {
  destroy: () => void
} {
  el.addEventListener(type, listener, options)
  return {
    destroy () {
      el.removeEventListener(type, listener, options)
    }
  }
}
