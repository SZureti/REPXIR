# REPXIR (RX)

**Movement is medicine. Your daily dose of progress.**

REPXIR is a **mobile-first, local-first single-page application** for discovering workouts, designing custom routines, tracking strength and jump-rope sessions, and reviewing progress. Built as a Code Platoon SPA project **with the standards of a real, publishable software product**.

> **Project status:** MVP implemented (Phases 1–3) with automated unit and end-to-end tests. The app lives in [`repxir/`](./repxir) — see [`repxir/README.md`](./repxir/README.md) for setup, scripts, architecture, and deployment. `design.md` remains the product specification; `Resources/REPXIR-wireframe.png` holds the latest wireframes.

## Product summary

- **Brand:** REPXIR; **symbol:** RX; **palette:** electric lime `#E6FF57` on charcoal `#191B1B`.
- **Core functionality:** Browse a built-in workout catalog; create/edit custom routines; start and resume sessions; log sets, reps, weights, jump counts and time; see history and basic performance summaries.
- **Working without an account:** The MVP saves workouts locally in the browser, supports offline logging after initial load, and provides JSON export/import for backups.
- **Mobile first:** Designed around one-handed logging between sets, with responsive layouts for tablets and desktops.
- **Fitness/wellness disclaimer:** “Movement is medicine” is a brand metaphor, not medical advice or a claim to diagnose, treat, or cure disease.

## Documentation

| File | Purpose |
|---|---|
| [`design.md`](./design.md) | Product specification, lesson's 8 questions, MVP, 3 user journeys, Gherkin-like criteria, 15 built-in workout templates, wireframes, design system, QA checklist |
| `REPXIR_Brand_Guide.md` (optional companion) | Expanded identity, visual voice and messaging, typography, color direction |
| `README.md` | Engineering approach, structure, setup when scaffolded, data model, roadmap, tests, release checklist |

## Eight planning questions — at a glance

1. **Problem:** Logging and interpreting exercise progress should be easy, consistent and private.
2. **User:** Beginners, strength trainees, and home/multi-equipment exercisers.
3. **Goals:** Find a routine; create one; track actual performance; observe trends.
4. **Information:** Exercise details, targets, actual logged values, elapsed time, history.
5. **Actions:** Browse, filter, build, save, start, log, pause, resume, finish, edit, export.
6. **Screens:** Today, Library, Workout Details, Builder, Active Session, Rope Tracker, History, Summary, Settings, empty/recovery/error states.
7. **Data:** Prebuilt catalog, custom templates, active drafts, completed session snapshots, preferences.
8. **Permissions:** No required account or device permissions; local storage by default; confirm destructive actions.

Full answers and test cases: **[`design.md`](./design.md)**.

## Built-in routines (15)

| Type | Templates |
|---|---|
| Muscle-group workouts (10) | Chest, Back, Shoulders, Biceps, Triceps, Core, Quadriceps, Hamstrings, Glutes, Calves |
| Full-body workouts (4) | Kettlebells, Barbells, Resistance Straps/Bands, Bodyweight/Calisthenics |
| Cardio / skill (1) | Jump Rope — RX Rounds |

Every template is editable through duplication, and custom plans can be authored from scratch. Defaults are adaptable suggestions, not mandatory prescriptions.

### Jump-rope tracking, explicitly

The rope mode must support **three distinct planned quantities**: `sets`, `targetJumpsPerSet`, `targetDurationSecondsPerSet`, plus optional `restSeconds`. Each finished set stores **actual jump count** and **actual active duration**. Manual jump counter buttons and exact entry are supported; the app does **not** pretend to count jumps with sensors. Summary shows actual total jumps, completed sets, work duration and (when time exists) estimated jumps/min. All actual metrics are separate from targets.

## Three primary user journeys

1. **Log a prebuilt workout:** Today → Library → select muscle group → details → start → complete sets → finish → History.
2. **Create & reuse a custom workout:** Library → builder → configure exercises/targets → save → start → modify later, preserving historical logs.
3. **Track jump rope:** Select rope → set reps/sets/time/rest → start/stop timer and enter actual jumps → complete sets → review totals.

See [`design.md`](./design.md#6-three-primary-user-journeys-with-testable-acceptance-criteria) for testable conditions and [`design.md`](./design.md#7-low-fidelity-wireframes--mobile-first-390px-reference) for lo-fi wireframes.

---

## Screenshots

<p>
  <img src="repxir/public/screenshots/home-narrow.jpg" alt="REPXIR home screen on a phone: today's plan and this week's stats" width="220" />
  <img src="repxir/public/screenshots/workouts-wide.jpg" alt="REPXIR workout library on desktop with search and filters" width="560" />
</p>

---

## Implementation stack

**Built with:** **Vite + React 19 + React Router 7** (React is a Code Platoon course requirement; it replaces the earlier vanilla-JS recommendation), plain CSS with brand tokens, **IndexedDB** (via `idb`) for custom workouts and completed sessions, and `localStorage` for the in-progress session draft and small preferences.

- **SPA behavior:** `index.html` is the sole document shell; routes render client-side and deep links fall back to `index.html` on Vercel (`repxir/vercel.json`).
- **Data:** Seed catalog in version-controlled JS (`src/data/`); custom workouts and history in IndexedDB; the active draft and preferences in localStorage.
- **Tests:** Vitest (+ Testing Library, fake-indexeddb) for calculations, storage, validation, and routing; Playwright for the three journeys on phone and desktop viewports.
- **PWA:** Installable on phones and desktop, and works offline after the first visit (vite-plugin-pwa precaches the app; deep links fall back to the cached `index.html`). New versions wait for the user to choose "Reload" and never interrupt a workout.
- **Later scaling:** TypeScript, cloud sync, and auth only after privacy and authorization are designed.

### Repository layout

```text
repxir/                     # project root (docs, brand, wireframes)
├── README.md               # this file
├── design.md               # product spec, journeys, acceptance criteria
├── REPXIR_Brand_Guide.md   # identity, tokens, voice
├── Resources/              # brand board + wireframes
└── repxir/                 # the app (Vite + React)
    ├── src/
    │   ├── data/           # exercise catalog, 15 templates, taxonomy
    │   ├── services/       # storage, prefs, workouts, sessions, backup
    │   ├── store/          # React context: app data, toasts, confirm dialogs
    │   ├── pages/          # Home, Library, WorkoutDetail, Builder, Session, History, SessionDetail, Account
    │   ├── components/     # app shell, dialogs, cards, icons
    │   ├── utils/          # validators, summaries, units, formatting, stats
    │   └── styles/         # tokens, base, layout, components, screens
    ├── tests/unit/         # Vitest
    ├── tests/e2e/          # Playwright
    └── vercel.json         # SPA rewrites + headers
```

### Local development

```bash
cd repxir
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`, `npm test`, `npm run test:e2e` (run `npx playwright install chromium` once first), and `npm run test:all`.

## Data contracts (planning sketch)

The implemented shapes differ slightly (for example, loads are stored as `loadKg` and sets carry `status`); see `repxir/src/services/sessionService.js` and `repxir/src/data/templates.js`.

```js
// Template: mutable only if user-created; system template stays read-only.
const workoutTemplate = {
  id: 'system-jump-rope',
  origin: 'system',               // 'system' | 'custom'
  name: 'Jump Rope — RX Rounds',
  focus: ['cardio', 'coordination'],
  equipment: ['jump-rope'],
  exercises: [{
    exerciseId: 'jump-rope',
    targetSets: 5,
    targetJumpsPerSet: 100,
    targetDurationSecondsPerSet: 60,
    restSeconds: 45
  }]
};

const completedRopeSet = {
  id: 'set-uuid',
  exerciseId: 'jump-rope',
  order: 1,
  targetJumps: 100,
  targetSeconds: 60,
  actualJumps: 92,
  actualSeconds: 57,
  completed: true
};

const session = {
  id: 'session-uuid',
  sourceTemplateId: 'system-jump-rope',
  templateSnapshot: workoutTemplate,  // clone at session start
  startedAt: '2026-10-14T19:00:00.000Z',
  endedAt: null,
  status: 'active',              // 'active' | 'completed' | 'discarded'
  elapsedActiveSeconds: 57,
  sets: [completedRopeSet],
  notes: ''
};
```

Use generated UUIDs, migrations with schema versions, consistent units, ISO timestamps, and strict validation. Treat completed sessions as event snapshots, not live pointers to editable templates.

### Storage strategy

- `exercises` / built-in routines: immutable version-controlled catalog.
- `customWorkouts`: IndexedDB with unique IDs and creation/update timestamps.
- `sessions`: IndexedDB for completed snapshots. The single in-progress draft is kept in localStorage (synchronous writes survive an instant reload) and falls back to IndexedDB if localStorage is blocked.
- `preferences`: localStorage, e.g. default units and display name.
- **Backup:** JSON export with schema version and UTC timestamps. Import must validate version and shape, preview changes, and reject malformed files; never silently erase existing data.
- **Privacy:** Don't silently upload records. Tell users that local browser storage is device/browser-specific and can be deleted by clearing site data; export is their portable backup.

## Session state machine

```text
No active session
    │ Start from template or custom workout
    ▼
ACTIVE ─── Pause ──→ PAUSED ─── Resume ───→ ACTIVE
    │                  │
    │                  └── Finish ──→ COMPLETED (saved snapshot)
    └────── Finish ─────────────────→ COMPLETED

ACTIVE/PAUSED ── Discard + confirm ─→ No active session

Page reload during an active session ──→ saved draft restored PAUSED
```

**Timer rule:** Do not assume `setInterval` is precise. Accumulate active elapsed time from a monotonic clock, persist on pause and visibility change, and show recovered drafts paused after reload. Only completed sets count toward reported totals. Prevent double-submitting one set.

## Development phases

**Phase 0 — Define / Explore / Plan**
- [x] Answer the lesson's eight questions.
- [x] Specify three journeys with testable criteria.
- [x] Draw mobile-first lo-fi wireframes and important states.
- [x] Establish initial visual tokens and brand voice.

**Phase 1 — App foundation**
- [x] Vite scaffold; brand tokens; mobile app shell; navigation/deep linking.
- [x] Exercise catalog, 15 workout templates and search/filter controls.
- [x] Unit tests for seed-data integrity and routing.

**Phase 2 — Training session MVP**
- [x] Workout detail, Start, set logging, timer, pause/resume, safe draft restore, finish.
- [x] Durable session store and complete/edit validation.
- [x] Jump-rope reps/sets/work-duration tracking (manual count), reliable totals.

**Phase 3 — Customization & history**
- [x] Builder create/edit/duplicate/archive and exercise picker.
- [x] Session history/details, simple progress totals, units.
- [x] Empty/error/recovery states and JSON backup.

**Phase 4 — QA / polish / release**
- [x] Automated journey tests on narrow phone and desktop viewports.
- [ ] Keyboard and screen-reader audit; reduced motion; contrast check. (Built in; manual audit pending QA.)
- [ ] Performance, storage corruption/import validation, reload and backward-navigation tests. (Import validation, reload, and back/forward are covered by tests; storage-corruption and performance checks pending.)
- [x] Installable PWA, offline after first load, with an update prompt that never interrupts a workout.
- [ ] Publish under chosen host with SPA route fallback and privacy information. (Vercel config ready.)

## Test plan

### Functional

- 15 system templates load; correct names/exercise associations; no duplicates.
- Search and filter across muscle group/equipment; clear empty state.
- Custom workout persists after refresh; edited template does not alter prior session snapshot.
- A completed weighted set contributes exactly `reps × weight` to weighted volume.
- Jump-rope targets remain separate from actual values; `90 + 100 + 110 = 300` completed jumps.
- No completed work time => pace unavailable (no NaN or divide-by-zero).
- Starting a second workout prompts a choice; reload resumes safely paused.
- Input edge cases: missing name, zero/negative/decimal jumps, invalid duration, zero weight, giant numbers, duplicate rapid taps.
- Import invalid JSON or unknown schema safely rejects without destroying saved work.

### UX / accessibility

- Complete an entire log with one hand on a 375px phone viewport; also test 320px and 390px.
- Every interactive control works by keyboard and has a visible focus indicator.
- Form errors are associated with relevant fields and announced where necessary.
- Dynamic text resizing, phone safe areas and on-screen keyboard do not obscure Save/Complete actions.
- Reduce motion honors the OS setting; timers stay readable without animation.
- Desktop deep links, Back, Forward and hard-refresh stay on correct routes.

## Release / IP checklist

- [ ] Conduct REPXIR trademark clearance across similar names and software/wellness categories; preliminary searches are not legal clearance.
- [ ] Verify and acquire domain, app-store names, and desired social handles independently.
- [ ] Create original icon/wordmark and confirm typeface/image asset licenses.
- [ ] Add honest privacy disclosure about device-local data, export, and optional future sync.
- [ ] Add an accessible educational-use disclaimer; avoid treatment claims.
- [ ] Verify hosting serves `index.html` on direct SPA routes.
- [ ] Ship demo screenshots, demo walkthrough, bug-tested build and changelog.

## Product language

**Hero:** *Move with purpose. Track your progress.*  
**Primary action:** `Start workout`  
**Builder action:** `Create workout`  
**Workout completion:** `Session saved. Another step forward.`  
**Empty history:** `Every session starts somewhere.`  
**Support line:** `Movement is medicine.` (metaphorical brand positioning)

---

**Project principle:** Implement a dependable, personally useful exercise tracker before layering on advanced integrations. The first shipped product should work for its users, not merely demonstrate that a homework requirement was met.
