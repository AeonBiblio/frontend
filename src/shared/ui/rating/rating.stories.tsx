import { Rating } from './rating'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Shared/Rating',
  component: Rating,
  args: {
    value: 4.8,
    color: '#ca8a04',
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 5, step: 0.1 },
    },
    color: { control: 'color' },
  },
} satisfies Meta<typeof Rating>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
