import { render, screen } from '@testing-library/react'
import { Avatar, getInitials } from './Avatar'

describe('getInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getInitials('Kwame Mensah')).toBe('KM')
    expect(getInitials('ada okafor')).toBe('AO')
  })

  it('treats hyphens as word breaks and skips symbols', () => {
    expect(getInitials('Okonkwo-Adeyemi Logistics & Haulage International Ltd')).toBe('OA')
    expect(getInitials('& Co')).toBe('C')
  })
})

describe('Avatar', () => {
  it('shows initials when there is no image', () => {
    render(<Avatar src={null} name="Kwame Mensah" alt="Kwame Mensah" />)
    expect(screen.getByRole('img', { name: 'Kwame Mensah' })).toHaveTextContent('KM')
  })

  it('is hidden from assistive tech when decorative', () => {
    const { container } = render(<Avatar name="Kwame Mensah" alt="" />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('prefers the image when there is one', () => {
    render(<Avatar src="/avatar.svg" name="Amara Test" alt="Amara" />)
    expect(screen.getByRole('img', { name: 'Amara' })).toHaveAttribute('src', '/avatar.svg')
  })
})
