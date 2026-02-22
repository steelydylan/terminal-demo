import { describe, expect, it } from 'vitest'
import { parseScenarioText, stringifyScenarios } from '../parser'

describe('parseScenarioText', () => {
  it('parses a simple scenario with name and description', () => {
    const text = `# my-cli demo
A demo of my CLI tool

---
$ my-cli hello
> Hello, World!`

    const scenarios = parseScenarioText(text)

    expect(scenarios).toHaveLength(1)
    expect(scenarios[0].name).toBe('my-cli demo')
    expect(scenarios[0].description).toBe('A demo of my CLI tool')
    expect(scenarios[0].steps).toHaveLength(3)
  })

  it('parses prompt step', () => {
    const text = `---`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({ type: 'prompt' })
  })

  it('parses command step with default delay', () => {
    const text = `$ npm install`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'command',
      text: 'npm install',
      delay: 60
    })
  })

  it('parses command step with custom delay', () => {
    const text = `$[delay:30] npm install`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'command',
      text: 'npm install',
      delay: 30
    })
  })

  it('parses output step', () => {
    const text = `> [green]Success![/green]`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'output',
      text: '[green]Success![/green]'
    })
  })

  it('parses empty output step', () => {
    const text = `>`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'output',
      text: ''
    })
  })

  it('parses question step', () => {
    const text = `? Continue? (y/N)`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'question',
      text: 'Continue? (y/N)'
    })
  })

  it('parses answer step', () => {
    const text = `: yes`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'answer',
      text: 'yes'
    })
  })

  it('parses spinner step', () => {
    const text = `[spinner:1500] Loading...`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'spinner',
      text: 'Loading...',
      duration: 1500
    })
  })

  it('parses wait step', () => {
    const text = `[wait:500]`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'wait',
      ms: 500
    })
  })

  it('parses select step', () => {
    const text = `[select:1500] Choose framework: | React, Vue, Angular | 1`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'select',
      question: 'Choose framework:',
      options: ['React', 'Vue', 'Angular'],
      selected: 1,
      duration: 1500
    })
  })

  it('parses multiselect step', () => {
    const text = `[multiselect:2000] Select features: | TypeScript, ESLint, Prettier | 0,2`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'multiselect',
      question: 'Select features:',
      options: ['TypeScript', 'ESLint', 'Prettier'],
      selected: [0, 2],
      duration: 2000
    })
  })

  it('parses progress step with percent', () => {
    const text = `[progress:2000:100] Installing...`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'progress',
      text: 'Installing...',
      duration: 2000,
      percent: 100
    })
  })

  it('parses progress step without percent (defaults to 100)', () => {
    const text = `[progress:1500] Downloading...`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'progress',
      text: 'Downloading...',
      duration: 1500,
      percent: 100
    })
  })

  it('parses multiple scenarios', () => {
    const text = `# first
First scenario

---
$ echo first

# second
Second scenario

---
$ echo second`

    const scenarios = parseScenarioText(text)

    expect(scenarios).toHaveLength(2)
    expect(scenarios[0].name).toBe('first')
    expect(scenarios[1].name).toBe('second')
  })

  it('creates default scenario if no # header', () => {
    const text = `---
$ hello`

    const scenarios = parseScenarioText(text)

    expect(scenarios[0].name).toBe('demo')
  })

  it('treats unmatched lines as output', () => {
    const text = `Some random text`
    const scenarios = parseScenarioText(text)

    expect(scenarios[0].steps[0]).toEqual({
      type: 'output',
      text: 'Some random text'
    })
  })
})

describe('stringifyScenarios', () => {
  it('converts scenarios back to text format', () => {
    const scenarios = [
      {
        name: 'test',
        description: 'A test scenario',
        steps: [
          { type: 'prompt' as const },
          { type: 'command' as const, text: 'npm test', delay: 60 },
          { type: 'output' as const, text: '[green]Pass[/green]' }
        ]
      }
    ]

    const text = stringifyScenarios(scenarios)

    expect(text).toContain('# test')
    expect(text).toContain('A test scenario')
    expect(text).toContain('---')
    expect(text).toContain('$ npm test')
    expect(text).toContain('> [green]Pass[/green]')
  })

  it('includes custom delay in command', () => {
    const scenarios = [
      {
        name: 'test',
        steps: [{ type: 'command' as const, text: 'fast', delay: 30 }]
      }
    ]

    const text = stringifyScenarios(scenarios)

    expect(text).toContain('$[delay:30] fast')
  })

  it('roundtrips correctly', () => {
    const original = `# demo
Test demo

---
$ npm install
[spinner:1500] Installing...
> [green]Done![/green]
[select:1500] Choose: | A, B, C | 1
[multiselect:2000] Select: | X, Y, Z | 0,2
[progress:2000:100] Loading...`

    const scenarios = parseScenarioText(original)
    const text = stringifyScenarios(scenarios)
    const reparsed = parseScenarioText(text)

    expect(reparsed).toEqual(scenarios)
  })
})
