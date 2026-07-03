import { SubscribeModal } from './subscribe-modal'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Subscription/SubscribeModal',
  component: SubscribeModal,
  args: {
    onClose: () => undefined,
  },
  argTypes: {
    onClose: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SubscribeModal>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
