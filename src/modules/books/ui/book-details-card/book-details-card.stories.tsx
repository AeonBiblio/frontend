import { BookDetailsCard } from './book-details-card'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Books/BookDetailsCard',
  component: BookDetailsCard,
  args: {
    title: 'Мартин Иден',
    author: 'Джек Лондон',
    genre: 'Автобиография, Психология, Драмма',
    description:
      '«Мартин Иден» — культовый роман Джека Лондона о силе человеческого духа и цене успеха. История простого моряка, который ради любви к девушке из высшего общества за короткий срок проходит путь от полуграмотного рабочего до всемирно известного писателя. Это глубокая драма о преодолении классовых барьеров, поиске себя и трагическом разочаровании в обретенной славе.',
    subscriptionLabel: 'Читать по подписке',
    buyLabel: 'Купить за 245 руб',
    rating: 8.1,
    ratingsCount: 21,
    reviewsCount: 5,
  },
  argTypes: {
    rating: {
      control: { type: 'number', min: 0, max: 10, step: 0.1 },
    },
    selectedScore: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1040 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BookDetailsCard>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
