# Deploy Guide (GitHub Pages + Render)

## 1) Deploy API to Render
1. Push this repository to GitHub.
2. In Render, create a new **Web Service** from this repo.
3. Render will read `render.yaml` automatically.
4. After deploy, copy your API URL (example: `https://cafe-navi-api.onrender.com`).

## 2) Set API URL for GitHub Pages
Edit `js/config.js`:

```js
var renderApiBase = 'https://YOUR-RENDER-URL.onrender.com';
```

## 3) Publish frontend to GitHub Pages
1. In GitHub repo settings, enable Pages for your branch/folder.
2. Open your Pages URL.
3. Test signup/login/favorite.

## Notes
- Local dev keeps using same-origin API (`''`), so `python3 server.py` works as before.
- On GitHub Pages (`*.github.io`), frontend automatically uses `renderApiBase`.
