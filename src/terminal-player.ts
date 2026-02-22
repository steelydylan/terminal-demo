import type { Scenario, Step } from './types.js'

// ANSI color codes
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  purple: '\x1b[35m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  // Cursor control
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  clearLine: '\x1b[2K',
  moveToStart: '\x1b[G',
  moveUp: (n: number) => `\x1b[${n}A`
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export interface TerminalPlayerOptions {
  promptText?: string
  promptSymbol?: string
  speed?: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Apply color tags to text for terminal output
 */
function applyColors(text: string): string {
  return text
    .replace(/\[green\]/g, ANSI.green)
    .replace(/\[\/green\]/g, ANSI.reset)
    .replace(/\[cyan\]/g, ANSI.cyan)
    .replace(/\[\/cyan\]/g, ANSI.reset)
    .replace(/\[yellow\]/g, ANSI.yellow)
    .replace(/\[\/yellow\]/g, ANSI.reset)
    .replace(/\[red\]/g, ANSI.red)
    .replace(/\[\/red\]/g, ANSI.reset)
    .replace(/\[purple\]/g, ANSI.purple)
    .replace(/\[\/purple\]/g, ANSI.reset)
    .replace(/\[gray\]/g, ANSI.gray)
    .replace(/\[\/gray\]/g, ANSI.reset)
    .replace(/\[white\]/g, ANSI.white)
    .replace(/\[\/white\]/g, ANSI.reset)
    .replace(/\[bold\]/g, ANSI.bold)
    .replace(/\[\/bold\]/g, ANSI.reset)
}

export class TerminalPlayer {
  private promptText: string
  private promptSymbol: string
  private speed: number
  private stopped = false

  constructor(options: TerminalPlayerOptions = {}) {
    this.promptText = options.promptText ?? '~'
    this.promptSymbol = options.promptSymbol ?? '❯'
    this.speed = options.speed ?? 1
  }

  private getPrompt(): string {
    return `${ANSI.cyan}${this.promptText}${ANSI.reset} ${ANSI.green}${this.promptSymbol}${ANSI.reset} `
  }

  private async typeText(text: string, delay: number): Promise<void> {
    const adjustedDelay = delay / this.speed
    for (const char of text) {
      if (this.stopped) return
      process.stdout.write(char)
      await sleep(adjustedDelay)
    }
  }

  private async showSpinner(text: string, duration: number): Promise<void> {
    const startTime = Date.now()
    let frameIndex = 0

    process.stdout.write(ANSI.hideCursor)

    while (Date.now() - startTime < duration) {
      if (this.stopped) break
      const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length]
      process.stdout.write(
        `${ANSI.moveToStart}${ANSI.clearLine}${ANSI.cyan}${frame}${ANSI.reset} ${applyColors(text)}`
      )
      frameIndex++
      await sleep(80)
    }

    process.stdout.write(`${ANSI.moveToStart}${ANSI.clearLine}`)
    process.stdout.write(ANSI.showCursor)
  }

  private async showProgress(text: string, duration: number, targetPercent: number): Promise<void> {
    const startTime = Date.now()
    const width = 30

    process.stdout.write(ANSI.hideCursor)

    while (Date.now() - startTime < duration) {
      if (this.stopped) break
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * targetPercent, targetPercent)
      const filled = Math.round((progress / 100) * width)
      const empty = width - filled
      const bar = `${ANSI.green}${'█'.repeat(filled)}${ANSI.gray}${'░'.repeat(empty)}${ANSI.reset}`
      const percent = Math.round(progress)

      process.stdout.write(
        `${ANSI.moveToStart}${ANSI.clearLine}${applyColors(text)} ${bar} ${percent}%`
      )
      await sleep(50)
    }

    // Final state
    const filled = Math.round((targetPercent / 100) * width)
    const empty = width - filled
    const bar = `${ANSI.green}${'█'.repeat(filled)}${ANSI.gray}${'░'.repeat(empty)}${ANSI.reset}`
    process.stdout.write(
      `${ANSI.moveToStart}${ANSI.clearLine}${applyColors(text)} ${bar} ${targetPercent}%\n`
    )
    process.stdout.write(ANSI.showCursor)
  }

  private async showSelect(
    question: string,
    options: string[],
    selectedIndex: number,
    duration: number
  ): Promise<void> {
    const stepDuration = duration / (options.length + 1)

    process.stdout.write(ANSI.hideCursor)
    console.log(`${ANSI.cyan}?${ANSI.reset} ${question}`)

    // Animate selection
    for (let current = 0; current <= selectedIndex; current++) {
      if (this.stopped) break

      // Draw options
      for (let i = 0; i < options.length; i++) {
        const prefix = i === current ? `${ANSI.cyan}❯${ANSI.reset}` : ' '
        const style = i === current ? ANSI.cyan : ANSI.dim
        console.log(`${prefix} ${style}${options[i]}${ANSI.reset}`)
      }

      if (current < selectedIndex) {
        await sleep(stepDuration)
        // Move cursor up to redraw
        process.stdout.write(ANSI.moveUp(options.length))
      }
    }

    // Clear options and show selected
    await sleep(stepDuration)
    process.stdout.write(ANSI.moveUp(options.length))
    for (let i = 0; i < options.length; i++) {
      process.stdout.write(`${ANSI.clearLine}\n`)
    }
    process.stdout.write(ANSI.moveUp(options.length + 1))
    process.stdout.write(ANSI.clearLine)
    console.log(
      `${ANSI.cyan}?${ANSI.reset} ${question} ${ANSI.cyan}${options[selectedIndex]}${ANSI.reset}`
    )

    process.stdout.write(ANSI.showCursor)
  }

  private async showMultiselect(
    question: string,
    options: string[],
    selectedIndices: number[],
    duration: number
  ): Promise<void> {
    const stepDuration = duration / (selectedIndices.length + 2)
    const selected = new Set<number>()

    process.stdout.write(ANSI.hideCursor)
    console.log(`${ANSI.cyan}?${ANSI.reset} ${question}`)

    // Draw initial options
    const drawOptions = (currentIndex: number) => {
      for (let i = 0; i < options.length; i++) {
        const isSelected = selected.has(i)
        const prefix = i === currentIndex ? `${ANSI.cyan}❯${ANSI.reset}` : ' '
        const checkbox = isSelected ? `${ANSI.green}◉${ANSI.reset}` : `${ANSI.dim}○${ANSI.reset}`
        const style = i === currentIndex ? '' : ANSI.dim
        console.log(`${prefix} ${checkbox} ${style}${options[i]}${ANSI.reset}`)
      }
    }

    drawOptions(0)

    // Animate selection
    for (const idx of selectedIndices) {
      if (this.stopped) break
      await sleep(stepDuration)
      selected.add(idx)
      process.stdout.write(ANSI.moveUp(options.length))
      drawOptions(idx)
    }

    // Final selection
    await sleep(stepDuration)
    process.stdout.write(ANSI.moveUp(options.length))
    for (let i = 0; i < options.length; i++) {
      process.stdout.write(`${ANSI.clearLine}\n`)
    }
    process.stdout.write(ANSI.moveUp(options.length + 1))
    process.stdout.write(ANSI.clearLine)

    const selectedNames = selectedIndices.map((i) => options[i]).join(', ')
    console.log(`${ANSI.cyan}?${ANSI.reset} ${question} ${ANSI.cyan}${selectedNames}${ANSI.reset}`)

    process.stdout.write(ANSI.showCursor)
  }

  private async playStep(step: Step): Promise<void> {
    if (this.stopped) return

    switch (step.type) {
      case 'prompt':
        process.stdout.write(this.getPrompt())
        break

      case 'command':
        await this.typeText(step.text, step.delay ?? 60)
        console.log()
        break

      case 'output':
        console.log(applyColors(step.text))
        break

      case 'spinner':
        await this.showSpinner(step.text, step.duration)
        break

      case 'wait':
        await sleep(step.ms / this.speed)
        break

      case 'question':
        process.stdout.write(`${ANSI.cyan}?${ANSI.reset} ${step.text} `)
        break

      case 'answer':
        await this.typeText(step.text, 80)
        console.log()
        break

      case 'select':
        await this.showSelect(step.question, step.options, step.selected, step.duration ?? 1500)
        break

      case 'multiselect':
        await this.showMultiselect(
          step.question,
          step.options,
          step.selected,
          step.duration ?? 2000
        )
        break

      case 'progress':
        await this.showProgress(step.text, step.duration, step.percent ?? 100)
        break
    }
  }

  async play(scenarios: Scenario[]): Promise<void> {
    this.stopped = false

    for (const scenario of scenarios) {
      if (this.stopped) break

      for (const step of scenario.steps) {
        if (this.stopped) break
        await this.playStep(step)
      }
    }
  }

  stop(): void {
    this.stopped = true
    process.stdout.write(ANSI.showCursor)
  }
}
