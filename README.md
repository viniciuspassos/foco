# Foco

A browser application for breaking tasks into short, checkable steps. It keeps task data only in memory and uses Chrome's local AI model for optional English step suggestions when available.

## Development

```sh
npm install
npm run dev
```

Open the local URL printed by Vite in desktop Chrome. The browser's Prompt API requires a supported Chrome installation and may require an initial model download.

## Validation

```sh
npm test
npm run lint
npm run build
npm run format:check
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions and [AGENTS.md](AGENTS.md) or [CLAUDE.md](CLAUDE.md) for development guidance.
