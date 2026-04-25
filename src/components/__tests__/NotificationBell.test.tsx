import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationBell from '../NotificationBell'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('NotificationBell', () => {
  it('renders bell icon', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ notifications: [] })))

    render(<NotificationBell />)

    expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument()
  })

  it('shows unread count badge', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ notifications: [{ id: '1', title: 'Test', body: null, createdAt: new Date().toISOString() }] }))
    )

    render(<NotificationBell />)

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('opens dropdown on click', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ notifications: [{ id: '1', title: 'Hello', body: 'World', createdAt: new Date().toISOString() }] }))
    )

    render(<NotificationBell />)

    await waitFor(() => screen.getByText('1'))
    fireEvent.click(screen.getByLabelText(/notifications/i))

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('World')).toBeInTheDocument()
  })

  it('shows empty state when no notifications', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ notifications: [] })))

    render(<NotificationBell />)

    fireEvent.click(screen.getByLabelText(/notifications/i))

    expect(screen.getByText(/no new notifications/i)).toBeInTheDocument()
  })
})
