import { render, screen } from '@testing-library/react'
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
    expect(document.body.style.overflow).toBe('')
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
})
