# SVGA Book Bank System — Design Brief

## Purpose & Context
Library management platform enabling students to search, request, and receive books from SVGA's collection via wizard-based onboarding and admin dashboard for book fulfillment. Institutional, trustworthy, editorial.

## Tone
Clean, professional, refined. Educational institution context. Modern SaaS editorial aesthetic with breathing space and hierarchical typography. Functional color usage, never decorative. Light theme only.

## Color Palette (OKLCH, Light Mode Only)
| Name | OKLCH | Usage |
| --- | --- | --- |
| Background | 0.97 0.015 210 | Page background, content zones |
| Foreground | 0.18 0.025 230 | Primary text, high contrast |
| Primary | 0.62 0.15 210 | Buttons, CTAs, links, active states |
| Secondary | 0.94 0.04 210 | Subtle backgrounds, tabs, muted UI |
| Accent | 0.88 0.06 200 | Highlights, bold accents (sparingly) |
| Muted | 0.96 0.02 210 | Disabled, placeholders, light zones |
| Border | 0.9 0.03 210 | Inputs, dividers, subtle edges |
| Destructive | 0.62 0.2 25 | Errors, delete actions |
| Success | 0.7 0.12 160 | Availability, approved, positive states |
| Status-Issued | 0.62 0.15 210 | Book issued status |
| Status-Reserved | 0.72 0.15 65 | Book reserved status |
| Status-Procurement | 0.65 0.18 35 | Procurement request status |
| Status-Overdue | 0.62 0.2 25 | Overdue return alerts |
| Navbar-Bg | 0.25 0.08 250 | Header navigation, deep blue |

## Typography
| Role | Font | Use |
| --- | --- | --- |
| Display | General Sans | Headers, titles, labels, wizard steps, profile cards |
| Body | DM Sans | Paragraphs, form fields, tables, body text |
| Mono | Geist Mono | Student IDs, book numbers, codes, reference values |

## Shape Language
Border radius: `0.75rem` cards, `0.375rem` inputs, `1.5rem` buttons. Subtle shadows via CSS custom properties: `shadow-elevated` (0 4px 20px sky-blue / 0.1), `shadow-subtle` (0 1px 3px black / 0.05), `shadow-warm` (0 8px 32px sky-blue / 0.14).

## Structural Zones
| Zone | Treatment |
| --- | --- |
| Navbar | Deep blue background (0.25 0.08 250), white text, sticky top, professional institutional tone |
| Page Background | Very light blue-tinted white (0.97 0.015 210) |
| Main Content | White cards with subtle shadows, 20px padding, responsive grid |
| Wizard Progress | Numbered badges (primary blue), progress bar, step transitions fade 0.2s |
| Form Inputs | Light blue border (0.93 0.025 210), soft focus ring (primary blue), placeholder muted |
| Footer | Muted background, border-top, centered text |
| Admin Dashboard | Grid of stat cards (10 key metrics), collection queue, return timeline sorted by urgency |
| Student Dashboard | Profile card with photo, ID, full name, issued books, return dates, request history |
| Admin Requests | Per-book approve/reject buttons, unavailable books show current holder and return date |
| Admin Students | Searchable database with edit pencil per student, in-place field editing |

## Spacing & Rhythm
8px grid baseline. Varied density: compact form spacing (8–12px gaps), airy card spacing (16–24px), generous internal padding (20px). Breathing room between sections (32–48px vertical margins). Never cramped.

## Component Patterns
- **Card**: white background, subtle shadow, 20px padding, responsive grid layout
- **Button**: primary (blue bg, white text), secondary (muted bg, dark text), outline (border, transparent), sizes sm/md/lg
- **Input**: light border, soft focus ring (primary blue), clear placeholder text
- **Badge**: rounded, colored by status (issued=blue, reserved=orange, procurement=brown, overdue=red, success=green)
- **Wizard Step**: numbered badge + label, progress bar beneath, fade-in transition 0.2s
- **Request Card**: student photo, name, ID, request date, per-book decision options
- **Table**: striped rows (muted/20 background), responsive wrap on mobile, monospace IDs/codes
- **Status Timeline**: color-coded urgency (red=overdue, yellow=soon, green=ok), left border accent, sorted by date

## Motion
Smooth Framer Motion animations. Transitions: 0.2s ease-out default. Focus states: 0.2s color transition. Wizard step transitions: fade-in 0.2s. Loading states: gentle pulse (no spinners, pure CSS). No animations at rest. Respects `prefers-reduced-motion`.

## Notification System
Website notifications for key events: registration success, book approval, book rejection, reservation created, book ready, return reminders, course completion, year promotion. Email and WhatsApp integration prepared (real delivery requires paid providers).

## Constraints
- Light theme only (no dark mode)
- No generic Bootstrap blue or Tailwind default shadows
- OKLCH values only (never hex, rgb, or color function mixing)
- Institutional tone, never playful or casual
- 4.5:1 WCAG contrast ratio on all text
- Mobile-first responsive design
- No gradient overuse; use layers and background color variation for depth
- Card-based layouts with breathing space

## Signature Details
Soft card-based layouts with deliberate depth through shadows and background color variation. Breathing space between elements. Editorial typography hierarchy (General Sans display for authority, DM Sans body for clarity). Professional navbar in deep institutional blue. Functional color usage: blue for actions, green for success, red for warnings. Status badges with OKLCH color system. Smooth transitions and motion orchestration. Responsive grid that stacks cleanly on mobile.
