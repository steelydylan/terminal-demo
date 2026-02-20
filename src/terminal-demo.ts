import { resolveTheme } from './themes.js'
import type { Scenario, Step, TerminalDemoController, TerminalDemoOptions, Theme } from './types.js'
import './terminal-demo.css'

/**
 * TerminalDemo - Animated terminal demo for showcasing CLI tools
 */
export class TerminalDemo implements TerminalDemoController {
  private container: HTMLElement
  private options: Required<
    Omit<
      TerminalDemoOptions,
      'onComplete' | 'onScenarioChange' | 'showScenarioSelector' | 'showProgress'
    >
  > & {
    onComplete?: () => void
    onScenarioChange?: (index: number, scenario: Scenario) => void
  }
  private theme: Theme

  // DOM elements
  private bodyEl: HTMLElement | null = null

  // State
  private running = false
  private paused = false
  private resumeResolver: (() => void) | null = null
  private currentLineEl: HTMLElement | null = null

  constructor(container: HTMLElement, options: TerminalDemoOptions) {
    this.container = container
    this.options = {
      title: options.title ?? 'Terminal Demo',
      promptText: options.promptText ?? '~',
      promptSymbol: options.promptSymbol ?? '❯',
      scenarios: options.scenarios,
      theme: options.theme ?? 'dark',
      windowStyle: options.windowStyle ?? 'macos',
      autoPlay: options.autoPlay ?? false,
      loop: options.loop ?? false,
      speed: options.speed ?? 1,
      onComplete: options.onComplete,
      onScenarioChange: options.onScenarioChange
    }
    this.theme = resolveTheme(this.options.theme)

    this.render()

    if (this.options.autoPlay) {
      this.play()
    }
  }

  private render(): void {
    const { windowStyle, title } = this.options

    this.container.innerHTML = `
      <div class="td-terminal" data-style="${windowStyle}">
        <div class="td-header">
          <div class="td-buttons">
            <span class="td-btn td-btn-close"></span>
            <span class="td-btn td-btn-minimize"></span>
            <span class="td-btn td-btn-maximize"></span>
          </div>
          <span class="td-title">${title}</span>
        </div>
        <div class="td-body"></div>
      </div>
    `

    this.applyTheme()

    // Get elements
    this.bodyEl = this.container.querySelector('.td-body')

    // Initial prompt
    this.showPrompt()
  }

  private applyTheme(): void {
    const t = this.theme
    const terminal = this.container.querySelector('.td-terminal') as HTMLElement
    if (!terminal) return

    terminal.style.setProperty('--td-background', t.background)
    terminal.style.setProperty('--td-foreground', t.foreground)
    terminal.style.setProperty('--td-header-background', t.headerBackground)
    terminal.style.setProperty('--td-cursor', t.cursor)
    terminal.style.setProperty('--td-prompt', t.prompt)
    terminal.style.setProperty('--td-gray', t.gray)
    terminal.style.setProperty('--td-green', t.green)
    terminal.style.setProperty('--td-cyan', t.cyan)
    terminal.style.setProperty('--td-yellow', t.yellow)
    terminal.style.setProperty('--td-red', t.red)
    terminal.style.setProperty('--td-purple', t.purple)
    terminal.style.setProperty('--td-white', t.white)
    terminal.style.setProperty('--td-button-close', t.buttonClose)
    terminal.style.setProperty('--td-button-minimize', t.buttonMinimize)
    terminal.style.setProperty('--td-button-maximize', t.buttonMaximize)
  }

  private async sleep(ms: number): Promise<void> {
    const adjustedMs = ms / this.options.speed
    const startTime = Date.now()
    let remainingTime = adjustedMs

    while (remainingTime > 0) {
      if (!this.running) return

      if (this.paused) {
        // Wait until resumed
        await new Promise<void>((resolve) => {
          this.resumeResolver = resolve
        })
        // After resume, continue with remaining time
        continue
      }

      const sleepTime = Math.min(remainingTime, 50) // Check every 50ms for pause
      await new Promise((resolve) => setTimeout(resolve, sleepTime))
      remainingTime = adjustedMs - (Date.now() - startTime)
    }
  }

  private createLine(): HTMLElement {
    const line = document.createElement('div')
    line.className = 'td-line'
    this.bodyEl?.appendChild(line)
    return line
  }

  private showPrompt(): void {
    this.currentLineEl = this.createLine()
    this.currentLineEl.innerHTML = `<span class="td-prompt">${this.options.promptText}</span> <span class="td-symbol">${this.options.promptSymbol}</span> <span class="td-cursor"></span>`
  }

  private async typeText(text: string, delay: number): Promise<void> {
    for (const char of text) {
      if (!this.running) return
      if (this.currentLineEl) {
        this.currentLineEl.innerHTML = this.currentLineEl.innerHTML.replace(
          '<span class="td-cursor"></span>',
          ''
        )
        this.currentLineEl.innerHTML += `${char}<span class="td-cursor"></span>`
      }
      await this.sleep(delay)
    }
  }

  private async showSpinner(text: string, duration: number): Promise<void> {
    const line = this.createLine()
    line.innerHTML = `<span class="td-spinner"></span> <span class="td-cyan">${text}</span>`
    await this.sleep(duration)
    line.remove()
  }

  private showOutput(text: string, className?: string): void {
    const line = this.createLine()
    const cls = className ? ` class="${className}"` : ''
    line.innerHTML = `<span${cls}>${this.parseColors(text)}</span>`
  }

  private parseColors(text: string): string {
    // Parse color tags like [green]text[/green]
    return text
      .replace(/\[gray\](.*?)\[\/gray\]/g, '<span class="td-gray">$1</span>')
      .replace(/\[green\](.*?)\[\/green\]/g, '<span class="td-green">$1</span>')
      .replace(/\[cyan\](.*?)\[\/cyan\]/g, '<span class="td-cyan">$1</span>')
      .replace(/\[yellow\](.*?)\[\/yellow\]/g, '<span class="td-yellow">$1</span>')
      .replace(/\[red\](.*?)\[\/red\]/g, '<span class="td-red">$1</span>')
      .replace(/\[purple\](.*?)\[\/purple\]/g, '<span class="td-purple">$1</span>')
      .replace(/\[white\](.*?)\[\/white\]/g, '<span class="td-white">$1</span>')
      .replace(/\[bold\](.*?)\[\/bold\]/g, '<span class="td-bold">$1</span>')
  }

  private async showQuestion(text: string): Promise<void> {
    this.currentLineEl = this.createLine()
    this.currentLineEl.innerHTML = `<span class="td-cyan">${text}</span><span class="td-cursor"></span>`
  }

  private async showAnswer(text: string): Promise<void> {
    this.removeCursor()
    if (this.currentLineEl) {
      this.currentLineEl.innerHTML += `<span class="td-white">${text}</span>`
    }
    await this.sleep(100)
  }

  private scrollToBottom(): void {
    if (this.bodyEl) {
      this.bodyEl.scrollTop = this.bodyEl.scrollHeight
    }
  }

  private removeCursor(): void {
    if (this.currentLineEl) {
      this.currentLineEl.innerHTML = this.currentLineEl.innerHTML.replace(
        '<span class="td-cursor"></span>',
        ''
      )
    }
  }

  private async runStep(step: Step): Promise<void> {
    if (!this.running) return

    switch (step.type) {
      case 'prompt':
        this.removeCursor()
        this.showPrompt()
        break
      case 'command':
        await this.typeText(step.text, step.delay ?? 60)
        this.removeCursor()
        break
      case 'wait':
        await this.sleep(step.ms)
        break
      case 'output':
        this.showOutput(step.text, step.className)
        await this.sleep(30)
        break
      case 'spinner':
        await this.showSpinner(step.text, step.duration)
        break
      case 'question':
        await this.showQuestion(step.text)
        break
      case 'answer':
        await this.showAnswer(step.text)
        break
    }

    this.scrollToBottom()
  }

  private async runScenario(scenario: Scenario, index: number): Promise<void> {
    this.options.onScenarioChange?.(index, scenario)

    for (const step of scenario.steps) {
      if (!this.running) break
      await this.runStep(step)
    }
  }

  async play(): Promise<void> {
    if (this.running) return

    this.running = true
    if (this.bodyEl) this.bodyEl.innerHTML = ''

    const { scenarios, loop } = this.options

    do {
      for (let i = 0; i < scenarios.length && this.running; i++) {
        await this.runScenario(scenarios[i], i)
      }

      if (this.running) {
        this.showPrompt()
      }
    } while (loop && this.running)

    this.running = false
    this.options.onComplete?.()
  }

  async playScenario(index: number): Promise<void> {
    if (index < 0 || index >= this.options.scenarios.length) return

    // Stop any running scenario first
    this.running = false
    await this.sleep(10) // Allow current operations to stop

    this.running = true
    if (this.bodyEl) this.bodyEl.innerHTML = ''

    await this.runScenario(this.options.scenarios[index], index)

    if (this.running) {
      this.showPrompt()
    }

    this.running = false
  }

  stop(): void {
    this.running = false
    this.paused = false
    if (this.resumeResolver) {
      this.resumeResolver()
      this.resumeResolver = null
    }
  }

  reset(): void {
    this.running = false
    this.paused = false
    if (this.resumeResolver) {
      this.resumeResolver()
      this.resumeResolver = null
    }
    if (this.bodyEl) this.bodyEl.innerHTML = ''
    this.showPrompt()
  }

  isPlaying(): boolean {
    return this.running
  }

  isPaused(): boolean {
    return this.paused
  }

  pause(): void {
    if (this.running && !this.paused) {
      this.paused = true
    }
  }

  resume(): void {
    if (this.paused) {
      this.paused = false
      if (this.resumeResolver) {
        this.resumeResolver()
        this.resumeResolver = null
      }
    }
  }

  destroy(): void {
    this.running = false
    this.paused = false
    if (this.resumeResolver) {
      this.resumeResolver()
      this.resumeResolver = null
    }
    this.container.innerHTML = ''
  }

  getTerminalElement(): HTMLElement | null {
    return this.container.querySelector('.td-terminal')
  }
}
