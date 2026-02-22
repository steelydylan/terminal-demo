/**
 * Node.js entry point for terminal-demo
 * Use this for CLI/terminal playback in Node.js environments
 */
export { AsciinemaRecorder } from './asciinema-recorder.js'
export type { AsciinemaEvent, AsciinemaHeader } from './asciinema-recorder.js'
export { parseScenarioText, stringifyScenarios } from './parser.js'
export type { TerminalPlayerOptions } from './terminal-player.js'
export { TerminalPlayer } from './terminal-player.js'
export type { Scenario, Step } from './types.js'
