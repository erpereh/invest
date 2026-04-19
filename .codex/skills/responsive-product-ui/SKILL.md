---
name: responsive-product-ui
description: Use when designing, reviewing, or implementing responsive product UI, mobile-first dashboards, adaptive layouts, stable components, Tailwind breakpoints, shadcn/ui composition, or responsive Recharts visualizations.
---

# Responsive Product UI

Use this skill to make product screens work across real viewport sizes without becoming cramped or unstable.

## Sources

- Tailwind CSS docs: https://tailwindcss.com/docs
- shadcn/ui docs: https://ui.shadcn.com/docs
- Recharts ResponsiveContainer: https://recharts.github.io/en-US/api/ResponsiveContainer/

## Principles

- Design the primary workflow for mobile and desktop, not just the layout.
- Use responsive Tailwind variants for layout changes, not viewport-scaled font sizes.
- Preserve readable type, touch targets, and chart labels on small screens.
- Define stable dimensions for grids, tiles, toolbars, charts, counters, and controls.
- Stack, reorder, collapse, or summarize content based on priority.
- Give chart containers explicit parent dimensions before using responsive chart components.
- Avoid hiding critical controls unless there is an obvious alternate path.

## Review Checklist

- No text overflows or becomes clipped on narrow screens.
- Dynamic content does not resize fixed-format controls.
- Tables have a mobile strategy: columns, cards, horizontal scroll, or summaries.
- Charts remain readable with fewer ticks, clearer labels, and useful tooltips.
- Navigation and filters stay reachable without taking over the whole screen.
