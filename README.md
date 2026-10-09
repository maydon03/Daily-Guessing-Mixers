# Daily Queue — Friends edition

Mason’s Discord puzzle arcade for Thack, Isaac, Ryan, and Brent. This is a complete static GitHub Pages site: no account, build step, API key, or installation is needed to play.

## Update your existing GitHub site

1. Download and extract `daily-queue-github.zip` on your computer.
2. Open your existing game repository on GitHub and choose **Add file → Upload files**.
3. Drag in **everything inside the extracted folder**, including `assets/`. The files `index.html`, `app.js`, `squad.js`, `vault.js`, and the other files must be at the repository root. Upload the extracted files, not the ZIP itself.
4. Commit the changes to the branch your Pages site uses. Existing files with the same paths are replaced.
5. Wait for the Pages deployment to complete, then refresh your site with **Ctrl+Shift+R**. The new home page says **Your people. Your games. One more mix.** and shows **19 games**.

If this is a new repository, enable **Settings → Pages → Deploy from a branch → main → / (root)**. For an existing working Pages site, keep its current Pages settings. There is no need to delete your repository or change its address.

## Nineteen games

- **Word & logic:** Wordle, Category Match, Word Ladder, Codebreaker, Anagram Rush, Letter Hive, Mini Crossword, Logic Lab, and the new **Cryptic Vault**.
- **League:** Classic, Quote & Riddle, Ability, Emoji, and Splash.
- **Kanto:** Classic, Mystery Card, Description, Who’s That Pokémon?, and Type Detective.

The original eighteen games retain their engines, answer data, rules, saved-round format, keyboard controls, feedback, daily rounds, and unlimited **New puzzle** button. Pokémon answers remain the original 151. Pancham and Groudon appear only in the personal theme art and archive clues.

Each game has a friend-inspired background, character banner, visual motif, animation, and custom result message. The main home page shows each person’s catchphrase. Animations respect the system’s reduced-motion preference and the site’s **Settings → Animations** switch.

## The Cryptic Vault

Six authored cryptic clues make one round. A clue can use an anagram, reversal, deletion, joined word parts, homophone, hidden word, or double definition. Answer lengths and an extraction position are shown. Each solved lock reveals its wordplay explanation and one marked letter. Read the six marked letters in order to find the final word.

- Standard: unlimited wrong guesses and three optional hints per clue.
- Expert: eight wrong submissions total, no hints. Select it before attempting a clue or using a hint.
- Answers ignore spaces, case, and punctuation; repeated wrong submissions on the same lock do not consume more attempts.
- **New puzzle** builds a new combination from sixty authored clues. It preserves your Expert preference.

## Stream the friend hunt on Discord

1. Open **The Archive** in the header, then select **Begin the hunt**.
2. Four cases are available at once. Read a case’s location riddle and find the game it describes.
3. That game has an animated **Archive signal found** button. Inspect it and solve its quiz, riddle, cipher, or word puzzle.
4. Collect its evidence and follow the next location riddle. Each case has four stops; the sixteen stops are spread across sixteen different games.
5. Identify each friend from the collected evidence. Finding all four unlocks the final cooperative deduction board and the animated group message.

One person streams and controls the site; everyone calls out ideas in Discord. No shared account or live room is needed. Use location hints if you lose the trail, and use the separate question hint after finding a fragment. You do not have to win the normal games, or solve the Cryptic Vault, to finish the hunt.

**Hunt on/off** controls clue markers. Turning it off pauses the hunt while you keep playing. New puzzle, daily rollover, and ordinary page refresh never reset your hunt. Progress saves in the streamer’s browser; it is not synchronized across devices. **Reset hunt** clears only archive progress after an in-site confirmation. The ending has an animation replay and optional sound; sound is off initially.

## Daily rounds, saves, and sharing

Daily puzzles change at midnight in America/Chicago. **New puzzle** gives a new free-play round immediately; **Today’s puzzle** brings back the daily round. Challenge links share the same puzzle seed, and **Copy result** provides a spoiler-light Discord summary. Existing v4 game progress and favorites carry forward when this update replaces the old files at the same site address.

The page can be opened from `index.html` for a quick local look. Use your published HTTPS site for dependable persistent saves and sharing. Champion/puzzle artwork is fetched over HTTPS; the character theme backgrounds are bundled locally to keep the upload small and the interface recognizable.

## Files and customization

- `index.html`, `styles.css`, `squad.css`: layout, responsive presentation, animations.
- `app.js`: game controls, routing, rounds, results, and saves.
- `engine.js`, `puzzle-engine.js`, `data.js`, `puzzles.js`: the original game engines and data.
- `squad-data.js`: friend themes, catchphrases, and the authored hunt content.
- `squad.js`: archive state, clue markers, friend reveals, final board, and finale.
- `vault.js`: cryptic clue bank, seeded round construction, and controls.
- `assets/`: local fonts, marks, and official theme art.
- `CREDITS.md`, `LICENSES/`: sources and third-party attribution.

Keep the artwork decorative: changes to a theme should not change the answer roster. Hunt content, including its solutions, is in `squad-data.js`; avoid opening it on stream if you want to preserve the surprise.

## Verification

Run `node --test tests/*.cjs` to check scoring, daily scheduling, wordplay integrity, and 1,000 generated Cryptic Vault rounds. The update also passed scripted DOM play-throughs of all nineteen games, all sixteen hunt steps, the final board, reload recovery, and archive-only reset. The original engine and answer-data files were compared byte-for-byte with the prior eighteen-game release. A rendered browser visual review was not available in the build environment.
