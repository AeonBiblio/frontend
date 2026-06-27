import { SubscriptionToggle } from './subscription-toggle'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Books/SubscriptionToggle',
  component: SubscriptionToggle,
  args: {
    value: true,
    onChange: () => undefined,
  },
  argTypes: {
    onChange: { control: false },
  },
} satisfies Meta<typeof SubscriptionToggle>

export default meta

type Story = StoryObj<typeof meta>

export const InSubscription: Story = {
  args: { value: true },
}

export const NotInSubscription: Story = {
  args: { value: false },
}
