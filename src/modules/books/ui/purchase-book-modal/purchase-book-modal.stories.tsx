import { PurchaseBookModal } from './purchase-book-modal'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Books/PurchaseBookModal',
  component: PurchaseBookModal,
  args: {
    bookId: '2a46fa32-b874-4e33-952a-177e479bd7b9',
    open: true,
    onClose: () => undefined,
  },
  argTypes: {
    onClose: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PurchaseBookModal>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
