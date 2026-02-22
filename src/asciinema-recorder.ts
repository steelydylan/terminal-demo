import { writeFileSync } from 'node:fs'

export interface AsciinemaHeader {
  version: 2
  width: number
  height: number
  timestamp?: number
  title?: string
  env?: Record<string, string>
}

export interface AsciinemaEvent {
  time: number
  type: 'o' | 'i'
  data: string
}

export class AsciinemaRecorder {
  private events: AsciinemaEvent[] = []
  private startTime: number = 0
  private originalWrite: typeof process.stdout.write | null = null
  private isRecording = false
  private width: number
  private height: number
  private title?: string

  constructor(options: { width?: number; height?: number; title?: string } = {}) {
    this.width = options.width ?? process.stdout.columns ?? 80
    this.height = options.height ?? process.stdout.rows ?? 24
    this.title = options.title
  }

  start(): void {
    if (this.isRecording) return

    this.events = []
    this.startTime = Date.now()
    this.isRecording = true

    // Wrap process.stdout.write to capture output
    this.originalWrite = process.stdout.write.bind(process.stdout)

    // Initialize terminal state - clear screen and move cursor to home
    // This ensures consistent starting position for recording
    this.events.push({
      time: 0,
      type: 'o',
      data: '\x1b[2J\x1b[H' // Clear screen and move to home position
    })
    process.stdout.write = ((
      chunk: string | Uint8Array,
      encodingOrCallback?: BufferEncoding | ((err?: Error | null) => void),
      callback?: (err?: Error | null) => void
    ): boolean => {
      const data = typeof chunk === 'string' ? chunk : chunk.toString()
      const time = (Date.now() - this.startTime) / 1000

      this.events.push({
        time,
        type: 'o',
        data
      })

      // Call original write
      if (typeof encodingOrCallback === 'function') {
        return this.originalWrite!(chunk, encodingOrCallback)
      }
      return this.originalWrite!(chunk, encodingOrCallback, callback)
    }) as typeof process.stdout.write
  }

  stop(): void {
    if (!this.isRecording) return

    // Restore original stdout.write
    if (this.originalWrite) {
      process.stdout.write = this.originalWrite
      this.originalWrite = null
    }

    this.isRecording = false
  }

  save(filePath: string): void {
    const header: AsciinemaHeader = {
      version: 2,
      width: this.width,
      height: this.height,
      timestamp: Math.floor(this.startTime / 1000)
    }

    if (this.title) {
      header.title = this.title
    }

    // Build the .cast file content (JSON Lines format)
    const lines: string[] = [JSON.stringify(header)]

    for (const event of this.events) {
      lines.push(JSON.stringify([event.time, event.type, event.data]))
    }

    writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf-8')
  }

  getEvents(): AsciinemaEvent[] {
    return [...this.events]
  }

  getDuration(): number {
    if (this.events.length === 0) return 0
    return this.events[this.events.length - 1].time
  }
}
