import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../../src/routes.jsx'
import { ToastProvider } from '../../src/store/toast.jsx'
import { StoreProvider } from '../../src/store/StoreProvider.jsx'
import { ConfirmProvider } from '../../src/store/confirm.jsx'
import { useStore } from '../../src/store/hooks.js'

function Gate() {
  const { status } = useStore()
  return status === 'ready' ? null : <p>loading</p>
}

function renderAt(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const utils = render(
    <ToastProvider>
      <StoreProvider>
        <ConfirmProvider>
          <Gate />
          <RouterProvider router={router} />
        </ConfirmProvider>
      </StoreProvider>
    </ToastProvider>,
  )
  return { ...utils, router }
}

describe('routing', () => {
  it('renders the library with all built-in workouts', async () => {
    renderAt('/workouts')
    expect(await screen.findByRole('heading', { level: 1, name: 'Workouts' })).toBeInTheDocument()
    const muscle = screen.getByRole('region', { name: 'Muscle group workouts' })
    expect(within(muscle).getAllByRole('link')).toHaveLength(10)
    expect(screen.getByRole('region', { name: 'Full body workouts' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Jump Rope — RX Rounds/ })).toBeInTheDocument()
  })

  it('keeps filters in the URL and shows a zero-results state', async () => {
    const user = userEvent.setup()
    const { router } = renderAt('/workouts')
    await user.type(await screen.findByRole('searchbox'), 'unicorn press')
    expect(await screen.findByRole('heading', { name: 'No results' })).toBeInTheDocument()
    expect(router.state.location.search).toContain('q=unicorn')
    await user.click(screen.getByRole('button', { name: 'View all' }))
    expect(await screen.findByRole('region', { name: 'Muscle group workouts' })).toBeInTheDocument()
  })

  it('deep-links to a workout detail page', async () => {
    renderAt('/workouts/system-jump-rope')
    expect(await screen.findByRole('heading', { level: 1, name: 'Jump Rope — RX Rounds' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Jumps per set/)).toHaveValue('100')
    expect(screen.getByLabelText(/Time per set/)).toHaveValue('1:00')
  })

  it('shows a helpful not-found state for unknown routes and workouts', async () => {
    renderAt('/nope')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('shows not-found for a missing workout id', async () => {
    renderAt('/workouts/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Workout not found' })).toBeInTheDocument()
  })

  it('validates the builder without discarding fields', async () => {
    const user = userEvent.setup()
    renderAt('/builder/new')
    const description = await screen.findByLabelText('Description (optional)')
    await user.type(description, 'Keep me')
    await user.click(screen.getByRole('button', { name: 'Save workout' }))
    expect(await screen.findByText('Give your workout a name.')).toBeInTheDocument()
    expect(screen.getAllByText(/Add at least one exercise/).length).toBeGreaterThan(0)
    expect(description).toHaveValue('Keep me')
  })

  it('shows the empty history state on first run', async () => {
    renderAt('/history')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'No workouts yet' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Explore workouts' })).toHaveAttribute('href', '/workouts')
  })
})
