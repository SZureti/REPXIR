---
title: Component Map
aliases: [Function Index, Module Map]
type: index
project: repxir
status: implemented
verification: verified
tags: [atlas/hub, atlas/components]
last_mapped: 2026-10-14
documentation_version: 1
---

# Component Map

<!-- ATLAS:BEGIN generated -->
The project has exactly one first-party React component and no other first-party functions, so this note also serves as the Module Map and Function Index.

## Component tree (verified)
```mermaid
flowchart TD
    SM["StrictMode (react)"] --> App["App<br/>src/App.jsx"]
    App --> Center["section#center<br/>hero images, heading, counter button"]
    App --> Ticks1["div.ticks"]
    App --> Next["section#next-steps"]
    Next --> Docs["div#docs<br/>Vite / React doc links"]
    Next --> Social["div#social<br/>GitHub, Discord, X, Bluesky links"]
    App --> Ticks2["div.ticks"]
    App --> Spacer["section#spacer"]
```
All children below `App` are plain HTML elements, not components.

## Modules
| Module | Path | Kind | Exports | Note |
|---|---|---|---|---|
| Entry | `src/main.jsx` | Side-effect module | none | [[main.jsx Entry Point]] |
| App | `src/App.jsx` | Component | `default App` | [[App Component]] |
| Styles | `src/index.css`, `src/App.css` | CSS | — | [[Styling and Theming]] |

## Function index
| Function | Location | Purpose | Note |
|---|---|---|---|
| `App()` | `src/App.jsx` | Renders the whole page; owns `count` state | [[App Component]] |
| inline `onClick` handler | `src/App.jsx`, counter button | Increments `count` with a functional update | [[Starter Counter]] |

## Related
- [[Architecture Overview]] · [[State Management]]
<!-- ATLAS:END generated -->
