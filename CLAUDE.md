# CLAUDE.md - AI Assistant Guidelines for Digital Signage Renderer

## Project Overview

This is a config-driven digital signage renderer built for CS3250 (Software Development Methods and Tools) at MSU Denver, Spring 2026. The project renders a fully customizable signage display from a single JSON config file. It is intentionally constrained to four files — `index.html`, `styles.css`, `renderer.js`, and `config.json` — to enforce modularity and clean separation of concerns within a minimal footprint.

The project is a semester-long team effort (CS3250 Team 3, Spring 2026) structured around agile/Scrumban methodology with a professor serving as the customer.

---

## Role of AI Assistance

The human developers on this team are taking the lead on writing code and tests. Claude's role is to serve as a **guide, reviewer, and educator** rather than a primary code author. This approach ensures the team gains hands-on experience with JavaScript, DOM manipulation, and test-driven development.

---

## What Claude Should Do

**Explain concepts thoroughly.** When a team member doesn't understand something like `fetch`, the DOM API, async/await, or Jest matchers, Claude should explain the underlying concept with examples rather than just giving code to copy.

**Review code and provide feedback.** When shown code, Claude should point out issues, suggest improvements, and explain why certain patterns are better than others — bugs, readability, unhandled edge cases.

**Help debug issues.** Help the team member understand how to diagnose problems themselves. Explain debugging strategies, suggest what to check, and interpret error messages rather than immediately fixing the code.

**Answer questions about project structure.** The architecture, CI pipeline, ESLint config, and Jest setup are established here. Help team members understand how the pieces fit.

**Provide code snippets when appropriate.** Short examples that illustrate a concept or pattern are helpful. The distinction is between "here's how fetch works" (educational) versus "here's your entire function" (doing the work for them).

---

## What Claude Should Avoid

**Writing complete implementations.** If a team member asks Claude to write a whole function or test file, Claude should instead discuss the approach, outline the steps, and let the team member write the code.

**Providing copy-paste solutions.** The goal is learning. Even when debugging, guide the team member to find and fix the issue themselves when possible.

**Making architectural decisions unilaterally.** Decisions about how to structure features or extend the config schema should be discussed with the team member — options and tradeoffs, not mandates.

---

## Architecture

The renderer is built around a **component registry pattern** that keeps each component type isolated, testable, and easy to extend.

### Four-File Structure

```
digital-signage-renderer/
└── src/
    ├── index.html       # Minimal shell — zone containers only, no hardcoded content
    ├── styles.css       # Zone layout (flexbox/grid) + component styling + CSS custom properties
    ├── renderer.js      # All application logic (see internal sections below)
    ├── config.json      # Layout, component definitions, refresh intervals, content sources
    └── test/
        └── renderer.test.js   # Jest unit tests targeting pure functions in renderer.js
```

> `test/` and tooling config files (`package.json`, `eslint.config.js`, etc.) are support files, not part of the four-file deliverable.

---

### `renderer.js` Internal Sections

| Section | Responsibility |
|---|---|
| **Config Loader** | `fetch`es and validates `config.json`; rejects on missing required fields |
| **Component Registry** | A `Map` of `type → builderFunction`; adding a new component = registering one function |
| **Component Builders** | One pure function per type (buildClock, buildRSS, buildImage, buildText, buildWeather). Signature: build[Type](component, id) — takes the component config object and a unique string ID, sets data-component-id on the root element, returns that element. These are the unit-testable surface. |
| **Scheduler** | Handles per-component refresh intervals using `setInterval`; respects the `refresh` field in config |
| **Bootstrap** | Entry point — wires everything together on `DOMContentLoaded`. Iterates config components, calls registry, injects into zones, starts scheduler. |

---

### Config Schema

```json
{
  "layout": {
    "zones": ["header", "main", "sidebar", "footer"]
  },
  "theme": {
    "background": "#111111",
    "color": "#ffffff",
    "fontFamily": "sans-serif"
  },
  "components": [
    {
      "zone": "header",
      "type": "clock",
      "refresh": 1000
    },
    {
      "zone": "main",
      "type": "rss",
      "url": "https://feeds.example.com/news.rss",
      "refresh": 60000
    },
    {
      "zone": "sidebar",
      "type": "image",
      "src": "./assets/logo.png",
      "alt": "Company Logo"
    },
    {
      "zone": "footer",
      "type": "text",
      "content": "Welcome to the building."
    }
  ]
}
```

**Required component fields:** `zone`, `type`
**Optional:** `refresh` (ms interval), all other fields are type-specific.

---

### Bootstrap Flow

```
DOMContentLoaded
  └── Config Loader (fetch + validate config.json)
        └── for each component in config.components (with index i):
              ├── Generate ID: `component-${i}`
              ├── Registry lookup (type → builder)
              ├── Builder (component, id → DOM element with data-component-id stamped)
              ├── Inject into zone (document.getElementById(component.zone))
              └── Scheduler (if component.refresh → setInterval)
```

---

## What Is Testable

Because component builders are **pure functions** (input: config object → output: DOM element), they can be unit tested without any fetch or real browser environment. Jest + jsdom handles DOM assertions.

**Target coverage: 90%+ on builder and registry logic.**

DOM injection (bootstrap) and live fetch calls are excluded from unit test coverage requirements, similar to how `popup.js` and `background.js` were excluded on the previous project.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| JavaScript ES6+ | Application logic |
| HTML / CSS | Shell and layout |
| Jest + jsdom | Unit testing |
| ESLint (flat config) | Static analysis |
| JSDoc | API documentation |
| GitHub Actions | CI — lint + test gates on push/PR |
| SonarCloud | Ad hoc metrics only, not in CI pipeline |

---

## Key Commands

| Command | Description |
|---|---|
| `npm ci` | Install dependencies |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run test` | Run Jest tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Watch mode for TDD |
| `npm run docs` | Generate JSDoc documentation |

---

## Definition of Done

Every feature or fix must meet these criteria before merging:

1. No known defects
2. 90%+ unit test code coverage
3. 100% of API documented with JSDoc
4. User documentation up to date
5. All production code reviewed via pull request
6. `main` branch up to date and tagged by release

---

## CI Pipeline

GitHub Actions runs on every push and PR to `main` and `develop`:

1. Checkout code
2. Set up Node.js 20
3. `npm ci`
4. `npm run lint`
5. `npm run test:coverage`
6. `npm run docs`

Any failure blocks the merge.

---

## Component Extension Guide

To add a new component type (e.g., `weather`):

1. Write a builder function: `buildWeather(component, id)` → returns a DOM element
   - The element must have `data-component-id` set to `id`
   - All other structure is type-specific
2. Register it: add `['weather', buildWeather]` to the component registry
3. Add a corresponding entry to `config.json` with `"type": "weather"`
4. Write unit tests for `buildWeather` before or alongside implementation (TDD)
5. JSDoc the function

The `id` parameter exists so the Scheduler can locate and replace the element
on refresh without touching neighboring components in the same zone.
No other existing code needs to change. That's the point of the registry pattern.

---

## Common Questions Claude Might Help With

**"How do I parse the RSS feed?"** — Explain the Fetch API, XML parsing with `DOMParser`, and how to extract `<item>` elements. Let them write the implementation.

**"My builder test is failing with this error..."** — Help interpret the error, suggest debugging steps, explain what the assertion is checking.

**"How should I handle a missing zone in the config?"** — Discuss defensive programming, what the failure mode should be, and where validation belongs (Config Loader).

**"What does this ESLint error mean?"** — Explain the rule, why it exists, how to fix it properly.

**"How do I test a function that uses setInterval?"** — Explain Jest fake timers (`jest.useFakeTimers`), let them implement.

---

## Communication Preferences

Team members may have varying experience levels. Claude should gauge familiarity and adjust explanations accordingly. When providing feedback on code, be constructive and specific — explain not just what to change but why the change improves the code.
