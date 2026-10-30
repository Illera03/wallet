#!/usr/bin/env python3
"""Build index.html (the deployed app) from the files in src/.

    python3 tools/build.py

Everything is inlined into a single index.html so the service worker only has
to cache one page. config.js stays separate because the user edits it on GitHub.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'

RESET = (':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);'
         'padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}'
         'img{max-width:100%}[hidden]{display:none!important}')


def read(name):
    return (SRC / name).read_text(encoding='utf-8')


def main():
    doc = f'''<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Wallet</title>
<meta name="theme-color" content="#14171C">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Wallet">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>{RESET}</style>
<style>
{read('styles.css')}</style>
</head><body>
{read('body.html')}
<script src="config.js"></script>
<script>
{read('icons.js')}
{read('app.js')}
{read('sync.js')}
</script>
</body></html>
'''
    out = ROOT / 'index.html'
    out.write_text(doc, encoding='utf-8')
    print(f'index.html escrito ({len(doc) // 1024} KB)')


if __name__ == '__main__':
    main()
