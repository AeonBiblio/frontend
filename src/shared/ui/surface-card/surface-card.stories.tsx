import { SurfaceCard } from './surface-card'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Shared/SurfaceCard',
  component: SurfaceCard,
  args: {
    color: '#f5f6ff',
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px' }}>Заголовок карточки</h3>
        <p style={{ margin: 0 }}>Контент внутри SurfaceCard.</p>
      </div>
    ),
  },
  argTypes: {
    color: { control: 'color' },
    children: { control: false },
  },
} satisfies Meta<typeof SurfaceCard>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
