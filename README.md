# Daily Queue

A daily puzzle arcade for you and your friends, ready for GitHub Pages.

- **Wordle:** One focused five-letter game with 1,061 curated answers, six guesses, a 15,922-word guess dictionary, animated letters, and physical or on-screen Enter.
- **Rift:** Three League of Legends games—Champion Clues, Role Queue, and Champion Silhouette—using a frozen roster of 173 champions.
- **Dex:** Three Pokémon games—Kanto Clues, Type Scan, and Who’s That Pokémon?—limited to the original 151 Pokémon from Generation 1.
- Each category has its own visual world: a neon letter arcade for Wordle, a champion archive with Graves, Viego, and Pyke for Rift, and a red Pokédex scanner with Charizard, Charmander, and Pikachu for Dex.
- Click **Refresh lineup** whenever you want to keep playing. It starts a deterministic practice lineup immediately, saves it in that browser, and leaves the normal daily set available through **Back to today’s set**. Practice results are labeled so they are not confused with the shared daily result.
- Same puzzles for everyone. New puzzles at **midnight America/Chicago**, with daylight saving time handled automatically.
- Progress survives refreshing and reopening in the same browser. Device-local saves; no login or shared leaderboard.
- Keyboard and touch controls, name suggestions, optional hints after three guesses, animated feedback, and spoiler-free result copying.
- Game data, portraits, sprites, and fonts are bundled. No API keys, scheduled jobs, build process, or paid server needed.

## Put it on GitHub Pages

1. Unzip this download on your computer.
2. Create a new GitHub repository, for example **daily-queue**. A public repository works with GitHub Free.
3. Upload the **contents** of the `daily-queue` folder to the repository. `index.html`, `app.js`, `engine.js`, `data.js`, `styles.css`, and `assets` must appear directly at the top level. Do not upload only the ZIP or nest everything one folder down.
4. Commit the upload to `main`.
5. Open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, then **main** and **/ (root)**. Click **Save**.
6. GitHub will show your website link on that page when deployment finishes. Send that link to your friends.

The portraits are combined into one compact asset file, so you can upload the entire folder through GitHub’s website. GitHub Desktop also works.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

You can also double-click `index.html` to try the game locally. If your browser blocks clipboard access on local files, the result appears in a text box you can copy manually.

## How the refresh works

The game computes a shared daily date in US Central time. A deterministic shuffled schedule chooses one answer per mini-game. Refreshing the page does not change the puzzle or erase guesses. The **Refresh lineup** button starts a new deterministic practice lineup immediately; **Back to today’s set** restores the shared daily lineup. Each roster cycles without repeating an answer within that cycle; a boundary between cycles can repeat.

There is no daily upload to perform. The bundled roster is a frozen snapshot, so everyone on the same version sees the same result. League stats are from Data Dragon **16.20.1**, captured October 8, 2026. New champion or Pokémon releases are not automatically added. Replacing or reordering a roster changes that game's schedule, so coordinate roster updates with your group.

## Playing with friends

Each friend opens the same website and plays their own copy of the daily puzzles. **Copy result** and **Copy daily results** create the colored grids you can paste into Discord or another group chat. Guesses are not broadcast live, and there is no synchronized multiplayer room or automatic leaderboard.

Names and answers are kept out of share text. A used hint is marked. Unfinished games are marked as in progress.

Progress lives in browser storage under versioned `daily-queue` keys. It does not sync between devices. Private browsing, clearing site data, a different domain, or disabling storage can remove or isolate progress. If storage is unavailable, the game explains that the current tab is temporary.

This is a client-side game for friendly competition. Like other static puzzle sites, its answer data can be inspected by a determined player; it has no server-side anti-cheat.

## Files

- `index.html`: page structure and metadata
- `styles.css`: responsive layout and visual theme
- `engine.js`: daily schedule, Central-time reset, and comparison rules
- `app.js`: controls, saves, hints, results, and progressive WebMCP support
- `data.js`: bundled answer pools and dictionary
- `assets/`: local images and fonts
- `assets/themes/`: the themed League splash art and Pokémon official artwork used by Rift and Dex
- `tests/engine.test.cjs`: focused puzzle logic tests
- `CREDITS.md` and `LICENSES/`: source attribution and licenses

To run the engine tests with Node.js: `node --test tests/engine.test.cjs`.

The optional browser WebMCP tools read visible progress and submit ordinary guesses. Unsupported browsers use the regular interface. They do not expose unsolved answers.

## Customization

Change the name in `index.html` and the share heading in `app.js`. Edit the color variables near the start of `styles.css` to change the theme. All paths are relative, so the site works under a repository URL such as `username.github.io/daily-queue/`.

Read `CREDITS.md` before reusing third-party artwork. This is an independent fan project.
