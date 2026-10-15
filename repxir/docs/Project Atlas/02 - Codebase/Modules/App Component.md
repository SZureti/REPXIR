---
title: App Component
aliases: [App, App.jsx]
type: component
project: repxir
status: implemented
verification: verified
language: JavaScript (JSX)
source_path: src/App.jsx
architecture_layer: presentation
related_features: [Starter Counter]
tags: [atlas/component, tech/react, layer/presentation]
last_mapped: 2026-10-14
documentation_version: 1
---

# App Component

<!-- ATLAS:BEGIN generated -->
## Purpose
The root and only React component. It renders the default Vite starter landing page. It is placeholder content that is expected to be replaced as the real app is built.

## Signature
`function App()` — no props, default export, returns a React fragment.

## Internal state
- `count` (number, initial `0`) from `useState`. Updated only by the counter button. See [[State Management]].

## What it renders
- `section#center`: three stacked hero images (`hero.png` as the base, plus the React and Vite logos with CSS 3D transforms), an `h1` "Get started", a hint to edit `src/App.jsx`, and the counter button `Count is {count}`.
- `section#next-steps` with two columns:
  - `#docs`: external links to `https://vite.dev/` and `https://react.dev/`
  - `#social`: external links to Vite's GitHub, Discord, X, and Bluesky
- Decorative `div.ticks` separators and a `section#spacer`.

## Imports
| Import | Kind | Purpose |
|---|---|---|
| `useState` from `react` | Hook | Counter state |
| `./assets/hero.png`, `./assets/react.svg`, `./assets/vite.svg` | Asset imports | Vite turns these into URL strings (hashed file names in production builds) |
| `./App.css` | Side-effect CSS | Component styles, see [[Styling and Theming]] |

It also references `/icons.svg#<id>` at runtime through `<use href>`. That file lives in `public/` and is served unprocessed, so a renamed symbol ID would fail silently (the icon just would not show).

## Side effects
None beyond rendering. No effects, no network, no storage. External links open in a new tab (`target="_blank"`).

## Consumers
- Rendered by [[main.jsx Entry Point]].

## Tests
None.

## Modification guide
- Replace the template page: edit the JSX returned by `App` and remove unused rules from `src/App.css`.
- Add pages: introduce React Router (see [[Client-Side Routing with React Router]]) and move this content into a route component.
- Remove template assets only after removing their imports here; otherwise the build fails on the missing import.

## Related
- [[Starter Counter]] · [[Component Map]] · [[React State with useState]]
<!-- ATLAS:END generated -->
