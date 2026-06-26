import { Login } from './login'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Auth/Login',
  component: Login,
  args: {
    onSubmit: () => undefined,
  },
  argTypes: {
    onSubmit: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Login>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
