import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { parseScenarioText } from './parser.js'
import { TerminalPlayer } from './terminal-player.js'

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

Examples:
  terminal-demo play demo.txt
  terminal-demo play demo.txt --speed 2
  terminal-demo play demo.txt --clear
`

const VERSION = '0.1.8'

interface ParsedArgs {
  command: string
  file?: string
  speed: number
  prompt: string
  symbol: string
  clear: boolean
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

      // Handle Ctrl+C
      process.on('SIGINT', () => {
        player.stop()
        console.log('\n')
        process.exit(0)
      })

      // Wait for Enter before starting
      await waitForEnter()

      // Clear terminal if --clear is specified
      if (args.clear) {
        clearTerminal()
      }

      await player.play(scenarios)
      break
    }
  }
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
