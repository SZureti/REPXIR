---
title: Technical Debt
aliases: [Known Issues, Gaps]
type: report
project: repxir
status: implemented
verification: verified
tags: [atlas/development, atlas/debt]
last_mapped: 2026-10-14
documentation_version: 1
---

# Technical Debt and Gaps

<!-- ATLAS:BEGIN generated -->
These are observations, not defects. The project is a fresh scaffold.

| # | Item | Evidence | Impact | Suggestion |
|---|---|---|---|---|
| 1 | `react-router-dom` installed but unused | In `package.json` dependencies; no imports in `src/` | No routing yet; dependency adds nothing until wired | Add a router in [[main.jsx Entry Point]] or `App.jsx`. See [[Client-Side Routing with React Router]] |
| 2 | Template placeholder UI | `src/App.jsx` and `src/App.css` are the stock create-vite content | Not project-specific | Replace with real pages; delete unused assets and styles |
| 3 | README describes the template, not repxir | `README.md` | Onboarding gap | Write a project README |
| 4 | No tests or CI | No test files, no test runner, no workflow config | Regressions go unnoticed | Add Vitest + React Testing Library when features land |
| 5 | No git repository | `git rev-parse` failed at mapping time | No history; Atlas sync must rely on file hashes | `git init` and commit the baseline |
| 6 | Global CSS only | `App.css` uses global IDs and classes | Collisions as components grow | Consider CSS Modules per component |
| 7 | External links use `target="_blank"` without `rel` | `src/App.jsx` | Minor. Modern browsers imply `noopener` for `_blank` | Add `rel="noreferrer"` explicitly if desired |
| 8 | No Node version pin | No `engines` / `.nvmrc` | Environment drift between machines | Add an `engines` field or `.nvmrc` |

## Related
- [[Development Setup]] · [[Dependency Overview]] · [[Documentation Status]]
<!-- ATLAS:END generated -->
