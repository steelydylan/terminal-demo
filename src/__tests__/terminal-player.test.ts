import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TerminalPlayer } from '../terminal-player'

describe('TerminalPlayer', () => {
  let originalStdoutWrite: typeof process.stdout.write
  let output: string[]

  beforeEach(() => {
    output = []
    originalStdoutWrite = process.stdout.write
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      output.push(chunk.toString())
      return true
    }) as typeof process.stdout.write

    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(`${args.join(' ')}\n`)
    })
  })

  afterEach(() => {
    process.stdout.write = originalStdoutWrite
    vi.restoreAllMocks()
  })

  it('creates player with default options', () => {
    const player = new TerminalPlayer()
    expect(player).toBeDefined()
  })

  it('creates player with custom options', () => {
    const player = new TerminalPlayer({
      promptText: 'myapp',
      promptSymbol: '$',
      speed: 2
    })
    expect(player).toBeDefined()
  })

  it('plays empty scenarios without error', async () => {
    const player = new TerminalPlayer({ speed: 100 })
    await player.play([])
    expect(true).toBe(true)
  })

  it('plays prompt step', async () => {
    const player = new TerminalPlayer({ speed: 100 })
    await player.play([
      {
        name: 'test',
        steps: [{ type: 'prompt' }]
      }
    ])

    const fullOutput = output.join('')
    expect(fullOutput).toContain('~')
    expect(fullOutput).toContain('❯')
  })

  it('plays output step with colors', async () => {
    const player = new TerminalPlayer({ speed: 100 })
    await player.play([
      {
        name: 'test',
        steps: [{ type: 'output', text: '[green]Success[/green]' }]
      }
    ])

    const fullOutput = output.join('')
    // ANSI green code
    expect(fullOutput).toContain('\x1b[32m')
    expect(fullOutput).toContain('Success')
  })

  it('can be stopped', async () => {
    const player = new TerminalPlayer({ speed: 100 })

    // Start playing and stop after a short delay
    setTimeout(() => player.stop(), 10)

    await player.play([
      {
        name: 'test',
        steps: [
          { type: 'wait', ms: 5000 },
          { type: 'output', text: 'Should not appear' }
        ]
      }
    ])

    const fullOutput = output.join('')
    expect(fullOutput).not.toContain('Should not appear')
  })

  it('uses custom prompt text and symbol', async () => {
    const player = new TerminalPlayer({
      promptText: 'myproject',
      promptSymbol: '$',
      speed: 100
    })

    await player.play([
      {
        name: 'test',
        steps: [{ type: 'prompt' }]
      }
    ])

    const fullOutput = output.join('')
    expect(fullOutput).toContain('myproject')
    expect(fullOutput).toContain('$')
  })

  it('respects speed multiplier', async () => {
    const startTime = Date.now()

    const player = new TerminalPlayer({ speed: 100 })
    await player.play([
      {
        name: 'test',
        steps: [{ type: 'wait', ms: 1000 }]
      }
    ])

    const elapsed = Date.now() - startTime
    // With speed 100, 1000ms wait should be ~10ms
    expect(elapsed).toBeLessThan(100)
  })
})
