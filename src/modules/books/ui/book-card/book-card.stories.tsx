import { BookCard } from './book-card'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Books/BookCard',
  component: BookCard,
  args: {
    bookId: '2a46fa32-b874-4e33-952a-177e479bd7b9',
    title: 'Шантарам',
    author: 'Грегори Дэвид Робертс',
    subscriptionLabel: 'В подписке',
    priceLabel: '450 ₽',
    rating: 4.8,
  },
  argTypes: {
    rating: {
      control: { type: 'number', min: 0, max: 5, step: 0.1 },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 340, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BookCard>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
