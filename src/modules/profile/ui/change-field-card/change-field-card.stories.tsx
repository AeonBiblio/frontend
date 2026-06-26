import { ChangeFieldCard } from './change-field-card'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Profile/ChangeFieldCard',
  component: ChangeFieldCard,
  args: {
    color: '#f5f6ff',
    currentValue: 'myexampleemail@gmail.com',
    fieldLabel: 'Почта',
    nextValue: 'myexampleemail@gmail.com',
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Meta<typeof ChangeFieldCard>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
