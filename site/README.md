# Ledge site

Static Next.js site for GitHub Pages: landing page, privacy policy and support.

```
cd site
npm ci
npm run dev                                   # http://localhost:3000
NEXT_PUBLIC_BASE_PATH=/ledge npm run build    # static export to site/out
```

The `Pages` workflow builds and deploys it on pushes to `main` that touch `site/`.
Enable it once under Settings → Pages → Source: GitHub Actions.
