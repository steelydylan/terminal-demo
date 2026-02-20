/**
 * A single step in a terminal demo scenario
 */
export type Step =
  | { type: 'command'; text: string; delay?: number }
  | { type: 'output'; text: string; className?: string }
  | { type: 'spinner'; text: string; duration: number }
  | { type: 'prompt' }
  | { type: 'wait'; ms: number }
  | { type: 'question'; text: string }
  | { type: 'answer'; text: string }
  | { type: 'select'; question: string; options: string[]; selected: number; duration?: number }
  | {
      type: 'multiselect'
      question: string
      options: string[]
      selected: number[]
      duration?: number
    }
  | { type: 'progress'; text: string; duration: number; percent?: number }

/**
 * A scenario containing multiple steps
 */
export interface Scenario {
  name: string
  description?: string
  steps: Step[]
}

/**
 * Terminal theme configuration
 */
export interface Theme {
  background: string
  foreground: string
  prompt: string
  command: string
  cursor: string
  headerBackground: string
  buttonClose: string
  buttonMinimize: string
  buttonMaximize: string
  // Text colors
  gray: string
  green: string
  cyan: string
  yellow: string
  red: string
  purple: string
  white: string
}

/**
 * Terminal demo options
 */
export interface TerminalDemoOptions {
  /** Title shown in terminal header */
  title?: string
  /** Prompt text (default: "~") */
  promptText?: string
  /** Prompt symbol (default: "❯") */
  promptSymbol?: string
  /** Scenarios to play */
  scenarios: Scenario[]
  /** Theme preset or custom theme */
  theme?: 'dark' | 'light' | Theme
  /** Terminal style: macOS, windows, or linux */
  windowStyle?: 'macos' | 'windows' | 'linux'
  /** Auto-play on mount */
  autoPlay?: boolean
  /** Loop playback */
  loop?: boolean
  /** Typing speed multiplier (default: 1) */
  speed?: number
  /** Callback when playback completes */
  onComplete?: () => void
  /** Callback when scenario changes */
  onScenarioChange?: (index: number, scenario: Scenario) => void
}

/**
 * Terminal demo controller interface
 */
export interface TerminalDemoController {
  /** Play all scenarios */
  play(): Promise<void>
  /** Play a specific scenario by index */
  playScenario(index: number): Promise<void>
  /** Stop playback */
  stop(): void
  /** Reset terminal to initial state */
  reset(): void
  /** Check if currently playing */
  isPlaying(): boolean
  /** Check if currently paused */
  isPaused(): boolean
  /** Pause playback */
  pause(): void
  /** Resume playback */
  resume(): void
  /** Destroy and cleanup */
  destroy(): void
  /** Get the terminal DOM element for external use (e.g., recording) */
  getTerminalElement(): HTMLElement | null
}
