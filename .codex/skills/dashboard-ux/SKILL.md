---
name: dashboard-ux
description: Use when designing, reviewing, or implementing dashboards, KPI surfaces, analytics views, chart-heavy screens, data cards, filters, drilldowns, or Recharts-based responsive visualizations. Prioritize clarity, hierarchy, responsiveness, and decision support.
---

# Dashboard UX

Use this skill to turn dense data into a decision surface.

## Sources

- shadcn/ui docs: https://ui.shadcn.com/docs
- Recharts ResponsiveContainer: https://recharts.github.io/en-US/api/ResponsiveContainer/
- Recharts Tooltip: https://recharts.github.io/en-US/api/Tooltip

## Principles

- Start with the user's decision, then choose KPIs and charts.
- Put the most important metric in the fastest-to-scan position.
- Use progressive disclosure: overview first, details on demand.
- Keep charts responsive with stable parent dimensions and `ResponsiveContainer` when using Recharts.
- Use custom tooltip content when default labels, formatting, or theme contrast are not good enough.
- Use semantic color sparingly; reserve urgent colors for states that require action.
- Keep filters, time ranges, and segmentation visible enough to explain the data being shown.

## Review Checklist

- Every dashboard view answers one primary question.
- KPI cards include context, trend, and timeframe when needed.
- Charts have readable labels, useful tooltips, and no unexplained units.
- Empty, loading, stale, and error states do not collapse layout.
- Mobile layouts preserve priority instead of shrinking everything equally.
- Performance-sensitive charts avoid unnecessary animation and oversized payloads.
