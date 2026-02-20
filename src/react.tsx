import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { TerminalDemo } from './terminal-demo.js'
import type { TerminalDemoController, TerminalDemoOptions } from './types.js'

export type TerminalDemoProps = Omit<TerminalDemoOptions, 'scenarios'> & {
  scenarios: TerminalDemoOptions['scenarios']
  className?: string
  style?: React.CSSProperties
}

export type TerminalDemoRef = TerminalDemoController

/**
 * React component wrapper for TerminalDemo
 */
export const TerminalDemoComponent = forwardRef<TerminalDemoRef, TerminalDemoProps>(
  function TerminalDemoComponent(props, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const instanceRef = useRef<TerminalDemo | null>(null)

    const { className, style, ...options } = props

    useImperativeHandle(ref, () => ({
      play: () => instanceRef.current?.play() ?? Promise.resolve(),
      playScenario: (index: number) =>
        instanceRef.current?.playScenario(index) ?? Promise.resolve(),
      stop: () => instanceRef.current?.stop(),
      reset: () => instanceRef.current?.reset(),
      isPlaying: () => instanceRef.current?.isPlaying() ?? false,
      destroy: () => instanceRef.current?.destroy(),
      getTerminalElement: () => instanceRef.current?.getTerminalElement() ?? null
    }))

    // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only run on mount
    useEffect(() => {
      if (!containerRef.current) return

      instanceRef.current = new TerminalDemo(containerRef.current, options)

      return () => {
        instanceRef.current?.destroy()
        instanceRef.current = null
      }
    }, [])

    return <div ref={containerRef} className={className} style={style} />
  }
)

export { TerminalDemo } from './terminal-demo.js'
export { darkTheme, lightTheme, resolveTheme } from './themes.js'
export { parseScenarioText, stringifyScenarios } from './parser.js'
export type {
  Scenario,
  Step,
  TerminalDemoController,
  TerminalDemoOptions,
  Theme
} from './types.js'
