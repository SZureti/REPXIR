---
title: Styling and Theming
aliases: [index.css, App.css, Styles]
type: module
project: repxir
status: implemented
verification: verified
language: CSS
source_path: [src/index.css, src/App.css]
architecture_layer: presentation
tags: [atlas/module, tech/css, layer/presentation]
last_mapped: 2026-10-14
documentation_version: 1
---

# Styling and Theming

<!-- ATLAS:BEGIN generated -->
## Overview
Two plain global CSS files, no CSS framework, no CSS modules. Both use **native CSS nesting** (`&:hover`, nested `@media`), which modern browsers support natively. `lightningcss` is installed as a Vite dependency; whether it lowers nesting for older browsers depends on Vite's build target (Inferred, not checked by running a build).

## `src/index.css` — global theme (imported by [[main.jsx Entry Point]])
- Defines design tokens as CSS custom properties on `:root`: `--text`, `--text-h`, `--bg`, `--border`, `--code-bg`, `--accent` (purple `#aa3bff`), `--accent-bg`, `--accent-border`, `--social-bg`, `--shadow`, and font stacks `--sans`, `--heading`, `--mono`.
- **Dark mode:** a `@media (prefers-color-scheme: dark)` block overrides the same variables. The theme follows the OS setting; there is no manual toggle.
- `#root` is a centered 1126px-wide flex column with side borders and `min-height: 100svh`.
- Base styles for `h1`, `h2`, `p`, `code`, and the shared mono font for `.counter`.
- Responsive breakpoint: `max-width: 1024px`.

## `src/App.css` — page styles (imported by [[App Component]])
- `.counter` button: accent colors, hover border, `:focus-visible` outline.
- `.hero`: stacked images with absolute positioning and 3D `transform`s.
- `#center`, `#next-steps`, `#docs`, `#spacer`, `.ticks` (decorative triangles made with `::before`/`::after` borders).

## Scoping caveat
Both files are global. Class and ID names in `App.css` apply anywhere in the document. As more components are added, name collisions become possible. CSS Modules (`*.module.css`) are an option Vite supports without extra config.

## Related
- [[App Component]] · [[Architecture Overview]]
<!-- ATLAS:END generated -->
