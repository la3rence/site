// Schedule non-critical work away from the current render and return a cancel function.
export const scheduleIdle = (fn, { timeout = 2000, fallbackDelay = 0 } = {}) => {
  if (typeof globalThis.requestIdleCallback === "function") {
    const callbackId = globalThis.requestIdleCallback(fn, { timeout });
    return () => globalThis.cancelIdleCallback(callbackId);
  }

  const timerId = setTimeout(fn, fallbackDelay);
  return () => clearTimeout(timerId);
};
