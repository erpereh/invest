---
name: design-system
description: Use when creating, reviewing, or aligning UI with a design system, DESIGN.md-style guidance, visual tokens, component rules, layout principles, responsive behavior, or do/don't guardrails. Use for projects that need consistent product UI before individual screen design.
---

# Design System

Use this skill to establish or apply a concise product design system before building screens.

## Sources

- VoltAgent awesome-design-md: https://github.com/VoltAgent/awesome-design-md

## DESIGN.md Structure

Use the nine-section model from `awesome-design-md` when a design system brief is needed:

1. Visual theme and atmosphere
2. Color palette and roles
3. Typography rules
4. Component stylings
5. Layout principles
6. Depth and elevation
7. Do's and don'ts
8. Responsive behavior
9. Agent prompt guide

## Principles

- Define role-based tokens before styling individual components.
- Keep component rules concrete: buttons, cards, inputs, navigation, states, density, and elevation.
- Tie layout guidance to spacing, grid behavior, breakpoints, and content priority.
- Treat brand inspirations as references, not exact clones.
- Preserve a small set of enforceable guardrails instead of broad aesthetic prose.

## Review Checklist

- Tokens have roles, not only names or hex values.
- Typography includes hierarchy, weight, rhythm, and usage guidance.
- Components include hover, focus, active, disabled, empty, and loading states when relevant.
- Responsive behavior explains what collapses, stacks, hides, or reorders.
- Anti-patterns are explicit enough for an implementation agent to avoid them.
