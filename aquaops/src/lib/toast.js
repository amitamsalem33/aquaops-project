// Simple pub/sub toast system — no external library needed
let listeners = [];
let idCounter = 0;

export function showToast(msg, type = "success") {
  const id = ++idCounter;
  listeners.forEach(fn => fn({ id, msg, type }));
}

export function subscribeToast(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(f => f !== fn); };
}
