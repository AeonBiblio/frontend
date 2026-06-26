import { ReviewForm } from './review-form'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Reviews/ReviewForm',
  component: ReviewForm,
  args: {
    userLabel: 'Slavik Bjncharov #13',
    dateLabel: '2 июня 2001',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReviewForm>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
