import { Eye, Mail, Search } from 'lucide-react'

import { Input } from './input'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Shared/Input',
  component: Input,
  args: {
    placeholder: 'Введите текст',
    disabled: false,
    type: 'text',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search'],
    },
    leftIcon: { control: false },
    rightIcon: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithIcons: Story = {
  args: {
    placeholder: 'Почта',
    leftIcon: Mail,
    rightIcon: Eye,
  },
}

export const SearchInput: Story = {
  args: {
    placeholder: 'Поиск',
    leftIcon: Search,
    type: 'search',
  },
}
