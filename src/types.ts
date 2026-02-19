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
 * GIF recording options
 */
export interface GifRecordingOptions {
  /** Frames per second (default: 10) */
  fps?: number
  /** GIF quality 1-30, lower is better (default: 10) */
  quality?: number
  /** Scale factor for output size (default: 1) */
  scale?: number
  /** Number of parallel workers (default: 2) */
  workers?: number
  /** Path to the GIF worker script (default: '/gif.worker.js') */
  workerScript?: string
  /** Callback when recording phase changes */
  onPhaseChange?: (phase: 'recording' | 'processing' | 'done') => void
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
  /** Destroy and cleanup */
  destroy(): void
  /** Record playback as GIF */
  recordGif(options?: GifRecordingOptions): Promise<Blob>
  /** Check if currently recording */
  isRecording(): boolean
}
