import { ReviewCard } from './review-card'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Reviews/ReviewCard',
  component: ReviewCard,
  args: {
    createdAt: '2026-06-22T12:00:00Z',
    displayTag: '#1234',
    dislikesCount: 2,
    likesCount: 31,
    myVote: null,
    promoIssued: true,
    sentiment: 'positive',
    text: 'Неожиданно глубокий роман. Читается на одном дыхании, хотя тема непростая. Автору удалось найти идеальный баланс между драмой и легким юмором. Рекомендую всем, кто любит книги, после которых остаётся послевкусие',
    username: 'Slavik Bjncharov',
  },
  argTypes: {
    sentiment: {
      control: 'radio',
      options: ['positive', 'neutral', 'negative'],
    },
    myVote: {
      control: 'radio',
      options: ['like', 'dislike', null],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 680, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReviewCard>

export default meta

type Story = StoryObj<typeof meta>

export const Positive: Story = {}

export const Neutral: Story = {
  args: {
    promoIssued: false,
    sentiment: 'neutral',
    text: 'В книге есть удачные главы, но часть сцен выглядит проходной. В целом читать можно, если интересна тема.',
  },
}

export const Negative: Story = {
  args: {
    dislikesCount: 8,
    likesCount: 4,
    myVote: 'dislike',
    promoIssued: false,
    sentiment: 'negative',
    text: 'Идея неплохая, но исполнение проседает: диалоги часто звучат неестественно, а конфликт почти не развивается.',
  },
}
