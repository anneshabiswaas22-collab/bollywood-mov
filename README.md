# BollyVault — Bollywood movie catalogue

A modern, responsive, Netflix-inspired **movie discovery website** built directly from this repository's exported message archives and posters. This independent design does not use Netflix branding.

## What is included

- **3,603 archived movie entries** extracted from `messages.html`, `messages2.html`, `messages3.html`, and `messages4.html`
- **2,444 distinct title/year combinations**, with repeated entries labeled **Updated 1**, **Updated 2**, etc.
- Real posters from the existing `photos/` directory; the original files are untouched
- Movie and series filtering, title/year/genre search, sortable collection, genre chips, horizontal carousels, detail views, and a local-device "My List"
- Mobile-first layout, keyboard shortcuts (press `/` to search, `Esc` to close details), image lazy loading, no backend or API keys

## Publish through GitHub Pages

1. Open **Settings → Pages** in this GitHub repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/(root)** and click **Save**.
4. Visit [https://anneshabiswaas22-collab.github.io/bollywood-mov/](https://anneshabiswaas22-collab.github.io/bollywood-mov/) once Pages has published.

GitHub Pages requires the `index.html` file in the project root (already included).

## Repository structure

- `index.html` — modern website homepage
- `assets/site.css` — responsive visual design
- `assets/app.js` — discovery, filters, modals, and watchlist
- `assets/favicon.svg` — original site icon
- `data/movies-1.json` through `movies-4.json` — indexed movie metadata
- `messages*.html`, `photos/`, `css/`, `js/`, `images/`, `result.json` — original archive contents, preserved

The catalogue is static: posters and descriptive metadata come from the repository. The site **does not host or stream videos**. Source links open the corresponding archived message for context. Movie art and titles may belong to their respective rights holders; ensure public use of the assets and linked content is authorized.

## Updating the movie list

To incorporate further `messages*.html` archive exports, regenerate the `data/movies-*.json` dataset from the exports (including movie title, year, genres, local poster path, and source fragment). The current website loads all four JSON shards automatically.

## Credits

A standalone Bollywood catalogue with an original interface inspired by popular movie-discovery experiences.
