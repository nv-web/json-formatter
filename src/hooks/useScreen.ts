import { useEffect, useState } from 'react'
import type { Screen } from '../types/ui'

const screens: Screen[] = ['home', 'formatter', 'compare', 'convert', 'schema', 'docs']
const defaultScreen: Screen = 'home'

const legacyAnchors: Record<string, Screen> = {
  top: 'home',
  workspace: 'formatter',
  'input-panel': 'formatter',
  compare: 'compare',
  convert: 'convert',
  converter: 'convert',
  csv: 'convert',
  schema: 'schema',
  generator: 'schema',
  examples: 'schema',
  insights: 'formatter',
  stats: 'formatter',
  tree: 'formatter',
  docs: 'docs',
  about: 'docs',
}

function parseHash(hash: string): Screen {
  const value = hash.replace(/^#\/?/, '').replace(/\/$/, '')

  if (value.length === 0) return defaultScreen
  if ((screens as string[]).includes(value)) return value as Screen
  return legacyAnchors[value] ?? defaultScreen
}

export function screenHref(screen: Screen): string {
  return `#/${screen}`
}

export function useScreen(): Screen {
  const [screen, setScreen] = useState<Screen>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => {
      setScreen(parseHash(window.location.hash))
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return screen
}
