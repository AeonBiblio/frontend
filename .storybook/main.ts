import type { StorybookConfig } from '@storybook/react-vite'
import type { InlineConfig } from 'vite'

const storybookBlockedVitePlugins = [
  'tanstack',
  'router',
  'start',
  'nitro',
  'devtools',
]

function filterStorybookPlugins(
  plugins: InlineConfig['plugins'],
): InlineConfig['plugins'] {
  return plugins?.flatMap((plugin) => {
    if (!plugin) {
      return []
    }

    if (Array.isArray(plugin)) {
      return filterStorybookPlugins(plugin) ?? []
    }

    const name =
      typeof plugin === 'object' && 'name' in plugin ? String(plugin.name) : ''

    if (
      storybookBlockedVitePlugins.some((blockedName) =>
        name.includes(blockedName),
      )
    ) {
      return []
    }

    return [plugin]
  })
}

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  viteFinal: async (viteConfig) => {
    return {
      ...viteConfig,
      plugins: filterStorybookPlugins(viteConfig.plugins),
      resolve: {
        ...viteConfig.resolve,
        tsconfigPaths: true,
      },
    }
  },
}

export default config
