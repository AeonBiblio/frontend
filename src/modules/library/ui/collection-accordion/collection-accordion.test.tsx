import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CollectionAccordion } from './collection-accordion'

describe('CollectionAccordion', () => {
  it('expands on header click', () => {
    render(
      <CollectionAccordion
        bookIds={[]}
        books={new Map()}
        title="Deep Dark Fantasy"
      />,
    )

    expect(screen.queryByText('В коллекции пока нет книг')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Deep Dark Fantasy/ }))
    expect(screen.getByText('В коллекции пока нет книг')).toBeTruthy()
  })
})
