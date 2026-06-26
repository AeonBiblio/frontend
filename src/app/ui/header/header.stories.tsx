import { Header } from './header'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'App/Header',
  component: Header,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1000 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Header>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
