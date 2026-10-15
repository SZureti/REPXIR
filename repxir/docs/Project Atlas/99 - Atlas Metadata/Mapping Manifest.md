---
title: Mapping Manifest
aliases: [Atlas Manifest, Generation Rules]
type: metadata
project: repxir
status: implemented
verification: verified
tags: [atlas/metadata]
last_mapped: 2026-10-14
documentation_version: 1
schema_version: 1
---

# Mapping Manifest

<!-- ATLAS:BEGIN generated -->
## Baseline
| Field | Value |
|---|---|
| Repository | `/Users/sai/codePlatoon/week2/repxir/repxir` |
| Git commit / branch | None. The directory is not a git repository |
| Mapped on | 2026-10-14 |
| Mode | A: Initial Project Mapping |
| Doc schema version | 1 |
| Exclusions | `node_modules/`, `dist/`, `.agents/`, `.claude/`, `docs/Project Atlas/` |

## Source file hashes (SHA-256)
Use these for incremental sync until a git baseline exists.
| File | SHA-256 |
|---|---|
| `index.html` | `3afde664608299767eaa2e00b0eef453c952be435e7f8ca99700a91a2aaf5dd2` |
| `package.json` | `5107311b9f6564ec9d6ccd1eee4981e059e5deff530ef125ab5dbd097b9c3281` |
| `vite.config.js` | `e1eefd0ed1639c88d1213884ef760516884db9e168190e223fee6b063ad3e088` |
| `.oxlintrc.json` | `1be899e45c49b2a2edc715bc3bfb31d8ed8e866ed7ebab2065ff6e55e88c2396` |
| `src/main.jsx` | `4b4b864dbe45253425d0c925337180ec07e204295179f80f59551216f466f618` |
| `src/App.jsx` | `3226560e76fae0a061d973aee04d87fc5e3f4c4b41d94777ab622c4b19aa4067` |
| `src/index.css` | `fda85fffe7f006d822fb9ab4e774b9e2b8fadffa73a3806b038dc0b8456cbbeb` |
| `src/App.css` | `6e25a776d3e8102da5bacb3cb99f4a5fc662a2e01e6143140671a556d28c3d5c` |

## Generated notes -> source mapping
| Note | Sources |
|---|---|
| [[Project Dashboard]] | all |
| [[Architecture Overview]] | `index.html`, `src/main.jsx`, `src/App.jsx`, `vite.config.js` |
| [[File Inventory]] | all first-party files |
| [[Component Map]] | `src/main.jsx`, `src/App.jsx` |
| [[main.jsx Entry Point]] | `src/main.jsx` |
| [[App Component]] | `src/App.jsx`, `src/assets/*`, `public/icons.svg` |
| [[Styling and Theming]] | `src/index.css`, `src/App.css` |
| [[Starter Counter]] | `src/App.jsx` |
| [[State Management]] | `src/App.jsx` |
| [[Dependency Overview]] | `package.json`, `package-lock.json` |
| [[Development Setup]] | `package.json`, `vite.config.js`, `.oxlintrc.json`, `.gitignore` |
| [[Technical Debt]] | all |
| [[Concepts Index]], [[React State with useState]], [[Vite Dev Server and Build]], [[Client-Side Routing with React Router]] | concept notes |
| [[Change Log]], [[Documentation Status]], [[Mapping Manifest]] | metadata |

## Generation rules
- Generated content lives between the HTML comment markers `ATLAS:BEGIN generated` and `ATLAS:END generated`. Content outside these markers is user-owned and must be preserved on sync.
- Note names are unique vault-wide. Links use bare `[[Note Name]]`.
- Confidence labels: Verified · Inferred · Unverified · Outdated · Planned.
<!-- ATLAS:END generated -->
