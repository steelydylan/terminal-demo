import type { Scenario, Step } from './types.js'

/**
 * Parse a simple text format into scenarios
 *
 * Format:
 * ```
 * # scenario name
 * description text (optional, first line after #)
 *
 * $ command text        → type: command (delay can be set with $[delay:30])
 * > output text         → type: output
 * ? question text       → type: question
 * : answer text         → type: answer
 * [spinner:ms] text     → type: spinner
 * [wait:ms]             → type: wait
 * [select:ms] question | opt1, opt2, opt3 | selected  → type: select
 * [multiselect:ms] question | opt1, opt2 | 0,1        → type: multiselect
 * [progress:ms:percent] text                          → type: progress
 * ---                   → type: prompt
 * ```
 *
 * Color tags work as usual: [green]text[/green], [red], [cyan], [yellow], [gray], [purple], [white], [bold]
 *
 * Example:
 * ```
 * # my-cli demo
 * A demo of my CLI tool
 *
 * ---
 * $ my-cli hello
 * [wait:400]
 * > [green]Hello, World![/green]
 * [spinner:1500] Processing...
 * ? Continue? (y/N)
 * : y
 * > Done!
 * ```
 */
export function parseScenarioText(text: string): Scenario[] {
  const lines = text.split('\n')
  const scenarios: Scenario[] = []

  let currentScenario: Scenario | null = null
  let expectDescription = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) {
      expectDescription = false
      continue
    }

    // New scenario: # name
    if (trimmed.startsWith('# ')) {
      if (currentScenario) {
        scenarios.push(currentScenario)
      }
      currentScenario = {
        name: trimmed.slice(2).trim(),
        steps: []
      }
      expectDescription = true
      continue
    }

    // Description (first non-empty line after #)
    if (
      expectDescription &&
      currentScenario &&
      !trimmed.startsWith('$') &&
      !trimmed.startsWith('>') &&
      !trimmed.startsWith('?') &&
      !trimmed.startsWith(':') &&
      !trimmed.startsWith('[') &&
      !trimmed.startsWith('---')
    ) {
      currentScenario.description = trimmed
      expectDescription = false
      continue
    }
    expectDescription = false

    // If no scenario started, create a default one
    if (!currentScenario) {
      currentScenario = {
        name: 'demo',
        steps: []
      }
    }

    const step = parseLine(trimmed)
    if (step) {
      currentScenario.steps.push(step)
    }
  }

  // Push the last scenario
  if (currentScenario) {
    scenarios.push(currentScenario)
  }

  return scenarios
}

function parseLine(line: string): Step | null {
  // Prompt: ---
  if (line === '---') {
    return { type: 'prompt' }
  }

  // Command: $ command or $[delay:30] command
  if (line.startsWith('$')) {
    const delayMatch = line.match(/^\$\[delay:(\d+)\]\s*(.*)$/)
    if (delayMatch) {
      return {
        type: 'command',
        text: delayMatch[2],
        delay: parseInt(delayMatch[1], 10)
      }
    }
    return {
      type: 'command',
      text: line.slice(1).trim(),
      delay: 60
    }
  }

  // Output: > text
  if (line.startsWith('> ') || line === '>') {
    return {
      type: 'output',
      text: line.slice(1).trim()
    }
  }

  // Question: ? text
  if (line.startsWith('? ')) {
    return {
      type: 'question',
      text: line.slice(2)
    }
  }

  // Answer: : text
  if (line.startsWith(': ')) {
    return {
      type: 'answer',
      text: line.slice(2)
    }
  }

  // Spinner: [spinner:ms] text
  const spinnerMatch = line.match(/^\[spinner:(\d+)\]\s*(.*)$/)
  if (spinnerMatch) {
    return {
      type: 'spinner',
      text: spinnerMatch[2],
      duration: parseInt(spinnerMatch[1], 10)
    }
  }

  // Wait: [wait:ms]
  const waitMatch = line.match(/^\[wait:(\d+)\]$/)
  if (waitMatch) {
    return {
      type: 'wait',
      ms: parseInt(waitMatch[1], 10)
    }
  }

  // Select: [select:ms] question | opt1, opt2 | selected
  const selectMatch = line.match(/^\[select:(\d+)\]\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\d+)$/)
  if (selectMatch) {
    return {
      type: 'select',
      question: selectMatch[2],
      options: selectMatch[3].split(',').map((s) => s.trim()),
      selected: parseInt(selectMatch[4], 10),
      duration: parseInt(selectMatch[1], 10)
    }
  }

  // Multiselect: [multiselect:ms] question | opt1, opt2 | 0,1,2
  const multiselectMatch = line.match(
    /^\[multiselect:(\d+)\]\s*(.+?)\s*\|\s*(.+?)\s*\|\s*([\d,]+)$/
  )
  if (multiselectMatch) {
    return {
      type: 'multiselect',
      question: multiselectMatch[2],
      options: multiselectMatch[3].split(',').map((s) => s.trim()),
      selected: multiselectMatch[4].split(',').map((s) => parseInt(s.trim(), 10)),
      duration: parseInt(multiselectMatch[1], 10)
    }
  }

  // Progress: [progress:ms] text or [progress:ms:percent] text
  const progressMatch = line.match(/^\[progress:(\d+)(?::(\d+))?\]\s*(.*)$/)
  if (progressMatch) {
    return {
      type: 'progress',
      text: progressMatch[3],
      duration: parseInt(progressMatch[1], 10),
      percent: progressMatch[2] ? parseInt(progressMatch[2], 10) : 100
    }
  }

  // If line doesn't match any pattern, treat as output
  if (line.length > 0) {
    return {
      type: 'output',
      text: line
    }
  }

  return null
}

/**
 * Convert scenarios back to text format
 */
export function stringifyScenarios(scenarios: Scenario[]): string {
  const lines: string[] = []

  for (const scenario of scenarios) {
    lines.push(`# ${scenario.name}`)
    if (scenario.description) {
      lines.push(scenario.description)
    }
    lines.push('')

    for (const step of scenario.steps) {
      switch (step.type) {
        case 'prompt':
          lines.push('---')
          break
        case 'command':
          if (step.delay && step.delay !== 60) {
            lines.push(`$[delay:${step.delay}] ${step.text}`)
          } else {
            lines.push(`$ ${step.text}`)
          }
          break
        case 'output':
          lines.push(`> ${step.text}`)
          break
        case 'question':
          lines.push(`? ${step.text}`)
          break
        case 'answer':
          lines.push(`: ${step.text}`)
          break
        case 'spinner':
          lines.push(`[spinner:${step.duration}] ${step.text}`)
          break
        case 'wait':
          lines.push(`[wait:${step.ms}]`)
          break
        case 'select':
          lines.push(
            `[select:${step.duration ?? 1500}] ${step.question} | ${step.options.join(', ')} | ${step.selected}`
          )
          break
        case 'multiselect':
          lines.push(
            `[multiselect:${step.duration ?? 2000}] ${step.question} | ${step.options.join(', ')} | ${step.selected.join(',')}`
          )
          break
        case 'progress':
          lines.push(`[progress:${step.duration}:${step.percent ?? 100}] ${step.text}`)
          break
      }
    }
    lines.push('')
  }

  return lines.join('\n').trim()
}
