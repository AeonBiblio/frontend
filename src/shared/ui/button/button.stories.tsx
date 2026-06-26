import { Button } from './button'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Shared/Button',
  component: Button,
  args: {
    children: 'Сохранить',
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'dangerOutline', 'outline', 'success'],
    },
    size: {
      control: 'radio',
      options: ['md', 'sm'],
    },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button>Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="dangerOutline">Danger</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
}
