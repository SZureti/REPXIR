import { expect, finishWorkout, logReps, mainNav, test } from './fixtures.js'

test.describe('Journey 1 — start a prebuilt workout and log strength sets', () => {
  test('filter, start, log, finish, and see it in history after reload', async ({ page }) => {
    await page.goto('/')
    await mainNav(page).getByRole('link', { name: 'Workouts' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Workouts' })).toBeVisible()

    // AC1: selecting Chest lists Chest Focus, and Back keeps the filter.
    await page.getByLabel('Focus').selectOption('chest')
    await expect(page).toHaveURL(/focus=chest/)
    await page.getByRole('link', { name: /Chest Focus/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Chest Focus' })).toBeVisible()
    await page.goBack()
    await expect(page.getByLabel('Focus')).toHaveValue('chest')
    await page.getByRole('link', { name: /Chest Focus/ }).click()

    // AC2: Start captures a snapshot and opens the session.
    await page.getByRole('button', { name: 'Start workout' }).click()
    await expect(page).toHaveURL(/\/session$/)
    await expect(page.getByRole('heading', { level: 2, name: 'Push-up' })).toBeVisible()

    // AC3: valid reps + Complete marks the set done exactly once.
    await logReps(page, 1, 10)
    await logReps(page, 2, 12)
    await logReps(page, 3, 8)
    await expect(page.getByText('3 of 12 sets')).toBeVisible()

    // Next exercise with a load.
    await page.getByRole('button', { name: /Next/ }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Dumbbell bench press' })).toBeVisible()
    await page.getByLabel('Set 1 weight in lb (optional)').fill('35')
    await logReps(page, 1, 10)

    // AC4: finishing with sets left explains and allows finishing anyway.
    await page.getByRole('button', { name: 'Finish workout' }).click()
    await expect(page.getByRole('dialog')).toContainText('completed 4 of 12 sets')
    await page.getByRole('dialog').getByRole('button', { name: 'Keep training' }).click()
    await finishWorkout(page, { notes: 'Felt strong' })

    await expect(page.getByText('4/12')).toBeVisible()
    await expect(page.getByText('Total reps')).toBeVisible()
    await expect(page.getByText('40', { exact: true })).toBeVisible()
    await expect(page.getByText('350', { exact: true })).toBeVisible() // 10 × 35 lb volume

    // AC5: values survive a refresh.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Chest Focus' })).toBeVisible()
    await expect(page.getByText('4/12')).toBeVisible()
    await expect(page.getByLabel('Session notes')).toHaveValue('Felt strong')
    await mainNav(page).getByRole('link', { name: 'History' }).click()
    await expect(page.getByRole('link', { name: /Chest Focus/ })).toBeVisible()
  })

  test('reloading during a session offers a safe resume', async ({ page }) => {
    await page.goto('/workouts/system-calves')
    await page.getByRole('button', { name: 'Start workout' }).click()
    await logReps(page, 1, 15)
    await page.goto('/')
    await page.reload()

    // AC6: the draft is restored paused, with Resume / Discard.
    const dialog = page.getByRole('dialog', { name: 'You have an unfinished workout' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Resume workout' }).click()
    await expect(page).toHaveURL(/\/session$/)
    await expect(page.getByText('Workout paused')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Set 1 completed. Undo to edit' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Complete set 2' })).toBeDisabled()
    await page.getByRole('button', { name: 'Resume workout' }).click()
    await expect(page.getByRole('button', { name: 'Complete set 2' })).toBeEnabled()
  })

  test('starting a second workout asks to resume or discard', async ({ page }) => {
    await page.goto('/workouts/system-biceps')
    await page.getByRole('button', { name: 'Start workout' }).click()
    await expect(page).toHaveURL(/\/session$/)
    await mainNav(page).getByRole('link', { name: 'Workouts' }).click()
    await page.getByRole('link', { name: /Triceps Focus/ }).click()
    await page.getByRole('button', { name: 'Start workout' }).click()
    const dialog = page.getByRole('dialog', { name: 'You have a workout in progress' })
    await expect(dialog).toContainText('Biceps Focus')
    await dialog.getByRole('button', { name: 'Discard & start new' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Triceps Focus' })).toBeVisible()
  })
})

test.describe('Journey 2 — build and reuse a custom routine', () => {
  test('validate, create, reorder, save, reuse, and edit without changing history', async ({ page }) => {
    await page.goto('/workouts')
    await page.getByRole('link', { name: 'New' }).click()

    // AC1: inline validation without discarding fields.
    await page.getByLabel('Description (optional)').fill('Squat and push')
    await page.getByRole('button', { name: 'Save workout' }).click()
    await expect(page.getByText('Give your workout a name.')).toBeVisible()
    await expect(page.getByLabel('Description (optional)')).toHaveValue('Squat and push')

    // AC2: pick, then reorder.
    await page.getByLabel('Workout name').fill('My Strength Mix')
    await page.getByRole('button', { name: 'Add exercise' }).click()
    const picker = page.getByRole('dialog', { name: 'Add exercises' })
    await picker.getByLabel('Search exercises').fill('goblet')
    await picker.getByRole('button', { name: 'Add Goblet squat' }).click()
    await picker.getByLabel('Search exercises').fill('push-up')
    await picker.getByRole('button', { name: 'Add Push-up', exact: true }).click()
    await picker.getByRole('button', { name: /Done/ }).click()
    await page.getByRole('button', { name: 'Move Push-up up' }).click()
    const rows = page.locator('.builder-row__title')
    await expect(rows.nth(0)).toContainText('Push-up')
    await expect(rows.nth(1)).toContainText('Goblet squat')

    // AC3: save, then it survives reload under My workouts.
    await page.getByRole('button', { name: 'Save workout' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'My Strength Mix' })).toBeVisible()
    await page.goto('/workouts?cat=custom')
    await page.reload()
    await expect(page.getByRole('link', { name: /My Strength Mix/ })).toBeVisible()

    // Reuse it.
    await page.getByRole('link', { name: /My Strength Mix/ }).click()
    await page.getByRole('button', { name: 'Start workout' }).click()
    await logReps(page, 1, 9)
    await finishWorkout(page)
    const historyUrl = page.url().replace(/\?.*$/, '')

    // AC4: editing affects future sessions only.
    await page.goto('/workouts?cat=custom')
    await page.getByRole('link', { name: /My Strength Mix/ }).click()
    await page.getByRole('link', { name: 'Edit workout' }).click()
    await page.locator('.builder-row').first().getByLabel('Sets').fill('5')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('5 sets × 8–12 reps')).toBeVisible()
    await page.goto(historyUrl)
    await expect(page.getByText('1 of 3 sets completed')).toBeVisible()

    // AC6: archived plans keep their history.
    await page.goto('/workouts?cat=custom')
    await page.getByRole('link', { name: /My Strength Mix/ }).click()
    await page.getByRole('button', { name: 'Archive' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click()
    await expect(page.locator('.tag', { hasText: 'Archived' })).toBeVisible()
    await page.goto(historyUrl)
    await expect(page.getByRole('heading', { level: 1, name: 'My Strength Mix' })).toBeVisible()
  })

  test('duplicating a built-in workout leaves the original unchanged', async ({ page }) => {
    await page.goto('/workouts/system-glutes')
    await page.getByRole('link', { name: 'Duplicate & customize' }).click()
    await expect(page.getByLabel('Workout name')).toHaveValue('Glutes Focus (copy)')
    await page.locator('.builder-row').first().getByLabel('Sets').fill('4')
    await page.getByRole('button', { name: 'Save workout' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Glutes Focus (copy)' })).toBeVisible()
    await expect(page.getByText('4 sets × 10–15 reps').first()).toBeVisible()

    // AC5: the seed template is untouched.
    await page.goto('/workouts/system-glutes')
    await expect(page.getByText('3 sets × 10–15 reps').first()).toBeVisible()
    await expect(page.getByText('4 sets × 10–15 reps')).toHaveCount(0)
  })
})

test.describe('Journey 3 — track jump rope with reps, sets, and time', () => {
  test('set targets, log actual jumps and time separately, and review totals', async ({ page }) => {
    await page.goto('/workouts')
    await page.getByRole('link', { name: /Jump Rope — RX Rounds/ }).click()

    // AC1: targets are shown and editable before Start.
    await expect(page.getByLabel(/Sets/).first()).toHaveValue('5')
    await page.getByLabel(/Rest between sets/).fill('0:30')
    await page.getByRole('button', { name: 'Start workout' }).click()
    await expect(page.getByRole('heading', { name: 'Target setup' })).toBeVisible()
    await expect(page.locator('.rope-targets')).toContainText('0:30')

    // AC2: the timer accrues only while running.
    await page.getByRole('button', { name: 'Start timer' }).click()
    await page.waitForTimeout(1300)
    await page.getByRole('button', { name: 'Pause timer' }).click()
    const meter = page.locator('.rope-meter__value').first()
    const paused = await meter.textContent()
    expect(paused).not.toBe('0:00')
    await page.waitForTimeout(1200)
    await expect(meter).toHaveText(paused)

    // AC3: 25+25+25+10+1×5 = 90 actual jumps (target stays 100).
    for (const n of [25, 25, 25, 10, 1, 1, 1, 1, 1]) {
      await page.getByRole('button', { name: `Add ${n} ${n === 1 ? 'jump' : 'jumps'}` }).click()
    }
    await expect(page.locator('.rope-meter__value').nth(1)).toHaveText('90')
    await page.getByRole('button', { name: 'Enter time' }).click()
    await page.getByRole('dialog').getByLabel('Actual work time').fill('0:57')
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click()

    // AC4: both values persist in the set.
    await page.getByRole('button', { name: 'Complete set' }).click()
    await expect(page.getByRole('button', { name: /Set 1: 90 jumps, 0:57/ })).toBeVisible()

    const logSet = async (jumps, time) => {
      await page.getByRole('button', { name: 'Enter count' }).click()
      await page.getByRole('dialog').getByLabel('Actual jumps').fill(String(jumps))
      await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click()
      await page.getByRole('button', { name: 'Enter time' }).click()
      await page.getByRole('dialog').getByLabel('Actual work time').fill(time)
      await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click()
      await page.getByRole('button', { name: 'Complete set' }).click()
    }
    await logSet(100, '1:00')
    await logSet(110, '1:02')
    await expect(page.getByText('3 of 5 completed')).toBeVisible()

    // AC5: a reload keeps completed sets and the draft count, paused.
    await page.getByRole('button', { name: 'Add 10 jumps' }).click()
    await page.reload()
    await expect(page.getByText('Workout paused')).toBeVisible()
    await expect(page.locator('.rope-meter__value').nth(1)).toHaveText('10')
    await expect(page.getByText('3 of 5 completed')).toBeVisible()

    // AC6: only completed sets count: 90 + 100 + 110 = 300.
    await finishWorkout(page)
    await expect(page.getByText('3/5')).toBeVisible()
    const stat = (label) => page.locator('.stat', { hasText: label }).locator('.stat__value')
    await expect(stat('Total jumps')).toHaveText('300')
    await expect(stat('Active work time')).toHaveText('2:59')
    await expect(stat('Avg jumps per set')).toHaveText('100')
    await expect(stat('Pace (jumps/min)')).toHaveText('101')
  })
})
