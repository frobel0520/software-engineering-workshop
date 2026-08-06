# Design Direction — Engineering Field Manual

## Mode

Redesign — Overhaul. The visual language changes; routes, curriculum data, lesson copy,
Git simulator behavior, accessibility semantics, and persistence keys remain protected.

## Design read

- Artifact: interactive software-engineering learning site
- Audience: Traditional Chinese-speaking beginner engineers
- Anchor: Stripe Press warmth with a practical engineering workbench
- Dials: variance 6, motion 3, density 6, assets 2, fidelity 6

## Tokens

- Ground: `#f1ecde`
- Surface: `#e6dcc4`
- Ink: `#1a1a18`
- Muted: `#736d5a`
- Accent: `#1b4b5a`
- Hairline: `#c8bea4`
- Display/body: Newsreader + Noto Serif TC
- UI: Noto Sans TC
- Code: DM Mono
- Radius: square editorial surfaces; small radius only for operational inputs
- Motion: 160–600ms; state and hierarchy only; reduced-motion fallback required
- Balance: repeated modules use equal widths and row heights; asymmetry is reserved for
  the hero narrative and the terminal/mission workbench where function justifies it

## Protected contracts

- `#/map`, `#/git`, and `#/lab`
- all 19 curriculum entries and their statuses
- `se-workshop-git-complete`
- Git Lab commands, simulator state, reset, and completion behavior
- keyboard focus order, live terminal announcements, and mobile navigation
