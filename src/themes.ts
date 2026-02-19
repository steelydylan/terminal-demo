import type { Theme } from './types.js'

export const darkTheme: Theme = {
  background: '#0d1117',
  foreground: '#c9d1d9',
  prompt: '#7ee787',
  command: '#f0f6fc',
  cursor: '#58a6ff',
  headerBackground: '#21262d',
  buttonClose: '#ff5f56',
  buttonMinimize: '#ffbd2e',
  buttonMaximize: '#27c93f',
  gray: '#8b949e',
  green: '#7ee787',
  cyan: '#79c0ff',
  yellow: '#e3b341',
  red: '#f85149',
  purple: '#d2a8ff',
  white: '#f0f6fc',
}

export const lightTheme: Theme = {
  background: '#ffffff',
  foreground: '#24292f',
  prompt: '#1a7f37',
  command: '#24292f',
  cursor: '#0969da',
  headerBackground: '#f6f8fa',
  buttonClose: '#ff5f56',
  buttonMinimize: '#ffbd2e',
  buttonMaximize: '#27c93f',
  gray: '#57606a',
  green: '#1a7f37',
  cyan: '#0969da',
  yellow: '#9a6700',
  red: '#cf222e',
  purple: '#8250df',
  white: '#24292f',
}

export function resolveTheme(theme: 'dark' | 'light' | Theme | undefined): Theme {
  if (!theme || theme === 'dark') return darkTheme
  if (theme === 'light') return lightTheme
  return theme
}
