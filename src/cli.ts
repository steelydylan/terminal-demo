import { exec } from 'node:child_process'
import { readFileSync, existsSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { createInterface } from 'node:readline'
import { promisify } from 'node:util'
import { AsciinemaRecorder } from './asciinema-recorder.js'
import { parseScenarioText } from './parser.js'
import { TerminalPlayer } from './terminal-player.js'

const execAsync = promisify(exec)

const HELP = `
terminal-demo - Play terminal demo scenarios in your terminal

Usage:
  terminal-demo play <file>   Play a scenario file
  terminal-demo help          Show this help message

Options:
  --speed <n>       Playback speed multiplier (default: 1)
  --prompt <text>   Custom prompt text (default: ~)
  --symbol <char>   Custom prompt symbol (default: ❯)
  --clear           Clear terminal before starting
  --record <file>   Record output to asciinema .cast file
  --mp4 <file>      Record output and convert to .mp4 video

Examples:
  terminal-demo play demo.txt
  terminal-demo play demo.txt --speed 2
  terminal-demo play demo.txt --clear
  terminal-demo play demo.txt --record output.cast
  terminal-demo play demo.txt --mp4 output.mp4
`

const VERSION = '0.1.8'

interface ParsedArgs {
  command: string
  file?: string
  speed: number
  prompt: string
  symbol: string
  clear: boolean
  record?: string
  mp4?: string
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: 'help',
    speed: 1,
    prompt: '~',
    symbol: '❯',
    clear: false
  }

  let i = 0
  while (i < args.length) {
    const arg = args[i]

    if (arg === 'play' && !result.file) {
      result.command = 'play'
      i++
      if (i < args.length && !args[i].startsWith('--')) {
        result.file = args[i]
        i++
      }
    } else if (arg === 'help' || arg === '--help' || arg === '-h') {
      result.command = 'help'
      i++
    } else if (arg === '--version' || arg === '-v') {
      result.command = 'version'
      i++
    } else if (arg === '--speed' && i + 1 < args.length) {
      result.speed = parseFloat(args[i + 1]) || 1
      i += 2
    } else if (arg === '--prompt' && i + 1 < args.length) {
      result.prompt = args[i + 1]
      i += 2
    } else if (arg === '--symbol' && i + 1 < args.length) {
      result.symbol = args[i + 1]
      i += 2
    } else if (arg === '--clear') {
      result.clear = true
      i++
    } else if (arg === '--record' && i + 1 < args.length) {
      result.record = args[i + 1]
      i += 2
    } else if (arg === '--mp4' && i + 1 < args.length) {
      result.mp4 = args[i + 1]
      i += 2
    } else {
      i++
    }
  }

  return result
}

function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })
    console.log('\x1b[90mPress Enter to start...\x1b[0m')
    rl.question('', () => {
      rl.close()
      resolve()
    })
  })
}

function clearTerminal(): void {
  process.stdout.write('\x1b[2J\x1b[H')
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  switch (args.command) {
    case 'version':
      console.log(`terminal-demo v${VERSION}`)
      break

    case 'help':
      console.log(HELP)
      break

    case 'play': {
      if (!args.file) {
        console.error('Error: No file specified')
        console.log('Usage: terminal-demo play <file>')
        process.exit(1)
      }

      const filePath = resolve(process.cwd(), args.file)

      let content: string
      try {
        content = readFileSync(filePath, 'utf-8')
      } catch {
        console.error(`Error: Cannot read file "${args.file}"`)
        process.exit(1)
      }

      const scenarios = parseScenarioText(content)

      if (scenarios.length === 0) {
        console.error('Error: No scenarios found in file')
        process.exit(1)
      }

      const player = new TerminalPlayer({
        promptText: args.prompt,
        promptSymbol: args.symbol,
        speed: args.speed
      })

      // Setup MP4 Temp Path Injection
      let tempCastFile: string | undefined
      let targetCastFile: string | undefined
      if (args.mp4) {
        if (args.record) {
          // user asked for BOTH .cast and .mp4. Use their path, don't delete later.
          targetCastFile = resolve(process.cwd(), args.record)
        } else {
          // user ONLY asked for .mp4. Create a temp file to delete later.
          tempCastFile = join(tmpdir(), `terminal-demo-${Date.now()}.cast`)
          args.record = tempCastFile
          targetCastFile = tempCastFile
        }
      }

      // Set up recorder if --record (or --mp4 via hijack) is specified
      let recorder: AsciinemaRecorder | null = null
      if (args.record) {
        recorder = new AsciinemaRecorder({
          title: `terminal-demo: ${args.file}`,
          width: args.mp4 ? 80 : undefined,
          height: args.mp4 ? 24 : undefined
        })
      }

      // Handle Ctrl+C
      process.on('SIGINT', () => {
        player.stop()
        if (recorder) {
          recorder.stop()
          const recordPath = resolve(process.cwd(), args.record!)
          recorder.save(recordPath)

          if (args.mp4 && tempCastFile && existsSync(tempCastFile)) {
            unlinkSync(tempCastFile)
            console.log(`\n\x1b[33m⚠\x1b[0m Interrupted. MP4 conversion cancelled.`)
          } else if (!args.mp4) {
            console.log(`\n\x1b[32m✓\x1b[0m Recording saved to ${args.record}`)
          }
        }
        console.log('\n')
        process.exit(0)
      })

      // Wait for Enter before starting
      await waitForEnter()

      // Clear terminal if --clear is specified
      if (args.clear) {
        clearTerminal()
      }

      // Start recording after clear (so clear is not recorded)
      if (recorder) {
        recorder.start()
      }

      await player.play(scenarios)

      // Stop recording and save / convert
      if (recorder) {
        recorder.stop()
        const recordPath = resolve(process.cwd(), args.record!)
        recorder.save(recordPath)

        if (args.mp4 && tempCastFile) {
          console.log(`\n Converting recording to .mp4...`)
          let tempGifFile: string | undefined
          try {
            // 1. Check for required dependencies
            try {
              await execAsync('agg --version')
              await execAsync('ffmpeg -version')
            } catch (_depsError) {
              throw new Error(
                'Missing required dependencies.\n' +
                '  To export to .mp4, you must have these installed on your system:\n' +
                '  1. agg (https://github.com/asciinema/agg)\n' +
                '  2. ffmpeg (https://ffmpeg.org/)'
              )
            }

            const mp4Path = resolve(process.cwd(), args.mp4)
            tempGifFile = join(tmpdir(), `terminal-demo-${Date.now()}.gif`)

            // 2. Convert .cast to .gif using agg
            console.log(`\x1b[90m  Step 1/2: Generating frames...\x1b[0m`)
            await execAsync(`agg --font-size 18 ${targetCastFile} ${tempGifFile}`)

            // 3. Convert .gif to .mp4 using ffmpeg (Uses mp4Path here to clear the warning)
            console.log(`\x1b[90m  Step 2/2: Encoding video...\x1b[0m`)
            await execAsync(`ffmpeg -y -i ${tempGifFile} -movflags faststart -pix_fmt yuv420p -crf 15 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ${mp4Path}`)

            console.log(`\x1b[32m✓\x1b[0m Video successfully saved to ${args.mp4}`)
          } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err))
            console.error(`\x1b[31mError converting to .mp4:\x1b[0m\n${error.message}`)
          } finally {
            // Cleanup temporary files gracefully
            if (tempCastFile && existsSync(tempCastFile)) {
              unlinkSync(tempCastFile)
            }
            if (tempGifFile && existsSync(tempGifFile)) {
              unlinkSync(tempGifFile)
            }
          }
        } else {
          console.log(`\n\x1b[32m✓\x1b[0m Recording saved to ${args.record}`)
          console.log(`\x1b[90m  Play with: asciinema play ${args.record}\x1b[0m`)
        }
      }
      break
    }
  }
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
