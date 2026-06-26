import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BookEditorForm } from './book-editor-form'

describe('BookEditorForm', () => {
  it('disables submit in publish mode without title and book file', () => {
    render(
      <BookEditorForm
        genreTags={[{ id: 'tag-1', label: 'Фэнтези' }]}
        mode="publish"
        pageTitle="Публикация"
        submitLabel="Опубликовать"
        onSubmit={vi.fn()}
      />,
    )

    const submitButton = screen.getByRole('button', {
      name: 'Опубликовать',
    })

    if (!(submitButton instanceof HTMLButtonElement)) {
      throw new Error('Expected submit button element')
    }

    expect(submitButton.disabled).toBe(true)
  })
})
