---
name: Clinical Precision
colors:
  surface: '#FFFFFF'
  surface-dim: '#ccdcea'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eaf5ff'
  surface-container: '#e0f0fe'
  surface-container-high: '#daeaf8'
  surface-container-highest: '#d5e5f2'
  on-surface: '#0e1d27'
  on-surface-variant: '#424751'
  inverse-surface: '#23323d'
  inverse-on-surface: '#e5f3ff'
  outline: '#727782'
  outline-variant: '#c2c6d2'
  surface-tint: '#1960a6'
  primary: '#004782'
  on-primary: '#ffffff'
  primary-container: '#185fa5'
  on-primary-container: '#c1d9ff'
  inverse-primary: '#a4c9ff'
  secondary: '#086b53'
  on-secondary: '#ffffff'
  secondary-container: '#a0f3d4'
  on-secondary-container: '#167159'
  tertiary: '#6f3800'
  on-tertiary: '#ffffff'
  tertiary-container: '#924b00'
  on-tertiary-container: '#ffceac'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a4c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#004883'
  secondary-fixed: '#a0f3d4'
  secondary-fixed-dim: '#84d6b9'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#00513e'
  tertiary-fixed: '#ffdcc4'
  tertiary-fixed-dim: '#ffb781'
  on-tertiary-fixed: '#2f1400'
  on-tertiary-fixed-variant: '#703800'
  background: '#f6faff'
  on-background: '#0e1d27'
  surface-variant: '#d5e5f2'
  page-bg: '#F5F8FB'
  blue-tint-bg: '#E8F1FA'
  blue-tint-text: '#0F4C81'
  teal-bg: '#E1F5EE'
  text-secondary: '#5C6B78'
  text-muted: '#95A3AE'
  border-hairline: '#E5ECF1'
  badge-normal-text: '#0F7C5C'
  badge-normal-bg: '#E2F4EE'
  badge-critical-text: '#9A5B00'
  badge-critical-bg: '#FBEFD9'
  badge-out-text: '#B0301F'
  badge-out-bg: '#FBE7E4'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  data-mono:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.02em
  data-mono-sm:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for high-stakes pharmaceutical logistics and clinical management. The brand personality is authoritative, reliable, and meticulously organized, catering to healthcare professionals and pharmacy staff who require clarity and speed. 

The aesthetic follows a **Corporate / Modern** approach with a strong emphasis on **Minimalism**. It prioritizes a high-information density that remains legible through generous white space and a rigid structural grid. Visual noise is eliminated to ensure that critical medical data, such as stock levels and expiration dates, remain the focal point. The emotional response should be one of absolute trust, safety, and operational efficiency.

## Colors

The palette is strictly functional, utilizing a systematic hierarchy to communicate status and action:

- **Primary Blue:** Reserved for primary actions and global navigation.
- **Brand Teal:** Used for positive reinforcement and specific clinical identifiers.
- **Functional Accents:** Status badges use a "text-on-tint" logic to ensure high legibility without the aggression of pure saturated colors. 
- **Neutrals:** The background uses a cool-toned gray (`#F5F8FB`) to reduce eye strain, while active surfaces are pure white to create a clear "layer" effect against the page.

## Typography

This system employs a dual-font strategy. **IBM Plex Sans** is the workhorse for interface elements, providing a modern and highly readable humanist touch. For any quantitative data—including SKU numbers, stock counts, currency, and timestamps—**IBM Plex Mono** is used. This ensures that columns of numbers align perfectly, facilitating rapid scanning of inventory lists.

Use `headline-lg-mobile` (24px) for top-level headers on smaller screens. Always maintain a minimum of 400 weight for body text to ensure clinical accessibility.

## Layout & Spacing

The layout utilizes a **Fixed Grid** on desktop (12 columns) and a **Fluid Grid** on mobile (4 columns). 

- **Density:** A "Comfortable" density model is used. Avoid compacting rows too tightly; the clinical nature of the app requires "breathing room" to prevent selection errors.
- **Rhythm:** All spacing must be multiples of 4px. Use 24px gutters for horizontal separation between card modules.
- **Structure:** Content should be grouped into cards or distinct sections separated by the `border-hairline`.

## Elevation & Depth

This design system avoids heavy drop shadows to maintain a clean, laboratory-like feel. Instead, it relies on **Low-contrast outlines** and **Tonal layers**.

- **Depth Level 0:** The page background (`#F5F8FB`).
- **Depth Level 1:** Cards and interactive surfaces (`#FFFFFF`) with a 1px `border-hairline`.
- **Depth Level 2:** Overlays and Modals. These may use a very subtle, diffused ambient shadow (0px 4px 12px, 5% opacity black) to separate them from the main surface, but the primary indicator of depth remains the 1px border.

## Shapes

The shape language is precise and disciplined. A dual-radius system is applied:
- **Controls & Small Components:** Buttons, inputs, and chips use a **8px** radius to feel approachable but professional.
- **Containers:** Large surfaces like data cards and inventory modals use a **12px** radius to soften the overall structure of the layout.
- **Strictness:** Do not use full-circle pills unless for specific status indicators (badges).

## Components

- **Buttons:** Primary buttons use the Primary Blue with white text. Secondary buttons use the Blue Tint palette. Use 16px horizontal padding and 10px vertical padding.
- **Inputs:** 1px hairline border. On focus, the border changes to Primary Blue with a subtle 2px glow. Placeholder text uses the `text-muted` color.
- **Badges:** Use the defined "Normal", "Critical", and "Agotado" color pairings. Badges should have a 4px border radius and use `label-caps` typography.
- **Data Tables:** Use `data-mono` for all numerical cells. Headers should be `label-caps` in `text-secondary`. Row borders should be 1px `border-hairline`.
- **Cards:** White background, 12px radius, 1px hairline border. No shadow.
- **Inventory Chips:** Small teal squares (`#E1F5EE`) behind brand icons to denote pharmaceutical categories or verified items.