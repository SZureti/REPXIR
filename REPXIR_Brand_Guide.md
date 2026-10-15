# REPXIR — Brand Identity & Product Design Guide
Version 1.0 | October 2026 | Working brand pending clearance

## 1. Brand at a glance
- **Name:** REPXIR
- **Pronunciation:** REP-zeer (proposed; use consistently)
- **Monogram:** RX
- **Category:** Workout tracking / fitness technology, expandable into movement and general wellness
- **Positioning:** A premium, privacy-conscious fitness companion that makes every workout a meaningful record of progress.
- **Primary tagline:** Movement is medicine.
- **Campaign line:** Your daily dose of progress.
- **Product microcopy line:** Train. Track. Progress.
- **Brand status:** Working name, not legally cleared. No trademark, app store, domain, or social-handle availability is guaranteed.

## 2. Meaning and brand story
REPXIR is a coined brand name joining **rep** (a measurable act of training) with a sound inspired by **elixir** (a metaphorical remedy). RX serves as a visual allusion to a prescription, reinforcing the idea that movement can support well-being. The brand must not imply that exercise cures diseases or replaces healthcare.

**Brand story:** Every workout tells a story. A single rep becomes a set, sets become sessions, and sessions become a record of discipline, adaptation, and progress. REPXIR helps people see that story and continue writing it.

## 3. Mission, vision and values
**Mission:** Empower people to build healthier, stronger, more active lives through intuitive and meaningful fitness tracking.

**Vision:** Become a trusted personal companion for tracking movement, celebrating progress and sustaining a lifelong habit of activity.

**Promise:** Turn effort into insight, without judgment.

**Values:** Progress over perfection; consistency without guilt; autonomy; accessible clarity; inclusion of different bodies, abilities and experience levels; user privacy by design; evidence-based communication.

## 4. Target audience and positioning
**Primary:** Beginners and intermediate fitness enthusiasts who want to log workouts, improve consistency, and understand their progress without complicated interfaces.
**Secondary:** Experienced lifters who care about exercises, reps, sets, weights, trends, personal records and reusable programs.
**Future:** People tracking walking, cardio, mobility, recovery and balanced activity.

**Differentiator to build toward, not yet a claimed existing feature:** A beautifully designed, fast and focused workout logger where progress and user data control come before social engagement.

**Positioning statement:** For people who want to build a sustainable movement practice, REPXIR is a thoughtfully designed fitness tracker that turns everyday training into visible, motivating progress—without unnecessary noise.

## 5. Brand personality and verbal identity
- **Confident, not aggressive:** “Your progress, at your pace.” Not “No excuses.”
- **Intelligent, not clinical:** Clear metrics with plain-language explanations.
- **Encouraging, not guilt-driven:** “Every session adds to your story.” Not “You broke your streak.”
- **Premium, not elitist:** Polished visuals and accessible usability.
- **Respectful, not invasive:** Ask permission before health integrations or notifications.

**Writing conventions:** Use sentence case in product UI; short, direct sentences; inclusive second-person voice; consistent workout vocabulary. Define jargon such as volume, PR, RPE where introduced. Avoid medical promises and shame-based motivation.

## 6. Messaging hierarchy
1. **Master tagline:** Movement is medicine.
2. **Benefit:** Your daily dose of progress.
3. **Product description:** Track workouts, understand your progress, and build a movement habit that lasts.
4. **Action language:** Start workout; Log set; Finish session; View progress; Save routine.

Alternative campaign lines: Every rep is progress. / Made for the long run. / Your effort, documented. / Progress, one session at a time.

**Safety qualifier for marketing:** The medicine/prescription language is figurative. Do not claim that REPXIR diagnoses, treats or cures conditions, or that exercise replaces medical advice.

## 7. Visual identity: colors
| Token | HEX | Use |
|---|---|---|
| --rx-bg | #191B1B | Main dark background |
| --rx-surface | #252827 | Cards and sections |
| --rx-raised | #343836 | Elevated controls |
| --rx-lime | #E6FF57 | Brand accent, active state, primary CTAs |
| --rx-text | #F3F5EF | Primary text |
| --rx-muted | #A8B0AA | Secondary labels |
| --rx-border | #474D49 | Dividers, outlines |
| --rx-danger | #FF7C77 | Errors and destructive actions |
| --rx-success | #BEE89C | Positive secondary feedback |

**Proportions:** 70% dark neutrals, 20% lighter neutrals, ~10% accent. These are directional, not rigid enforcement.

**Color rules:** Lime text on dark surfaces; dark text on lime filled buttons. Do not use white on lime. Use text/icons/patterns in addition to color for states. Validate WCAG 2.2 AA contrast (4.5:1 normal text, 3:1 large text and essential non-text contrast). Verify all color combinations in actual components rather than assuming every palette pairing passes.

## 8. Typography
**Recommended accessible, open-source starting pair:** Space Grotesk for display and Inter for UI/body. License and redistribution terms should be confirmed for the exact versions bundled in production. Alternative: Manrope for both display and UI.

**Display:** Bold 600–700; compact, geometric headings. **UI:** 400–600; readable at small sizes. **Metrics:** Tabular numerals, 600–700 weight.

**Scale (starting desktop/mobile CSS):** hero 48/56 (desktop) and 36/42 (mobile); page H1 32/38; H2 24/30; body 16/24; labels 14/20; captions 12/18 only for nonessential supplemental text. Respect dynamic text resizing.

**Do:** clear hierarchy, generously spaced cards, large tappable numbers. **Don't:** excessive all caps, illegible condensed UI labels, or text baked into images.

## 9. Logo architecture
**Primary wordmark:** REPXIR, custom geometric lettering. Explore a distinct X intersection as the recognizability anchor.
**Secondary monogram:** RX, optically balanced for app icon, favicon, loading mark, watch complications and avatars.
**Tertiary lockup:** RX symbol + REPXIR horizontal wordmark.

**Concept A — Interlock:** R's diagonal leg flows into the X; the shape remains readable at 24 px.
**Concept B — Split X:** R is straightforward; X is formed with a small purposeful cut, signaling movement.
**Concept C — Motion grid:** Symbol drawn on consistent geometry; a slight forward tension without italicized text.

**Clear space:** At least the width of the X's main stroke on every side (working rule; finalize with vector logo).
**Minimum sizes:** Validate through real device tests; start at 24px monogram and 120px wide wordmark.
**Misuse:** Do not stretch, rotate, bevel, add glowing gradients behind small text, use medical-cross iconography or overlay on low-contrast photography.

## 10. Graphic system and motion
- Shapes: rounded rectangles, finely divided lines, geometric grid, large metrics.
- Signature motif: ascending workout bars or segmented rings; not a heartbeat/ECG graphic as the primary symbol.
- Photography: authentic, diverse bodies and abilities; candid training situations; realistic efforts; avoid perfect-body promises.
- Illustrations: restrained monochrome line art with lime highlights.
- Motion: numeric tick-up on completed sets, restrained progress-ring drawing, satisfying but subtle confirmation, 180–300ms UI easing.
- Motion accessibility: support `prefers-reduced-motion`; never make essential feedback dependent on movement.

## 11. Product UI direction
**Navigation, early MVP:** Today / Workouts / Progress / Profile.
**Today:** Next workout, streak or consistency metric without pressure, recent session.
**Workout session:** Exercise name, set number, weight, reps, rest timer, completed status; large, touch-friendly inputs.
**History:** Calendar/timeline of workouts and searchable exercise history.
**Progress:** Personal records, sessions per week, trends for weight/volume, filter by movement and date.
**Profile:** Units, privacy/data export, accessibility, notifications, account controls.

**Important states:** onboarding, empty dashboard, first logged set, saving, sync offline/online, success, error, no results, permission denied, interrupted session, deleted workout, and accessible reduced-motion versions.

**MVP boundary:** Do not advertise integrations, coaching, clinical insights or wearable sync before those features exist. Build manual workout logging and progress first; add cardio/mobility/recovery only when the product supports them reliably.

## 12. UX/content examples
**Welcome title:** Make movement count.
**Welcome body:** Log your workouts, spot your progress, and build consistency at your own pace.
**Primary action:** Start tracking
**Empty workout history:** Every journey starts somewhere. Log your first workout to see your progress take shape.
**Completed workout:** Session saved. Another step forward.
**Rest timer:** Recover for your next set.
**Empty search:** No exercises found. Try a different name or add a custom exercise.
**Notification:** Your routine is ready whenever you are.
**Privacy reassurance:** Your fitness history belongs to you. Control what you save, share, and delete.

## 13. App store and marketing copy (draft)
**App name:** REPXIR — Workout Tracker (subject to store character limits and approval).
**Subtitle:** Train. Track. Progress.
**Short description:** Track sets, reps, and workouts with a clean, focused fitness journal.

**Long description opening:**
REPXIR helps you record every session and see how far you've come. Log exercises, sets, reps, and weights in a focused interface designed to make training easier to follow and progress easier to understand. Whether you're beginning your first routine or building on years of training, REPXIR helps you make each workout part of a bigger picture.

**Homepage hero:** MOVEMENT IS MEDICINE. / Every rep is a step forward. Log your workouts, track progress, and build a routine that lasts. / CTA: Explore REPXIR.

**Social bio:** Workout tracking, without the noise. Every session counts. Train. Track. Progress.

**Launch email subject:** Meet REPXIR: your progress, in motion.

## 14. Accessibility and inclusive fitness
- WCAG 2.2 AA as target, including contrast and keyboard support for web.
- Minimum 44×44 CSS px tap targets as a practical standard where feasible; avoid cramped number entry during workouts.
- Complete screen-reader labels, logical focus order, distinct error descriptions and status announcements.
- Support reduced motion, dynamic type and meaningful input validation.
- Offer imperial and metric units; make gender/body assumptions optional or unnecessary.
- Avoid default weight-loss messaging and punitive streak design.
- Keep color-independent identification for completed sets and exercise trends.

## 15. Privacy and trust
Workout and wellness information may be sensitive. Use data minimization, secure authentication, encrypted transport, clear retention policy, export and deletion tools, meaningful consent for integrations, and no selling of personal fitness data as a product principle if achievable. Publish a truthful privacy policy based on actual implementation. Do not claim HIPAA compliance unless it applies and is substantiated; most consumer fitness apps are not automatically covered entities.

## 16. Naming and legal launch gate
An initial exact-name public web search on October 14, 2026 did not reveal an obvious competing fitness product under the exact spelling REPXIR. This is **not** proof of availability or clearance. Search results included unrelated OCR/transcription artifacts.

**Required independent checks before investment/launch:**
1. USPTO search for REPXIR and confusingly similar variants, especially fitness/software classes and related services; assess common-law use too.
2. Appropriate state, international, and domain-specific trademark searches as needed; consult trademark counsel for formal clearance.
3. Search Apple App Store and Google Play for the exact name, spacing variants, phonetic lookalikes and related names.
4. Check live domain registration for repxir.com and relevant alternatives; check DNS and historic use.
5. Check matching social handles and GitHub organization names.
6. Review likely confusion with RX-marked fitness brands, pharmacy/medical brands and other REP-prefixed fitness products.
7. Only then finalize legal entity/product branding, register owned domains and trademark where appropriate.

**Important:** Domain and app-store availability are not verified. Do not assume ownership of any suggested handle or URL.

## 17. Design (CSS)
```css
:root {
  --rx-bg: #191B1B;
  --rx-surface: #252827;
  --rx-raised: #343836;
  --rx-lime: #E6FF57;
  --rx-text: #F3F5EF;
  --rx-muted: #A8B0AA;
  --rx-border: #474D49;
  --rx-danger: #FF7C77;
  --rx-success: #BEE89C;
  --rx-radius-sm: 8px;
  --rx-radius-card: 16px;
  --rx-radius-xl: 24px;
  --rx-space-1: 4px;
  --rx-space-2: 8px;
  --rx-space-3: 12px;
  --rx-space-4: 16px;
  --rx-space-6: 24px;
  --rx-space-8: 32px;
  --rx-font-display: 'Space Grotesk', sans-serif;
  --rx-font-body: 'Inter', sans-serif;
}
```

## 18. Brand rollout checklist
**Pre-launch:** Clear brand name, reserve domain/handles, design final vector logo, prepare SVG variants, test favicon, build UI kit, verify typography licensing, validate colors/contrast.
**MVP:** Implement polished workout logging, workout history, basic progress analytics, empty/error states and reliable data handling.
**Launch:** Publish a single clear promise, show real product screenshots, ensure honest feature list and privacy disclosures, create support channel, collect feedback.
**Post-launch:** Evaluate retention and usability, add desired features based on demand, maintain consistent mark and tone across platform releases.

## 19. Creative north star
**REPXIR is not an app that tells people how their bodies should look. It is a tool that helps them recognize what their bodies can do, and how their efforts accumulate over time.**
