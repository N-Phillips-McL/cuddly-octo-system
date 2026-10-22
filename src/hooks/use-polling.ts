import { useEffect, useRef } from 'react'

/** Runs the callback now and then again intervalMs after each run finishes, so requests never overlap. */
export function usePolling(
  callback: (signal: AbortSignal) => Promise<void>,
  intervalMs: number,
  enabled: boolean,
): void {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    if (!enabled) {
      return
    }
    let cancelled = false
    let timer: number | undefined
    const controller = new AbortController()

    const tick = async () => {
      try {
        await callbackRef.current(controller.signal)
      } catch {
        // Callbacks report their own errors.
      }
      if (!cancelled) {
        timer = window.setTimeout(tick, intervalMs)
      }
    }
    void tick()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [enabled, intervalMs])
}