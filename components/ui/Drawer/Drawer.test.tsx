import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Drawer } from './Drawer'

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Drawer
        open={open}
        title="Transaction details"
        onClose={() => {
          onClose?.()
          setOpen(false)
        }}
      >
        <p>Body text</p>
        <button type="button">Copy</button>
      </Drawer>
    </>
  )
}

async function openDrawer() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Open' }))
  return { user, dialog: screen.getByRole('dialog', { name: 'Transaction details' }) }
}

describe('Drawer', () => {
  it('is a labelled modal dialog that takes focus and locks scroll', async () => {
    render(<Harness />)
    const { dialog } = await openDrawer()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Harness />)
    const { user } = await openDrawer()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
    // Scroll stays locked until the panel has finished sliding out.
    expect(document.body.style.overflow).toBe('hidden')
    await waitFor(() => expect(document.body.style.overflow).toBe(''))
  })

  it('does not close when clicking inside the panel', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const { user } = await openDrawer()
    await user.click(screen.getByText('Body text'))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes when clicking the overlay', async () => {
    render(<Harness />)
    const { user } = await openDrawer()
    await user.click(document.querySelector('.overlay')!)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes from the close button', async () => {
    render(<Harness />)
    const { user } = await openDrawer()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps Tab inside the dialog', async () => {
    render(<Harness />)
    const { user } = await openDrawer()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('keeps its last content on screen, inert, while it slides out', async () => {
    function Selection() {
      const [selected, setSelected] = useState<string | null>('Body text')
      return (
        <Drawer open={selected !== null} title="Transaction details" onClose={() => setSelected(null)}>
          {selected && <p>{selected}</p>}
        </Drawer>
      )
    }
    render(<Selection />)
    await userEvent.keyboard('{Escape}')

    // No longer a dialog, but still on screen with its content while it slides out.
    expect(screen.queryByRole('dialog')).toBeNull()
    const panel = document.querySelector('.panel[data-state="closed"]')!
    expect(panel).toHaveTextContent('Body text')
    expect(panel).toHaveAttribute('inert')

    // animationend itself can't be simulated: jsdom has no AnimationEvent, so React never listens for it.
    // The browser path is checked manually; the fallback below covers unmounting.
  })

  it('unmounts after a fallback delay if animationend never fires', async () => {
    vi.useFakeTimers()
    try {
      render(<Harness />)
      act(() => screen.getByRole('button', { name: 'Open' }).click())
      act(() => screen.getByRole('button', { name: 'Close' }).click())
      expect(document.querySelector('.panel')).not.toBeNull()
      act(() => vi.advanceTimersByTime(400))
      expect(document.querySelector('.panel')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
