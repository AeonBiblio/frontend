import { useState } from 'react'

import { defaultBookFilters } from '@domain/books/book-filters'

import { BookFilters } from './book-filters'

import type { BookFilters as BookFiltersValue } from '@domain/books/book-filters'
import type { Meta, StoryObj } from '@storybook/react-vite'

const genreTags = [
  { id: 'detective', label: 'Детективы' },
  { id: 'fantasy', label: 'Фэнтези' },
  { id: 'classic', label: 'Классика' },
  { id: 'business', label: 'Бизнес' },
]

function StatefulBookFilters(args: React.ComponentProps<typeof BookFilters>) {
  const [filters, setFilters] = useState<BookFiltersValue>(args.filters)
  const [selectedGenreId, setSelectedGenreId] = useState(args.selectedGenreId)

  return (
    <BookFilters
      {...args}
      filters={filters}
      selectedGenreId={selectedGenreId}
      onApply={setFilters}
      onTagSelect={(id) => {
        setSelectedGenreId(id)
        args.onTagSelect(id)
      }}
      onReset={() => {
        setFilters(defaultBookFilters)
        setSelectedGenreId(undefined)
        args.onReset()
      }}
    />
  )
}

const meta = {
  title: 'Modules/Books/BookFilters',
  component: BookFilters,
  render: (args) => <StatefulBookFilters {...args} />,
  args: {
    filters: { ...defaultBookFilters, q: 'Роман' },
    genreTags,
    selectedGenreId: 'fantasy',
    onApply: () => undefined,
    onTagSelect: () => undefined,
    onReset: () => undefined,
  },
  argTypes: {
    onApply: { control: false },
    onTagSelect: { control: false },
    onReset: { control: false },
  },
} satisfies Meta<typeof BookFilters>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
