<!-- Initialized by 21st; project facts corrected from the approved repository sources. -->

# Project Design Context

## Project

- Product: Arabic-first multi-vendor marketplace mobile app for Oman
- Stack: Expo, React Native, TypeScript, StyleSheet
- Direction: RTL by default, complete LTR English mirror
- Density: comfortable mobile, 44 pt minimum targets

## Sources

- Tokens: `design-reference/uploads/BRAND HUB (6)/tokens.css`
- Native theme: `src/presentation/theme/tokens.ts`
- Components: `src/presentation/components/`
- Architecture: `docs/architecture.md`
- Phase requirements: `docs/plan.md`

## Identity

The interface is neutral-first: ink, white and pale gray carry most chrome. Purple is the workhorse
accent; pink is reserved for badges and the brand gradient; gold belongs only to the logo. Arabic
uses Noto Kufi Arabic at a 1.75 body line-height. English uses Plus Jakarta Sans.

## Constraints

- Use typed theme tokens and installed primitives before creating new values or lookalikes.
- Use logical start/end layout properties and flip directional SVG glyphs in RTL.
- Keep numerals LTR and format OMR to three fractional digits.
- Every async surface has exactly one loading, empty, error or content state.
- Every interactive control has a localized label, semantic role/state and a 44×44 pt target.
- Ignore `design-reference/_ds/modernist-…/`; it is explicitly excluded by decision D6.

## Decision

Preserve the approved prototype direction as native React Native components. No redesign was
selected. The 21st catalog search was unavailable (HTTP 401), so no external component was pulled.
