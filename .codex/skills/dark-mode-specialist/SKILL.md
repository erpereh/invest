---
name: dark-mode-specialist
description: Use when designing, reviewing, or implementing dark mode, theme toggles, token pairs, contrast, color-scheme behavior, or Tailwind/shadcn theme integration. Prioritize this skill before other UI skills for dark-first fintech dashboards, theme safety, and light/dark parity.
---

# Dark Mode Specialist

Use this skill to make dark mode deliberate, accessible, and token-driven.

## Sources

- shadcn/ui Dark Mode: https://ui.shadcn.com/docs/dark-mode
- shadcn/ui Theming: https://ui.shadcn.com/docs/theming
- Tailwind CSS Dark Mode: https://tailwindcss.com/docs/dark-mode

## Principles

- Use semantic token pairs such as `background`/`foreground`, `primary`/`primary-foreground`, `muted`/`muted-foreground`, and `destructive`/`destructive-foreground`.
- Prefer class-driven dark mode with the `.dark` selector when a manual toggle is required.
- Support `light`, `dark`, and `system` preferences when the product needs user-controlled theming.
- Keep dark mode as token overrides, not a second component system.
- Apply `color-scheme` behavior so native controls match the active theme.
- Avoid hard-coded color utilities for product surfaces unless they map to documented tokens.
- Verify contrast, focus states, disabled states, skeletons, charts, icons, borders, and hover states in both themes.

## Review Checklist

- Theme is initialized early enough to avoid flash of incorrect theme.
- All text and icons use foreground tokens that match their surface.
- Charts and semantic colors remain readable on dark surfaces.
- Positive, negative, warning, and neutral states do not rely on color alone.
- Lucide icons inherit `currentColor` unless a semantic exception is documented.
- Shadows, rings, borders, and overlays are visible but not noisy in dark mode.
