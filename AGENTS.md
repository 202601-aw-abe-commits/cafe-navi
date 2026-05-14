# Repository Guidelines

## Agent-First Workflow (Read This First)
This file is the single source of truth for contributors and Codex agents.

Before editing any file, always do this in order:
1. Open `AGENTS.md` first.
2. Use the "Current Features Snapshot" and "Edit Scope Quick Map" in this file to decide target files.
3. Open only the minimum required files for the requested change.
4. Make minimal scoped edits.
5. Run manual verification steps listed in this file.
6. Update this file if any permanent rule or important decision changed.

If a request conflicts with this guide, follow the user request and then update this guide to reflect the new rule.

## Mandatory Agent Rule
- Codex must always read `AGENTS.md` first before any implementation work.
- Codex should not scan the full repository by default.
- Codex should use `AGENTS.md` as the routing table to identify exactly which files to open.
- Only if information is missing/ambiguous in `AGENTS.md`, open additional files.

## Important Project Memo
- App type: static frontend + optional Python API backend (`server.py`) for auth/favorites persistence.
- Map policy: use Leaflet + OpenStreetMap only.
- Forbidden for core map feature: Google Maps API, paid/key-based map APIs.
- Keep design stable; avoid large visual changes unless explicitly requested.
- Separation rule: no custom `<style>` or inline custom `<script>` in `index.html`.
- Image policy: apply mosaic (blur/pixelation) to photos/images that should not be shown clearly.

## Current Features Snapshot
- Top navigation includes: `検索`, `お気に入り`, `カフェナビについて`, `お問い合わせ`, `ログアウト`.
- Brand title `カフェナビ` uses per-character wave animation.
- Search area has input + `現在地から探す` button (Enter key in input triggers the same button click).
- Cafe result list currently contains 11 cards for testing.
- Pagination is enabled when visible results are over 10 (10 per page).
- Favorite toggle:
  - Clicking heart toggles favorite visual state (pink, `♥`).
  - `お気に入り` tab filters and shows only favorite cards.
- Left filter panel is sticky on desktop while scrolling.
- Clicking a card opens detail page for that cafe.
- Detail page shows cafe info + Leaflet/OpenStreetMap map marker.

## Project Structure & Module Organization
- `index.html`: Main list page markup (top nav, filters, cards, pagination container).
- `login.html` / `signup.html` / `auth-choice.html`: Authentication flow pages.
- `cafe-detail.html`: Cafe detail page markup.
- `about.html`: "About Cafe Navi" page markup.
- `contact.html`: Contact form page markup.
- `css/style.css`: Main list page styles and interactions/animations.
- `css/cafe-detail.css`: Detail page styles.
- `css/about.css`: About page styles (cards, badges, section layouts).
- `css/contact.css`: Contact page styles (form and layout).
- `js/main.js`: Main list page behavior (favorites, pagination, tab switching, card navigation).
- `js/auth.js`: Login/signup form API integration.
- `js/cafe-detail.js`: Detail page behavior (query-id based render, map render).
- `server.py`: Local API server and SQLite DB bootstrap (`db/cafe_navi.sqlite3`).
- `db/schema.sql`: MySQL schema reference.
- `ai-input-proposal-research-persona.md`: Product/context notes (non-runtime document).

Keep concerns separated: HTML for markup only, CSS for presentation, JS for behavior.

## Edit Scope Quick Map
- Layout/content changes: `index.html`
- Detail page layout/content: `cafe-detail.html`
- About page layout/content: `about.html`
- Contact page layout/content: `contact.html`
- Visual/theme/responsive changes (main page): `css/style.css`
- Visual/theme/responsive changes (detail page): `css/cafe-detail.css`
- Visual/theme/responsive changes (about page): `css/about.css`
- Visual/theme/responsive changes (contact page): `css/contact.css`
- Main page interaction/data logic: `js/main.js`
- Detail page interaction/map/data logic: `js/cafe-detail.js`
- Product notes and planning context: `ai-input-proposal-research-persona.md`

## Build, Test, and Development Commands
No build step is required.

Frontend only:

- `python3 -m http.server 8000`
  - Serves the project at `http://localhost:8000`.
- `open http://localhost:8000` (macOS, optional)
  - Opens the app in a browser.

If Python is unavailable, any static server is acceptable.

Auth/Favorites persistence (recommended):

- `python3 server.py`
  - Serves app + API at `http://localhost:8000`.
  - Creates SQLite DB at `db/cafe_navi.sqlite3` automatically.

## Coding Style & Naming Conventions
- Use 2-space indentation in HTML, CSS, and JavaScript.
- Keep files ASCII-first unless existing content requires Unicode.
- CSS class names: kebab-case (e.g., `search-card`, `filter-chip`).
- JavaScript identifiers: camelCase (e.g., `popupHtml`, `cafes`).
- Prefer small, focused changes and avoid mixing refactors with feature edits.

## Testing Guidelines
Automated tests are not configured yet. Perform manual checks for every change:

- Verify layout at desktop and mobile widths.
- Confirm main page card count text matches the actually visible dataset count.
- When results exceed 10, confirm pagination appears and page transitions work.
- Toggle heart on several cards and confirm pink state changes correctly.
- Click `お気に入り` and confirm only favorited cards are shown.
- Click `検索` and confirm all cards are shown again.
- Press Enter in search input and confirm it triggers `現在地から探す` click behavior.
- Confirm filter card stays visible while scrolling on desktop.
- Click a card and confirm navigation to `cafe-detail.html?id=...`.
- On detail page, confirm Leaflet map loads and marker/popup matches selected cafe.
- Check browser console for errors.
- Confirm file links resolve:
  - `css/style.css`
  - `css/cafe-detail.css`
  - `js/main.js`
  - `js/cafe-detail.js`
  - Leaflet CDN files on detail page

When adding tests later, place them under a top-level `tests/` directory.

## Data Maintenance Notes
- Main card content in `index.html` and detail data in `js/cafe-detail.js` are currently maintained separately.
- If card titles/metadata are changed in `index.html`, update corresponding entries in `js/cafe-detail.js` to keep detail page consistent.

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
