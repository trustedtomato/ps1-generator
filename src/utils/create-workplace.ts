// Workplaces are higher order functions which change the behaviour
// of the function sent to them.

/** Creates a workplace where only one job can run in the same time. */
export function createThrottlingWorkplace<T extends unknown[]>(func: (...args: T) => Promise<void>): (...args: T) => Promise<void> {
  let currentlyRunning = false
  return async (...args) => {
    if (currentlyRunning) {
      return
    }
    currentlyRunning = true
    await func(...args)
    currentlyRunning = false
  }
}
