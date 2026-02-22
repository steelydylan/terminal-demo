# gut commit
AI-generated commit messages

---
$ gut commit
[wait:400]
> [gray]No staged changes, staging all changes...[/gray]
[spinner:1800] Generating commit message...
>
> [bold]Generated commit message:[/bold]
>
>   [green]feat(auth): add secure API key storage[/green]
>   [gray]- Implement keytar for macOS Keychain[/gray]
>   [gray]- Add environment variable fallback[/gray]
>
? Commit with this message? (y/N/e to edit)
: y
> [green]✓ Committed successfully[/green]
[wait:1000]

# gut pr
Generate PR descriptions

---
$ gut pr --create
[wait:400]
[spinner:600] Analyzing branch...
[spinner:1500] Generating PR description...
>
> [bold]📝 Generated PR:[/bold]
>
> [cyan]Title:[/cyan] [white]feat(auth): Add secure API key storage[/white]
>
> [cyan]Description:[/cyan]
> [gray]──────────────────────────────────────────────────[/gray]
> ## Summary
> Implements secure API key storage using system keychain.
>
> ## Changes
> - Added keytar integration
> - Support for multiple AI providers
> [gray]──────────────────────────────────────────────────[/gray]
? Create PR? (y/N)
: y
[spinner:1200] Creating PR...
> [green]✓ PR created successfully![/green]
>
> [green]🔗 https://github.com/user/repo/pull/42[/green]
[wait:1000]

# gut review
AI code review

---
$[delay:40] gut review
[wait:400]
[spinner:2000] Analyzing changes...
>
> [bold]🔍 Code Review Results[/bold]
>
> [cyan]Overall:[/cyan] [green]Good[/green] - Well-structured code
>
> [yellow]⚠ src/lib/credentials.ts:45[/yellow]
>   [gray]Consider adding error handling for keychain failures[/gray]
>
> [green]✓ src/commands/auth.ts[/green]
>   [gray]Clean implementation of auth flow[/gray]
[wait:1500]

# gut init
Interactive project setup

---
$ gut init
[wait:400]
>
> [bold]🚀 Initialize gut-cli[/bold]
>
[select:1500] Select AI provider: | OpenAI, Anthropic, Google AI, Local LLM | 1
[wait:300]
[multiselect:2500] Select features: | Auto-commit, PR generation, Code review, Branch naming | 0,1,2
[wait:300]
>
[progress:2000:100] Installing dependencies...
>
> [green]✓ gut-cli initialized successfully![/green]
> [gray]Run gut --help to see available commands[/gray]
[wait:1000]
