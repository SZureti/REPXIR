# REPXIR — Product & Experience Design

**Version:** 1.0 · **Status:** Planning specification · **Product:** Mobile-first single-page workout tracker · **Brand:** REPXIR (RX)

> **Purpose:** A buildable product plan, not just a classroom mockup. This document defines the MVP, interaction model, workout templates, user journeys, acceptance criteria, responsive low-fidelity wireframes, accessibility, and design system. See `README.md` for implementation and setup. See `REPXIR_Brand_Guide.md` for the extended identity system.

## 1. Product thesis

**Promise:** Record your movement, own your progress. **Brand line:** *Movement is medicine.* This is a motivating metaphor, **not** a medical claim: REPXIR does not diagnose, treat, or prescribe healthcare.

**Core loop:** Choose or create a workout → start a session → log each set → finish → review history/progress → repeat.

**Audience:** Beginners who need a starting point; habitual gym-goers tracking progression; at-home users training with bodyweight, bands, kettlebells, barbells, or jump rope. Work equally well on a phone held between sets and on desktop.

**MVP outcome:** A new visitor can choose a prebuilt template, customize or create their own, complete/log a session, and see persisted workout history without signing up.

---

## 2. The lesson's eight planning questions — answered

### Q1 — What problem are we solving?

Workout records are often scattered among notes, memory, and overly complicated fitness tools. Users need a fast, clear, private way to follow a routine, record sets/reps/loads/time, and see that their effort accumulates into measurable progress.

### Q2 — Who is the user?

- **New mover:** wants safe, understandable exercise labels and a ready-to-start routine; can scale effort and skip movements.
- **Strength trainee:** wants reliable logs for exercise, weight, sets, repetitions, rest, and personal performance.
- **Flexible/home trainee:** wants equipment-specific full-body routines, jump-rope intervals, and editable custom workouts.

Do not assume age, gender, ability, equipment ownership, or a specific fitness level.

### Q3 — What are the user's goals?

1. Find an appropriate template by muscle group or equipment.
2. Build a repeatable personalized workout.
3. Track an actual session with as little tapping as possible.
4. Track jump-rope **planned and actual jumps, sets, and time**.
5. See past sessions and simple trends, retain control over data, and resume after reopening the page.

### Q4 — What information must the app show?

- Dashboard: quick start, most recent activity, recent workouts, totals/trends.
- Library: template name, focus, equipment, exercise count, rough duration (estimated, not guaranteed), difficulty guidance.
- Workout detail: exercises in order, target sets/reps/time/rest, equipment, adaptations/notes.
- In session: exercise, completed/remaining sets, actual reps, weight and unit, duration, rest timer, status, save feedback.
- Jump rope: target jumps per set, target sets, target work time per set or total session, actual jumps and elapsed time; no double counting.
- History: date, template/custom source, duration, exercises, completed sets, total reps/jumps, total logged volume where applicable.
- Empty/error states: clear explanation and a single next action.

### Q5 — What can users do?

Browse/filter/search templates; inspect details; create/duplicate/edit/archive custom plans; begin, pause, resume and finish sessions; log/edit/undo sets; skip an exercise; set rest time; configure jump-rope targets; record actual counts and time; review/filter past sessions; export/import their data; change units; delete records with confirmation.

### Q6 — What screens or states are required?

`Today`, `Library`, `Workout detail`, `Workout builder`, `Active session`, `Jump-rope active mode`, `History`, `Session summary/detail`, `Settings & data`, plus first-run, empty history, zero search results, validation, recoverable error, and confirmation states. The active session is an app-wide ongoing state and survives navigation/reload.

### Q7 — What data is stored?

Exercise catalog, system workout templates, user custom plans, active session draft, finished session snapshots, per-set entries, preferences, schema version, and lightweight progress aggregates (prefer compute from sessions). Persist locally in the MVP using browser storage; see README's suggested IndexedDB/localStorage split. **Plans are editable; historic sessions are immutable snapshots unless the user explicitly edits the history record.**

### Q8 — What permissions or access rules apply?

No login, account, location, camera, health platform, or push notification permissions required in MVP. On-device user data is private to the browser profile unless deliberately exported. No other person's records appear. Imported files require validation before overwriting or merging. Deletion needs confirmation. If future cloud sync is introduced, it requires explicit opt-in, authentication, authorization checks, and a revised privacy policy. No medical diagnosis or treatment advice.

---

## 3. Scope & product rules

### In scope — version 1

- Client-side SPA with browser History API routes, direct-link fallback, responsive mobile-first layout.
- Preloaded exercises and templates listed in §4; no external APIs needed.
- Search by template name, target muscles, and equipment; filter by goal/focus and gear.
- One-tap start from any template, plus duplicate-to-edit.
- Custom workout builder: name, description, muscle focus, equipment, reorder/add/remove exercises, target sets, reps or seconds, rest, optional target load.
- Active session logging for resistance **reps + weight**, timed work, and jump-rope **jumps + sets + time**. Display prior performance if available.
- Rest countdown (optional), pause/resume, draft recovery, finish/cancel confirmation, optional personal notes.
- Workout history, session details, recent totals and simple progress indicators.
- Offline-capable after initial app load using locally bundled assets; no backend required for core logging. Optional PWA packaging later.
- Local JSON export/import and delete-all-data.

### Out of scope — version 1

Accounts, social sharing, leaderboards, payments, AI coaching, personalized medical plans, wearables integration, video streaming, heart-rate integrations, calorie claims, automatic jump counting, camera pose analysis, and cloud syncing. These are candidate future releases, not prerequisites for this assignment.

### Rules that prevent ambiguous behavior

- **Template vs. session:** Editing a template never retroactively edits a completed session.
- **Completing sets:** Only explicitly marked completed entries count toward totals. Draft input alone does not count.
- **Resuming:** A single active session exists at a time. Starting another prompts *Resume / Discard & start new / Cancel*.
- **Pause:** Pauses session elapsed-time counting and rest timer; recorded reps/jumps remain unchanged.
- **Units:** Default lb or kg in Settings; conversion when changing display units must preserve canonical load values and not alter recorded effort. Metric volume = sum of (completed reps × load) for weighted sets; never include jump counts or timed sets in lifting volume.
- **Timing:** Timed sets use seconds. Jump rope supports time and jump counts together, with either/both as targets; actual values are recorded independently.
- **Validation:** Positive integer sets; reps/jumps must be nonnegative integers; durations nonnegative seconds; weights finite and nonnegative. Completed work sets require at least one meaningful actual metric (reps, jumps, or duration). Prevent NaN/negative entries, cap implausibly large inputs with helpful validation, and distinguish 0 from missing.
- **Safety:** Exercise examples are general references, not a substitute for instruction or medical care. Provide alternatives where possible; do not prescribe loads or promise outcomes.

---

## 4. Built-in workout catalog

**Catalog requirement:** Provide **one routine for each primary muscle-group focus** below, **four equipment-specific full-body routines**, and **one jump-rope workout**. These 15 templates are first-party seed data and can be duplicated and customized. Beginners should be able to lower targets, omit movements, and change equipment; all targets are editable suggestions, not medical guidance. Use exercise IDs rather than raw strings to link templates to the exercise catalog.

### Muscle-group routines (10)

| Template | Focus | Suggested example exercises | Default target pattern |
|---|---|---|---|
| Chest Focus | Chest | Push-up; dumbbell bench press; incline push-up; chest fly | 3 sets × 8–12 reps |
| Back Focus | Back | Bent-over row; resistance-band row; one-arm row; reverse fly | 3 × 8–12 |
| Shoulder Focus | Shoulders | Overhead press; lateral raise; front raise; band pull-apart | 3 × 8–12 |
| Biceps Focus | Biceps | Alternating curl; hammer curl; band curl | 3 × 10–12 |
| Triceps Focus | Triceps | Close-grip push-up; overhead triceps extension; band pushdown | 3 × 8–12 |
| Core Focus | Abdominals/core | Dead bug; plank; bird dog; controlled crunch | 3 rounds; plank timed 20–45 sec |
| Quadriceps Focus | Front thighs | Squat; split squat; step-up; wall sit | 3 × 8–12; wall sit timed |
| Hamstrings Focus | Back thighs | Romanian deadlift; band leg curl; good morning; bridge walkout | 3 × 8–12 |
| Glutes Focus | Glutes | Glute bridge; hip thrust; reverse lunge; lateral band walk | 3 × 10–15 |
| Calves Focus | Calves | Standing calf raise; single-leg calf raise; seated calf raise | 3 × 12–15 |

### Full-body routines (4)

| Template | Equipment | Order of example exercises | Suggested structure |
|---|---|---|---|
| Full Body — Kettlebell | Kettlebell | Goblet squat → KB deadlift → KB row → KB overhead press → suitcase carry | 3 rounds; 8–12 reps; carry timed |
| Full Body — Barbell | Barbell | Barbell squat → Romanian deadlift → barbell row → overhead press → floor press | 3 × 6–10; user-selectable load |
| Full Body — Resistance Straps | Resistance bands/straps | Strap squat → strap row → strap chest press → strap shoulder press → strap pallof press | 3 × 10–15; control tension |
| Full Body — Bodyweight / Calisthenics | None | Squat → push-up → reverse lunge → inverted row alternative → plank | 3 rounds; 8–15 reps; plank timed |

**Terminology:** Users said “resistence straps”; label the equipment category **Resistance Straps / Bands** and note specific attachment requirements where an exercise needs one. Offer a no-anchor alternative for users without secure fixtures. Kettlebell swings are not a required default for novices; they may be added later with clear coaching resources.

### Jump Rope — RX Rounds (1)

**Required inputs:** number of sets, target jumps per set, and target time per set (minutes/seconds). Allow targets to be entered independently; at least one target (jumps or time) must be provided per set. Also set optional rest seconds between sets.

**Example default:** 5 sets × 100 jumps × up to 60 seconds of work per set; 45 seconds rest. Users may log fewer/more actual jumps or actual duration than their target. Do **not** infer actual jump count from time or assume that hitting one target completes the other.

**During a set:** Start/pause/stop work timer; manually increment jumps in configurable steps (e.g., +1, +10, +25) or type final actual jumps; on completion save actual jumps **and** elapsed work seconds. A session contains multiple sets, each independently stored. If a user did not run the timer, they may enter actual duration manually. Pausing and resuming should not silently reset the count. A manual reset is confirmed.

**Summary:** completed sets / target sets, total **actual** jumps, total **active** work time, total elapsed session time, average actual jumps per completed set, optional pace as jumps/min only when actual work duration > 0. Never label pace as measured automatically; it is derived from user-entered counts and time.

### Exercise-catalog model

Each exercise: stable `id`, `name`, `primaryMuscles[]`, `secondaryMuscles[]`, `equipment[]`, `measurement` (`reps_weight`, `reps_only`, `duration`, `jumps_duration`, `distance_optional` future), `instructions` (short), `safetyNote?`, `alternatives[]`. Templates reference catalog IDs. Avoid relying on images to explain essential techniques; accessible text must exist.

---

## 5. Navigation map / route architecture

```text
REPXIR SPA
├── /                 Today / dashboard
├── /workouts         Library, search, filters, empty results
│   └── /workouts/:id Workout details; start or duplicate
├── /builder/new      Create custom workout
├── /builder/:id       Edit own custom workout
├── /session           Active session (resumable)
│   └── jump-rope mode when exercise measurement = jumps_duration
├── /history           Completed sessions / empty history
│   └── /history/:id   Session detail
└── /settings          Units, export, import, deletion
```

**Persistent mobile navigation:** Today · Workouts · History · Settings. Active session gets a prominent sticky *Return to workout* entry point, not an extra permanent navigation tab. Desktop can use a left rail. Browser Back should not silently destroy state.

---

## 6. Three primary user journeys with testable acceptance criteria

### Journey 1 — Start a prebuilt workout and log strength sets

**User:** A new or returning trainee who wants a guided routine.

**Flow:** Today → Browse workouts → Filter `Chest` → Open `Chest Focus` → View exercises/equipment → Start → Enter actual reps/weight for each set → Mark sets complete → Finish → Session summary → History.

**User story:** *As a trainee, I want to launch a ready-made workout and record my actual performance so I can see what I did later.*

**Acceptance criteria (Given / When / Then):**

1. **Given** seeded templates, **when** the user selects `Chest`, **then** the library lists Chest Focus without losing the search/filter state when navigating back.
2. **Given** a workout detail page, **when** Start is pressed, **then** a new session captures a snapshot of exercises and default targets.
3. **Given** an active strength set, **when** valid reps and load are entered and `Complete set` is tapped, **then** the set is marked complete, saved locally, and counted once.
4. **Given** incomplete sets, **when** Finish is pressed, **then** the user sees the number completed and may finish anyway or return.
5. **Given** a finished session, **when** the app is refreshed, **then** the session still appears in history and its values match the summary.
6. **Given** an active session, **when** the page reloads, **then** the app offers a safe resume rather than silently losing progress.

### Journey 2 — Build and reuse a custom routine

**User:** A trainee tailoring workouts to personal equipment, goals, or accessibility needs.

**Flow:** Workouts → Create workout → Name `My Strength Mix` → Add/reorder exercises → Configure targets/rest → Save → View own template → Start → Finish → Reopen editable template.

**User story:** *As a trainee, I want to define my own routine so I can repeat and improve a workout that fits my equipment.*

**Acceptance criteria:**

1. **Given** a new builder, **when** the name is blank or no exercises exist and Save is selected, **then** inline validation explains what is required without discarding fields.
2. **Given** the exercise picker, **when** exercises are searched/selected, **then** chosen items appear in the custom routine and can be reordered or removed.
3. **Given** valid targets, **when** Save is pressed, **then** the custom template appears in `My Workouts` after reload.
4. **Given** an existing custom template, **when** edited, **then** subsequent sessions use the new template while past session snapshots remain unchanged.
5. **Given** the user duplicates a built-in workout, **when** they edit the copy, **then** the original seed template is unchanged.
6. **Given** a deleted/archived custom plan, **when** History is viewed, **then** previously recorded sessions remain accessible.

### Journey 3 — Track a jump-rope workout with reps, sets, and time

**User:** An at-home trainee tracking jumping volume and duration.

**Flow:** Workouts → `Jump Rope — RX Rounds` → Set `5 sets / 100 jumps / 1:00` with 0:45 rest → Start → Start timer → Increment or type actual jumps → Pause/resume → Save set → Rest → Repeat → Finish → Review actual jumps + active time + session time.

**User story:** *As a jump-rope trainee, I want to plan reps, sets, and time, then separately record actual jumps and elapsed work time so my history reflects what I did.*

**Acceptance criteria:**

1. **Given** a jump-rope routine, **when** the user updates sets, target jumps, time, or rest, **then** valid values are shown before Start and persisted into the session snapshot.
2. **Given** a running timer, **when** Pause is selected, **then** work time stops accumulating until Resume.
3. **Given** a target of 100 jumps, **when** the user records 92 jumps, **then** actual count is 92, not silently changed to 100.
4. **Given** 60 seconds elapsed and 92 jumps recorded, **when** Complete Set is tapped, **then** both values persist in that set.
5. **Given** a resumed session, **when** the user returns after reload, **then** saved completed sets and draft jump counts remain available and no unobserved off-page seconds are added to active work time.
6. **Given** a session with three completed sets of 90, 100, 110 jumps, **when** Summary appears, **then** total actual jumps equals **300**; only completed sets count.
7. **Given** no recorded duration, **when** Summary calculates pace, **then** pace is shown as unavailable, not as infinity or zero.

---

## 7. Low-fidelity wireframes — mobile first (390px reference)

The diagrams show *structure and states*, not finished UI. Real touch targets ≥44×44 CSS px, with a one-handed workflow and accessible labels.

### A — Today / dashboard

```text
┌──────────────────────────────────┐
│ RX  REPXIR                 ⚙     │
│                                  │
│ TODAY                            │
│ Ready to move?                   │
│ ┌──────────────────────────────┐ │
│ │ THIS WEEK                    │ │
│ │  03 sessions  ·  112 min     │ │
│ │  ▮ ▮ ▮ ▯ ▯ ▯ ▯               │ │
│ └──────────────────────────────┘ │
│                                  │
│ [ + START A WORKOUT         → ]  │
│                                  │
│ CONTINUE / QUICK START           │
│ ┌──────────────────────────────┐ │
│ │ Jump Rope — RX Rounds        │ │
│ │ 5 sets · jumps + time    →   │ │
│ └──────────────────────────────┘ │
│ RECENT ACTIVITY                  │
│ [ last workout / view history ]  │
│                                  │
├──────────────────────────────────┤
│ Today   Workouts   History  More │
└──────────────────────────────────┘
```

### B — Workout library, filters, and zero results

```text
┌──────────────────────────────────┐
│ ←  WORKOUTS                + New │
│ [ Search exercises / workouts  ] │
│ [ All ] [ Muscles ] [ Gear ]     │
│ [ Built-in ] [ My Workouts ]     │
│                                  │
│ MUSCLE GROUPS                    │
│ ┌──────────────────────────────┐ │
│ │ Chest Focus             →    │ │
│ │ 4 exercises  ·  Strength     │ │
│ ├──────────────────────────────┤ │
│ │ Back Focus              →    │ │
│ └──────────────────────────────┘ │
│ FULL BODY                        │
│ [ Kettlebell ]  [ Barbell ]      │
│ [ Straps ]      [ Bodyweight ]   │
│ CARDIO                           │
│ [ Jump Rope — RX Rounds      → ] │
├──────────────────────────────────┤
│ Today   Workouts   History  More │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Search: [ unicorn press        ] │
│           NO RESULTS             │
│ No workouts match your search.   │
│ [ Clear search ] [ View all ]    │
└──────────────────────────────────┘
```

### C — Workout detail

```text
┌──────────────────────────────────┐
│ ←  WORKOUT DETAIL                │
│ CHEST FOCUS                      │
│ Chest  ·  dumbbells/bodyweight   │
│ 4 exercises  ·  adjustable       │
│                                  │
│ 01 Push-up            3 × 10     │
│ 02 DB bench press     3 × 10     │
│ 03 Incline push-up    3 × 10     │
│ 04 Chest fly          3 × 10     │
│                                  │
│ [ Duplicate & customize ]        │
│                                  │
│ [ START WORKOUT               → ]│
└──────────────────────────────────┘
```

### D — Workout builder and validation state

```text
┌──────────────────────────────────┐
│ ←  NEW WORKOUT              Save │
│ Workout name                     │
│ [ My Strength Mix             ]  │
│ Description (optional)           │
│ [ ...                         ]  │
│ Focus [ Full body     ⌄ ]        │
│                                  │
│ EXERCISES              [+ Add]   │
│ ≡ Squat         3 sets × 10 reps │
│   [ Adjust ] [ Remove ]          │
│ ≡ Push-up       3 sets × 8 reps  │
│   [ Adjust ] [ Remove ]          │
│                                  │
│ [ + ADD EXERCISE ]               │
│ [ SAVE WORKOUT ]                 │
│                                  │
│ Validation (only when needed):   │
│ ! Name and 1 exercise required.  │
└──────────────────────────────────┘
```

### E — Active strength session

```text
┌──────────────────────────────────┐
│ ←  CHEST FOCUS          [ Pause ]│
│ Session 00:18:42   Exercise 2/4  │
│                                  │
│ DB BENCH PRESS                   │
│ Previous: 10 reps × 35 lb        │
│                                  │
│ SET     REPS      WEIGHT         │
│  1       10       35 lb   [ ✓ ]  │
│  2      [10]     [35]     [ + ]  │
│  3      [10]     [35]     [ + ]  │
│                                  │
│ Rest timer  00:45   [ Skip ]     │
│ [ ← PREV ]            [ NEXT → ] │
│                                  │
│ [ FINISH SESSION ]               │
└──────────────────────────────────┘
```

### F — Jump-rope setup and tracking

```text
┌──────────────────────────────────┐
│ ←  JUMP ROPE · RX ROUNDS         │
│ SET TARGETS                      │
│ Sets              [ 5  − + ]     │
│ Jumps per set     [ 100     ]    │
│ Time per set      [ 01 : 00 ]    │
│ Rest between sets [ 00 : 45 ]    │
│ [ START SESSION              → ] │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ←  RX ROUNDS             [Pause] │
│ SET 2 OF 5                       │
│             00:43                │
│        ACTIVE WORK TIME          │
│ [ START/PAUSE TIMER ]            │
│                                  │
│ ACTUAL JUMPS                     │
│              092                 │
│    [ +1 ]   [ +10 ]   [ +25 ]    │
│ [ Edit exact count ]             │
│ TARGET 100 JUMPS · 01:00         │
│ [ COMPLETE SET               ✓ ] │
│ [ Finish / Save partial ]        │
└──────────────────────────────────┘
```

### G — History, first-run empty history, and session summary

```text
┌──────────────────────────────────┐
│ ←  HISTORY                       │
│ [ All ] [ Strength ] [ Rope ]    │
│ OCT 14                           │
│ [ Chest Focus    41m        → ]  │
│ OCT 12                           │
│ [ Jump Rope     300 jumps   → ]  │
│                                  │
│ [ View session details ]         │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ HISTORY                          │
│          NO WORKOUTS YET         │
│ Every session starts somewhere.  │
│ [ EXPLORE WORKOUTS ]             │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ✓ WORKOUT COMPLETE               │
│ Jump Rope — RX Rounds            │
│ 3/5 sets   300 jumps             │
│ Active time 02:51                │
│ Elapsed session 05:22            │
│ [ VIEW DETAILS ] [ DONE ]        │
└──────────────────────────────────┘
```

### H — Saving/error/recovery states

```text
┌──────────────────────────────────┐
│ SESSION RECOVERY                 │
│ You have an unfinished workout.  │
│ Chest Focus · last saved 4:12 PM │
│ [ RESUME ]                       │
│ [ DISCARD SESSION ]              │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ WE COULDN'T SAVE THIS SET        │
│ Your changes remain on screen.   │
│ [ TRY AGAIN ] [ EXPORT BACKUP ]  │
└──────────────────────────────────┘
```

### Desktop adaptation (≥ 1024px)

```text
┌───────────────┬──────────────────────────────────────┬───────────────────┐
│ RX / REPXIR   │ Header + workspace                   │ Active session /  │
│ Today         │ Library cards in responsive grid     │ recent progress   │
│ Workouts      │ OR workout log / builder             │ contextual panel  │
│ History       │                                      │                   │
│ Settings      │                                      │                   │
└───────────────┴──────────────────────────────────────┴───────────────────┘
```

---

## 8. Visual design system

**Direction:** Energetic, architectural, premium training utility. Use restrained typography, precise numeric layouts, subtle performance-inspired motion, and generous negative space—never sacrifice log speed for decoration.

| Token | Value | Application |
|---|---|---|
| `--color-bg` | `#191B1B` | Main charcoal canvas |
| `--color-surface` | `#252827` | Cards/fields |
| `--color-surface-raised` | `#343836` | Floating controls, dialogs |
| `--color-accent` | `#E6FF57` | RX symbol, primary CTA, focus/active progress |
| `--color-text` | `#F3F5EF` | Main text |
| `--color-muted` | `#A8B0AA` | Supporting labels |
| Display | Space Grotesk | Headers/wordmark exploration |
| Body | Inter | App copy, forms, lists |
| Numeric | Tabular numerals | Sets, timers, weights, charts |

Use charcoal text on lime fills; all focus indicators must remain perceptible; test WCAG AA contrast for actual font sizes. Use status labels alongside color and icons. Avoid red/green-only completion cues. Dynamic Type/zoom to 200% must not destroy logging controls.

**Breakpoints:** 320–599px phone first; 600–1023px tablet; ≥1024px desktop rail with 2–3 panel layout. Bottom tabs on phone; left navigation rail on wide screens. Respect safe areas and keyboard overlap. Primary action sticky near bottom except when input keyboard is active.

**Motion:** 120–220ms micro-interactions; optional set check-off pulse, progress fill, numeric transitions. No looping effects that distract during exercise. Honor `prefers-reduced-motion: reduce`; timers must function without animation.

**Icons & imagery:** Consistent line iconography, readable equipment labels, original/custom exercise diagrams if added. Avoid copyrighted third-party fitness photography without rights.

---

## 9. Technical UX contracts

- **SPA routes:** Client-side navigation; deep links and refresh resolve to `index.html` on deployed host. Back/Forward updates the view without full page reload.
- **Data integrity:** Stable IDs and schema version; new session from deep clone/snapshot; atomic updates for completed sets; prevent accidental double-save; deterministic summaries.
- **Timer integrity:** Use `performance.now()` for active elapsed timing while running, accumulated durations persisted on pause/visibility/page unload. On reload restore the saved accumulated duration and resume in a *paused* state, to avoid counting time away as active exercise. Wall-clock timestamps are for session history, not active duration calculations.
- **Offline:** Browser persistence and bundled catalog. Storage-full/error states must be recoverable and exportable where possible. Explicitly communicate that clearing browser data can remove local workouts.
- **Accessibility:** Semantic landmarks, visible field labels, keyboard-operable form and navigation, proper error associations, `aria-live` for save confirmations (not every timer tick), reduced motion and tested screen reader flow.
- **Performance:** Target fast initial load on a midrange mobile device; lazy-load history charts/builder; no heavy animation libraries for an MVP; avoid rerendering the entire SPA every second.
- **Security:** Do not render arbitrary user-entered HTML. Validate all imported JSON and escape displayed text. Avoid embedding personal health information in analytics or logging services.

---

## 10. Definition of done

- [ ] Eight planning questions represented in product scope.
- [ ] All 15 built-in templates appear and link to working detail screens.
- [ ] Users can create, edit, duplicate, archive and reuse custom routines.
- [ ] Three end-to-end journeys pass acceptance checks on mobile and desktop.
- [ ] Strength sets record reps and load; timed exercises record seconds; jump rope logs target and **actual** sets/jumps/time separately.
- [ ] Reload/navigation preserves templates, completed workouts, and safely resumes paused draft sessions.
- [ ] Search and filters work; empty/error/validation states are polished.
- [ ] History summaries are computed only from completed sets and remain correct after template changes.
- [ ] Mobile viewport (320px+) usable with touch and keyboard; contrast and screen reader basics tested.
- [ ] Browser deep-link navigation/back-forward works; no backend required for essential MVP use.
- [ ] JSON export/import, recovery, and deletion with confirmation work.
- [ ] Core flows covered by unit tests and browser e2e tests; no console errors in release build.

**Release approach:** Ship a reliable, local-first workout logger first. Then evaluate cloud synchronization, instructional content, and integrations based on real usage—not assumptions.
