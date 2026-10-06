# Mohamed Ben Naima — portfolio

Live: <https://mohamed-ben-naima.netlify.app/>

A static, dependency-free site in the same retro-arcade language as my
[GitHub profile](https://github.com/Mohamed-Ben-Naima). No framework, no tracker, no third-party request.

## Layout

| Path | What |
|---|---|
| `index.html` | The page, with every project case study in a `<template>` (popups deep-link as `#case-<id>`) |
| `assets/css/style.css` · `assets/js/main.js` | Readable sources |
| `assets/css/style.min.css` · `assets/js/main.min.js` | What the page loads (generated) |
| `assets/fonts/` | Self-hosted, subsetted WOFF2 (SIL OFL) |
| `assets/img/` | Portrait (360/480/720 WebP), Open Graph card, icons |
| `_headers` | Netlify security and cache headers (CSP, HSTS, framing, permissions) |
| `404.html` · `robots.txt` · `sitemap.xml` · `site.webmanifest` · `.well-known/security.txt` | The rest of a proper site |
| `oldest_version/` | The original template, kept as an archive (`noindex`) |

## After editing CSS or JS

```bash
python3 tools/build.py   # minifies (esbuild via npx) and re-stamps ?v=<hash> in the HTML
```

The CSS and JS are cached for a year, so the hash in the URL is what makes a change reach visitors.

## Security notes

- Strict Content-Security-Policy: no inline styles, one inline script allowed by hash, no external origins,
  Trusted Types required. If you add an inline `<script>`, its SHA-256 must go into both the `<meta>` CSP
  and `_headers`.
- `frame-ancestors 'none'` and `X-Frame-Options: DENY` stop clickjacking; HSTS forces HTTPS.
- There is a flag hidden in this site. It isn't hard.
