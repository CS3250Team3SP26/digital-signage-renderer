# Digital Signage Renderer — Configuration Guide

The display is entirely driven by a single file: `config.json`. No HTML or JavaScript needs to be touched to change what appears on screen. This guide explains how to configure the renderer for the currently supported component types: **Image** and **RSS Feed**.

---

## How It Works

When the page loads, the renderer reads `config.json`, finds each component you've defined, and injects it into the correct zone on the screen. If you change the config and reload the page, the display updates automatically.

---

## File Structure

`config.json` has four top-level sections:

| Field | Required | Description |
|---|---|---|
| [`proxy`](#proxy) | No | A CORS proxy URL prepended to external feed requests. Required if your RSS feeds block direct browser access. |
| [`layout`](#layout) | Yes | Defines the named zones available on the page. |
| [`theme`](#theme) | No | Controls background color, text color, and font. |
| [`components`](#components) | Yes | An array of components to render, each assigned to a zone. |

### `proxy`

If your RSS feeds block direct browser requests (a common restriction called CORS), you can route them through a proxy. Set this to the proxy's base URL — the renderer will prepend it to any RSS feed URL automatically.

```json
"proxy": "https://corsproxy.io/?url="
```

> If you are only displaying local images and no RSS feeds, you can omit this field entirely.

### `layout`

Defines which zones exist on the page. Zone names must match the IDs of elements in `index.html`.

```json
"layout": {
  "zones": ["header", "main", "sidebar", "footer"]
}
```

### `theme`

Optional visual configuration applied globally to the display.

| Field | Type | Default | Description |
|---|---|---|---|
| `background` | string | `"#111111"` | Background color (any valid CSS color value) |
| `color` | string | `"#ffffff"` | Text color (any valid CSS color value) |
| `fontFamily` | string | `"sans-serif"` | Font family (any valid CSS font-family value) |

---

## Supported Components

| Component | Description |
|---|---|
| [Image](#image-component) | Displays a static image in a zone. |
| [RSS Feed](#rss-feed-component) | Fetches and displays headlines from an RSS feed URL. |

---

## Components

Every component, regardless of type, requires these two fields:

| Field | Required | Type | Description |
|---|---|---|---|
| `zone` | Yes | string | The zone ID where this component will be rendered. Must match a zone defined in `layout.zones`. |
| `type` | Yes | string | The component type. Currently supported: `"image"`, `"rss"`. |

---

### Image Component

Displays a static image in a zone.

| Field | Required | Type | Description |
|---|---|---|---|
| `zone` | Yes | string | Zone to render into. |
| `type` | Yes | string | Must be `"image"`. |
| `src` | Yes | string | Path or URL to the image file. Relative paths are resolved from the project root. |
| `alt` | Yes | string | Descriptive text for the image. Used by screen readers and shown if the image fails to load. |

**Example:**

```json
{
  "zone": "sidebar",
  "type": "image",
  "src": "./assets/logo.png",
  "alt": "Company Logo"
}
```

> **Note:** `alt` is required, not optional. An empty string (`""`) is acceptable only for purely decorative images that convey no information.

---

### RSS Feed Component

Fetches and displays headlines from an RSS feed URL. Automatically re-fetches on a configurable interval.

| Field | Required | Type | Description |
|---|---|---|---|
| `zone` | Yes | string | Zone to render into. |
| `type` | Yes | string | Must be `"rss"`. |
| `url` | Yes | string | The full URL of the RSS feed. |
| `maxItems` | No | number | Maximum number of headlines to display. If omitted, all items in the feed are shown. |
| `refresh` | No | number | How often to re-fetch the feed, in milliseconds. If omitted, the feed is fetched once on load and never updated. |

**Example:**

```json
{
  "zone": "main",
  "type": "rss",
  "url": "https://feeds.bbci.co.uk/news/rss.xml",
  "maxItems": 5,
  "refresh": 60000
}
```

> **Note on `refresh`:** `60000` ms = 60 seconds. Setting this too low (e.g., under 10 seconds) may result in your requests being rate-limited or blocked by the feed provider.

> **Note on CORS:** Most major news RSS feeds block direct browser requests. If your feed fails to load, make sure `proxy` is set at the top level of your config. See the [proxy section](#proxy) above.

---

## Complete Example

See `config.template.json` for a ready-to-use starting point. Below is a full working example for reference:

```json
{
  "proxy": "https://corsproxy.io/?url=",
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
      "zone": "sidebar",
      "type": "image",
      "src": "./assets/logo.png",
      "alt": "Company Logo"
    },
    {
      "zone": "main",
      "type": "rss",
      "url": "https://feeds.bbci.co.uk/news/rss.xml",
      "maxItems": 5,
      "refresh": 60000
    }
  ]
}
```

---

## Common Mistakes

**Zone name doesn't match layout** — If a component's `zone` value isn't listed in `layout.zones`, it won't render. Check for typos.

**Missing `proxy` with an RSS feed** — If headlines aren't appearing and you see a CORS error in the browser console, add the `proxy` field to the top level of your config.

**`refresh` set too low** — Values under `10000` (10 seconds) risk rate limiting from feed providers.

**Relative image path not resolving** — Paths in `src` are relative to the project root, not to `config.json`. If your image is at `src/assets/logo.png`, use `"./assets/logo.png"` not `"../assets/logo.png"`.

---

*This document covers v1 of the config schema. Additional component types (clock, text, weather) will be documented as they are added.*