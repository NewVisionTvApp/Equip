# Design System & UI Specifications (DESIGN.md)

## 0. Paper Design System Canvas
- **Paper File:** [Equip Design System](https://app.paper.design/file/01M7RYX0QD7C1FN7S8PDT15AG2/p-1-0) (File ID: `01M7RYX0QD7C1FN7S8PDT15AG2`)
- **Tokens Configured:** 32 Design Tokens (Colors, Spacings, Radii, Font Sizes, Font Families).
- **Artboards Created:**
  1. `Design System & Foundations` (1440 × 1080px): Brand colors, typography scale, buttons, form inputs, status badges, and Participant ID Pass card.
  2. `Mobile: Registration & Pass` (390 × 844px): Native mobile registration confirmation view with Apple status bar, high-contrast unique ID card (`EQ-82914`), and 5-session schedule preview.

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

## 3. Color Palette
- **Primary / Brand:**
  - Deep Navy / Indigo: `#1E293B` (slate-800) to `#0F172A` (slate-900) - provides grounded authority and calm readability.
  - Accent / Action: `#2563EB` (blue-600) / Hover `#1D4ED8` (blue-700) - primary action buttons and active indicators.
- **Backgrounds:**
  - Public Background: `#F8FAFC` (slate-50) with white surface cards (`#FFFFFF`).
  - Subtle borders: `#E2E8F0` (slate-200).
- **Status & Feedback:**
  - Success / Confirmed: `#059669` (emerald-600) / Light emerald background `#ECFDF5`.
  - Attention / Pending: `#D97706` (amber-600) / Light amber background `#FFFBEB`.
  - Error: `#DC2626` (red-600) / Light red background `#FEF2F2`.

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
