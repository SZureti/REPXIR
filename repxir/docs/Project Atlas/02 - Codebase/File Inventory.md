---
title: File Inventory
aliases: [Files]
type: index
project: repxir
status: implemented
verification: verified
tags: [atlas/hub, atlas/inventory]
last_mapped: 2026-10-14
documentation_version: 1
---

# File Inventory

<!-- ATLAS:BEGIN generated -->
All first-party files found at mapping time (excluding `node_modules/`, `.agents/`, `.claude/`).

## Source (`src/`)
| Path | Type | Responsibility | Note |
|---|---|---|---|
| `src/main.jsx` | JSX module | Mounts React into `#root` inside `StrictMode`; imports global CSS | [[main.jsx Entry Point]] |
| `src/App.jsx` | JSX component | Root (and only) component; landing page + counter | [[App Component]] |
| `src/index.css` | CSS | Global theme variables, light/dark scheme, base typography, `#root` layout | [[Styling and Theming]] |
| `src/App.css` | CSS | Styles for App sections: `.counter`, `.hero`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.ticks` | [[Styling and Theming]] |
| `src/assets/hero.png` | Image (343x361 PNG) | Base hero image; imported by App | [[App Component]] |
| `src/assets/react.svg` | Image | React logo; imported by App | [[App Component]] |
| `src/assets/vite.svg` | Image | Vite logo; imported by App | [[App Component]] |

## Static public files (`public/`)
Served as-is at the site root; not processed by the bundler.
| Path | Responsibility |
|---|---|
| `public/favicon.svg` | Favicon referenced by `index.html` |
| `public/icons.svg` | SVG sprite. Symbol IDs: `documentation-icon`, `social-icon`, `github-icon`, `discord-icon`, `x-icon`, `bluesky-icon` (plus `bluesky-clip` clip path). Referenced via `<use href="/icons.svg#...">` in [[App Component]] |

## Root configuration
| Path | Responsibility | Note |
|---|---|---|
| `index.html` | HTML shell and module entry | [[Architecture Overview]] |
| `package.json` | Name `repxir`, ESM (`"type": "module"`), scripts, dependencies | [[Dependency Overview]] |
| `package-lock.json` | npm lockfile | [[Dependency Overview]] |
| `vite.config.js` | Vite config; only registers `react()` plugin | [[Development Setup]] |
| `.oxlintrc.json` | oxlint config: `react` + `oxc` plugins; `react/rules-of-hooks` = error, `react/only-export-components` = warn | [[Development Setup]] |
| `.gitignore` | Ignores logs, `node_modules`, `dist`, `dist-ssr`, `*.local`, editor files | [[Development Setup]] |
| `README.md` | Unmodified Vite template README (describes the template, not this project) | [[Technical Debt]] |
| `skills-lock.json` | Lock file for installed AI-agent skills in `.agents/`; not used by the app | — |

## Not present
No tests, no CI config, no `.env` files, no TypeScript, no backend directories.
<!-- ATLAS:END generated -->
