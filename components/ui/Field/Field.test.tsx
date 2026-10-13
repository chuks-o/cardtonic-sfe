import { render, screen } from '@testing-library/react'
import { Input } from '../Input'
import { Select } from '../Select'

describe('Field labelling', () => {
  it('gives Input an accessible name and description', () => {
    render(<Input label="Search" hint="Reference, name or narration" />)
    const input = screen.getByRole('textbox', { name: 'Search' })
    expect(input).toHaveAccessibleDescription('Reference, name or narration')
  })

  it('keeps the name when the label is visually hidden', () => {
    render(<Input label="Search" hideLabel />)
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument()
  })

  it('gives Select an accessible name', () => {
    render(<Select label="Type" options={[{ value: '', label: 'All types' }]} />)
    expect(screen.getByRole('combobox', { name: 'Type' })).toBeInTheDocument()
  })
})
