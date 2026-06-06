# Sunlit Apothecary — Design System v1.0
> Roots & Leaves • Natural Hair Care E-Commerce

---

## 1. Color Palette

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `--color-bg` | `#FAF9F6` | 40 33% 97% | Page backgrounds (Sunlit Vellum) |
| `--color-surface` | `#F0E6D9` | 30 42% 89% | Cards, sidebars, modals (Warm Cream) |
| `--color-text` | `#4A3525` | 20 35% 22% | Primary headings & body (Deep Espresso) |
| `--color-muted` | `#8B7355` | 28 25% 44% | Secondary text, descriptions |
| `--color-cta` | `#B37943` | 28 47% 48% | Buttons, links, active (Burnished Amber) |
| `--color-cta-hover` | `#96612F` | 25 52% 39% | CTA hover / pressed |
| `--color-accent` | `#E5C492` | 35 62% 74% | Borders, dividers (Golden Luster) |
| `--color-accent-20` | `#E5C49233` | — | Subtle borders at 20% opacity |
| `--color-success` | `#5B8C5A` | 119 22% 45% | Success states |
| `--color-error` | `#C44536` | 6 55% 49% | Error, destructive |
| `--color-warning` | `#D4A843` | 42 62% 55% | Warning states |

### Semantic Aliases
```css
--color-primary: var(--color-cta);
--color-primary-hover: var(--color-cta-hover);
--color-danger: var(--color-error);
--color-card-bg: var(--color-surface);
--color-input-bg: color-mix(in srgb, var(--color-surface) 50%, var(--color-bg));
--color-focus-ring: color-mix(in srgb, var(--color-cta) 30%, transparent);
```

### Forbidden Colors
- ❌ Pure white `#FFFFFF` — Always use `#FAF9F6`
- ❌ Pure black `#000000` — Always use `#4A3525`
- ❌ Tailwind grays (`gray-100`..`gray-900`) — Use palette tokens
- ❌ Cool blues/greens as primary — Brand is warm only

---

## 2. Typography

### Font Stack
```css
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700&display=swap');

--font-heading: 'Lora', Georgia, 'Times New Roman', serif;
--font-body: 'Raleway', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale

| Token | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| `--text-hero` | `clamp(2.5rem, 5vw, 4rem)` | 700 | Heading | Hero headlines |
| `--text-h1` | `2.25rem` (36px) | 700 | Heading | Page titles |
| `--text-h2` | `1.875rem` (30px) | 600 | Heading | Section headers |
| `--text-h3` | `1.25rem` (20px) | 600 | Heading | Card titles |
| `--text-h4` | `1rem` (16px) | 600 | Heading | Subsections |
| `--text-body` | `0.9375rem` (15px) | 400 | Body | Paragraphs |
| `--text-sm` | `0.8125rem` (13px) | 400 | Body | Secondary text |
| `--text-xs` | `0.6875rem` (11px) | 600 | Body | Labels, badges |
| `--text-caption` | `0.625rem` (10px) | 700 | Body | Uppercase captions |

### Line Heights
```
Headings: 1.2
Body: 1.6
Compact (UI): 1.4
```

### Letter Spacing
```
Headings: -0.02em (tight)
Body: 0
Uppercase labels: 0.12em (wide)
Overline captions: 0.2em (extra-wide)
```

---

## 3. Spacing System

### Base Unit: `4px`

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--space-1` | `4px` | `p-1` | Inline micro gaps |
| `--space-2` | `8px` | `p-2` | Icon padding, tight gaps |
| `--space-3` | `12px` | `p-3` | Button internal padding |
| `--space-4` | `16px` | `p-4` | Card padding (mobile) |
| `--space-5` | `20px` | `p-5` | Form field spacing |
| `--space-6` | `24px` | `p-6` | Card padding (desktop) |
| `--space-8` | `32px` | `p-8` | Section internal padding |
| `--space-10` | `40px` | `p-10` | Dashboard content padding |
| `--space-12` | `48px` | `p-12` | Section vertical padding (mobile) |
| `--space-16` | `64px` | `p-16` | Section vertical padding (desktop) |
| `--space-20` | `80px` | `p-20` | Hero vertical padding |
| `--space-24` | `96px` | `p-24` | Major section breathing room |

### Responsive Padding Pattern
```
Container: px-4 sm:px-6 lg:px-8
Section vertical: py-12 sm:py-16 lg:py-20
Card internal: p-4 sm:p-6
Max-width: max-w-7xl (1280px)
```

---

## 4. Shadow Depths

Four elevation levels using warm-tinted shadows:

| Level | Token | CSS Value | Usage |
|-------|-------|-----------|-------|
| **Rest** | `--shadow-sm` | `0 1px 2px rgba(74,53,37, 0.04)` | Default card state |
| **Raised** | `--shadow-md` | `0 4px 12px rgba(74,53,37, 0.06)` | Hovered cards, dropdowns |
| **Floating** | `--shadow-lg` | `0 12px 32px rgba(74,53,37, 0.08)` | Modals, popovers |
| **Dramatic** | `--shadow-xl` | `0 24px 48px rgba(74,53,37, 0.12)` | Hero overlays, featured |

### CTA Shadow (Amber Glow)
```css
--shadow-cta: 0 4px 14px rgba(179,121,67, 0.25);
--shadow-cta-hover: 0 6px 20px rgba(179,121,67, 0.35);
```

### Inner Glow (Input Focus)
```css
--shadow-focus: 0 0 0 3px rgba(179,121,67, 0.15);
```

---

## 5. Border Radii

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--radius-sm` | `8px` | `rounded-lg` | Badges, tags, small pills |
| `--radius-md` | `12px` | `rounded-xl` | Inputs, small cards |
| `--radius-lg` | `16px` | `rounded-2xl` | Buttons, cards |
| `--radius-xl` | `24px` | `rounded-3xl` | Hero cards, modals |
| `--radius-full` | `9999px` | `rounded-full` | Avatars, pills |

---

## 6. Component Specs

### 6.1 Buttons

#### Primary Button (CTA)
```
Background:    #B37943
Text:          #FAF9F6
Border:        none
Border-radius: 16px (rounded-2xl)
Padding:       14px 32px (py-3.5 px-8)
Font:          DM Sans 600, 14px, uppercase, tracking: 0.08em
Shadow:        var(--shadow-cta)
Transition:    all 300ms cubic-bezier(0.4, 0, 0.2, 1)

Hover:         background #96612F, shadow var(--shadow-cta-hover), translateY(-1px)
Active:        scale(0.98), shadow var(--shadow-sm)
Disabled:      opacity 0.5, cursor not-allowed
Focus:         ring 3px rgba(179,121,67, 0.3)
Loading:       spinner + "Processing..." text, disabled
```

#### Secondary Button (Outlined)
```
Background:    transparent
Text:          #B37943
Border:        1.5px solid #E5C492
Border-radius: 16px
Padding:       14px 32px
Font:          DM Sans 600, 14px, uppercase, tracking: 0.08em
Shadow:        none
Transition:    all 250ms ease

Hover:         background #F0E6D9, border-color #B37943
Active:        scale(0.98)
Focus:         ring 3px rgba(179,121,67, 0.15)
```

#### Ghost Button (Text)
```
Background:    transparent
Text:          #8B7355
Border:        none
Padding:       8px 16px
Font:          DM Sans 500, 14px

Hover:         text #B37943, background rgba(179,121,67, 0.06)
```

#### Danger Button
```
Background:    #C44536
Text:          #FAF9F6
Hover:         #A33829
Shadow:        0 4px 14px rgba(196,69,54, 0.25)
```

#### Button Sizes

| Size | Padding | Font Size | Height |
|------|---------|-----------|--------|
| `sm` | `8px 16px` | `12px` | `32px` |
| `md` | `12px 24px` | `14px` | `40px` |
| `lg` | `14px 32px` | `14px` | `48px` |
| `xl` | `16px 40px` | `16px` | `56px` |

---

### 6.2 Cards

#### Product Card
```
Background:    transparent → hover: #F0E6D9
Border:        1px solid rgba(229,196,146, 0.2)
Border-radius: 24px (image), 0 (text area)
Shadow:        var(--shadow-sm) → hover: var(--shadow-md)
Transition:    all 500ms ease
Padding:       0 (image fills), 4px horizontal (text)

Image:         aspect-ratio 4/5, object-fit cover
               hover: scale(1.03) over 700ms
Category badge: bg #FAF9F6/95, text #4A3525, 9px uppercase
Price:         DM Sans 500, #B37943
Name:          Playfair 17px, #4A3525
```

#### Dashboard Metric Card
```
Background:    #FAF9F6
Border:        1px solid rgba(229,196,146, 0.2)
Border-radius: 24px
Shadow:        var(--shadow-md)
Padding:       24px
Transition:    transform 300ms, shadow 300ms

Hover:         translateY(-2px), shadow var(--shadow-lg)
Icon container: 48x48, bg rgba(179,121,67, 0.1), rounded-xl
Label:         10px uppercase tracking-widest, #8B7355
Value:         Playfair 24px, #4A3525
```

#### Content Card (About, Contact)
```
Background:    #FAF9F6
Border:        1px solid rgba(229,196,146, 0.15)
Border-radius: 16px
Shadow:        var(--shadow-sm)
Padding:       24px
Hover:         shadow var(--shadow-md), border-color rgba(229,196,146, 0.4)
```

---

### 6.3 Inputs

#### Text Input
```
Background:    color-mix(#F0E6D9 50%, #FAF9F6) → focus: #FAF9F6
Border:        1px solid rgba(229,196,146, 0.3)
Border-radius: 16px
Padding:       16px 20px (py-4 px-5)
Font:          DM Sans 400, 14px, #4A3525
Placeholder:   #8B7355 at 60% opacity
Transition:    all 200ms ease

Focus:         border-color #B37943, ring 3px rgba(179,121,67, 0.15), bg #FAF9F6
Error:         border-color #C44536, ring rgba(196,69,54, 0.15)
Disabled:      opacity 0.5, cursor not-allowed
```

#### Select / Dropdown
```
Same as text input +
Chevron icon:  right-aligned, #8B7355
Open state:    shadow var(--shadow-lg)
Option hover:  bg #F0E6D9
```

#### Textarea
```
Same as text input +
Min-height:    120px
Resize:        vertical only
```

#### Checkbox / Toggle
```
Unchecked:     border 2px #E5C492, bg transparent
Checked:       bg #B37943, border #B37943, checkmark #FAF9F6
Focus:         ring 3px rgba(179,121,67, 0.15)
Size:          20x20px
Transition:    all 200ms ease
```

---

### 6.4 Modals / Drawers

#### Modal
```
Overlay:       bg rgba(74,53,37, 0.4), backdrop-blur 4px
Container:     bg #FAF9F6, rounded-3xl, shadow var(--shadow-xl)
Max-width:     480px (sm), 640px (md), 800px (lg)
Padding:       32px (p-8)
Header:        Playfair 20px #4A3525, border-bottom rgba(229,196,146, 0.2)
Close button:  top-right, 40x40, hover bg #F0E6D9, rounded-xl

Animation:     
  Enter: opacity 0→1 (200ms), scale 0.95→1 (300ms ease-out)
  Exit:  opacity 1→0 (150ms), scale 1→0.95 (200ms ease-in)
```

#### Side Drawer (Cart, Mobile Nav)
```
Overlay:       bg rgba(74,53,37, 0.4), backdrop-blur 4px
Container:     bg #FAF9F6, shadow var(--shadow-xl)
Width:         100% mobile, 420px desktop
Animation:     translateX(100%) → translateX(0), 300ms ease-out
Header:        Playfair 18px, border-bottom rgba(229,196,146, 0.2)
```

---

### 6.5 Navigation

#### Floating Navbar
```
Position:      fixed, top-4 left-4 right-4, z-50
Background:    #FAF9F6/80, backdrop-blur-xl
Border:        1px solid rgba(229,196,146, 0.15)
Border-radius: 16px
Shadow:        scrolled → var(--shadow-md)
Height:        56px mobile, 64px desktop

Logo text:     Playfair 20px #4A3525
Nav links:     DM Sans 14px 500, #8B7355
Active link:   text #B37943, bg #F0E6D9, rounded-lg
Hover link:    text #B37943
Cart badge:    bg #B37943, text #FAF9F6, 16x16, rounded-full
```

#### Admin Sidebar
```
Width:         240px
Background:    #F0E6D9
Border-right:  1px solid rgba(229,196,146, 0.2)

Logo area:     p-6, Playfair 18px #4A3525
Nav item:      px-4 py-3, rounded-xl, DM Sans 14px 500
Active item:   bg #FAF9F6, text #B37943, shadow-sm, border rgba(229,196,146, 0.2)
Inactive:      text #8B7355, hover → text #B37943, bg #FAF9F6/50
Sign out:      text #C44536/80, hover bg rgba(196,69,54, 0.05)
```

---

### 6.6 Badges & Tags

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Default | `#F0E6D9` | `#4A3525` | none |
| Primary | `rgba(179,121,67, 0.1)` | `#B37943` | none |
| Success | `rgba(91,140,90, 0.1)` | `#5B8C5A` | none |
| Warning | `rgba(212,168,67, 0.1)` | `#96612F` | none |
| Danger | `rgba(196,69,54, 0.1)` | `#C44536` | none |
| Outline | `transparent` | `#8B7355` | `1px solid #E5C492` |

```
Border-radius: 8px
Padding:       4px 10px
Font:          DM Sans 11px 700 uppercase, tracking 0.1em
```

---

### 6.7 Tables (Admin)

```
Header row:    bg #F0E6D9, text #4A3525, font 11px 700 uppercase tracking-widest
Body row:      bg #FAF9F6, hover bg #F0E6D9/50
Border:        1px solid rgba(229,196,146, 0.15) between rows
Cell padding:  12px 16px
Text:          DM Sans 14px, #4A3525
Muted columns: #8B7355
Border-radius: 16px on outer container
```

---

## 7. Animation & Motion

### Timing
```
--duration-fast:   150ms   (micro-interactions: hover, focus)
--duration-base:   250ms   (buttons, toggles, tabs)
--duration-slow:   400ms   (cards, page transitions)
--duration-slower: 600ms   (hero reveals, scroll-triggered)
--duration-image:  700ms   (product image zoom)
```

### Easing
```
--ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1)    — entering elements
--ease-in:     cubic-bezier(0.4, 0.0, 1, 1)       — exiting elements
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1)     — moving elements
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  — playful bounces (rare)
```

### Scroll-triggered (Framer Motion)
```jsx
initial={{ opacity: 0, y: 24 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Z-Index Scale

| Layer | Value | Usage |
|-------|-------|-------|
| Base | `0` | Default content |
| Raised | `10` | Sticky elements, cards on hover |
| Dropdown | `20` | Dropdowns, tooltips |
| Navbar | `50` | Fixed navigation |
| Overlay | `60` | Backdrop overlays |
| Drawer | `70` | Side drawers |
| Modal | `80` | Modal dialogs |
| Toast | `90` | Toast notifications |

---

## 9. Breakpoints

| Name | Min-width | Target |
|------|-----------|--------|
| `sm` | `640px` | Large phones landscape |
| `md` | `768px` | Tablets |
| `lg` | `1024px` | Laptops |
| `xl` | `1280px` | Desktops |
| `2xl` | `1536px` | Large monitors |

### Grid Patterns
```
Product grid:  grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
Dashboard:     grid-cols-1 md:grid-cols-3
Content:       max-w-7xl mx-auto
Narrow:        max-w-3xl mx-auto
Form:          max-w-md mx-auto
```

---

## 10. Style Guidelines

### Do ✅
- Use warm-tinted shadows (espresso-based rgba)
- Massive negative space — let the design breathe
- Consistent 4px spacing grid
- `cursor-pointer` on every clickable element
- Smooth transitions on all interactive states (150–300ms)
- `font-display: swap` for web fonts
- Semantic HTML elements (`<section>`, `<nav>`, `<article>`)
- Lazy-load below-fold images
- Skeleton loaders for async content (not blank screens)
- Disable buttons during loading with spinner
- Focus rings visible for keyboard navigation
- `prefers-reduced-motion` respected
- Test at 375px, 768px, 1024px, 1440px

### Don't ❌
- Pure white (`#FFF`) or pure black (`#000`) anywhere
- Emojis as UI icons — use Lucide React SVGs
- Layout-shifting hover effects (no scale that moves siblings)
- Arbitrary z-index values (`z-[9999]`)
- Linear easing for UI transitions
- `outline: none` without a replacement focus style
- Cool-toned grays (Tailwind gray scale) — use warm espresso tones
- Continuous decorative animations (only loading indicators)
- Instant state changes without transitions
- More than 2 font families on a single page
- Inconsistent border-radius (stick to the scale)

### Image Guidelines
- Product images: aspect-ratio `4/5`, `object-cover`
- Hero images: lazy-loaded, WebP format
- Alt text on every `<img>` element
- Max display width: constrain with `max-w-` utilities

### Admin Dashboard Rules
- Sidebar: `#F0E6D9` background, never pure white
- Data tables: warm cream header rows
- Input focus rings: amber, not blue
- Status badges: use semantic color variants above
- Metric values: Playfair Display serif for premium feel
- Dense but not cramped — `p-6` minimum card padding

---

## 11. Pre-Delivery Checklist

- [ ] No `#FFFFFF` backgrounds anywhere
- [ ] No emojis as icons (Lucide SVGs only)
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states use transitions (150–300ms)
- [ ] Light mode text contrast ≥ 4.5:1
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] All images have `alt` text
- [ ] Form inputs have associated labels
- [ ] Buttons disabled + spinner during loading
- [ ] Consistent border-radius from scale
- [ ] Warm shadows (no default gray box-shadow)
- [ ] Google Fonts loaded with `display=swap`
