# Design System Specification — "Editorial Frost / Platform Blue"

A portable, product-agnostic design-system spec. It documents the live system of a
data-dense analytics web app, but nothing in it depends on that domain: follow this
file exactly and any product will look and feel identical to the source.

---

## 1. Design philosophy

- **White, sharp, editorial.** The whole canvas is `#ffffff`. Surfaces are separated
  by 1px hairlines (`#e5e7eb`), never by fills or shadows. Every edge in the system
  is square — `border-radius: 0` on every surface AND on every button. The "pill"
  vocabulary survives in class names and in a `--r-pill` token, but that token's live
  value is `0px`: pills are rectangles here.
- **One accent.** `#004ce6` (a saturated action blue) is the only brand color. Blue
  means "active": filled CTAs, selected nav rows, active underline tabs, checked
  marks, focus, links, the primary chart series. It is punctuation, never wallpaper —
  with one deliberate exception, the light-blue widget header band (`#eaf1ff`).
- **Flat elevation.** `box-shadow: none` everywhere. Every shadow token exists and is
  set to `none`. Depth is communicated by hairlines, tonal steps (`#ffffff` →
  `#f5f5f6` → `#ededef`), and backdrop blur on overlays.
- **Data colors are rationed.** Exactly three semantic hues — red `#FF0000`, amber
  `#FFC000`, green `#00B050` — reserved for meaning (bad / caution / good). All other
  former hue families (violet, cyan) are folded into gray monochrome.
- **One typeface, one voice.** Plus Jakarta Sans at every size, tight negative
  tracking on display type, uppercase letterspaced micro-labels for every section
  heading and table header.
- **Utilitarian density.** Root font-size 15px, body text 13px, table text ~0.84rem.
  Controls are 34px tall; information is dense but everything aligns.

---

## 2. Color tokens

All colors route through CSS custom properties on `:root` so dynamically injected
markup inherits the system automatically.

### 2.1 Canvas & surfaces

| Token | Value | Role |
|---|---|---|
| `--bg-color` | `#ffffff` | Page background |
| `--sidebar-bg` | `#ffffff` | Sidebar background |
| `--card-bg` | `#ffffff` | Card background |
| `--surface-1` | `#ffffff` | Cards, dropdowns, "elevated" panels |
| `--surface-2` | `#f5f5f6` | Table header bands, subtle fills, hover on outline buttons |
| `--surface-3` | `#ededef` | Stronger hover fills, neutral pill fills |
| `--border-color` | `#e5e7eb` | THE hairline. Every divider, every default border |
| `--border-strong` | `#c9cfd6` | Hover borders, scrollbar thumb, "today" markers |

### 2.2 Ink

| Token | Value | Role |
|---|---|---|
| `--text-main` | `#030303` | Primary ink ("deep obsidian") — headings, values, primary labels |
| `--text-accent` | `#3d444d` | Body/secondary ink — table cells, descriptions |
| `--text-muted` | `#667079` | Muted labels, sublines, section micro-labels |
| `--text-subtle` | `#98a1a9` | Placeholders, disabled-ish hints, tertiary ink |

### 2.3 Brand / action blue

| Token | Value | Role |
|---|---|---|
| `--accent` | `#004ce6` | Filled CTAs, active segments, selected states |
| `--accent-hover` | `#003bb3` | CTA hover fill |
| `--accent-contrast` | `#ffffff` | Text on filled blue |
| `--brand` | `#004ce6` | Active indicators, links, focus, checked marks, primary chart series |
| `--brand-strong` | `#0040c2` | Reserved stronger blue (rarely used) |
| `--accent-fg` | `var(--brand)` | Link / active-text alias |
| `--accent-soft` | `#eef3fd` | Whisper tint behind brand things: row hover, menu-item hover |
| `--focus-ring` | `rgba(0, 76, 230, 0.16)` | The 3px focus halo color |

**Widget band colors (hard-coded, not tokens):** header bands on widget cards use
background `#eaf1ff`, hover `#ddeafe`, with text/icons in `var(--brand)`.

### 2.4 Semantic data triads (bg / fg / border / solid)

| Family | fg | bg | border | solid |
|---|---|---|---|---|
| green | `#00B050` | `rgba(0,176,80,0.07)` | `rgba(0,176,80,0.32)` | `#00B050` |
| red | `#FF0000` | `rgba(255,0,0,0.055)` | `rgba(255,0,0,0.30)` | `#FF0000` |
| amber | `#b98b00` (fg is darkened for contrast) | `rgba(255,192,0,0.12)` | `rgba(255,192,0,0.45)` | `#FFC000` |
| blue | `#004ce6` | `#eef3fd` | `#c9d9fa` | `#004ce6` |
| violet (neutralized) | `#3d444d` | `#f2f3f5` | `#e5e7eb` | `#3d444d` |
| cyan (neutralized) | `#3d444d` | `#f7f8f9` | `#e5e7eb` | `#667079` |

Violet and cyan are deliberately monochrome gray — legacy hue slots folded into the
rationed palette. Use them for quiet neutral chips.

### 2.5 Selection & overlay scrims

- `::selection { background: var(--brand); color: #ffffff; }`
- Slide-over/backdrop scrim: `rgba(3, 3, 3, 0.42)` + `backdrop-filter: blur(2px)`
- Sidebar scrim (mobile): `rgba(3, 3, 3, 0.4)` + `blur(2px)`
- Modal overlays (heavier dialogs): `rgba(0, 0, 0, 0.5)` + `blur(3px)`

### 2.6 Chart palette (categorical series)

A fixed, clearly-distinct qualitative palette, in order:

```
#004ce6  #030303  #FF0000  #00B050  #FFC000  #667079
#7ba0f4  #30363d  #002d80  #9aa1a9  #3b74f0  #c9cfd6
```

Rules:
- The "current period" series is ALWAYS `#004ce6`; when comparing periods, the rest
  of the palette is used with that blue removed so nothing clashes with it.
- Sentiment/segment stacks: positive `#00B050`, neutral `#FFC000` (its in-bar label
  ink is `#3d2b00`), negative `#FF0000`; label ink `#fff` on the other two.
- Chart chrome reads live tokens: axis text `--text-muted`, gridlines
  `--border-color` (dashed axis-pointer in `--border-strong`, width 1, opacity 0.85),
  tooltip surface `--surface-1`, zoom-slider filler `--surface-3`, handles
  `--border-strong`. Chart background transparent (export: `--bg-color`).

---

## 3. Typography

### 3.1 Families

```css
--font-body:    'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

Loaded from Google Fonts with weights **400, 500, 600, 700, 800**. No mono family is
declared; numeric alignment is done with `font-variant-numeric: tabular-nums`, not a
mono font. `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale`.

### 3.2 Root sizing

```css
html { font-size: 15px; }        /* 1rem = 15px */
body { font-size: 13px; line-height: 1.5; }
```

All component sizes below are rem against the 15px root.

### 3.3 Tracking tokens

| Token | Value | Use |
|---|---|---|
| `--track-display` | `-0.027em` | H1 / display sizes |
| `--track-heading` | `-0.015em` | Sub-headings, big stat numbers |
| `--track-caps` | `0.07em` | Every uppercase micro-label |

### 3.4 The size scale (as actually used)

| Size | Weight | Role |
|---|---|---|
| `1.9rem` | 700 | KPI stat value (`--track-heading`, line-height 1.02, tabular-nums) |
| `1.85rem` | 600 | Card-level big count |
| `1.55rem` | 700 | Page H1 (`--track-display`, line-height 1.1) — 1.5rem below 820px |
| `1.4rem` | 600 | Detail-card stat value |
| `1.25rem` | 600 | Slide-over panel title (`--track-heading`) |
| `1.15rem` | 650 | Modal titles (letter-spacing −0.01em) |
| `1.1rem` | 600 | Small dialog title |
| `1.05rem` | 500 | Title qualifier badge (muted, after H1) |
| `1rem` | 600 | Card entity titles, list-card titles |
| `0.95rem` | 600 | Brand wordmark; large inputs |
| `0.92rem` | 400–600 | Detail values, card emails |
| `0.9rem` | 500 | Empty states, primary auth button |
| `0.85–0.88rem` | 400–600 | Body copy, remarks, toasts, subtitles |
| `0.83–0.84rem` | 500 | Buttons, menu items, table cell text |
| `0.82rem` | 500 | Outline buttons, selects, dropdown rows, tab labels |
| `0.8rem` | 500 | THE control size (`--fs-font`): filter bar inputs, pills, pagination |
| `0.78rem` | 500–700 | Dense table text, chips, calendar title |
| `0.74–0.76rem` | 500–600 | Sub-meta lines, applied-filter chips, nav counts |
| `0.72rem` | 600–700 | **Uppercase section micro-label / widget band label** |
| `0.7rem` | 500–600 | Tooltips, tiny legends |
| `0.66–0.68rem` | 600–700 | KPI stat labels (caps), count badges, trend pills |
| `0.62–0.64rem` | 600–700 | Table `<th>` caps (0.64), field caps labels (0.62) |
| `0.58–0.6rem` | 600–700 | Smallest caps keys (key-value grids, weekday headers) |
| `0.55rem` | 600 | Tiniest flag chip (uppercase, 0.04em tracking) |

Weight 650 appears in a few dense spots (`font-weight: 650` for emphasized inline
numbers); with static 600/700 loaded it renders as the nearer weight — treat it as
"between semibold and bold".

### 3.5 The uppercase micro-label pattern

The signature label treatment, used for section titles, widget band titles, table
headers, KPI labels, form-group labels, nav group titles:

```css
font-size: 0.72rem;          /* 0.62–0.66rem for smaller variants */
font-weight: 700;            /* 600 for the smaller variants */
text-transform: uppercase;
letter-spacing: var(--track-caps);   /* 0.07em */
color: var(--text-main);     /* or --text-muted / --text-subtle by hierarchy */
```

### 3.6 Line heights

Body 1.5; headings 1.1; stat values 1.02; dense meta 1.3–1.4; readable paragraphs
1.45–1.6; remarks/quotes 1.55.

---

## 4. Spacing & layout metrics

| Metric | Value |
|---|---|
| Sidebar width | `--sidebar-w: 232px` |
| Main content padding | `1.6rem 2rem 3.5rem` (desktop); `1.25rem 1.25rem 4rem` ≤820px; `1rem 1rem 3rem` ≤520px |
| Card padding | `1.25rem` (1.15rem ≤520px); card margin-bottom `1.25rem` |
| KPI grid | `grid-template-columns: repeat(5, 1fr); gap: 0.9rem; margin-bottom: 1.6rem` (3-col ≤1100px, 2-col ≤820px, 0.6rem gap ≤520px) |
| Page header | `margin-bottom: 1.3rem; padding-bottom: 1rem` + 1px bottom hairline |
| Header action gap | `1rem` |
| Control gap (filter bars) | `--fs-gap: 0.5rem` |
| Control height | `--fs-h: 34px` — EVERY filter-bar control, every view |
| Control font | `--fs-font: 0.8rem` |
| Section band break | 1px hairline with `margin: 3.25rem 0 2.75rem` |
| Sidebar padding | `1.4rem 0.85rem 1rem` |
| Nav item padding | `0.52rem 0.75rem`, gap `0.65rem`, margin-bottom `0.1rem` |
| Nav group margin | `1.5rem` bottom |
| Menu padding | `0.4rem` (popovers), rows `0.42–0.55rem` × `0.5–0.7rem` |
| Slide-over header | `1.25rem 1.75rem`; body `1.75rem` |
| Modal padding | `1.5rem` (small); heads `1.35rem 1.6rem`, bodies `1.5–1.6rem`, feet `1.05rem 1.6rem` |

The container behavior: the app is a fixed flex row (`body { display:flex; height:
100vh; overflow:hidden; }`) — a non-scrolling sidebar plus a `.main-content` that is
the ONLY vertical scroll area (`flex:1; overflow-y:auto; scroll-behavior:smooth`).
Content is fluid, no max-width container; density is controlled by the paddings above.
Sizes are FIXED, never stretched to fill: leftover space is left as space.

---

## 5. Shape: borders & radii

```css
--r-sm: 0px;  --r-md: 0px;  --r-lg: 0px;  --r-pill: 0px;
```

**Everything is sharp.** All four radius tokens are `0px`. Buttons, cards, inputs,
menus, chips, avatars, toasts — all square. Components still *reference*
`var(--r-pill)` (buttons, pills, badges, avatar, toast) and `var(--r-md)/--r-lg`
(menus, modals) so that the shape language could be flipped by editing four tokens,
but the shipped value is 0 in every case.

**The only curve left in the system is the spinner.** `border-radius: 50%` survives
on the four rotating rings (`.patterns-spinner`, `.bill-spinner`, `.du-spin`, the
patterns loader) because a ring has to be a circle to read as one. Everything else
that was round has been squared: the deep-dive banner chips in every tab (NPS
Summary, MoM, Transition), the MTD note pill, the `.fs-badge` count badge and the
chip-remove ✕ hit-target, the 52px Slack FAB, the 56px billing privacy-wall badge,
and the chart furniture — legend swatches are `rect`, line markers are 6px squares
(`symbol: 'rect'`), and bars default to `rounded: false` (the chart toolbar's
"Rounded corners" toggle still lets a reader round them per-session).

`var(--r-*)` fallbacks in the JS-injected stylesheets are written `var(--r-lg,0)`,
never `var(--r-lg,10px)` — a missing token must degrade to sharp, not to round.

Border weights:
- **1px** `var(--border-color)` — the default border on every control, card, menu.
- **1px** `var(--border-strong)` or `var(--text-main)` — hover borders.
- **1.5px** — custom checkbox box outline.
- **2px** — solid focus outline used inside composite pills (`outline: 2px solid var(--brand); outline-offset: -3px`), spinner strokes.
- **2.5px** — the underline-tab active bar (`border-bottom: 2.5px solid`).
- **3px** — the brand quote bar (`border-left: 3px solid var(--brand)`), scrollbar thumb inset border.
- Dashed 1px `var(--border-strong)` — the "empty/add" affordance chip.

---

## 6. Elevation & shadows

```css
--shadow-subtle: none;  --shadow-soft: none;  --shadow-pop: none;  --shadow-lg: none;
```

Deliberately flat. `box-shadow: none` is written explicitly on popovers, toasts,
slide-overs, modals, menus. The only box-shadows in the system are **not elevation**:

1. **Focus ring:** `box-shadow: 0 0 0 3px var(--focus-ring)` — on every focused
   input, select, textarea, and `:focus-visible` button.
2. **Inset hover outline:** interactive cards signal hover with
   `border-color: var(--brand); box-shadow: inset 0 0 0 1px var(--brand);`
   (a doubled 1px brand edge, still flat).
3. A 2px ring variant `0 0 0 2px var(--focus-ring)` on in-table sort buttons.
4. `box-shadow: 0 0 0 2px var(--sidebar-bg)` to knock out a notification dot's
   surroundings (a punch-out, not a shadow).

Overlays get separation from `backdrop-filter: blur(2–3px)` on a dark scrim instead
of shadow.

---

## 7. Motion

### 7.1 Easing tokens

```css
--ease-out:    cubic-bezier(0.22, 1, 0.36, 1);   /* the default for everything */
--ease-spring: cubic-bezier(0.34, 1.3, 0.64, 1); /* pop-in for menus/modals/toasts */
```

### 7.2 Duration ladder

| Duration | Used for |
|---|---|
| 0.12–0.14s | Micro hovers: menu rows, chip ✕, calendar day cells |
| 0.15–0.16s | Option rows, small buttons, tab color changes |
| 0.18s | THE standard hover transition (border-color, background, color, transform) |
| 0.2s | Popover `menu-in`, cell filters, tooltip fades |
| 0.22s | Chevron rotation, share-popover `menu-in` |
| 0.24s | Toast opacity, account-menu opacity |
| 0.25s | Backdrop fade-in, learner-chevron rotate |
| 0.3s | Toast spring slide, modal-in, grid-rows reveal |
| 0.32s | Sidebar slide (mobile), peek-rise |
| 0.38s | View entrance (`view-in`) |
| 0.4s | Slide-over panel slide |
| 0.45s | Auth card entrance |
| 0.5s | The Filter pill's Clear-half width growth |
| 0.7–0.8s linear | Spinners (patspin etc.) |

### 7.3 Keyframes (canonical)

```css
@keyframes view-in  { from { opacity: 0; transform: translateY(10px); }
                      to   { opacity: 1; transform: translateY(0); } }      /* 0.38s ease-out, every tab switch */
@keyframes menu-in  { from { opacity: 0; transform: translateY(-4px); }
                      to   { opacity: 1; transform: translateY(0); } }      /* 0.18–0.22s ease-out, every popover */
@keyframes modal-in { from { opacity: 0; transform: translateY(10px) scale(0.985); }
                      to   { opacity: 1; transform: translateY(0) scale(1); } } /* 0.3s ease-spring */
@keyframes fade-in  { from { opacity: 0; } to { opacity: 1; } }             /* 0.25s, backdrops */
@keyframes patspin  { to { transform: rotate(360deg); } }                   /* 0.7s linear infinite, spinners */
```

**Tab switches** additionally run inside a View Transition where the API exists:
`.main-content` carries `view-transition-name: nps-main`, whose old snapshot
fades 0.14s while the new one fades in + rises 6px over 0.22s — content pane
only, so the sidebar never appears to move. Skipped under reduced motion and
under automation (`navigator.webdriver`), where the swap must stay synchronous.

### 7.4 The universal press

Every button on the site steps down 1px while held. `translate` (the property, not
`transform`) is used so it composes with any transform the control already carries:

```css
button:not(:disabled):active,
.nav-item:active, .icon-btn:active, .control-select:active,
a[onclick]:active, .clickable-cell:active /* …every interactive class */ {
  translate: 0 1px;
}
```

### 7.5 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Motion is a courtesy, never a requirement.

---

## 8. Iconography

- Inline SVG only, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
  `stroke-linecap="round"`, `stroke-linejoin="round"` (Feather-style line icons).
- The shared `.icon` class overrides any attribute weight to a hairline stroke:

```css
.icon { width: 16px; height: 16px; stroke: currentColor; fill: none;
        stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round;
        display: inline-block; vertical-align: -3px; flex-shrink: 0; }
.icon--sm { width: 15px; height: 15px; vertical-align: -2px; }
.icon--lg { width: 22px; height: 22px; }
```

- Icons inside buttons: 15px (`.btn-primary .icon`, `.btn-outline .icon`), 16px in
  nav rows, 17px in tool rails.
- Data-URI chevrons baked into selects: 12×12, stroke `#98a1a9`, stroke-width 2.
- Calendar nav arrows: 13px, stroke-width 2.2. Tick marks in option lists: 12px,
  stroke-width 3, colored `var(--brand)`.
- Icon color follows text color: `--text-subtle` at rest in nav/menus, ink or brand
  on hover/active. No emoji in UI chrome.

---

## 9. Scrollbars

Part of the system, not the OS:

```css
::-webkit-scrollbar { width: 9px; height: 9px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 0;
                            border: 3px solid var(--bg-color); }
::-webkit-scrollbar-thumb:hover { background: var(--text-subtle); }
* { scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; }
```

Square thumb, inset 3px, monochrome. Inner horizontal scrollers may thin to 5px.

---

## 10. Components

### 10.1 Primary button (`.btn-primary`)

```css
display: inline-flex; align-items: center; gap: 0.45rem;
background: var(--accent); color: var(--accent-contrast);
border: 1px solid var(--accent);
padding: 0.5rem 1.05rem; border-radius: var(--r-pill);   /* = 0 */
font-size: 0.83rem; font-weight: 500; white-space: nowrap; cursor: pointer;
transition: background 0.18s var(--ease-out), transform 0.18s var(--ease-out);
/* hover */  background: var(--accent-hover); border-color: var(--accent-hover);
/* active */ translate: 0 1px;
/* loading */ opacity: 0.7; cursor: default;
/* disabled (scoped where needed) */ opacity: 0.4; cursor: not-allowed;
```

### 10.2 Outline button (`.btn-outline`)

```css
background: transparent; border: 1px solid var(--border-color); color: var(--text-main);
padding: 0.45rem 0.95rem; border-radius: var(--r-pill);
font-size: 0.82rem; font-weight: 500; gap: 0.4rem;
/* hover */ border-color: var(--border-strong); background: var(--surface-2);
```

### 10.3 Icon button (`.icon-btn`)

36×36px square (radius token = 0), 1px `--border-color` border, `--surface-1` fill,
ink icon. Hover: border `--border-strong`, background `--surface-2`. Press: 1px down.
Smaller variants: 34×34 (modal close ✕ — hover flips border+color to `--text-main`),
26×26 (calendar month nav).

### 10.4 Filter-bar trigger button (`.fs-btn`)

The standard action on every filter bar:

```css
height: var(--fs-h);                 /* 34px */
background: var(--surface-1); border: 1px solid var(--border-color);
color: var(--text-main); padding: 0 0.85rem; border-radius: var(--r-pill);
font-size: 0.8rem; font-weight: 500; gap: 0.4rem; white-space: nowrap;
transition: border-color 0.15s ease, box-shadow 0.15s ease;
/* hover */        border-color: var(--text-main);
/* open (.active) */ border-color: var(--brand);   /* border only — NO ring, no fill */
/* :focus-visible */ border-color: var(--brand); box-shadow: 0 0 0 3px var(--focus-ring);
```

Its value fragment is `font-weight: 600` (`.fs-btn__val`); its count badge
(`.fs-badge`) is a `999px`-rounded dot: min-width 1.05rem, height 1.05rem, padding
0 0.3rem, `--brand` fill, white 0.66rem/700 text.

### 10.5 Two-half pills

Two controls in the system are one pill split down the middle. Both are 34px tall,
1px-bordered rectangles (`--r-pill` = 0) with `overflow: hidden`.

**(a) Filter + Clear pill (`.fs-pill`)** — trigger left, red Clear right:
- Wrapper: `--surface-1`, 1px `--border-color`; hover border `--text-main`; open
  (`.is-open`) border `--brand`. The inner buttons are borderless segments;
  keyboard focus inside uses `outline: 2px solid var(--brand); outline-offset: -3px`.
- Clear half: exists only while a filter is applied. Width animates
  `0 → (measured width of the filter half)` over
  `width 0.5s cubic-bezier(.22,1,.36,1)`, opacity `0.38s` with `0.04s` delay; the
  content is absolutely positioned at final width so it wipes in, never squashes.
  A 1px seam (`::before`) fades in with it (`opacity 0.38s`).
- Clear colors: red text `#FF0000` on white at rest; hover/focus flips to solid
  `#FF0000` background with `#fff` text (the seam disappears). Focus:
  `outline: 2px solid #FF0000; outline-offset: -3px`.
- The two halves are equal width (Clear is given the Filter half's measured px).
- Clear scope (2026-08-24): Clear wipes the view's ON-BAR free-text boxes
  (`.fs-text` / `.fs-num` in the pill's control bar) along with the menu's
  filters, and a typed search alone arms the Clear half — a filter you can
  type must be a filter Clear clears.

**(b) Export pill (`.ex-pill`)** — action left, count readout right:

```css
display: inline-grid; grid-template-columns: 1fr 1fr;  /* equal halves */
height: var(--fs-h, 34px); background: var(--surface-1);
border: 1px solid var(--border-color); border-radius: var(--r-pill);
font-size: 0.8rem; font-weight: 500; overflow: hidden;
/* halves */ padding: 0 0.85rem; min-width: 104px; centered content;
/* left */   font-weight: 600;  /* hover lights ONLY this half: background: var(--surface-2) */
/* right */  border-left: 1px solid var(--border-color); color: var(--text-muted);
             font-variant-numeric: tabular-nums;      /* a readout, not a button */
/* hover */  border-color: var(--text-main);
/* focus-visible */ border-color: var(--brand); box-shadow: 0 0 0 3px var(--focus-ring);
```

### 10.6 Sidebar navigation

- Group title: 0.62rem / 600 / uppercase / `--track-caps` / `--text-subtle`,
  margin-bottom 0.6rem, padding-left 0.75rem.
- Row (`.nav-item`): flex, gap 0.65rem, padding `0.52rem 0.75rem`, 0.86rem / 500,
  `--text-muted` with `--text-subtle` 16px icon. Hover: `--surface-2` fill, ink text
  and icon. **Active: solid `--brand` fill, white text and icon, weight 600** —
  the single point of color on the rail. Radius 0. Press: 1px down.
- Brand row: 28px logo + wordmark 0.95rem/600 `--track-heading`; an accent glyph in
  the wordmark is `--brand` at 0.7rem. Hover: opacity 0.72.
- Footer account trigger: transparent → `--surface-2` on hover/open (open also gets a
  1px `--border-color` border); 28px square avatar with `--accent` fill, white
  0.76rem/600 uppercase initials; name 0.8rem/600; subline 0.68rem `--text-subtle`.
- Account menu: opens ABOVE (`bottom: calc(100% + 8px)`), `--surface-1`, 1px border,
  padding 0.4rem, no shadow; enters via
  `opacity 0.18s var(--ease-out), transform 0.24s var(--ease-spring)` from
  `translateY(8px) scale(0.98)`. Items 0.83rem/500 `--text-accent`, padding
  `0.55rem 0.6rem`; hover `--accent-soft` bg + `--brand` text/icon. Danger item
  hovers `--red-bg`/`--red-fg`. Header row separated by a hairline.
- Count badge in menus (`.approval-badge`): min-width 18px, height 18px, padding
  0 5px, radius `--r-pill`, solid `#FF0000`, white 0.66rem/700.
- **View as row** (named super admin only), between the divider and Sign out: a
  standard menu item (eye icon, right caret) whose hover slides a flyout out to
  the RIGHT of the menu (`left: calc(100% + 10px)`, vertically centred, entering
  from `translateX(-6px)` on the menu's own easings; a 12px `::before` bridge
  spans the gap). The flyout is a horizontal strip on `--surface-1` with a 1px
  hairline, padding 4px, holding the three access levels as text options
  (0.76rem/600, `--text-muted`, hover `--brand`). The active level sits on the
  **flowing thumb** — one absolutely-positioned `--brand` rectangle (inset 4px,
  radius 0) shared by all options, whose `left`/`width` transition on slightly
  offset spring-ish curves (0.5s) so a change of level glides and stretches like
  poured water rather than snapping; option text goes white via a 0.35s color
  fade. Picking a level opens a small confirm modal (`.np-overlay`/`.np-modal`,
  No = `.btn-outline`, Yes = `.btn-primary`); No returns to the pinned-open
  flyout (`.fly-open`), Yes switches instantly, lets the thumb visibly flow,
  then closes the menu after 1.6s. Session-only by contract: no storage, a
  refresh always returns to Super Admin.

### 10.7 Underline tabs (segmented views)

The tab idiom for switching views within a page — text on a shared baseline rule:

```css
.seg      { display: inline-flex; background: transparent; border: none;
            border-bottom: 1px solid var(--border-color); border-radius: 0;
            padding: 0; gap: 1.3rem; }
.seg__btn { display: inline-flex; align-items: center; gap: 7px;
            border: none; background: transparent;
            border-bottom: 2.5px solid transparent; margin-bottom: -1px;
            color: var(--text-muted); font-size: 0.82rem; font-weight: 500;
            padding: 0.4rem 0.1rem 0.5rem; cursor: pointer;
            transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
.seg__btn:hover  { color: var(--text-main); }
.seg__btn.active { color: var(--accent); border-bottom-color: var(--accent);
                   font-weight: 600; }
.seg__btn:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--focus-ring); }
.seg__btn .icon  { width: 15–16px; }
```

The 2.5px blue underline overlaps the 1px gray rule via `margin-bottom: -1px`.
No fills, no boxes — active is color + underline + weight only.

### 10.8 KPI stat cards

`.stat-card` is a `.card` variant on a `repeat(5, 1fr)` grid:

```css
padding: 1.25rem 1.3rem 1.45rem; gap: 1.05rem; min-height: 122px;
display: flex; flex-direction: column;
transform: translateZ(0);   /* own compositing layer: keeps 1px borders crisp
                               in fractional-width grids at HiDPI/zoom */
```

- Label on top (`.stat-label`): 0.66rem / 600 / uppercase / `--track-caps` /
  `--text-muted`; head row `min-height: 1.35rem`.
- Number at the bottom (`.stat-value`): `--font-display` 1.9rem / 700 /
  line-height 1.02 / `--track-heading` / `tabular-nums` / ink. All five cards share
  a baseline so the numbers scan as a row.
- Subline 0.74rem `--text-muted` with optional trend pill: padding
  `0.12rem 0.55rem`, radius `--r-pill`, 0.68rem/600 — up `--green-bg/--green-fg`,
  down `--red-bg/--red-fg`, warn `--amber-bg/--amber-fg`, neutral
  `--surface-3/--text-muted`.
- Inline deltas: 0.9rem/600 colored green/red/muted; in-cell deltas inherit size and
  are set apart by italics alone.
- **Count-up**: on render the number ticks from its last shown value to the new
  one (~0.52s, cubic ease-out, rAF). The true value is stashed on the element,
  never parsed from text; instant under reduced motion and automation.
- No "loud" variant: every KPI card is the same quiet white card. No sparklines
  or other third lines — tried 2026-08-23 and removed same day at the user's
  call; the cards stay label + number only.

### 10.9 Widget cards & the header band

`.card`: white, 1px hairline, radius 0, padding 1.25rem, hover only transitions
border-color. The band is the card's one loud element, full-bleed to the card edge:

```css
.widget-head {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  background: #eaf1ff; color: var(--brand);
  margin: -1.25rem -1.25rem 1.1rem;    /* bleeds over the card padding */
  padding: 0.62rem 1.1rem;
}
.widget-head > span:first-child { font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: var(--track-caps); color: var(--brand); }
.widget-head:hover { background: #ddeafe; }
```

Bands are collapsible: a chevron icon rotates −90° over 0.22s; collapsed, the band is
ALL that remains (`.is-collapsed > *:not(.widget-head) { display: none }`, band
margin-bottom flips to −1.25rem). Standalone group headers reuse the identical band
recipe outside cards.

Section titles NOT in a band: `.section-title` = 0.72rem/700 uppercase
`--track-caps` ink, margin-bottom 1.15rem.

### 10.10 Tables

**Records/data tables** (`.records-table`, `.data-table`) inside a `.table-wrapper`
(`overflow-x: auto; border: 1px solid var(--border-color); border-radius: 0`):

```css
table  { width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left; }
th     { color: var(--text-muted); font-weight: 700; text-transform: uppercase;
         font-size: 0.64rem; letter-spacing: var(--track-caps);
         padding: 0.65rem 1rem; background: var(--surface-2);
         border-bottom: 1px solid var(--border-color);
         position: sticky; top: 0; z-index: 1; }
td     { padding: 0.7rem 1rem; border-bottom: 1px solid var(--border-color);
         color: var(--text-accent); }
tr:last-child td { border-bottom: none; }
tr:hover td { background: var(--surface-2); }
tr.clickable-row:hover td { background: var(--accent-soft); }  /* + cursor:pointer */
```

Emphasized cell text (e.g. a clickable identifier): 500 weight, `--text-main`.

**Primary data table variant** — the app's main record table promotes its header
row to the widget-band treatment and lets it float on the page scroll:

```css
th { background: #eaf1ff; color: var(--accent); z-index: 5;
     transition: box-shadow 0.3s var(--ease-out), border-color 0.3s var(--ease-out); }
/* Floating header: the wrapper must NOT be a scroll container (that traps
   position:sticky), so at desktop widths it is overflow: visible and the th
   pins against the page scroll; narrow widths restore overflow-x: auto and
   give up the float. Chrome insets sticky offsets by the scroll container's
   padding — cancel it (top: -<scroller padding-top>) so the header pins flush. */
table.is-floating th { border-bottom-color: var(--border-strong);
                       box-shadow: 0 10px 14px -12px rgba(3, 3, 3, 0.3); }
```

`.is-floating` is toggled by a scroll listener when the table's top has passed the
scrollport top but its bottom has not. Sticky itself is continuous — detaching and
re-merging read as one fluid motion; the transitioned soft bottom edge is the only
added cue, and it is the system's ONLY use of a drop shadow besides focus rings.

**Pivot/matrix tables** (`.pivot-table`): centered, 0.84rem, full 1px grid borders
on every cell; `th` and row-header cells get `--surface-2` fill, 600 ink; body cells
`--text-accent`, padding `0.68rem 0.7rem` (headers `0.62rem 0.7rem`). Row hover:
`filter: brightness(0.985)`. Totals rows: `--amber-bg` wash, 600 weight (700 on the
label). Fixed-layout variants give every data column equal width and one-line
ellipsis; only the row-header column may wrap. Row labels cap at `max-width: 340px`
with ellipsis; the full value lives on `title=`.

Clickable cells: `cursor: pointer; transition: filter 0.2s` with hover
`filter: brightness(0.95)`. In the Custom Pivot Explorer the drill-down target is
the **whole `<td>`** (`.pv-click` carries the onclick and cursor), never just the
number inside it; the number keeps its dotted underline as the affordance cue.

**Custom Pivot mode toggle** (`.pivot-mode`, right-aligned directly beneath the
Explorer's Filter/Sort pair — 0.8rem below the bar, flush with its right edge): the
same segmented-control idiom as the sidebar's "View as" flyout — a bordered
`--surface-1` strip (4px padding, 2px gap, sharp corners) of flat 0.76rem/600
options with the solid `--brand` thumb gliding under the active one (identical
cubic-bezier pair; active text white, idle `--text-muted`, hover `--brand`).
Options: **Fills** (every fill matching the filters; untagged fills bucket as a
pinned-last "No Issue Tagged" lane on Issue Area axes, Segment axes grow a
Promoter lane) then **Issues** (default — tagged non-promoters only).

Status dots: 7×7px **squares** (radius 0), 6px right margin — red/amber/green solids,
gray = `--border-strong`.

Pagination: centered flex, gap 1rem, `padding: 1.5rem 0 0`, 0.8rem `--text-muted`,
tabular-nums, using outline buttons.

### 10.11 Form controls

**Select / text input (`.control-select`, `.batch-filter-input`):** fields are sharp
rectangles — "a control that holds data reads as a cell of the sheet, not a button":

```css
background: var(--surface-1); border: 1px solid var(--border-color);
color: var(--text-main); padding: 0.4rem 0.7rem; border-radius: 0;
font-size: 0.8rem; font-weight: 500;
/* hover */ border-color: var(--border-strong);
/* focus */ border-color: var(--brand); box-shadow: 0 0 0 3px var(--focus-ring); outline: none;
```

Selects hide the native arrow (`appearance: none; padding-right: 1.9rem`) and paint a
12px data-URI chevron (stroke `#98a1a9`, width 2) at `right 0.6rem center`.
Placeholders: `--text-subtle`. On filter bars, text inputs are fixed-width
(`--fs-text-w: 200px`), numeric inputs 120px, selects `min-width: 148px` with
`padding: 0 1.75rem 0 0.7rem`; ALL at `height: var(--fs-h)` (34px).

**Date fields (dateSkin):** the input pairs with an opaque placeholder overlay
(`.date-ph`): absolutely positioned `left/top/bottom: 1px; right: 1.85rem` (reserving
the icon strip), `--surface-2` fill, 0.8rem/500 `--text-muted`; empty inputs get
`--surface-2` background and transparent datetime text. Min-width 148px (178px wide
variant). The custom calendar popover (`.dk-pop`): fixed-position, 252px wide,
padding 0.6rem, `--surface-1` + hairline, `menu-in 0.18s`. Inside: title 0.78rem/700;
26px square nav buttons; 7-column grid with 2px gaps; weekday header 0.6rem/700
uppercase 0.04em `--text-subtle`; day cells 28px tall, 0.76rem/500 tabular-nums,
transparent 1px border — hover `--accent-soft` bg + `--brand` border; out-month days
`--text-subtle`/400; today `--border-strong` border + 700; selected solid `--brand`,
white, 700. Footer actions are bare text links 0.72rem/600 in `--accent-fg`
(underline on hover), muted variant `--text-muted`.

**selectSkin panel (`.sk-pop`):** replaces every native option list. Fixed-position,
`max-height: min(60vh, 380px)`, padding 0.3rem, `--surface-1` + hairline, no shadow,
`menu-in 0.18s`. Option rows (`.sk-opt`): `0.42rem 0.6rem` padding, 0.82rem/500,
hover `--accent-soft`; selected row is weight 600 with a 14px brand tick.

**Textareas:** same field recipe; modal variants sit on `--surface-2` and flip to
`--card-bg` on focus. Line-height 1.45–1.65. Auto-grow bar textareas pin
`min-height: 32px; max-height: 110px`.

**Checkboxes/radios:** native, `accent-color: var(--brand)`. The custom checkbox
(chart toolbars): 18px box, 1.5px `--border-strong` border; checked = solid
`--brand` fill, white 13px tick at stroke-width 3.

### 10.12 Multi-select widget (`.ms-*`)

- Trigger (`.ms-button`): the field recipe at width 150px, label ellipsized;
  `.active` = `--brand` border + 3px focus ring.
- Menu (`.ms-dropdown`): absolute below (`top: calc(100% + 4px)`), `--surface-1`,
  1px hairline, radius 0, NO shadow, min-width 180px / max-width 280px / max-height
  280px scroll; shows with `menu-in 0.2s`.
- Sticky header row (Select All + ✕): padding `0.5rem 0.7rem`, bottom hairline. The
  ✕ (`.ms-close`) is an 18px transparent round target, `--text-subtle` → hover
  `--surface-3` + ink.
- Item (`.ms-item`): flex, gap 0.5rem, padding `0.42rem 0.7rem`, 0.82rem ink,
  hover `--accent-soft`; brand-accent native checkbox.
- Group heading (`.ms-group`): 0.62rem/600 uppercase `--track-caps`
  `--text-subtle`, non-interactive, top hairline between groups.

### 10.13 Menus, flyouts & popovers

- Filter/Sort menus (`.fs-menu`): **fixed-position, JS-placed** (immune to ancestor
  clipping), width 238px (`--fs-menu-w`), padding 0.3rem, max-height
  `min(70vh, 420px)`. Flyouts (`.fs-fly`): fixed, 222px (`--fs-flyout-w`),
  max-height `min(58vh, 330px)`, opened 6px beside their row, flipping and clamping
  to stay ≥8px inside the viewport.
- Menu head: name only — 0.68rem/700 uppercase 0.04em `--text-muted`, bottom hairline.
- Rows (`.fs-row__btn`): full-width, padding `0.44rem 0.55rem`, 0.8rem/500 ink,
  hover `--accent-soft`; a row whose flyout is open = solid `--accent` fill with
  white text; its chevron rotates 90° over 0.18s.
- Option rows (`.fs-opt`): one design for many-of, one-of and sort directions —
  padding `0.4rem 0.5rem`, 0.8rem/500, hover `--accent-soft`, selected = weight 600 +
  a 12px brand tick (stroke-width 3) in a 15px box. No checkbox chrome.
- Share/header popovers: absolute `top: calc(100% + 8px); right: 0`, width 380px
  (max 78vw), padding 0.85rem, hairline, no shadow, `menu-in 0.22s`. Inner inputs:
  0.75rem on `--surface-2`.
- Tooltips: inverted — `--text-main` background, `--bg-color` text, padding
  `0.45rem 0.65rem`, 0.7rem/500, radius 0, max-width 220px, 5px caret, fade+drop
  over 0.2s. Chart-tool tips: 0.28rem 0.5rem, 0.7rem/600, opacity 0.12s.
- **Dismissal contract (site-wide):** a single capture-phase document click listener
  collects every open overlay with its "zone" = the panel PLUS its trigger; any
  click outside a zone closes that overlay. A menu never closes on clicks inside
  itself, and clicking an open trigger toggles (it never fights its own handler).
  Body-mounted pickers (calendar, select panel) count as inside the control that
  opened them.

### 10.14 Modals

Overlay: fixed inset 0, `rgba(0,0,0,0.5)` + `blur(3px)` (lighter dialogs
`rgba(3,3,3,0.42)` + `blur(2px)`), content centered, padding 1–1.5rem.

Shell: `--card-bg`, 1px hairline, radius 0, no shadow. Small dialog: max-width
400px, padding 1.5rem, `modal-in 0.3s var(--ease-spring)`. Large workflow dialogs:
max-width 780–900px, **fixed height** (`min(88vh, 700px)` or max-height
`min(90vh, 760px)`) — only the body scrolls, so nothing jumps under the cursor.
Anatomy: head `1.35rem 1.6rem` + bottom hairline (title 1.15rem/650 −0.01em, sub
0.82rem muted, 34px ✕ button); body `1.5–1.6rem` scrollable; foot `1.05rem 1.6rem`
+ top hairline on `--surface-1`, note left (0.78rem muted), buttons right
(gap 0.6rem, `margin-left: auto`).

Field labels in modals: 0.68–0.78rem/600 (uppercase variant uses `--track-caps`),
margin-bottom 0.4–0.7rem.

### 10.15 Slide-over panel

```css
.slide-over { position: fixed; top: 0; right: -640px; width: 560px;
              max-width: 100vw; height: 100vh;
              background: var(--card-bg); border-left: 1px solid var(--border-color);
              transition: right 0.4s var(--ease-out); z-index: 1000;
              display: flex; flex-direction: column; box-shadow: none; }
.slide-over.active { right: 0; }
```

Header: `1.25rem 1.75rem`, bottom hairline, title 1.25rem/600 `--track-heading`.
Body: `1.75rem`, scrolls. Backdrop: `rgba(3,3,3,0.42)` + `blur(2px)`, `fade-in
0.25s`. At ≤820px the panel is full-width (`width: 100vw`).

Floating prev/next cluster pinned bottom-center inside the panel (`.snap-nav`):
a pill-of-pills — outer padding 0.35rem, `--surface-1` + hairline; inner buttons
min-width 84px, padding `0.45rem 1rem`, 0.82rem/600, hover = solid `--accent` with
white; disabled opacity 0.4; centered count 0.76rem/600 muted tabular-nums.

### 10.16 Chips & badges

- Neutral tag chip: `--violet-bg`/`--violet-fg` + `--violet-border` (gray), radius
  `--r-pill`, padding `0.18rem 0.6rem`, 0.72rem/600.
- Location/context chip: `--accent-soft` bg, `--brand` text, `#c9d9fa` border.
- Reference chip (e.g. ticket ids): `--cyan-bg`/`--cyan-fg`/`--cyan-border`,
  padding `0.18rem 0.6rem`, 0.78rem/600.
- Status pills: `0.12–0.14rem 0.5rem`, 0.68–0.7rem/600, semantic bg+fg pairs
  (green/red/amber/neutral `--surface-3`).
- Micro-flag: 0.55rem/600 uppercase 0.04em, padding `0.02rem 0.32rem`.
- Title qualifier: not a chip — inline muted text at 1.05rem/500 after the H1.
- Notification dot: 8px square `#FF0000` with a 2px background punch-out ring.
- Applied-filter chips are **text, not controls**: 0.74rem/500 `--text-muted`, no
  border/background/padding, values bolded in ink (weight 650), separated by
  `·` in `--border-strong`; only the ✕ is interactive (0.95rem round target,
  opacity 0.6 → 1 + `--surface-3` on hover). The chips line reserves its height
  (`min-height: 1.25rem`) so applying a filter never shifts the layout.

### 10.17 Toast

```css
.toast { position: fixed; left: 50%; bottom: 28px;
         transform: translateX(-50%) translateY(16px);
         background: var(--text-main); color: var(--bg-color);   /* inverted dark pill */
         padding: 0.65rem 1.25rem; border-radius: var(--r-pill);
         font-size: 0.85rem; font-weight: 500; max-width: 90vw;
         opacity: 0; visibility: hidden; z-index: 11000;
         transition: opacity 0.24s var(--ease-out), transform 0.3s var(--ease-spring); }
.toast.show { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
.toast--error { background: #FF0000; color: #fff; }
```

Undo variant (destructive-but-reversible actions, e.g. a direct tag change): the
same pill plus an inline `Undo` button — transparent, borderless, `--bg-color`
text at 700 weight, underlined with `text-underline-offset: 3px`, margin-left
0.9rem. Window ~6.5s; a later plain toast replaces it, which also revokes the
offer.

### 10.18 Interactive list cards

Rows of clickable record cards: white, 1px hairline, radius 0, padding
`1.1rem 1.25rem`, `margin-bottom: -1px` (collapsed borders). Hover:
`border-color: var(--brand); box-shadow: inset 0 0 0 1px var(--brand); z-index: 2`.
Internal grid: content column + fixed 188px numeric column split by a left hairline;
big count 1.85rem/600 tabular-nums; distribution bar 150×6px flat (radius 0) on
`--surface-3`.

### 10.19 Remarks / quote boxes

- Fixed-height scroll box: `height: 132px; overflow-y: auto`, 1px hairline,
  `--surface-1`, padding `0.65rem 0.8rem`, 0.85rem/1.55. The box never grows with
  the text; the text scrolls inside it. Items separated by inner hairlines.
- Pull-quote: `--surface-2` fill, `border-left: 3px solid var(--brand)`, padding
  `0.6rem 0.8rem`, 0.88rem/1.55 ink.
- One-line notes cell: fixed 160px × one-line box (preview ellipsizes, editing
  textarea keeps `white-space: pre` + hidden overflow), 0.78rem, hover `--surface-2`
  + `--border-strong`, focus brand ring.
- Snapshot Notes editor (2026-08-24): a contenteditable box styled exactly like
  the textarea it replaced (`white-space: pre-wrap`), storing links as
  `[label](url)` markdown. Rendered links: `--accent` ink, underline at 45%
  accent (100% on hover), `text-underline-offset: 2px`; click opens a new tab.
  Link fab: 22px sharp 1px-bordered square pinned to the section's top-right
  (label line); hidden at `opacity 0, translateY(4px) scale(.85)`, shown by a
  class flip straight off `selectionchange` — transitions 0.13s opacity /
  0.18s `cubic-bezier(.22,1,.36,1)` transform, **no delay, no JS debounce**.
  Link bar: slides down between editor and Save row (`max-height` 0→44px +
  opacity + translateY(-4px), 0.16–0.18s), holding a 30px input (brand focus
  ring; invalid = red border pulse), a pill Apply (accent, mirrors Save), and a
  30px sharp ✕ ghost. ⌘/Ctrl+K opens it; Enter applies; Esc closes.

### 10.20 Loading & empty states

- First load (dashboard): a **skeleton** in the page's real layout — five
  `.sk-card` placeholders (label bar + bottom-pinned number bar) on the
  `.grid-5` plus one `.sk-widget` block, all sharp-cornered on `--card-bg` with
  1px hairlines. Shimmer = a translateX sweep of a white gradient over
  `--surface-2` bars (`sk-sweep 1.4s infinite`; static under reduced motion).
  **No visible text** — when the structure is known, the structure is the
  loading message (NN/g); an `.sk-sr` visually-hidden status serves screen
  readers, and the static `#loading` markup is the skeleton too so nothing
  else ever flashes first. The retry/error path overwrites the same container
  with its message + retry countdown. Labeled spinners stay the right choice
  for short LOCAL fetches (e.g. Billing), and explanatory empty states
  ("Data is still loading… open this tab again in a moment") for tabs that
  depend on data still arriving.
- Spinner (elsewhere): 16px circle, `border: 2px solid var(--border-color); border-top-color:
  var(--brand)`, `patspin 0.7s linear infinite`; larger 34px / 3px variant for page
  blocks. Loading row: centered flex, gap 0.6rem, `--text-muted`, 500.
- Empty states: centered text, `padding: 2.5–3rem 1rem`, 0.85–0.9rem `--text-muted`.
- Progress bar: 8px tall, `--surface-3` track, `--brand` fill, width transition
  `0.5s cubic-bezier(.4,0,.2,1)`; indeterminate = 32% slab sweeping
  `1.3s ease-in-out infinite`.
- Privacy/reveal walls: content blurred `blur(9px)` at opacity 0.55 behind a
  centered card on a 45%-transparent scrim with `blur(3px)`.

---

## 11. Layout & UX principles

1. **Fixed sidebar + single scroll area.** 232px sidebar (right hairline), main
   content is the only vertical scroller. Views animate in with `view-in 0.38s`.
2. **Page header:** title left (H1 1.55rem + optional muted subtitle 0.85rem
   0.3rem below), actions right (`gap: 1rem`), `align-items: flex-end`,
   closed by a 1px bottom hairline (`padding-bottom: 1rem; margin-bottom: 1.3rem`).
3. **The filter-bar contract (every view):** inputs read left-to-right from the left
   edge; the two actions (Filter, Sort) are anchored to the top-right corner via
   `margin-left: auto` — *the corner belongs to Filter and Sort, nothing else*.
   Secondary actions (Export, Refresh…) get their OWN right-aligned line below
   (`.fs-subtail`: `margin: -0.35rem 0 0.6rem; gap: 0.5rem`), so a growing control
   can never displace them. Below that, the applied-filters line (height reserved),
   then a closing hairline (`margin: 0.85rem 0 1.1rem`). Every control: 34px tall,
   0.8rem, 0.5rem gaps. Fixed widths, never stretched — leftover space stays empty.
   A filter a view cannot act on is REMOVED, not greyed.
4. **Blue = active, everywhere.** Selected nav row, active tab underline, open
   trigger border, checked tick, solid option row, selected calendar day — always
   `#004ce6`, never a second accent.
5. **Labels live inside controls.** A select's first option carries its label
   ("Program", "Month"); no external field labels on bars. Explanations go on
   `title=` tooltips, not helper text.
6. **Tonal information hierarchy:** ink → `#3d444d` → `#667079` → `#98a1a9`; caps
   micro-labels mark structure; numbers are tabular.
7. **Nothing shifts as a side effect.** Chips lines reserve height; modal shells are
   fixed-height; option clusters reserve their widest footprint; menus are
   fixed-positioned and clamped to the viewport.
8. **Mobile (≤820px):** sidebar becomes a fixed drawer (`transform:
   translateX(-100%)` → `.open` translates in over 0.32s) under a
   `rgba(3,3,3,0.4)` blurred scrim; a sticky topbar appears (padding
   `0.65rem 1rem`, bottom hairline, hamburger `.icon-btn` + 28px logo). Grids
   collapse 5→3→2 columns (breakpoints 1100 / 820 / 520px); right-anchored action
   clusters return to the flow ≤720px.
9. **Print:** only the active detail panel prints — everything else
   `visibility: hidden`; buttons hidden; accordions expanded; page-break-inside
   avoided on cards.
10. **Density widgets:** two-axis scrolling lives inside cards
    (`max-height: 78vh; overflow: auto`) with sticky `th` — the page never scrolls
    sideways.

---

## 12. Rules — do / don't

**Do**
- Set `border-radius: 0` on every surface AND every button; route shape through the
  four radius tokens (`--r-sm/md/lg/pill`), all `0px`.
- Use `#004ce6` as the single action/brand color; `#eaf1ff` bands (hover `#ddeafe`)
  with blue uppercase 0.72rem/700 `--track-caps` labels are the one sanctioned area
  of blue surface.
- Separate everything with 1px `#e5e7eb` hairlines; escalate to `#c9cfd6` or ink on
  hover.
- Keep every filter-bar control at 34px (`--fs-h`) and 0.8rem (`--fs-font`).
- Give every keyboard focus a visible cue: `box-shadow: 0 0 0 3px
  rgba(0,76,230,0.16)` (+ brand border), or `outline: 2px solid var(--brand);
  outline-offset: -3px` inside composite pills. `:focus-visible` only — mouse
  clicks never ring.
- Press every button down 1px while held (`translate: 0 1px`).
- Use `font-variant-numeric: tabular-nums` on every count, date value, and metric.
- Reserve red/amber/green (`#FF0000`/`#FFC000`/`#00B050`) strictly for meaning;
  darken amber text to `#b98b00` for contrast on white.
- Use the inverted dark pill (`#030303` bg, white text) for toasts and tooltips.
- Animate popovers in with `menu-in` (0.18–0.22s ease-out), modals with `modal-in`
  (0.3s spring), views with `view-in` (0.38s ease-out).
- Honor `prefers-reduced-motion` by collapsing all durations to 0.01ms.
- Put full values in `title=` tooltips and ellipsize the cell — never wrap a row
  label into a paragraph.

**Don't**
- Don't add box-shadows for elevation — every shadow token is `none`. The only
  rings are focus and the 1px inset brand hover outline.
- Don't introduce a second accent color, gradients, or colored surfaces beyond the
  `#eaf1ff` band and the semantic triads.
- Don't use radii between 1px and 999px: the shape language is binary — 0px for
  everything, 999px/50% only for micro count-dots, chip ✕ targets, spinners, and
  the one floating action button.
- Don't let native OS widgets show: selects, option lists, calendars, checkboxes
  and scrollbars are all skinned (custom chevrons, `.sk-pop`, `.dk-pop`,
  `accent-color`, 9px square scrollbars).
- Don't grey-out a filter a view can't use — remove it. (Exception: a dependent
  control that becomes valid after a sibling choice may sit at opacity 0.42–0.45,
  `pointer-events: none`.)
- Don't let a control move as a side effect of using it — reserve the space.
- Don't put clearing inside a menu: Clear is the red right half of the Filter pill,
  visible exactly when there is something to clear.
- Don't style state chips as buttons — applied-filter chips are plain muted text;
  only their ✕ looks interactive.
- Don't use emoji in UI chrome; icons are 24-viewBox line SVGs at stroke 1.5
  (icons) / 2 (data-URI glyphs), round caps and joins, `currentColor`.
- Don't center body paragraphs, and don't let a table force the page to scroll
  horizontally — wide content scrolls inside its own bordered wrapper.
- Don't decorate loading: one 2px-border brand-top spinner, 0.7s linear.
