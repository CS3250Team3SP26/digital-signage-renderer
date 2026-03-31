# Project Overview — Digital Signage Renderer

## What Are We Building?

A browser-based digital signage display that is fully driven by a single JSON config file. Think of it like a TV display you'd see in a lobby or hallway — showing a clock, news headlines, images, weather, etc. — except instead of hardcoding any of that, **everything comes from the config**.

You point it at a config file, it builds the display. Change the config, change the display. No touching the HTML or JS.

---

## The Four Files

The entire project is intentionally constrained to four files:

| File | What It Does |
|---|---|
| `config.json` | Defines what goes where — zones, component types, content sources, refresh intervals |
| `index.html` | Just the skeleton — empty zone containers that get filled by JS |
| `styles.css` | Makes the zones lay out correctly at any screen size |
| `renderer.js` | Reads the config and builds everything dynamically |

That's it. No frameworks, no build step for the end product.

---

## How It Works (The Short Version)

1. Page loads → `renderer.js` fetches `config.json`
2. For each component in the config, it finds the right zone on the page and injects the built component into it
3. If a component has a refresh interval (like an RSS feed updating every 60 seconds), the scheduler handles that automatically

---

## The Two Required Components

The minimum viable product needs:
- **Image** — display an image in a zone
- **RSS Feed** — fetch and display headlines from a feed URL, auto-refreshing

Everything else (clock, weather, text) is a bonus that plugs in cleanly once the core pattern is established.

---

## What You Need to Know Before Writing Any Code

- **Read `CLAUDE.md`** — it has the full architecture, the config schema, and the definition of done
- New component types are added by writing one function and registering it — you should never need to touch existing code to add something new
- The JS is organized into clear sections (Config Loader, Registry, Builders, Scheduler, Bootstrap) — know which section your work belongs in before you start
- Business logic goes in builder functions because **that's what we test** — keep DOM injection and fetch calls separate from logic wherever possible

---

## Questions?

Check `CLAUDE.md` first. If it's not answered there, ask in Discord.
