# One Promise — Abraham, the Living God, and the Story That Never Ended

**Live site:** https://jonathandiaso.github.io/One-Promise-Abraham-and-the-Living-God/

The whole book — text, styles, audio player, search, focus mode — is one file:
[`index.html`](index.html). Edit that file, push, and the live site changes.

## Changing the live site

```bash
cd ~/One-Promise
# edit index.html
git add -A && git commit -m "what changed" && git push
```

GitHub Pages serves the default branch from the repo root and rebuilds in about
a minute.

**If you changed a precached file** — `index.html`, `accessibility.html`,
`404.html`, `manifest.webmanifest`, the icons, or anything under `audio/*.json`
— **bump `var SHELL` in [`sw.js`](sw.js)**. Without a new cache name the service
worker keeps serving the previous build to returning visitors forever. Then
hard-refresh once (Cmd-Shift-R) to see the change locally.

## Testing before you push

Python's `http.server` ignores `Range` requests, which makes Chrome treat every
act file as unseekable — the player looks broken when it is not. Serve with
something Range-capable, then open `http://127.0.0.1:8765/`.

## What is where

| Path | What |
|---|---|
| `index.html` | **The site.** Text, styles, player, search, focus mode, all of it. |
| `audio/act01…act09.m4a` | The nine act files. AAC 96 kbps mono, 138 MB, piano score baked in. |
| `audio/cues.json` | 510 text-sync cue points, act-relative. Drives read-along and tap-a-line in English. |
| `audio/cues_es.json` | The same blocks timed against the **Spanish** recording — 430 of the 510, plus 45 chapter marks and 7 act ticks. Built by `~/Abraham/scripts/audio/es_*.py`. |
| `audio/marks_new.json`, `audio/manifest.json` | 64 chapter marks; act titles, durations, sizes. |
| `sw.js` | Offline shell, per-act downloads, Range slicing out of the cache. |
| `accessibility.html` | The accessibility statement — what works and what does not yet. |
| `robots.txt`, `sitemap.xml`, `404.html` | Crawler and not-found handling. |
| `docs/NEXT-ROUND.md` | What is still open — mainly the Spanish narration work. |
| `docs/UPGRADE.md` | The editorial plan for the book's prose. |

The build scripts that produced the audio live in `~/Abraham/scripts/audio/`.
The Spanish read-along is built there too, in four steps:

```bash
python3 ~/Abraham/scripts/audio/es_blocks.py   # page + cues.json -> en_blocks.json
./transcribe.sh                                # whisper: Spanish audio -> English text, Spanish times
python3 ~/Abraham/scripts/audio/es_align.py    # rare 4-grams -> a monotone anchor map
python3 ~/Abraham/scripts/audio/es_match.py    # independent per-block match, catches divergence
python3 ~/Abraham/scripts/audio/es_cues.py     # both together -> audio/cues_es.json
```

**The Spanish recording does not contain Act Three — The Test.** It runs Act Two
straight into Act Four. That is why 80 of the 510 blocks have no Spanish cue and
the page shows a Spanish-only note on that act.

## The one rule

**The audio and the marks ship together.** New marks with old audio, or new
audio with old marks, put every chapter in the wrong place.
