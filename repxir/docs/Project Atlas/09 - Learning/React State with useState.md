---
title: React State with useState
aliases: [useState, Component State]
type: concept
project: repxir
status: implemented
verification: verified
tags: [atlas/concept, tech/react]
last_mapped: 2026-10-14
documentation_version: 1
---

# React State with useState

<!-- ATLAS:BEGIN generated -->
## Plain language
A component is a function that draws part of the page. "State" is the component's memory: a value React keeps between redraws. When you change state, React redraws the component with the new value. It is like a scoreboard. You don't repaint the stadium, you just tell the scoreboard the new score and it updates.

## Technical
- `const [value, setValue] = useState(initial)` returns the current value and a setter. React stores the value per component instance, keyed by **hook call order**. That is why hooks must not be called conditionally (enforced here by oxlint's `react/rules-of-hooks` = error).
- Calling the setter **schedules** a re-render; it does not mutate `value` in the current render.
- **Functional updates** `setValue(prev => prev + 1)` read the latest pending value. This matters when several updates are batched in one event.
- State is local to the component instance. Sharing it requires lifting state up, Context, or a store.

## In this codebase
- `const [count, setCount] = useState(0)` in [[App Component]].
- `onClick={() => setCount((count) => count + 1)}`: a functional update. See [[Starter Counter]].

## Related
- [[State Management]] · [[Concepts Index]]
<!-- ATLAS:END generated -->
