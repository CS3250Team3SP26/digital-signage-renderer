# CLAUDE.md - AI Assistant Guidelines for Digital Signage Renderer

## Project Overview

This is a config-driven digital signage renderer built for CS3250 (Software Development Methods and Tools) at MSU Denver, Spring 2026. The project renders a fully customizable signage display from a single JSON config file. It is intentionally constrained to four files — `index.html`, `styles.css`, `renderer.js`, and `config.json` — to enforce modularity and clean separation of concerns within a minimal footprint.

The project is a semester-long team effort (CS3250 Team 3, Spring 2026) structured around agile/Scrumban methodology with a professor serving as the customer.
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
| **Component Builders** | One pure function per type (buildClock, buildRSS, buildImage, buildText, buildWeather). Signature: build[Type](component, id) — takes the component config object and a unique string ID. Returns a div.component-card with data-component-id set to id as the root element. The card div wraps all inner content elements and is responsible for card styling. This consistent root structure allows the Scheduler to locate and replace any component type via [data-component-id] without knowing the component's internal structure. These are the unit-testable surface. |
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

## Definition of Done

Every feature or fix must meet these criteria before merging:

1. No known defects
2. 90%+ unit test code coverage
3. 100% of API documented with JSDoc
4. User documentation up to date
5. All production code reviewed via pull request
6. `main` branch up to date and tagged by release

---

## Component Extension Guide

To add a new component type (e.g., `weather`):

1. build[Type](component, id) → div.component-card
  - Root is always a div with class="component-card"
  - data-component-id is stamped on that root div
  - All inner content elements are children of the card div
2. Register it: add `['weather', buildWeather]` to the component registry
3. Add a corresponding entry to `config.json` with `"type": "weather"`
4. Write unit tests for `buildWeather` before or alongside implementation (TDD)
5. JSDoc the function

The `id` parameter exists so the Scheduler can locate and replace the element
on refresh without touching neighboring components in the same zone.
No other existing code needs to change. That's the point of the registry pattern.

---
