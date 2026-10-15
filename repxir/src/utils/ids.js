export function createId(prefix = 'id') {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${uuid}`
}

// structuredClone keeps snapshots fully detached from the template they came from.
export const deepClone = (value) => structuredClone(value)
