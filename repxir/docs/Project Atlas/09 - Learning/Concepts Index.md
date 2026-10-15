---
title: Concepts Index
aliases: [Learning Index]
type: index
project: repxir
status: implemented
verification: verified
tags: [atlas/hub, atlas/learning]
last_mapped: 2026-10-14
documentation_version: 1
---

# Concepts Index

<!-- ATLAS:BEGIN generated -->
Each concept has one canonical note, linked to where it appears in this codebase.

| Concept | Where it appears | Status |
|---|---|---|
| [[React State with useState]] | `count` in [[App Component]], [[Starter Counter]] | Implemented |
| [[Vite Dev Server and Build]] | `vite.config.js`, asset imports, HMR | Implemented |
| [[Client-Side Routing with React Router]] | `react-router-dom` dependency | Planned (installed, not used) |

## Guided walkthrough: from `npm run dev` to a click
1. `npm run dev` starts Vite ([[Vite Dev Server and Build]]).
2. The browser requests `/`; Vite serves `index.html`.
3. `index.html` loads `/src/main.jsx`; Vite transforms the JSX on the fly via `@vitejs/plugin-react`.
4. [[main.jsx Entry Point]] creates a React root on `#root` and renders `App` in `StrictMode`.
5. [[App Component]] calls `useState(0)` and returns JSX; React builds the DOM.
6. A click runs `setCount(c => c + 1)`; React re-renders `App` and patches the DOM ([[Starter Counter]]).
7. Saving `App.jsx` triggers HMR: Vite pushes the new module and Fast Refresh swaps it without a full reload.
<!-- ATLAS:END generated -->
