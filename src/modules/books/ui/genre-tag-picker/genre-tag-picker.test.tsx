import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { GenreTagPicker } from './genre-tag-picker'

describe('GenreTagPicker', () => {
  it('toggles selected genre ids', () => {
    const onChange = vi.fn()

    render(
      <GenreTagPicker
        options={[
          { id: 'tag-1', label: 'Фэнтези' },
          { id: 'tag-2', label: 'Детектив' },
        ]}
        selectedIds={[]}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Фэнтези' }))
    expect(onChange).toHaveBeenCalledWith(['tag-1'])

    onChange.mockClear()

    render(
      <GenreTagPicker
        options={[
          { id: 'tag-1', label: 'Фэнтези' },
          { id: 'tag-2', label: 'Детектив' },
        ]}
        selectedIds={['tag-1']}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Фэнтези' })[1])
    expect(onChange).toHaveBeenCalledWith([])
  })
})
