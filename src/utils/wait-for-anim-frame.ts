export function waitForAnimFrame (): Promise<number> {
  return new Promise(resolve => requestAnimationFrame(resolve))
}