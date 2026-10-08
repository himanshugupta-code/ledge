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

## SEO

- Per-page title, description, keywords, canonical, hreflang, Open Graph and Twitter tags come from `lib/seo.ts`.
- JSON-LD: `SoftwareApplication`, `WebSite`, `Person` and `FAQPage` on the home page, `BreadcrumbList` on subpages, `Blog` and `BlogPosting` on the blog.
- `app/sitemap.ts` and `app/robots.ts` generate `sitemap.xml` and `robots.txt`. Submit the sitemap in Google Search Console.
- Copy lives in `dictionaries/`. Keep titles under about 60 characters and descriptions under about 160.

## Languages

English, Spanish, French, German, Japanese and Hindi live at `/en/`, `/es/`, `/fr/`, `/de/`, `/ja/` and `/hi/`. `/` serves the English site directly with its canonical URL set to `/en/`.

To add a language: add the code to `lib/i18n.ts`, then create `dictionaries/<code>.ts` typed as `Dict` and register it in `dictionaries/index.ts`. The build fails if any key is missing.

## Blog

Posts are MDX files in `content/blog/`. Each one exports a `meta` object (title, description, date, minutes, keywords). Add the slug to `postSlugs` in `lib/blog.ts`. The blog is English only for now.
