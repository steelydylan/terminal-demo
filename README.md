# terminal-demo

Animated terminal demo component for showcasing CLI tools. Works with vanilla JavaScript and React.

## Features

- Animated typing, spinners, and colored output
- Scenario-based playback
- Multiple themes (dark/light) and window styles (macOS/Windows/Linux)
- Works with any framework or vanilla JS
- React component included
- TypeScript support

## Installation

```bash
npm install terminal-demo
```

## Usage

### Vanilla JavaScript

```html
<div id="demo"></div>

<script type="module">
  import { TerminalDemo } from 'terminal-demo'

  new TerminalDemo(document.getElementById('demo'), {
    title: 'my-cli demo',
    scenarios: [
      {
        name: 'Install',
        steps: [
          { type: 'prompt' },
          { type: 'command', text: 'npm install my-cli' },
          { type: 'spinner', text: 'Installing...', duration: 2000 },
          { type: 'output', text: '[green]✓ Installed successfully[/green]' },
        ]
      }
    ]
  })
</script>
```

### React

```tsx
import { TerminalDemoComponent } from 'terminal-demo/react'

function App() {
  return (
    <TerminalDemoComponent
      title="my-cli demo"
      scenarios={[
        {
          name: 'Install',
          steps: [
            { type: 'prompt' },
            { type: 'command', text: 'npm install my-cli' },
            { type: 'spinner', text: 'Installing...', duration: 2000 },
            { type: 'output', text: '[green]✓ Installed successfully[/green]' },
          ]
        }
      ]}
      autoPlay
    />
  )
}
```

## Step Types

| Type | Description | Properties |
|------|-------------|------------|
| `prompt` | Show command prompt | - |
| `command` | Type a command | `text`, `delay?` |
| `output` | Display output line | `text`, `className?` |
| `spinner` | Show loading spinner | `text`, `duration` |
| `wait` | Pause execution | `ms` |
| `question` | Show interactive prompt | `text` |
| `answer` | Show user's answer | `text` |

## Color Tags

Use color tags in output text:

```js
{ type: 'output', text: '[green]Success![/green]' }
{ type: 'output', text: '[red]Error:[/red] Something went wrong' }
{ type: 'output', text: '[bold][cyan]Title[/cyan][/bold]' }
```

Available colors: `gray`, `green`, `cyan`, `yellow`, `red`, `purple`, `white`, `bold`

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | `string` | `'Terminal Demo'` | Title in terminal header |
| `scenarios` | `Scenario[]` | required | Array of scenarios |
| `theme` | `'dark' \| 'light' \| Theme` | `'dark'` | Color theme |
| `windowStyle` | `'macos' \| 'windows' \| 'linux'` | `'macos'` | Window button style |
| `promptText` | `string` | `'~'` | Prompt path text |
| `promptSymbol` | `string` | `'❯'` | Prompt symbol |
| `autoPlay` | `boolean` | `false` | Auto-play on mount |
| `loop` | `boolean` | `false` | Loop playback |
| `speed` | `number` | `1` | Playback speed multiplier |
| `showScenarioSelector` | `boolean` | `true` | Show scenario buttons |
| `showProgress` | `boolean` | `true` | Show progress bar |
| `onComplete` | `() => void` | - | Called when playback ends |
| `onScenarioChange` | `(index, scenario) => void` | - | Called on scenario change |

## Controller Methods

```ts
const demo = new TerminalDemo(el, options)

demo.play()              // Play all scenarios
demo.playScenario(0)     // Play specific scenario
demo.stop()              // Stop playback
demo.reset()             // Reset to initial state
demo.isPlaying()         // Check if playing
demo.destroy()           // Cleanup
```

## Custom Theme

```ts
new TerminalDemo(el, {
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    prompt: '#6a9955',
    command: '#d4d4d4',
    cursor: '#aeafad',
    headerBackground: '#323233',
    buttonClose: '#f14c4c',
    buttonMinimize: '#cca700',
    buttonMaximize: '#23d18b',
    gray: '#808080',
    green: '#6a9955',
    cyan: '#4ec9b0',
    yellow: '#dcdcaa',
    red: '#f14c4c',
    purple: '#c586c0',
    white: '#d4d4d4',
  },
  // ...
})
```

## License

MIT
