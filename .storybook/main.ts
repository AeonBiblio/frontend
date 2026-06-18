import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: './vite.storybook.config.ts',
      },
    },
  },

  stories: ['../src/**/*.stories.@(ts|tsx)'],
}

export default config
