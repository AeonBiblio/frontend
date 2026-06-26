import { FileDropzone } from './file-dropzone'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Modules/Books/FileDropzone',
  component: FileDropzone,
  args: {
    accept: '.epub,.fb2,.pdf',
    formatsLabel: 'Доступные форматы: epub, fb2, PDF',
    label: 'Книга',
    onFileChange: () => undefined,
  },
  argTypes: {
    onFileChange: { control: false },
  },
} satisfies Meta<typeof FileDropzone>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithSelectedFile: Story = {
  args: {
    selectedFile: new File(['book'], 'file-name.fb2', {
      type: 'application/octet-stream',
    }),
  },
}
