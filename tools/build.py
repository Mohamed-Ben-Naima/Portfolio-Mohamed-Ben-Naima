#!/usr/bin/env python3
"""Minify the CSS and JS, then version their URLs by content hash.

Sources stay readable in assets/css/style.css and assets/js/main.js; the site
loads the minified copies, which are served with a one-year immutable cache
(see _headers), so each URL carries a hash that changes with the file.

Run after editing either source (needs Node for npx):

    python3 tools/build.py
"""
import hashlib
import pathlib
import re
import subprocess

root = pathlib.Path(__file__).resolve().parent.parent
pairs = {
    "assets/css/style.css": "assets/css/style.min.css",
    "assets/js/main.js": "assets/js/main.min.js",
}
for src, out in pairs.items():
    subprocess.run(
        ["npx", "-y", "esbuild@0.24", src, "--minify", "--target=es2020,chrome100,firefox100,safari15",
         f"--outfile={out}", "--log-level=warning"],
        cwd=root, check=True, shell=False,
    )

for page in ("index.html", "404.html"):
    path = root / page
    text = path.read_text(encoding="utf-8")
    for out in pairs.values():
        digest = hashlib.sha256((root / out).read_bytes()).hexdigest()[:10]
        text = re.sub(rf'{re.escape(out)}(\?v=[\w-]+)?"', f'{out}?v={digest}"', text)
    path.write_text(text, encoding="utf-8")

for src, out in pairs.items():
    a, b = (root / src).stat().st_size, (root / out).stat().st_size
    print(f"{out}: {a:,} -> {b:,} bytes")
