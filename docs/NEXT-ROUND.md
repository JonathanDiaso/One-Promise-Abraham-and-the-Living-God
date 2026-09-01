# One Promise — Next Round

Everything found while building click-to-play and fixing the Spanish switch. Each
item says what is wrong or missing, why it matters, and what going in looks like.

Nothing here is speculative — every gap was checked against the running site or
against `~/Panim/Panim-site/`, which is the model this rebuild follows.

---

## Shipped this round — do not redo

| What | Where |
|---|---|
| Click any line to hear it — all 510 cues are seek points, both directions | `index.html`, player IIFE |
| `P` plays from the line nearest the top of the screen (keyboard path) | same |
| Spanish narration actually plays — `BOOK.en` now flips with the language | same |
| Position stored per language under `op_lang_v1`, migrating `op_audio_v1` | same |
| English chapter marks, cues and click-to-play stand down in Spanish | same + `body.op-lang-es` CSS |
| The welcome card's EN · ES choice now picks the narration, not just the card copy | same |

---

---

# Verified and shipped — 1 September 2026

Every item below was checked against the running page before it was built. The
three verdicts that came back different from the write-up are called out; the
rest were accurate as written.

| Item | Verdict | What shipped |
|---|---|---|
| **B1** Search | Confirmed — no search existed | Full-text search over every block of running text **plus all 64 chapters**, diacritic folding, AND-matching with a prefix on the last term, ranked by where the hit falls. `/` opens it. A passage result jumps the page; a chapter result seeks the narration. |
| **B3** Missing site files | Confirmed — none of the four existed | `robots.txt`, `sitemap.xml`, `404.html`, `accessibility.html`, the last linked from a new page footer |
| **B4** OG image on a third-party host | Confirmed | `og:image` and `twitter:image` now point at `Abraham Stars.jpeg` on the site's own domain, plus `og:image:alt`, a `description` and a canonical link |
| **B5** Focus mode | Confirmed — none existed | Full-screen player: act, chapter, 88 px transport, ±30, seek, remaining time, sleep. Keyboard-trapped, `Esc` closes, focus restored on exit |
| **B6** Accessibility | Confirmed on every point | Skip link, a polite live region (chapter, act finished, sleep armed, language switched), `aria-valuetext` on the seekbar — “Act Three — The Test, 1 hour 12 minutes of 3 hours 10 minutes” — and a visible focus ring, which the page had nowhere |
| **B7** Seekbar | **Half wrong** | The buffered range shipped, drawn as a segment offset to the current act's place on the book timeline rather than growing from zero. The drag complaint does not hold: a native `input[type=range]` already takes implicit pointer capture, so a drag that leaves the 4 px track keeps tracking. Nothing to fix there. |
| **B8** Sleep timer | Confirmed | **END OF ACT** joins 30 / 60 / 90. Caught a quarter-second before the file's own `ended`, so the next act never loads. English only — Spanish has no act boundaries to end at, and says so |
| **B9** Per-act completion | Confirmed, **built differently** | A card at each of nine boundaries would stop a read the acts are deliberately built to run through. It ships as a toast — “✦ Act Three — The Test finished — 4 of 9” — and a spoken line |
| **A4** Spanish gaps | Confirmed on all three | The welcome card's control rows, the end-of-book card and both share strings now follow the language |
| **B2** Per-chapter URLs | **Revised** | `c/01 … c/09` as separate pages means nine copies of a 363 KB single-file site, and every future edit becomes ten edits. What shipped instead is `?t=SECONDS`, which opens the book at a point in the narration and can be sent to someone. The full split is still worth doing **only** if the page is ever broken out of one file. |
| **A1–A3** Spanish audio | Confirmed, **not shippable from here** | Baking the score, cutting acts and building Spanish cues all need the 282 MB Dropbox file, a Spanish transcript and hours of `musicmix.py`/`level.py`. Nothing about it is a page change. Still the top of the list. |

Also done in the same pass: `sw.js`'s `SHELL` bumped to `v2` (a precached
`index.html` changed, and without a new cache name returning visitors are served
the old build forever), and the live URL, the publish steps and that cache rule
written into the top of `index.html` and `README.md`.

---

# The Spanish read-along — 1 September 2026

**A3 is done, and it turned up something the write-up did not know.**

## What the Spanish recording actually is

It is not this book in Spanish. It is a different cut of it.

The reader announces **Act 1**, then **Act II**, and then **Act 4**. There is no
Acto 3. Measured block by block against the page:

| Act | In the Spanish recording |
|---|---|
| Prologue — The Spirit | 48 / 49 |
| Act One — The Promise | 54 / 55 |
| Act Two — The Mistake | 65 / 65 |
| **Act Three — The Test** | **0 / 78** |
| Act Four — The Fulfillment | 51 / 51 |
| Act Five — The Expansion | 61 / 61 |
| Act Six — The Wildfire | 50 / 50 |
| Act Seven — The Fractures | 29 / 29 |
| Act Eight — The Unfinished Story | 72 / 72 |

Moriah, the third day, the ram, Eid al-Adha, Rebekah at the well — 27 and a half
minutes of English narration — are not in the Spanish edition. Some Moriah
phrasing surfaces later inside its Act 4, but the act itself was never recorded.
**That is an editorial decision waiting to be made, not a bug to fix.** Until it
is, the page says so in Spanish on that act rather than letting the read-along
quietly stop working for half an hour.

## How the timing was found

No Spanish transcript existed, so one was made — and made in English on purpose.

1. `es_blocks.py` pulls the 510 blocks out of the page with their English times.
2. whisper (`small`, translate task) turns the Spanish recording into English
   text carrying Spanish timestamps — 11 minutes for the whole book. The turbo
   models cannot do this; they are transcribe-only and hand back Spanish.
3. `es_align.py` finds rare 4-grams that occur exactly once on each side, keeps
   the longest run that never goes backwards, and gets 4,016 control points.
4. `es_match.py` independently makes every block vote for a place in the audio
   with its rare words, and refuses to guess when nothing wins clearly.
5. `es_cues.py` maps a block only where an anchor is within 30 s to vouch for it
   and the two methods agree to within a minute.

**How good it is, measured rather than asserted.** Hold out a fifth of the
anchors and predict them from the rest: median error **0.03 s**, 95th 0.95 s. And
where the map puts each act start, against where the reader is actually heard
saying it:

| | map | announced | diff |
|---|---|---|---|
| Act One | 1112.4 | 1112.5 | −0.1 s |
| Act Two | 3010.3 | 3019.6 | −9.3 s |
| Act Four | 4933.4 | 4920.9 | +12.5 s |
| Act Five | 6504.2 | 6509.2 | −5.0 s |
| Act Six | 7951.5 | 7957.2 | −5.7 s |
| Act Eight | 10085.2 | 10084.6 | +0.6 s |

## What shipped

`audio/cues_es.json` — 430 cues, 45 chapter marks, 7 act ticks (I, II, IV, V, VI,
VII, VIII: no III, because there is no III). In Spanish the page now highlights,
scrolls, tracks chapters and takes a tap on a line, exactly as it does in
English. Checked in a browser against the real Dropbox file: 7 of 8 sampled cues
land on the block they name, the eighth on its neighbour; tap-a-line lands within
2 s; English restores completely on the way back.

Still open: **A1** (the piano bed under the Spanish read), **A2** (cutting Spanish
into acts, which is what would give it offline and end the Dropbox dependency), a
real third-party accessibility audit, and B2's full chapter split if the single
file is ever broken up. **And the Act Three question above.**

---

## If you only do three

**#1 Music on the Spanish narration.** **#2 Split Spanish into acts.** **#3 Search.**

The first two are the same job done once, and they unlock offline, chapter marks
and text sync for half the audience. The third is the biggest hole in the page.

---

# A. The Spanish narration

Spanish is currently **one flat 282 MB mp3** streamed from Dropbox
(`Spanish.mp3`, 192 kbps mono, 3:25:37, `rlkey` share link, Range-seekable, CORS
open). English is nine AAC files at 96 kbps mono, 138 MB total, with a piano bed
baked in. Almost everything below follows from that difference.

## A1. Bake the piano bed into the Spanish audio — **the headline item**

English narration is not narration plus a music player. The score is **inside the
file**: `musicmix.py` composes a different arrangement per act, holds it steady
under the voice, drops a quiet spell every 2–4 minutes starting inside one of the
reader's own pauses, and lifts the bed in the act doors. There is nothing to turn
on and nothing to adjust. Spanish is dry.

A Spanish listener is getting a materially lesser edition of the same book, and it
is the half of the audience that cannot tell whether that was a choice.

**The pipeline already exists** — `~/Abraham/scripts/audio/`, run from
`~/Downloads/Abraham-MUSIC-WORK`:

```
concat.py    masters      -> voice-full.wav + timeline.json
musicmix.py  voice-full   -> mix-raw.wav        UNDER=28 is the level
level.py     mix-raw      -> loudness master, -16 LUFS
             master       -> cut to actNN.m4a
```

**The blocker is `timeline.json`, not the music.** `musicmix.py` reads act
boundaries to know where the doors are, where each new arrangement starts, and
where to lift the bed. It cannot be pointed at a flat file. So:

1. Locate the eight act headers in the Spanish recording. The English ones were
   found in the mastered SRTs (`ACTS_IN_FILE` in `concat.py`); Spanish needs the
   same, from a Spanish transcript or by ear.
2. Write a Spanish `timeline.json` in the same shape — `sr`, `act_gap`,
   `duration_s`, `file_offsets`, `acts[{t,label,file,t_in_file}]`.
3. Run `musicmix.py` with **`UNDER=28`** — the locked level, same as English. Do
   not re-derive it from samples; it was chosen by ear and it is the house level.
4. `level.py` to −16 LUFS, then cut to acts.

Note this is step 2 of A2 as well. Doing the boundaries once gets you both.

**Watch for:** the quiet spells key off pauses of ≥2 s in the reading. A Spanish
read with a different rhythm may offer fewer of them; if the spells come out
sparse or clustered, `SPELL_EVERY_LO/HI` and `SPELL_GAP_S` are the knobs, and the
one rule is that a transition never starts mid-sentence.

## A2. Cut Spanish into acts

Once the boundaries from A1 exist, cut Spanish the way English is cut. This is
what the rest of the Spanish list depends on:

- **Offline.** The offline sheet lists acts and hands them to the service worker.
  A single remote Dropbox file cannot be saved at all, so a Spanish listener has
  no offline edition and re-streams 282 MB from Dropbox every session.
- **Weight.** 192 kbps mono for narration is roughly double what this needs.
  Re-encoding to AAC 96 k mono, matching English, takes 282 MB to about 140 MB.
- **The Dropbox dependency.** English is served from the repo. Spanish is one
  third-party share link away from a dead page. Acts in `audio/` end that.

## A3. Spanish cues and chapter marks

Right now the 510 cues, the 64 chapter marks, the 8 act marks, FOLLOW and
click-to-play are all English-only, and the site correctly switches them off in
Spanish rather than showing them at wrong times. But "correctly off" is still off:
the Spanish reader gets a plain audio bar under a page that does not move.

With acts in place, `cues.py` and `marks.py` can be run against a Spanish
transcript exactly as they were for English. The text on the page is English, so
what a Spanish cue would highlight is a design question worth settling before the
work: highlight the English block the Spanish audio is currently reading (useful
for a bilingual reader) or ship Spanish body copy too (much larger job).

## A4. Small Spanish gaps

- The onboarding card's control list (`#onboard-controls`) stays English even when
  the card is switched to Spanish. `OB_TEXT` translates title, sub, intro, lang
  note, footer and button, but not the six control rows.
- The end-of-book completion card (`#audio-complete`) is English-only.
- `shareDoc` and the completion card's share text are English-only.

---

# B. What Panim has that this does not

Checked against `~/Panim/Panim-site/`.

## B1. Search — the biggest hole

Panim has `js/search.js`: diacritic folding, AND-matching with a prefix on the
last term, results ranked by *where* the hit is rather than just that it happened.
One Promise has no way to find a passage. On a 3-hour book that is the single most
missed control.

## B2. Per-chapter URLs

Panim ships `c/01` … `c/10`, so a chapter can be linked, shared and indexed on its
own. One Promise is one URL — there is no way to send someone Act Three. This also
feeds B3: a sitemap with one entry is not worth much.

## B3. The site files that are simply absent

Panim has all four; this repo has none:

| File | Why |
|---|---|
| `robots.txt` | Nothing tells a crawler what to do |
| `sitemap.xml` | Pairs with B2 |
| `404.html` | A mistyped path gets GitHub's default page, not the book's |
| `accessibility.html` | Panim publishes a statement; there is a real one to make here |

## B4. The OG image is on a third-party host

`og:image` points at `https://i.ibb.co/PsN1Qvvy/Abraham-Stars.jpg`. Every share
card on every platform depends on a free image host staying up. `Abraham
Stars.jpeg` is **already in this repo** — point at the raw GitHub URL, or add a
proper `og-card.jpg` sized for the crop, the way Panim does.

Same class of problem as A2's Dropbox dependency: the two most visible things
about the site both live somewhere the author does not control.

## B5. Focus mode

Panim's `js/room.js` is a full-screen minimal player — big transport, chapter,
clock, seek, sleep, nothing else — for listening with the page out of the way.
This site has a floating play button and a bar; there is no way to put the book
down and just listen.

## B6. Accessibility pass

Panim's source cites specific WCAG criteria it was fixed against. Here:

- **No skip-to-content link.** A keyboard user walks the whole nav on every load.
- **No `aria-live` region.** Nothing is announced — not the chapter change, not
  the sleep timer arming, not an act finishing.
- The seekbar announces a bare percentage. Panim explicitly fixed this because
  "37" is not a position in a book.
- Click-to-play shipped with a keyboard equivalent (`P`) rather than 510 tab
  stops, but that is one control, not an audit. The page has never had one.

## B7. Seekbar

Panim shows the **buffered range** and has a real draggable handle with pointer
capture, so the drag survives the finger leaving the 3 px track. This site's
seekbar is a bare `<input type="range">`: no indication of what has loaded, and a
drag that slips off the track is a drag that ends.

## B8. Sleep timer — "end of act"

Options here are 30 / 60 / 90 minutes. Panim offers end-of-chapter, which is the
one people actually want: not "stop in 30 minutes" but "let this finish." The act
boundaries are already in `BOOK_ACTS`, so the arithmetic is on hand.

## B9. Per-act completion

There is one completion card, at the end of the whole book (`#audio-complete`).
Panim marks each chapter done and offers next / bookmark / resume tomorrow. Over
3 hours in nine acts, finishing Act Three should feel like finishing something.

---

# C. Notes for whoever picks this up

- **The audio and the marks ship together.** New marks with old audio, or new
  audio with old marks, put every chapter in the wrong place. This is the one rule
  from `~/Abraham/WHERE-EVERYTHING-IS.md` and it now applies twice over, once per
  language.
- **`UNDER=28` is locked.** It was chosen by ear from one-minute samples. Spanish
  matches it; it does not get its own number.
- **`BOOK.en` is the language switch.** With it false the nine-act machinery
  stands down and the raw element's clock is used directly. Anything new that
  reads `narrEl.currentTime` or `narrEl.duration` is reading a *synthetic* value
  in English and a real one in Spanish — check the flag before assuming a timeline.
- **Test seeking against a Range-capable server.** Python's `http.server` ignores
  `Range`, so Chrome marks every file unseekable and audio work appears broken
  when it is not. This cost an hour; do not repeat it.
