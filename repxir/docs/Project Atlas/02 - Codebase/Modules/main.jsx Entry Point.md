---
title: main.jsx Entry Point
aliases: [main.jsx, Entry Point]
type: module
project: repxir
status: implemented
verification: verified
language: JavaScript (JSX)
source_path: src/main.jsx
architecture_layer: bootstrap
related_features: []
tags: [atlas/module, tech/react, layer/bootstrap]
last_mapped: 2026-10-14
documentation_version: 1
---

# main.jsx Entry Point

<!-- ATLAS:BEGIN generated -->
## Purpose
Starts the React application. It is the module `index.html` loads via `<script type="module" src="/src/main.jsx">`.

## What it does
1. Imports `StrictMode` from `react` and `createRoot` from `react-dom/client`.
2. Imports `./index.css` for its side effect (global styles get injected) — see [[Styling and Theming]].
3. Imports the default export of `./App.jsx` — see [[App Component]].
4. Calls `createRoot(document.getElementById('root'))` and renders `<StrictMode><App /></StrictMode>`.

## Exports
None. This is a side-effect-only module.

## Behavior notes
- **StrictMode** (development only) double-invokes component functions and effects to surface impure code. Expect `App` to render twice on mount in `npm run dev`; this does not happen in production builds.
- **No error handling:** if `#root` were missing, `createRoot(null)` would throw. `index.html` does provide `#root`. (Verified by reading both files.)
- **No router provider here.** If routing is added, this is the usual place to wrap `<App />` in `<BrowserRouter>` (or to use `createBrowserRouter` + `RouterProvider`). See [[Client-Side Routing with React Router]].

## Dependencies
- Imports: `react`, `react-dom/client`, `src/index.css`, [[App Component]]
- Loaded by: `index.html` ([[Architecture Overview]])

## Tests
None.
<!-- ATLAS:END generated -->
