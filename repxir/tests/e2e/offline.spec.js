import { expect, test } from './fixtures.js'

test.describe('installable and offline', () => {
  test('a deep link reloads offline after the first visit', async ({ page, context }) => {
    await page.goto('/')
    await expect(page.locator('main h1').first()).toBeVisible()
    // Wait until the service worker has precached the app and is active.
    await page.evaluate(() => navigator.serviceWorker.ready)

    await context.setOffline(true)
    await page.goto('/workouts/system-chest')
    await expect(page.getByRole('heading', { level: 1, name: 'Chest Focus' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Start workout' })).toBeVisible()
    // Lazy-loaded screens are precached too.
    await page.goto('/history')
    await expect(page.getByRole('heading', { level: 1, name: 'History' })).toBeVisible()
    await context.setOffline(false)
  })

  test('the manifest describes an installable app', async ({ page }) => {
    await page.goto('/')
    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    const manifest = await (await page.request.get(href)).json()
    expect(manifest).toMatchObject({ name: 'REPXIR', short_name: 'RX', display: 'standalone', start_url: '/' })
    expect(manifest.screenshots.map((s) => s.form_factor).sort()).toEqual(['narrow', 'wide'])
    for (const { src } of [...manifest.icons, ...manifest.screenshots]) {
      expect((await page.request.get(src)).ok(), src).toBe(true)
    }
  })
})
