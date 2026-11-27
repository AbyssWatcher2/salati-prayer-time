let intervalId = null;

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'START') {
    const intervalMs = typeof data.intervalMs === 'number' && data.intervalMs >= 1000 ? data.intervalMs : 10000;
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
      self.postMessage({ type: 'TICK', now: Date.now() });
    }, intervalMs);
    self.postMessage({ type: 'TICK', now: Date.now() });
  } else if (data.type === 'STOP') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
});
