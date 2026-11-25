---
name: Public Facility & Asset Operations
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2f1500'
  on-tertiary-container: '#c76c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#ffffff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  status-received: '#64748b'
  status-in-progress: '#2563eb'
  status-sla-warning: '#d97706'
  status-resolved: '#16a34a'
  status-critical: '#dc2626'
  card: '#ffffff'
  muted: '#f1f5f9'
  border: '#e2e8f0'
  input: '#e2e8f0'
  foreground: '#090d16'
typography:
  display-hero:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-clarity operational framework tailored for public infrastructure monitoring, IT asset governance, and fast-response incident handling. The interface projects accountability, institutional precision, and uncompromising functional calm. It avoids decorative extravagance in favor of a clean, structured workspace where critical metrics, service level agreements (SLAs), and issue resolutions surface immediately.

The visual direction follows **Corporate / Modern** principles rooted in the `shadcn/ui` neutral paradigm:
- **Calm, High-Information Density:** White surfaces, subdued cool-gray borders, and disciplined spacing eliminate eye fatigue during extended operational shifts.
- **Semantic Restraint:** High-saturation chromatic accents are strictly quarantined to priority alerts, lifecycle statuses, and decisive primary user actions.
- **Immediate Hierarchy:** Content naturally guides the eye through responsive breadcrumbs, critical counters, dynamic telemetry, and tabular incident logs without requiring decorative elevation or deep drop shadows.

## Colors

The palette utilizes an intentional neutral scale anchored by deep slate (`#0f172a`) as the primary interactive driver and slate neutrals (`#64748b`, `#e2e8f0`, `#ffffff`) for surfaces and structural framing.

### Semantic Status & Priority Rules
Color is never used as the sole conveyor of incident state. Every visual status must accompany clear descriptive text:
- **접수 (Received / Unassigned):** Neutral Slate (`#64748b`) with a muted cool-gray background.
- **조치 중 (In Progress):** Focused Signal Blue (`#2563eb`) indicating active investigation.
- **SLA 임박 (SLA Approaching):** Warm Amber (`#d97706`) signaling imminent breach risk.
- **완료 (Resolved):** Balanced Emerald Green (`#16a34a`) denoting successful closure.
- **긴급 / 기한 초과 (Critical / Overdue):** Uncompromising Crimson (`#dc2626`) demanding immediate intervention.

### Surface & Border Logic
Surfaces remain predominantly pure white (`#ffffff`) or subtle gray tint (`#f1f5f9`) for alternating rows and table headers. Structural separation relies on `1px` solid borders (`#e2e8f0`). Decorative gradients are prohibited; chart fills are restricted to single-hue low-opacity (8–12%) area masks.

## Typography

The design system relies on **Geist Sans** across all interface layers to deliver technical legibility and neutral authority. 

### Tabular Numbers & Identification Codes
Incident reference numbers (`#INC-2024-0891`), asset IDs (`FAC-HVAC-014`), timestamps, and metric counts must enforce tabular figure alignment via OpenType feature settings (`font-variant-numeric: tabular-nums`). This prevents horizontal jitter during asynchronous polling and real-time updates.

### Hierarchy & Content Roles
- **Display Metric (28px / 600):** Exclusively reserved for summary card counters and high-level KPI tallies.
- **Page Titles (24px / 600):** Primary dashboard view headings and modal titles.
- **Section Titles (18px / 600):** Card cluster headers, chart captions, and data table block anchors.
- **Body Standard (14px / 400):** Primary incident descriptions, data table row values, and input fields.
- **Control Labels & Badges (13px & 12px / 500):** Form labels, table headers, filter trigger chips, and status badge labels.

## Layout & Spacing

A strict **4px modular grid** guides vertical rhythm, element padding, and dimensional alignments across all viewport configurations.

### Grid Architecture & Breakpoints
- **Desktop (≥ 1024px):** Fixed 240px collateral navigation sidebar paired with a fluid 12-column content container capped at `1440px`. Column gutters measure `24px` (`gutter-desktop`) with outer canvas padding set to `32px` (`margin-desktop`).
  - Top Summary Cards: 4 equal spans (3 columns each).
  - Main Body: 8-column primary telemetry/table view accompanied by a 4-column contextual SLA/audit rail.
- **Tablet (640px – 1023px):** Collapsible sidebar rail (64px icon view or overlay drawer), `16px` gutters, and `24px` outer canvas margins. Summary cards stack into a 2x2 matrix.
- **Mobile (< 640px):** Full-bleed single-column vertical flow with a slide-out hamburger drawer, `16px` outer gutters, and stacked full-width summary blocks.

### Component Spacing Rhythms
- **Icon to Label:** `8px` (`space-sm`).
- **Input Padding:** `8px 12px` (vertical/horizontal).
- **Card Interior:** `16px` to `20px` uniform padding.
- **Section Gap:** `24px` to `32px` between disparate visual modules.

## Elevation & Depth

Visual separation relies on a **flat, bordered tonal layout** rather than aggressive multi-tiered drop shadows, upholding the clean operational spirit of `shadcn/ui`.

### Surface Hierarchy
1. **Canvas Layer (`--background` #ffffff):** Root application canvas.
2. **Structural Layer (`--card` #ffffff with 1px `--border` #e2e8f0):** Summary KPI tiles, chart wrappers, and incident tables sit directly on the canvas without default elevation shadows.
3. **Muted Layer (`--muted` #f1f5f9):** Table header strips, striped alternate rows, inactive chip controls, and disabled button baselines.
4. **Transient Floating Overlays (Popovers, Select Menus, Drawers, Modals):**
   - **Border:** 1px solid `#e2e8f0`.
   - **Shadow:** Restrained, diffused ambient drop shadow (`0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`).
   - **Backdrop:** Low-contrast modal veil (`rgba(15, 23, 42, 0.4)` with `backdrop-filter: blur(2px)`).

## Shapes

The interface embraces a structured, modern corner geometry calibrated at level `2` (`0.5rem` / `8px` default radius) to achieve balanced utility without excessive roundness:

- **6px (`rounded-sm`):** Interactive mini badges, table row checkbox containers, and compact icon buttons.
- **8px (`rounded-md`):** Standard input fields, search toolbars, action buttons, dropdown trigger selects, and popover menus.
- **12px (`rounded-lg` / `rounded-xl`):** Primary analytical cards, summary counter containers, data table shells, and modal dialog sheets.
- **9999px (`rounded-full`):** State indicator badges, SLA countdown pills, and avatar badge initials.

## Components

### Buttons
- **Primary:** Dark Slate background (`#0f172a`), white label, 8px radius, 36px standard height (`44px` mobile). Used exclusively for irreversible actions, new ticket dispatches (`장애 신고`), and workflow commits (`조치 완료`).
- **Secondary / Outline:** Pure white background, 1px border (`#e2e8f0`), hover tint (`#f1f5f9`). Used for filters, table pagination, and CSV data export.
- **Destructive:** Crimson border and tint (`#fee2e2` bg, `#dc2626` text) used for urgent escalations and deletion confirmations.

### Status Badges & Pills
Status indicators feature full pill curvature (`rounded-full`), `12px` medium text, and unified two-tone styling (10% tint background + 100% solid text border):
- **접수 (Received):** Neutral Slate (`bg-slate-100 text-slate-700 border-slate-200`).
- **조치 중 (In Progress):** Signal Blue (`bg-blue-50 text-blue-700 border-blue-200`).
- **SLA 임박 (SLA Approaching):** Warning Amber (`bg-amber-50 text-amber-800 border-amber-200`).
- **완료 (Resolved):** Success Green (`bg-emerald-50 text-emerald-700 border-emerald-200`).
- **긴급 / 기한 초과 (Critical / Overdue):** Alert Red (`bg-red-50 text-red-700 border-red-200`).

### Incident Data Table
- **Header:** Sticky top, height 40px, neutral muted background (`#f8fafc`), uppercase/bold 12px label typography with sorting arrows.
- **Row Heights:** Compact 48px baseline to maximize scanning efficiency. Active/selected row features a 1px primary left border accent with subtle `#f1f5f9` fill.
- **Cell Content:** Tabular incident IDs, dual-stacked location/equipment titles, separate badges for Priority and Status, and live tabular SLA countdown tickers.

### Summary KPI Cards
- Contained within `12px` rounded cards bordered with `#e2e8f0`.
- Display structure: 13px muted category label (`전체 접수`, `미처리`, `SLA 임박`), followed by a prominent 28px numeric readout, paired with comparative micro-copy (e.g., `전주 대비 +3건`).

### Input Fields & Controls
- Standard height: 36px desktop, 44px mobile.
- Inactive state: 1px border (`#e2e8f0`), white background, 14px text.
- Focus state: Ring outline (`2px` solid `#0f172a` offset by `2px` white space) eliminating default browser glow.
- Inline validation: Field-level error micro-text placed directly below the field in crimson (`#dc2626`).