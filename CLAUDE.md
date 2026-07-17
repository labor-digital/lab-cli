# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@labor-digital/lab-cli` is a Node.js CLI tool (command: `lab`) for managing Docker-based development environments. It wraps Docker Compose operations, project scaffolding, npm script execution, and Factory component management. Requires Node 22.

## Build & Test Commands

```bash
npm run build      # Clean lib/ directory and compile TypeScript
npm run watch      # Watch mode for development
npm test           # Run full Jest test suite
npx jest test/SomeFile.test.ts  # Run a single test file
```

Build output goes to `lib/` (compiled from `src/`). Entry point is `lib/index.js`.

## Architecture

### Application Lifecycle

`src/index.ts` → `Application.run()` → creates `AppContext` → registers commands via `DefaultCommands` → loads extensions → `CommandHandler` parses argv and executes the matched command.

### AppContext (DI Container)

`AppContext` is the central dependency injection object passed to all commands. It holds: `program` (Commander instance), `eventEmitter`, `config`, `registry`, `appRegistry`, `fileFinder`, `commandRegistry`, `platform`, and path references (`cwd`, `rootDirectory`, `cliDirectory`).

### Command System

Commands are registered in `DefaultCommands.ts` with a signature, file path, and options. They are lazy-loaded — the command class file is only `require()`'d when the command is actually invoked. Commands implement an async action method receiving `(cmd, context, stack, ...args)`.

The `CommandStack` allows commands to push follow-up commands for sequential execution.

### Event System

`EventEmitter` supports two patterns:
- **Events** (`emit`): async fire-and-forget
- **Hooks** (`emitHook`): sequential, awaited, priority-ordered

Used by extensions to intercept and modify CLI behavior.

### Configuration Hierarchy (highest priority last)

1. `DefaultConfig.ts` (defaults)
2. `~/lab.config.json` (global user config)
3. `lab.config.json` in root directory (where docker-compose.yml lives)
4. `lab.config.json` in parent directory
5. `lab.config.json` in current directory

### Storage

- `Registry` — global persistent key-value store (`~/lab-cli-registry.json`)
- `AppRegistry` — per-project storage, nested inside the global registry keyed by root path

Both support dot-notation keys.

### Platform Abstraction

`Platform` class provides OS detection and `Platform.choose()` for platform-specific values. Docker socket paths and hosts file locations are resolved per-platform.

### Factory Commands

The Factory commands manage headless CMS projects built on the Factory boilerplate (TYPO3 + Nuxt). They revolve around a `factory.json` config file in client projects that declares `core_version` and `active_components`.

**Commands:**
- `lab factory:create <project-name>` — Scaffolds a new client project from `factory-core/templates/`, creating `backend/app/` and `frontend/app/` directories, replacing `{{PROJECT_NAME}}` placeholders, and initializing an empty `factory.json`.
- `lab factory:add <name>` — Activates a component by adding it to `active_components` in `factory.json` and installing its dependencies. Detects context from `composer.json` (backend → Composer) or `package.json` (frontend → npm). Checks the component manifest for version compatibility — returns `requires_update` if core is too old.
- `lab factory:upgrade` — Upgrades factory-core by running `composer require` (backend) or `npm install` (frontend) and updating `core_version` in `factory.json`. Uses semver comparison to skip if already up-to-date.

**Key types:**
- `ComponentManifest` (`src/Classes/Core/Factory/ComponentManifest.ts`) — maps component names to `{ version, composer_dependencies?, npm_dependencies? }`. Resolved from `../factory-core/manifest.json` relative to cwd, with a hardcoded fallback.
- `FactoryConfig` — the `factory.json` shape: `{ core_version: string, active_components: string[] }`.

**Shared patterns across Factory commands:**
- All support `--json` flag for machine-readable JSON output (used by other tools/agents)
- `resolveFactoryPath()` searches: explicit `--factory <path>` → `./factory.json` → `./src/factory.json` → interactive prompt (or error in JSON mode)
- Context detection: presence of `composer.json` = backend, `package.json` = frontend. Both present = error.
- JSON responses use typed status objects (`success`, `error`, `noop`, `requires_update`) — follow this pattern when adding new Factory commands.

## Design Log Methodology

The project follows a design log methodology for significant features and architectural changes. Design logs live in `.design-log/`.

### Before Making Changes
1. Check `.design-log/` for existing designs and implementation notes
2. For new features: create design log first, get approval, then implement
3. Read related design logs to understand context and constraints

### When Creating Design Logs
1. Structure: Background → Problem → Questions and Answers → Design → Implementation Plan → Examples → Trade-offs
2. Be specific: include file paths, type signatures, validation rules
3. Show examples: use checkmark/cross for good/bad patterns, include realistic code
4. Explain why: don't just describe what, explain rationale and trade-offs
5. Ask questions (in the file) for anything unclear or missing
6. When answering questions: keep the questions, just add answers
7. Be brief: write short explanations and only what is most relevant
8. Draw diagrams: use mermaid inline diagrams when it makes sense

### When Implementing
1. Follow the implementation plan phases from the design log
2. Write tests first or update existing tests to match new behavior
3. Do not update design log initial sections once implementation started
4. Append design log with "Implementation Results" section as you go
5. Document deviations: explain why implementation differs from design
6. Run tests: include test results (X/Y passing) in implementation notes
7. After implementation add a summary of deviations from original design

## Key Conventions

- Utility functions come from `radashi` (not lodash)
- All source files use Apache-2.0 license headers
- TypeScript with strict null checks, target ES6, CommonJS modules
- Jest tests live in `test/` with mocks for `chalk`, `inquirer`, and `radashi` in `test/__mocks__/`
- The `"."` prefix in CLI args is a shortcut for npm scripts (e.g., `lab .watch` → `lab run watch`)

## CI/CD

GitHub Actions on push to master: install → test → build → changelog/version bump → npm publish. Node 22 environment.
