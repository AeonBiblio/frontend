import { Register } from './register'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Auth/Register',
  component: Register,
  args: {
    onSubmit: () => undefined,
  },
  argTypes: {
    onSubmit: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Register>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
