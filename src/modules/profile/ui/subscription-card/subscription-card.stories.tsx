import { SubscriptionCard } from './subscription-card'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Profile/SubscriptionCard',
  component: SubscriptionCard,
  args: {
    color: '#fff7eb',
    status: 'active',
    onSubscribeClick: () => undefined,
  },
  argTypes: {
    color: { control: 'color' },
    status: {
      control: 'radio',
      options: ['active', 'inactive'],
    },
    onSubscribeClick: { control: false },
  },
} satisfies Meta<typeof SubscriptionCard>

export default meta

type Story = StoryObj<typeof meta>

export const Active: Story = {}

export const Inactive: Story = {
  args: {
    status: 'inactive',
  },
}
