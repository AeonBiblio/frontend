import { BalanceCard } from './balance-card'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Profile/BalanceCard',
  component: BalanceCard,
  args: {
    amount: '18 123, 23',
    color: '#f5f6ff',
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Meta<typeof BalanceCard>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
