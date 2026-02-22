import { readFileSync, unlinkSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { AsciinemaRecorder } from '../asciinema-recorder.js'

describe('AsciinemaRecorder', () => {
  const testFile = '/tmp/test-recording.cast'

  afterEach(() => {
    try {
      unlinkSync(testFile)
    } catch {
      // ignore
    }
  })

  it('should capture stdout output', () => {
    const recorder = new AsciinemaRecorder({ width: 80, height: 24 })

    recorder.start()
    process.stdout.write('Hello')
    process.stdout.write(' World')
    recorder.stop()

    const events = recorder.getEvents()
    // First event is clear screen, then Hello, then World
    expect(events.length).toBe(3)
    expect(events[0].data).toBe('\x1b[2J\x1b[H') // Clear screen
    expect(events[1].data).toBe('Hello')
    expect(events[2].data).toBe(' World')
    expect(events[1].type).toBe('o')
  })

  it('should record timestamps', async () => {
    const recorder = new AsciinemaRecorder()

    recorder.start()
    process.stdout.write('First')
    await new Promise((resolve) => setTimeout(resolve, 100))
    process.stdout.write('Second')
    recorder.stop()

    const events = recorder.getEvents()
    // First event is clear screen, then First, then Second
    expect(events.length).toBe(3)
    expect(events[0].time).toBe(0) // Clear screen at time 0
    expect(events[1].time).toBe(0) // First is also at ~0
    expect(events[2].time).toBeGreaterThan(0.05) // Second is after delay
  })

  it('should save to .cast file in correct format', () => {
    const recorder = new AsciinemaRecorder({
      width: 100,
      height: 30,
      title: 'Test Recording'
    })

    recorder.start()
    process.stdout.write('Test output')
    recorder.stop()
    recorder.save(testFile)

    const content = readFileSync(testFile, 'utf-8')
    const lines = content.trim().split('\n')

    // First line is header
    const header = JSON.parse(lines[0])
    expect(header.version).toBe(2)
    expect(header.width).toBe(100)
    expect(header.height).toBe(30)
    expect(header.title).toBe('Test Recording')

    // Second line is clear screen event
    const clearEvent = JSON.parse(lines[1])
    expect(clearEvent[1]).toBe('o')
    expect(clearEvent[2]).toBe('\x1b[2J\x1b[H')

    // Third line is actual output event
    const event = JSON.parse(lines[2])
    expect(event[1]).toBe('o')
    expect(event[2]).toBe('Test output')
  })

  it('should not record after stop', () => {
    const recorder = new AsciinemaRecorder()

    recorder.start()
    process.stdout.write('Before stop')
    recorder.stop()
    process.stdout.write('After stop')

    const events = recorder.getEvents()
    // First event is clear screen, second is Before stop
    expect(events.length).toBe(2)
    expect(events[0].data).toBe('\x1b[2J\x1b[H')
    expect(events[1].data).toBe('Before stop')
  })

  it('should calculate duration correctly', async () => {
    const recorder = new AsciinemaRecorder()

    recorder.start()
    process.stdout.write('Start')
    await new Promise((resolve) => setTimeout(resolve, 150))
    process.stdout.write('End')
    recorder.stop()

    const duration = recorder.getDuration()
    expect(duration).toBeGreaterThan(0.1)
    expect(duration).toBeLessThan(0.5)
  })
})
