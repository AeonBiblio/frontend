import { ProfileCard } from './profile-card'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Profile/ProfileCard',
  component: ProfileCard,
  args: {
    color: '#f5f6ff',
    onEditField: () => undefined,
  },
  argTypes: {
    color: { control: 'color' },
    onEditField: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 620 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProfileCard>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
