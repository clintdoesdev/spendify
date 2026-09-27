# Spendify design system (light)

The whole app uses this system. Reusable pieces live in `components/ui/kit.tsx` (Container, Card,
PageHeading, Segmented, PillButton, TextField, SelectField, Notice, EmptyState, BankAvatar, …).

It is built from three references. **Shares** is the base; the other two contribute specific pieces:

| From | What we took |
|---|---|
| **Shares** (base) | Porcelain canvas, one Signal Violet accent for actions and active states only, pill buttons and tabs, 36px Cloud cards with no shadows, uppercase eyebrows at 0.075em tracking, dark Inkstone closing band |
| **Wise** | Heavy display numerals for the headline amount, segmented pill control, inverted dark panel for emphasis, filled CTA paired with an underlined text link |
| **Clearbit** | Lavender wash for soft highlight zones, data-record rows with a muted label on the left and an ink value on the right, colour allowed only in bank marks |

## Tokens

Defined in `app/globals.css` under `@theme`.

| Token | Value | Use |
|---|---|---|
| `ink` | `#1f1f1f` | Text, headings, dark panels, footer |
| `ink-soft` | `#5d5d5d` | Secondary text |
| `ink-faint` | `#6f6f6f` | Labels and helper text (Smoke darkened to pass 4.5:1) |
| `ash` | `#b0b0b0` | Text on dark surfaces, dashed/inactive borders |
| `hairline` | `#e7e7e7` | Dividers, borders, chart grid |
| `cloud` | `#f6f6f6` | Card surface |
| `porcelain` | `#ffffff` | Page canvas |
| `violet` / `violet-deep` | `#594ff4` / `#4a40e0` | The only accent: primary buttons, active tabs, focused data (hover) |
| `violet-wash` | `#f5f3ff` | Soft callouts and tags |
| `gain` / `gain-wash` | `#0b7a61` / `#e3f5ef` | Positive change, money in |
| `warn` / `warn-wash` | `#8a5a00` / `#fdf3dc` | Budget running ahead of pace, soft warnings |
| `loss` / `loss-wash` | `#cb272f` / `#fbe9ea` | Negative change |

## Type

- **Inter Variable**, self-hosted via `@fontsource-variable/inter`, so builds don't depend on Google Fonts. Features `cv11` (single-storey a) and `ss01` (open digits) give it the geometric Aeonik feel. Use `tabular-nums` on every figure.
- Body 500 at 15–17px. Headings 700 at 22–40px, with tracking −0.01 to −0.02em.
- The headline figure uses weight 900 at up to 104px, tracking −0.045em, line-height 0.92.
- Eyebrows are 13px, 500 weight, uppercase, tracking 0.075em.

## Shape and depth

- Cards are 36px radius (28px on mobile) with 32px padding (24px on mobile). Inner rows and accordions are 16px.
- Buttons, tags, tabs and chips are full pills. Primary buttons are violet-filled; ghost buttons have a violet outline.
- Depth comes from surface tint (white page → Cloud card → white inner panel). The only shadow is `shadow-float`, used on floating tooltips.
- No gradients, no decorative motion, and no chart animation.

## Charts

- **One accent.** Show a single series in violet. To compare parts, use emphasis: the selected part in violet, everything else in `#d4d4d8`. Don't give each category its own hue.
- **Comparison lines.** The previous period is a gray `#a3a3a3` line next to the violet one.
- **Chrome.** Grid lines are solid hairlines. Axis labels are 13px `ink-faint` and formatted with `formatNairaAxis`.
- **Bars.** A 2px surface-coloured gap between stacked segments. Only the top of each stack is rounded, at 6px.
- **Tooltips.** Every chart has one: a white card with the hairline border and `shadow-float`.
