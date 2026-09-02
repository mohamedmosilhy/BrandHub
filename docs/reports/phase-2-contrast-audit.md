# Phase 2 — Contrast audit

**Date:** 2026-09-02 · **Standard:** WCAG 2.2 AA · **Scope:** approved BRANDHUB light palette

Ratios were calculated from the sRGB luminance formula. Normal text requires **4.5:1**; large text
requires **3:1**. Meaningful non-text controls also require **3:1** against adjacent colours.

## Passing reference pairs

| Foreground               | Background |  Ratio | Result                     |
| ------------------------ | ---------- | -----: | -------------------------- |
| Ink `#1A1A2E`            | white      | 16.7:1 | Pass                       |
| Text secondary `#5A5A72` | white      | 6.69:1 | Pass                       |
| Accent `#7F77DD`         | white      | 3.76:1 | Large text / non-text only |
| Accent hover `#6860CC`   | white      | 5.08:1 | Pass                       |

## Failing reference pairs and remedies

| Reference pair                     |       Ratio | Where it appears                      | Remedy implemented                                                                                                                                                                       |
| ---------------------------------- | ----------: | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Muted `#9A9AAF` on white           |      2.76:1 | placeholders, captions, disabled copy | `textSubtleAccessible` `#686879` (5.46:1) for readable small copy; original muted token remains for non-text decoration and disabled content that is not required to convey information. |
| White on accent `#7F77DD`          |      3.76:1 | primary buttons                       | Use `accentHover` `#6860CC` for filled button backgrounds (5.08:1). The original accent remains the brand and icon token.                                                                |
| White on danger `#D94F4F`          |      4.05:1 | destructive buttons                   | Use `dangerAccessible` `#B8323C` (5.90:1).                                                                                                                                               |
| Pink `#D4537E` on pink-light       | below 4.5:1 | small badges                          | Use `pinkAccessible` `#9D3155` on pink-light (6.21:1).                                                                                                                                   |
| Success `#22A06B` on success-light |      2.94:1 | status pills                          | Use `successAccessible` `#0F6B45` on success-light (5.79:1).                                                                                                                             |
| Warning `#E6A817` on warning-light |      1.96:1 | status pills and banners              | Use `warningAccessible` `#765800` on warning-light (6.19:1).                                                                                                                             |
| Danger `#D94F4F` on danger-light   |      3.50:1 | field errors and status pills         | Use `dangerAccessible` `#B8323C` on danger-light (4.77:1 or better, depending on the exact surface).                                                                                     |
| Accent `#7F77DD` on accent-light   |      3.24:1 | selected chips and initials           | Use ink text on accent-light; retain the accent border/icon so selection is not conveyed by colour alone.                                                                                |

## Decision

Accessibility takes precedence over pixel-identical low-contrast text, as already anticipated by
`architecture.md` §30/A3 and §33. The original reference values remain available and unchanged in
the theme, satisfying token fidelity. The additional `*Accessible` tokens are presentation
remedies, not replacements for the brand palette.

The gallery still needs a final VoiceOver/TalkBack and physical-device visual check in Phase 13.
