import { Options as PresetEnvOptions } from '@babel/preset-env'
import { TransformOptions, PluginItem } from '@babel/core'

const defaultBrowserOptions = {
  targets: {
    browsers: ['last 3 versions'],
  },
  useBuiltIns: 'entry',
  corejs: 3,
  loose: true,
  modules: false,
  include: ['@babel/plugin-transform-regenerator', '@babel/plugin-transform-async-to-generator'],
}

const browsersWithEdge = {
  ...defaultBrowserOptions,
  include: [
    ...defaultBrowserOptions.include,
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-destructuring',
    '@babel/plugin-transform-spread',
  ],
}

const node = {
  targets: {
    node: 'current',
  },
  useBuiltIns: 'entry',
  corejs: 3,
  loose: true,
  modules: false,
}

enum EnvProfiles {
  BROWSERS = 'browsers',
  BROWSERS_WITH_EDGE = 'browsersWithEdge',
  NODE = 'node',
}

const profiles = {
  [EnvProfiles.BROWSERS]: defaultBrowserOptions,
  [EnvProfiles.BROWSERS_WITH_EDGE]: browsersWithEdge,
  [EnvProfiles.NODE]: node,
} as Record<EnvProfiles, PresetEnvOptions>

const getPluginName = (plugin: PluginItem) =>
  typeof plugin === 'string' ? plugin : Array.isArray(plugin) ? plugin[0] : (plugin as any).name

const addMissing = (items: PluginItem[], existingItems: PluginItem[]) => {
  let newItems = [...existingItems]
  items.forEach((existingItem) => {
    const existingItemName = getPluginName(existingItem)
    newItems = newItems.filter((newItem) => {
      const newItemName = getPluginName(newItem)
      return existingItemName !== newItemName
    })
    newItems.push(existingItem)
  })
  return newItems
}

const ensureOrder = (items: PluginItem[], ...rest: string[]) => {
  return items.sort((i1, i2) => {
    const name1 = getPluginName(i1)
    const name2 = getPluginName(i2)
    if (!rest.includes(name1) || !rest.includes(name2)) {
      return 0
    }
    return rest.indexOf(name1) < rest.indexOf(name2) ? -1 : 1
  })
}

export const configFactory = ({
  profile = EnvProfiles.BROWSERS,
  presets = [],
  plugins = [],
  cache,
}: {
  profile?: EnvProfiles | PresetEnvOptions
  presets?: TransformOptions['presets']
  plugins?: TransformOptions['plugins']
  cache?: boolean
} = {}) => {
  const envProfile = typeof profile === 'string' ? profiles[profile] : profile
  const config = {
    babelrc: false,
    cacheDirectory: cache,
    presets: [['@babel/preset-env', envProfile], '@babel/preset-react', '@babel/preset-typescript'],
    plugins: [
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-syntax-import-meta',
      '@enhanced-dom/babel/plugins/fontawesome',
      'react-require',
    ],
  } as TransformOptions

  if (presets.length) {
    config.presets = addMissing(presets, config.presets)
  }
  if (plugins.length) {
    config.plugins = addMissing(plugins, config.plugins)
    config.plugins = ensureOrder(
      config.plugins,
      '@babel/plugin-transform-decorators',
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-regenerator',
      '@babel/plugin-transform-async-to-generator',
    )
  }
  return config
}

configFactory.inbuiltProfiles = profiles
configFactory.profile = EnvProfiles
