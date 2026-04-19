---
name: tailwind-shadcn-best-practices
description: Use when implementing, reviewing, or refactoring React UI built with Tailwind CSS, shadcn/ui, Radix primitives, Lucide icons, semantic tokens, component variants, or theme-aware utility classes.
---

# Tailwind Shadcn Best Practices

Use this skill to keep Tailwind and shadcn/ui implementation consistent, themeable, and maintainable.

## Sources

- shadcn/ui docs: https://ui.shadcn.com/docs
- Tailwind CSS docs: https://tailwindcss.com/docs
- Lucide docs: https://lucide.dev/

## Principles

- Treat shadcn/ui as open component source, not a black-box component library.
- Prefer composition and local variants over one-off wrappers everywhere.
- Use Tailwind semantic tokens and CSS variables instead of hard-coded colors.
- Keep visual styles declarative with utility classes; avoid inline styles unless a library API requires them.
- Use Lucide icons as tree-shakeable imports and let them inherit text color by default.
- Keep radius, spacing, border, and focus treatment consistent with the local design system.
- Preserve Radix accessibility behavior when customizing shadcn/ui primitives.

## Review Checklist

- Components use `cn` or the local class merge helper consistently.
- Variants are named by intent, not by raw color.
- Dark mode uses tokens and `dark:` variants only where needed.
- Icon-only buttons have accessible labels.
- Focus rings are visible in light and dark themes.
- New UI follows existing component paths, aliases, and project conventions.
