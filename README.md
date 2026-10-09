# Daily Queue

Daily Queue is a polished, static puzzle arcade for a Discord friend group. It needs no account, server, API key, build step, or database—upload the folder to GitHub Pages and play.

## What is inside

- **Word & logic (8):** Wordle, Category Match, Word Ladder, Codebreaker, Anagram Rush, Letter Hive, Mini Crossword, and Logic Lab.
- **League of Legends (5):** Classic clue table, Quote & Riddle, Ability, Emoji, and Splash.
- **Kanto (5):** Classic clue table, Mystery Card, Description, harder Who’s That Pokémon?, and Type Detective.
- Every Pokémon answer is from the original **151**. The hard silhouette mode starts with a cropped, tilted shadow and reveals more after misses.
- League feedback is explicit: green = correct, amber = partial, red = incorrect, and arrows show when a numeric clue is higher or lower.
- Every game has a **New puzzle** button. Daily rounds stay shared; free-play rounds are unlimited and saved in the current browser.
- Physical Enter and on-screen Enter both submit guesses. Tile flips, clue reveals, card blur, silhouette scans, and result celebrations respect reduced-motion settings.
- Challenge links preserve the exact puzzle. Copy result creates a spoiler-light summary that is easy to paste into Discord.

## Put it on GitHub Pages

1. Unzip this download.
2. Create or open the repository you want to use (for example, `daily-queue`).
3. Upload the **contents** of this folder so `index.html`, `app.js`, `engine.js`, `puzzle-engine.js`, `data.js`, `puzzles.js`, `styles.css`, and `assets/` are at the repository root. Do not upload only the ZIP or nest the folder one level down.
4. Commit to `main`.
5. Open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
6. GitHub will show the Pages URL when deployment finishes. Send that URL to your Discord.

The site also works from a local `index.html` preview. Clipboard permissions are stricter for local files; if copying is blocked, Daily Queue opens the result in a text box so it can still be copied manually.

## How the rounds work

The shared daily set uses America/Chicago dates and rolls over automatically at midnight, including daylight-saving changes. A refresh does not erase progress. **New puzzle** creates a deterministic-looking free-play seed immediately and leaves the daily round available through **Today’s puzzle**.

Progress and favorites are stored only in the current browser. There is no live multiplayer room or synchronized leaderboard. Friends play the same challenge link asynchronously and compare their copied results in Discord.

## Sources and customization

League names, portraits, splash art, and ability art come from Riot’s Data Dragon snapshot bundled in `assets/` and frozen in the included data files. Kanto facts and artwork come from the PokéAPI ecosystem and are limited to #001–151. Word data comes from the included English word sources. See `CREDITS.md` and `LICENSES/` before redistributing third-party artwork.

To change the visual identity, edit the CSS variables at the top of `styles.css`. To change the page title or brand, edit `index.html`. All asset paths are relative, so repository URLs such as `username.github.io/daily-queue/` work without extra configuration.

## Files

- `index.html` — accessible page shell and metadata
- `styles.css` — responsive arcade, Rift, and Pokédex worlds
- `app.js` — routing, controls, saves, hints, results, sharing, and animations
- `engine.js` — shared daily schedule and comparison rules
- `puzzle-engine.js` — seeded game generation and puzzle helpers
- `data.js` — Wordle and roster data
- `puzzles.js` — bundled groups, ladders, hives, crosswords, riddles, abilities, and Kanto clues
- Official champion and Kanto puzzle art is requested over HTTPS at play time; the six theme images remain local in `assets/themes/` so the GitHub upload stays small.
- `assets/themes/` — Graves, Viego, Pyke, Charizard, Charmander, and Pikachu theme art
- `CREDITS.md` and `LICENSES/` — attribution and included licenses

Run the focused engine tests with `node --test tests/engine.test.cjs`.
