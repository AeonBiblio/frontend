import { Spinner } from './spinner'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Shared/Spinner',
  component: Spinner,
  args: {
    label: 'Загрузка',
  },
} satisfies Meta<typeof Spinner>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
