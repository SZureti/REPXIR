import { test as base, expect } from '@playwright/test'

// Every test fails if the page logs an error or throws.
export const test = base.extend({
  page: async ({ page }, provide) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await provide(page)
    expect(errors, 'console errors').toEqual([])
  },
})

export { expect }

export const mainNav = (page) => page.getByRole('navigation', { name: 'Main' })

export async function logReps(page, setNumber, reps) {
  await page.getByLabel(`Set ${setNumber} reps`).fill(String(reps))
  await page.getByRole('button', { name: `Complete set ${setNumber}` }).click()
  await expect(page.getByRole('button', { name: `Set ${setNumber} completed. Undo to edit` })).toBeVisible()
}

export async function finishWorkout(page, { notes } = {}) {
  await page.getByRole('button', { name: 'Finish workout' }).click()
  const dialog = page.getByRole('dialog')
  if (notes) await dialog.getByLabel('Notes (optional)').fill(notes)
  await dialog.getByRole('button', { name: /Finish anyway|Finish & save/ }).click()
  await expect(page.getByText('Workout complete')).toBeVisible()
}
