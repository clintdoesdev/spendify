# Spendify design system

Forest Ink and Lime Voltage, adapted from the Wise reference (`DESIGN_3.md`): a confident, slightly
loud voice. Heavy display type does the shouting, Forest Ink carries the weight, and a single electric
lime marks the next action. The whole app and the landing page use it, in a light and a dark theme.

## Colour

Semantic tokens are CSS variables in `app/globals.css` that swap with the theme. Use them as normal
Tailwind utilities (`bg-cloud`, `text-ink`, `bg-brand/25`). Don't use `dark:` for these.

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#ffffff` | `#0b1008` | Page background |
| `cloud` | `#f0f2ed` | `#131b0f` | Cards and panels |
| `raised` | `#ffffff` | `#1a2415` | Inputs, inner panels, tooltips, floating cards |
| `sunken` | `#e5e9e1` | `#212c1b` | Meter tracks, skeletons |
| `hairline` / `pebble` | `#e1e5dd` / `#868685` | `#26331f` / `#5b6655` | Dividers / input borders, neutral series |
| `ink` / `ink-soft` / `ink-faint` | Obsidian / Charcoal / Slate | light greys | Headings and figures / body / labels |
| `brand` | Forest `#163300` | Lime `#9fe870` | Text accents, links, the main chart series, progress |
| `brand-wash` | Linen Mist `#e2f6d5` | `#1c2d12` | Badges, soft highlights |
| `context` | `#d3d9cd` | `#3a4834` | "Everything else" in emphasis charts |
| `gain`, `loss`, `warn` (+ `-wash`) | | | Status only, always with an icon or sign |

Fixed brand colours look the same in both themes:

| Token | Value | Use |
|---|---|---|
| `lime` / `lime-deep` | `#9fe870` / `#8ad65b` | Primary buttons, active tabs, the one highlight per section. Never text on a light background. |
| `forest` / `forest-deep` | `#163300` / `#0f2400` | Inverted sections and panels (True Inflow breakdown, security, footer, login brand panel) |
| `forest-soft` | `#b8cbb0` | Muted text on forest |

Every text pair passes WCAG AA (4.5:1 or better) in both themes.

## When to go dark

- **Theme:** Light, Dark or Auto (follows the OS), set from the header toggle or the account menu. It's saved in `localStorage` and applied before first paint by `components/theme/themeScript.ts`, so the page never flashes the wrong theme.
- **Always-forest surfaces:** some moments stay forest in both themes on purpose: the landing product stage and security section, the login brand panel, the True Inflow "How we got there" panel and proof-of-income panel, and the Overview True Inflow teaser. On forest, headlines and key numbers are lime.
- **The lime closing band** on the landing page is lime in both themes, with forest type.

## Type

- **Face:** Inter Variable, self-hosted, with `cv11` and `ss01` switched on.
- **Display** (Wise Sans stand-in): weight 900, tracking −0.04 to −0.055em, line-height 0.84–0.95. Use it for heroes, page titles and big figures. Hero moments are ALL CAPS.
- **Headings:** weight 700, tracking −0.02em. Body is 500 at 15–18px.
- **Badges:** 12px, weight 600, uppercase, tracking 0.06em, set on `brand-wash` (or `white/10` on forest).

## Shape

- **Pills:** buttons, tabs, badges and navigation.
- **Cards:** 24px radius on mobile, 28px on desktop. Inner rows and inputs are 12–20px.
- **Buttons:** the primary is a lime fill with forest text; the secondary is a forest outline or an underlined text link. Never put two filled buttons side by side.
- **Depth:** mostly tint and hairlines. `shadow-float` is used only for things that float: product mockups, tooltips and menus.

## Motion

All motion respects `prefers-reduced-motion`: it collapses to instant, and everything stays visible.

| What | How |
|---|---|
| Page change | `PageTransition` rises each page in (0.45s) |
| Scroll reveal | Add `data-reveal` (`="fade"` or `="scale"`); stagger with `style={{ "--delay": "120ms" }}`. `ClientEffects` shows elements as they enter the viewport |
| Growing bars | `.grow-y` / `.grow-x` inside a revealed element, with `--i` for per-bar stagger |
| Numbers | `<CountUp value format>` counts up when visible, and again when the value changes |
| Hero headline | Words rise in with a stagger; `.mark-lime` swipes a lime block behind one word |
| Tabs | `Segmented` slides its lime indicator between options |
| Ambient | Floating cards (`animate-float`), the bank marquee, the coin moving between banks in "Transfer matched" |

## Charts

- **Colours:** one accent. The series is `brand`, with `context` for "everything else" when one source is highlighted. A comparison series is `pebble` or `ink-faint`.
- **SVG attributes:** these need real colours, so read them with `useThemeColors()`. HTML tooltips can use `var(--brand)` directly.
- **Styling:** grid lines are solid `hairline`, axis labels are 13px `ink-faint`, and every chart has a tooltip.
