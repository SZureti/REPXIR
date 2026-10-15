---
title: Vite Dev Server and Build
aliases: [Vite, HMR, Hot Module Replacement]
type: concept
project: repxir
status: implemented
verification: verified
tags: [atlas/concept, tech/vite]
last_mapped: 2026-10-14
documentation_version: 1
---

# Vite Dev Server and Build

<!-- ATLAS:BEGIN generated -->
## Plain language
Browsers can't read JSX, and shipping hundreds of small files is slow. Vite is the workshop tool that fixes both. During development it translates files the moment the browser asks for them and live-updates the page when you save. For release, it packs everything into a few optimized files.

## Technical
- **Dev (`vite`):** serves source over native ES modules and transforms each requested module on demand. `@vitejs/plugin-react` handles the JSX transform and **React Fast Refresh**, so editing a component re-renders it in place and usually keeps its state.
- **Build (`vite build`):** bundles from `index.html` as the entry into `dist/`. Vite 8 uses Rolldown (installed in `node_modules`) as its bundler.
- **Asset imports:** `import heroImg from './assets/hero.png'` gives a URL string. In production the file is emitted with a content hash for caching.
- **`public/` directory:** copied verbatim and served from `/`. That is why `App.jsx` references `/icons.svg#github-icon` by absolute path instead of importing it.
- **Env vars:** only `import.meta.env.VITE_*` variables reach client code. None are used here.

## In this codebase
- `vite.config.js` registers only `react()`. See [[Development Setup]].
- Asset imports and public-file references in [[App Component]].

## Related
- [[Concepts Index]] · [[Dependency Overview]]
<!-- ATLAS:END generated -->
