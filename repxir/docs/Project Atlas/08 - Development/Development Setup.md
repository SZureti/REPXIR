---
title: Development Setup
aliases: [Build & Deployment, Testing Strategy, Scripts]
type: guide
project: repxir
status: implemented
verification: verified
source_path: package.json
tags: [atlas/development]
last_mapped: 2026-10-14
documentation_version: 1
---

# Development Setup

<!-- ATLAS:BEGIN generated -->
## Prerequisites
Node.js and npm. Node v24.21.0 was present on the mapping machine. No `engines` field or `.nvmrc` pins a version.

## Scripts (`package.json`)
| Command | Runs | What it does |
|---|---|---|
| `npm install` | — | Installs from `package-lock.json` |
| `npm run dev` | `vite` | Dev server with HMR (Vite's default port is 5173) |
| `npm run build` | `vite build` | Production bundle into `dist/` (gitignored) |
| `npm run preview` | `vite preview` | Serves the built `dist/` locally |
| `npm run lint` | `oxlint` | Lints using `.oxlintrc.json` |

None of these scripts were run during mapping (read-only analysis).

## Configuration
- **`vite.config.js`:** `defineConfig({ plugins: [react()] })`. Defaults for everything else (port, base path, build target, output dir).
- **`.oxlintrc.json`:** plugins `react` and `oxc`. Rules: `react/rules-of-hooks` = error; `react/only-export-components` = warn with `allowConstantExport: true` (keeps Fast Refresh reliable by having component files export only components).
- **Environment variables:** none declared, and no `.env` files. Vite exposes only `VITE_`-prefixed variables to client code.

## Testing
No test framework, test files, or CI pipelines exist. Vitest would be the natural fit for a Vite project (a suggestion, not something in the repo).

## Deployment
No deployment config. `vite build` produces a static site that any static host can serve. Once client-side routing is added, the host must rewrite unknown paths to `index.html`.

## Related
- [[Dependency Overview]] · [[Technical Debt]]
<!-- ATLAS:END generated -->
