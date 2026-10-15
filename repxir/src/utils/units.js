// Loads are stored canonically in kilograms and converted only for display,
// so switching units never changes what was recorded.

export const KG_PER_LB = 0.45359237
export const UNITS = ['lb', 'kg']

export function toDisplayLoad(kg, unit) {
  if (kg == null || !Number.isFinite(kg)) return null
  const value = unit === 'lb' ? kg / KG_PER_LB : kg
  return Math.round(value * 10) / 10
}

export function fromDisplayLoad(value, unit) {
  if (value == null || !Number.isFinite(value)) return null
  return unit === 'lb' ? value * KG_PER_LB : value
}

export function formatLoad(kg, unit) {
  const value = toDisplayLoad(kg, unit)
  if (value == null) return null
  return `${formatNumber(value)} ${unit}`
}

export function formatNumber(value) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}
