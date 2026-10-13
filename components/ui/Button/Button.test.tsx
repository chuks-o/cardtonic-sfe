import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('is a real button that works from the keyboard', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Try again</Button>)
    const button = screen.getByRole('button', { name: 'Try again' })
    expect(button).toHaveAttribute('type', 'button')
    button.focus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Convert
      </Button>
    )
    expect(screen.getByRole('button', { name: 'Convert' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
