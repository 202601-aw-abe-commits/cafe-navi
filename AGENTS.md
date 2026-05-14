# Repository Guidelines

## Agent-First Workflow (Read This First)
This file is the single source of truth for contributors and Codex agents.

Before editing any file, always do this in order:
1. Open `AGENTS.md` and review constraints/checklist.
2. Identify target files from the structure section below.
3. Make minimal scoped edits.
4. Run manual verification steps listed in this file.
5. Update this file if any permanent rule or important decision changed.

If a request conflicts with this guide, follow the user request and then update this guide to reflect the new rule.

## Important Project Memo
- App type: static frontend only (no backend, no build pipeline).
- Map policy: use Leaflet + OpenStreetMap only.
- Forbidden for core map feature: Google Maps API, paid/key-based map APIs.
- Keep design stable; avoid large visual changes unless explicitly requested.
- Separation rule: no custom `<style>` or inline custom `<script>` in `index.html`.
- Image policy: apply mosaic (blur/pixelation) to photos/images that should not be shown clearly.

## Project Structure & Module Organization
This repository is a static web app for the Cafe Navi landing page.

- `index.html`: Page structure and external asset links.
- `css/style.css`: All custom styles, responsive rules, and Leaflet popup styling.
- `js/main.js`: Frontend behavior, including Leaflet map initialization and marker rendering.
- `ai-input-proposal-research-persona.md`: Product/context notes (non-runtime document).

Keep concerns separated: HTML for markup only, CSS for presentation, JS for behavior.

## Edit Scope Quick Map
- Layout/content changes: `index.html`
- Visual/theme/responsive changes: `css/style.css`
- Map/interaction/data logic: `js/main.js`
- Product notes and planning context: `ai-input-proposal-research-persona.md`

## Build, Test, and Development Commands
No build step is required. Run locally with a static server:

- `python3 -m http.server 8000`
  - Serves the project at `http://localhost:8000`.
- `open http://localhost:8000` (macOS, optional)
  - Opens the app in a browser.

If Python is unavailable, any static server is acceptable.

## Coding Style & Naming Conventions
- Use 2-space indentation in HTML, CSS, and JavaScript.
- Keep files ASCII-first unless existing content requires Unicode.
- CSS class names: kebab-case (e.g., `search-card`, `filter-chip`).
- JavaScript identifiers: camelCase (e.g., `popupHtml`, `cafes`).
- Prefer small, focused changes and avoid mixing refactors with feature edits.

## Testing Guidelines
Automated tests are not configured yet. Perform manual checks for every change:

- Verify layout at desktop and mobile widths.
- Confirm Leaflet map loads, centers near Ueno, and shows 3 markers.
- Click each marker and confirm popup content (name, rating, features).
- Check browser console for errors.
- Confirm file links resolve: `css/style.css`, Leaflet CDN, `js/main.js`.

When adding tests later, place them under a top-level `tests/` directory.

## Commit & Pull Request Guidelines
Git history is currently minimal (`Initial commit: cafe-navi`). Follow a simple, consistent style:

- Commit format: imperative summary, optional scope.
  - Example: `feat(map): add OpenStreetMap markers for sample cafes`
- Keep commits atomic and logically grouped.

PRs should include:
- What changed and why.
- Before/after screenshots for UI changes.
- Manual verification steps performed.
- Linked issue/task when applicable.

## Security & Configuration Tips
- Do not introduce paid or key-based map APIs for core map features.
- Keep API keys and secrets out of the repository.

## Maintenance Rule
When a new recurring decision is made (naming, structure, dependency, workflow), add it to `AGENTS.md` immediately so future agents do not need to rediscover it.
