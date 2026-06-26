import { PaymentCardModal } from './payment-card-modal'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Profile/PaymentCardModal',
  component: PaymentCardModal,
  args: {
    open: true,
    onClose: () => undefined,
  },
  argTypes: {
    onClose: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PaymentCardModal>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
