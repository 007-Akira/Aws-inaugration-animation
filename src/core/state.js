const transitions = {
  loading: ['ready', 'error'], ready: ['playing', 'loading'],
  playing: ['complete', 'ready', 'loading'], complete: ['ready', 'loading'],
  error: ['loading'],
};
export function createState() {
  let current = 'loading';
  const listeners = new Set();
  return {
    get current() { return current; },
    set(next) {
      if (current === next) return;
      if (!transitions[current]?.includes(next)) throw new Error(`Invalid transition: ${current} → ${next}`);
      current = next;
      listeners.forEach((listener) => listener(current));
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
