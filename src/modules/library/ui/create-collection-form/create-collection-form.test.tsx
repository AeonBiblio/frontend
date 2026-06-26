import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CreateCollectionForm } from './create-collection-form'

describe('CreateCollectionForm', () => {
  it('disables create until title is entered', () => {
    render(<CreateCollectionForm onCreate={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Создать новую коллекцию +' }),
    )
    const createButton = screen.getByRole('button', { name: 'Создать' })

    if (!(createButton instanceof HTMLButtonElement)) {
      throw new Error('Expected button element')
    }

    expect(createButton.disabled).toBe(true)
  })
})
