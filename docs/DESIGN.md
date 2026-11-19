# Design System & UI Specifications (DESIGN.md)

## 0. Paper Design System Canvas
- **Paper File:** [Equip Design System](https://app.paper.design/file/01M7RYX0QD7C1FN7S8PDT15AG2/p-1-0) (File ID: `01M7RYX0QD7C1FN7S8PDT15AG2`)
- **Tokens Configured:** 34 Design Tokens (Colors, Spacings, Radii, Font Sizes, Font Families).
- **Artboards Created:**
  1. `Design System & Foundations` (1440 × 1080px): Brand colors, typography scale, buttons, form inputs, status badges, and Participant ID Pass card.
  2. `Mobile: Registration & Pass` (390 × 844px): Native mobile registration confirmation view with Apple status bar, high-contrast unique ID card (`EQ-82914`), and 5-session schedule preview.
  3. `Desktop: Admin & Attendance Dashboard` (1440 × 1050px): Full administrative workspace modeled after the modern card & sidebar layout (Donezo style), with dark forest green stat card, 5-session attendance pillar charts, church delegation breakdown, live attendee table, turnout gauge, and session timer.

---

## 1. Design Principles (Impeccable UI)
- **Clarity & Dignity:** A warm, clean, reverent, and professional aesthetic suitable for a church leadership programme.
- **Mobile-First Responsiveness:** Over 85% of registrations will occur on mobile devices. Large touch targets (min 44px), legible input fields, and zero horizontal scrolling.
- **Immediate Reassurance:** Clear visual badges, high-contrast unique ID cards, and instantaneous feedback for form validation and attendance check-in.

## 2. Typography
- **Primary Font Family:** System font stack (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`) for crisp rendering without blocking network font downloads.
- **Scale:**
  - Page Titles / Headings: `text-2xl` to `text-3xl` font-semibold / font-bold.
  - Section Headers: `text-lg` to `text-xl` font-medium.
  - Form Labels & Body: `text-sm` to `text-base` font-normal.
  - Helper & Badge Text: `text-xs` font-medium.
  - Participant ID Display: Monospaced / tabular font (`font-mono tracking-widest text-xl font-bold`).

## 3. Brand Identity & Color Palette (Equip 3.0 Logo)

The color system directly reflects the official **Equip 3.0** logo emblem:

- **Primary Brand Accent (Vibrant Lime / Leaf Green):**
  - Hex: `#84CC16` (Lime-500) / `#A3E635` (Lime-400)
  - Meaning: Growth, vitality, impartation, and spiritual equipment.
  - Usage: Primary CTAs, active highlights, badge accents, Unique ID emphasis.
- **Secondary Grounding (Deep Forest / Emerald Green):**
  - Hex: `#065F46` (Emerald-800) / `#047857` (Emerald-700)
  - Meaning: Stability, depth, and ministerial authority.
  - Usage: Secondary buttons, dark accents, footer/border anchors.
- **Foundation / Dark Charcoal (Logo Backdrop):**
  - Hex: `#0B0F17` (Deep Charcoal 950) / `#0F172A` (Slate-900)
  - Usage: Contrasting dark hero bars, top navigation, high-contrast dark badges.
- **Surfaces & Neutrals:**
  - Public Background: `#F8FAFC` (Clean off-white)
  - Card Surfaces: `#FFFFFF` (White)
  - Borders: `#E2E8F0` (Slate-200)
  - Text Primary: `#0F172A` (Slate-900)
  - Text Muted: `#64748B` (Slate-500)
- **Status & Feedback:**
  - Confirmed / Checked In: `#059669` (Emerald-600) with `#ECFDF5` background.
  - Warning / Pending: `#D97706` (Amber-600) with `#FFFBEB` background.
  - Error: `#DC2626` (Red-600) with `#FEF2F2` background.

## 4. Components & Interactions
### Public Form Elements
- **Input Fields:** Generous padding (`py-3 px-4`), clear labels placed above inputs, inline error messages with accessible `aria-describedby`.
- **Primary Buttons:** High-contrast, full-width on mobile, subtle active scale effect, with disabled state and loading spinner during submission.
- **Participant ID Confirmation Card:**
  - Prominent container with dashed or distinct border.
  - Bold, copyable unique ID.
  - Clear "Save this ID" or "Screenshot this confirmation" callout.

### Admin Dashboard Elements
- **Search Header:** Persistent search bar with live filtering by name, phone, or ID.
- **Attendance Session Switcher:** Tabbed or button-group selector for the 5 sessions (Mon AM, Mon PM, Tue AM, Tue PM, Wed PM).
- **Roster Table / Cards:** Table view on desktop, clean touch cards on mobile with single-tap check-in buttons (`Check In` / `Checked In`).
