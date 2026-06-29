---
name: inventory-ui-references
description: "Trigger: referencias-UI, login reference, catalogo reference, screen.png, code.html, DESIGN.md. Analyze UI references, extract components, fix inconsistencies, and report visual corrections before building React screens."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when building or refactoring UI from files inside `referencias-UI/`, especially Login, Catalogo, and catalog modals.

## Hard Rules

- Read `DESIGN.md`, `code.html`, and any `screen.png` before editing app code.
- Treat `DESIGN.md` as the visual source of truth when HTML and images disagree.
- If references conflict, keep the stronger system rule and note the fix in the final report.
- Always load and follow the `react-19` skill for component structure and hook usage that is compatible with the current app.
- Keep one mock data source of truth. Do not create per-screen mock arrays.
- Replace non-functional reference patterns such as `href="#"`, CDN-only Tailwind tricks, or invalid `@apply` usage with working React/Vite code.
- Report every intentional correction with: issue, fix, file changed.

## Decision Gates

| Situation | Action |
| --- | --- |
| `screen.png` and `code.html` differ | Prefer the image for layout, `DESIGN.md` for tokens, then adapt HTML structure |
| HTML violates app conventions | Preserve the look, rewrite the implementation |
| Reference has inconsistent data labels, statuses, or currencies | Normalize using one canonical dataset and mention the normalization |
| A visual detail harms accessibility or clarity | Fix it and record the reason |

## Execution Steps

1. Inspect all relevant files in `referencias-UI/` for the target screen and related modals.
2. Extract tokens, layout regions, repeated elements, and required interactions.
3. Compare against current `src/` components and central mock data.
4. List inconsistencies or missing data fields before implementation.
5. Build reusable components first, then the screen composition.
6. Keep visual parity with the references while correcting broken or inconsistent details.
7. Validate responsive behavior, keyboard flow, and build output.

## Output Contract

Return:
- Components created or reused.
- Data fields added or normalized.
- Inconsistencies found.
- Corrections applied with file paths.
- Verification steps executed.

## References

- `referencias-UI/Login/DESIGN.md`
- `referencias-UI/Login/code.html`
- `referencias-UI/Catálogo/DESIGN.md`
- `referencias-UI/Catálogo/code.html`
- `src/data/mockDatabase.ts`
- `src/data/mockSelectors.ts`
