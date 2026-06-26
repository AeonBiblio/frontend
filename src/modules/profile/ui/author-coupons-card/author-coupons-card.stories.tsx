import { AuthorCouponsCard } from './author-coupons-card'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Profile/AuthorCouponsCard',
  component: AuthorCouponsCard,
  args: {
    activationCoupons: 2,
    color: '#fff',
    issueCoupons: 14,
    promoCode: 'ABC-1-DEF-23-GHIJ',
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Meta<typeof AuthorCouponsCard>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
