---
title: Client-Side Routing with React Router
aliases: [React Router, Routing]
type: concept
project: repxir
status: planned
verification: verified
tags: [atlas/concept, tech/react-router]
last_mapped: 2026-10-14
documentation_version: 1
---

# Client-Side Routing with React Router

<!-- ATLAS:BEGIN generated -->
> **Status: Planned.** `react-router-dom` 7.18.4 is installed (verified), but no source file imports it. Nothing below describes current behavior. It explains how the dependency would fit.

## Plain language
A single-page app loads one HTML page. Routing lets it act like it has many pages: when the URL changes, it swaps which component is shown instead of asking the server for a new page. It is like changing the channel on one TV instead of buying a new TV for every show.

## Technical
- A **router** listens to the browser History API and matches the current URL against route definitions.
- In React Router v7 (library mode) there are two common setups:
  - Declarative: wrap the app in `<BrowserRouter>` and declare `<Routes><Route path="/" element={<Home/>} /></Routes>`.
  - Data router: `createBrowserRouter([...])` + `<RouterProvider router={router} />`, which adds loaders and actions.
- `<Link to="/x">` navigates without a full page load; `useNavigate`, `useParams`, and `useLocation` expose routing state to components.
- In v7, `react-router-dom` re-exports `react-router` (both 7.18.4 are installed). New code can import from either.

## Where it would plug in (Inferred)
- [[main.jsx Entry Point]]: wrap `<App />` in `<BrowserRouter>`, or replace it with `<RouterProvider>`.
- [[App Component]]: becomes a layout or a route element. The current landing content would move into a route component.
- Deployment: the static host must fall back to `index.html` for deep links. See [[Development Setup]].

## Related
- [[Technical Debt]] · [[Concepts Index]] · [[Dependency Overview]]
<!-- ATLAS:END generated -->
