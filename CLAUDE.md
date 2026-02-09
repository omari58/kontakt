# Kontakt — Project Conventions

## Package Manager

This project uses **pnpm** with workspaces.

- Install dependencies: `pnpm install`
- Add to specific app: `pnpm add <pkg> --filter <app>` (e.g., `--filter web`, `--filter api`)
- Run scripts: `pnpm --filter <app> <script>` or `pnpm <script>` from root for workspace scripts
- Never use `npm` or `yarn`
