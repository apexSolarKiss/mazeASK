# mazes-ASK // web instrument

The mazes-ASK maze lab as a browser instrument: the sketch's eight algorithms and four grids, on [design-system-ASK](https://github.com/apexSolarKiss/design-system-ASK)'s `instrument` pattern, in chrome that follows the system's light or dark setting. JavaScript and Canvas 2D; no p5, no framework, no build step.

The p5.js sketch, [`mazeASK.js`](../mazeASK.js), stays as it is. This folder is a separate chapter beside it.

## Open it

Its public address is [mazes.A-S-K.studio](https://mazes.a-s-k.studio/), served from this folder.

Locally, double-click `index.html`. It runs from disk; there is nothing to install. The browser icons do not show from disk, because the page names them by root paths, as a deployed site does.

To serve it instead, from this folder:

```bash
python3 -m http.server 8765
```

then open `http://localhost:8765/`, where the icons do show.

## What is here

| Folder or file | What it holds | Owner |
|---|---|---|
| `index.html` | the page: markup, copy, link-preview metadata, and a notice if a file it needs fails to load | mazes-ASK |
| `app/maze-engine.js` | the maze: generation, solving and drawing, ported from `mazeASK.js`. No DOM | mazes-ASK |
| `app/maze-app.js` | controls, loop, keys, undo and settings | mazes-ASK |
| `app/maze.css` | the page's own small additions: the frame note, and the phone full-window row | mazes-ASK |
| `checks/engine-sweep.cjs` | builds every algorithm on every grid it offers and checks each result is one perfect maze | mazes-ASK |
| `instrument.js`, `instrument.css` | frame fitting, full window, fullscreen, PNG saves and the shared control styles. Knows nothing about mazes | design-system-ASK, vendored |
| `_dsa-tokens/`, `_dsa-surface/`, `licenses/` | the design system's foundation, root modules and licenses | design-system-ASK, vendored |
| `favicon.svg`, `favicon-32.png`, `favicon.ico`, `apple-touch-icon.png` | the ASK browser icons, at the site root | design-system-ASK, vendored |
| `og-image.jpg` | the link-preview card, 1200 × 630 | mazes-ASK |
| `vercel.json`, `.vercelignore` | hosting: response headers, and what stays out of the deployment | mazes-ASK |
| `VENDOR.md` | the donor commit and every vendored file's identity | mazes-ASK |

The vendored files are byte-identical copies at one design-system commit. `VENDOR.md` records it and says how to re-sync.

## Hosting

The site is this folder as it is: there is no build step, and `vercel.json` only adds response headers. `.vercelignore` keeps `checks/`, this README and `VENDOR.md` out of the deployment.

The link-preview card, `og-image.jpg`, is cut from the repository's header image, [`docs/assets/mazeASK-3.jpg`](../docs/assets/mazeASK-3.jpg), and keeps its settings caption. It uses the same horizontal framing as the repository's GitHub social preview, a 1280 × 640 cut of the same image.

## Using it

- **new maze** makes a new maze for the frame on screen. Space does the same, as in the sketch.
- **algorithm** and **grid** are the sketch's keys `1`–`8` and `H` `T` `C` as controls. Sidewinder and Eller build row by row, so they offer squares only, as in the sketch; the other grids are shown but off for them.
- **density** scales the cells across and down from half to two and a half times the default, so the number of cells runs from about a quarter to about six times the default. It takes effect when you let go of the slider.
- Changing the algorithm, the grid or the density starts a new maze at once, as the sketch's keys did. **undo** brings back the previous maze for 8 seconds, newest first. On a phone in full window, `undo` takes the place of `save PNG` while it is available, so the row stays one line.
- **frame**: `free` is the shape on screen; `square`, `4:3` and `widescreen` are fixed. **save PNG** saves the maze at the frame's size: `square` 2160 × 2160, `4:3` 2880 × 2160, `widescreen` 3840 × 2160, and `free` the shape on screen at 2160 on its short side, with the long side capped at 3840.
- **full window** and **fullscreen** give the canvas the window or the screen. Where the browser refuses fullscreen, the page falls back to full window. Esc leaves full window.
- **show**: the puzzle's `ends`, its `solution` and the text `label`. Ends and solution appear once the maze is complete. What is shown is what is saved.
- **new colors** picks new colors by the sketch's rules and keeps the maze. Undo works here too.
- **tuning** holds **speed**, the sketch's steps per 1/60 s, and the **settings** line (see "Making the same maze again").

**Touch works the controls only.** The canvas takes no input: there is no tracing of a solution by hand, and clicking or touching it does nothing. Saving happens only from `save PNG`.

**What never makes a new maze:** resizing the window, rotating a phone, changing the frame, entering or leaving full window or fullscreen, switching the system between light and dark, and saving. Each of these draws the same maze again. A maze being built keeps building where it was.

### Keys

With the canvas or the page focused: space new maze, `1`–`8` algorithm, `H` hexagons, `T` triangles, `C` rings, `R` new colors, `E` ends, `S` solution, `[` `]` density, `-` `=` speed, `P` pause building. Esc leaves full window. Keys typed in a control, or with a modifier held, are left to the control and the browser.

## Making the same maze again

The settings line in `tuning` is a set of URL parameters, for example:

```text
seed=2026&algorithm=recursiveBacktracker&grid=rect&density=1&aspect=1.1958333333333333
```

Put after the page's address and a `?`, it makes the same maze again, on any screen and in any frame: the same seed, algorithm, grid and density, composed for the same frame shape, so the same grid size and the same walls. `aspect` is the width ÷ height of the frame the maze was composed for, written in full: the grid is sized from it, and a rounded value can size a different grid.

- **Remembered settings.** Opening such an address also makes its algorithm, grid and density the remembered settings, unless `store=0` is added.
- **Colors.** A page's first maze takes its colors from its seed, so a replayed maze has its seed's colors. A maze that kept the colors of the maze before it, or got `new colors`, comes back in its seed's colors instead.
- **The frame.** A maze shown in a frame of another shape sits whole inside it, with more ground around it, and the panel offers `new maze for this frame`. A saved PNG also depends on the frame it is saved in.
- **File names** are `mazes-ASK-<date>-<time>-<algorithm>-<grid>-<seed>-<W>x<H>.png`. They name the maze; the settings line holds what makes it again.

## From the sketch: what is the same, what changed

Kept as the sketch has them: the eight algorithms and their steps, the four grids and their geometry, the sketch's default grid sizes as the starting density, its palette with its weights and its rules for picking colors, the drawing order, line weights and alphas, the puzzle's ends and solution, and the keys apart from those below.

| Sketch | Here | Why |
|---|---|---|
| Resizing the window, `O` and `P` made a new maze | they draw the same maze | view changes keep the work |
| `O` output mode and `P` size cycling | the `frame` selector and `save PNG` at the exact preset size | a saved file no longer depends on making the live canvas 4K |
| Any click saved the canvas | only `save PNG` saves | no accidental saves; touch screens |
| One unit square stretched to the canvas on each axis | one scale factor: cells keep their true shape | the stretch distorted every cell |
| p5 `random`, no seed | seeded streams; each maze has a seed in the settings line and the file name | the same settings make the same maze again |
| The label always in the picture, with `speed n` | the label is optional (on by default), set in the design system's mono face, without the speed | the speed describes the building, not the maze |
| A finished maze redrawn 60 times a second | drawn once when finished, and again only when something changes | nothing is wasted while you look |
| `[` `]` changed the grid by 2 cells | they step `density` by 0.25 | one density control for keys and slider |
| `H` `T` `C` under Sidewinder or Eller made a new square maze | they do nothing; those grids are off for those algorithms | the control shows what is possible |
| The ring label read `96x8` | it reads `8 rings` | 96 is a ceiling, not a size |
| Triangle grids of any column count | an even column count | Binary Tree needs a downward triangle at each row's end; the sketch's defaults were already even |
| `P` cycled output sizes | `P` pauses building | output sizes are the frame selector now |

**Composition.** Cells keep their true shapes, and the grid is sized to fill the same box the sketch used: in a 16:9 frame the default square-cell maze is 56 × 24, where the sketch drew 46 × 24 stretched cells. As in the sketch, a frame narrower than 1.15 : 1 gets a "square" composition and a wider one a "wide" composition.

**Colors** come from the sketch's palette by its rules, which only ask walls to differ a little from the ground, so some draws have low contrast. `new colors` draws again. Colors stay from one maze to the next, as in the sketch.

**Building.** Saving while a maze is being built saves it as it is, as the sketch did. With the system's reduce-motion setting on, each new maze appears complete at once instead of being built step by step.

### Three repairs to the sketch's algorithms

Each one changed the maze from separate pieces into one maze. From this folder, `node checks/engine-sweep.cjs app/maze-engine.js 4 --legacy` builds 1,248 mazes (every offered algorithm and grid, four frame shapes, three densities, four seeds) and checks each is one perfect maze, then runs the sketch's unrepaired rules and the repaired ones on the same seeds.

1. **Binary Tree on hexagons.** The last cell of every odd row had no wall it was allowed to open, so the maze came out in pieces. That cell now opens the wall to its upper left. The sketch's rule fails 40 of 40 seeds here; the repaired rule fails none.
2. **Binary Tree on rings.** Every cell of one ring could choose its clockwise neighbor, closing a loop cut off from the center. The last cell of each ring now never chooses clockwise. The sketch's rule fails 1 of the 40 seeds tried; the repaired rule fails none.
3. **Wilson on every grid.** It stopped as soon as every cell was marked, one step before the last link is carved, so the last cells could be left cut off. A walk being carved now finishes. On 200 seeds the sketch's rule leaves 2 broken mazes on squares and 6 on rings; the repaired rule leaves none.

The sketch itself keeps its original rules.

**Puzzle ends, faster.** The sketch searched from every boundary cell to find the two farthest apart. A finished maze is a tree, so two searches find the same longest distance. Where two pairs tie, the pair may differ from the sketch's.

## Known limits

- **Checked in headless Chrome**, outside this repo: the page, its saves and its views, and the pixel comparisons below.
- **Checked on ASK's iPhone, in Safari:** full window and its `controls` panel, the hexagon grid, rotating the phone, which kept the same maze, and `save PNG`, which reached Files. The `fullscreen` control did not appear there: that browser did not offer the element fullscreen the page uses, and the page shows the control only where it is offered.
- **Untested:** real browser fullscreen (headless Chrome refuses it, and the iPhone check above is of full window), Safari on a computer, Firefox, other browsers on a phone, other phones, and tablets. Nothing was compared pixel for pixel outside headless Chrome.
- **Phones in particular:** the memory a 3840 × 2160 save needs on a phone, and the cost of redrawing every cell each frame while a large maze builds, are not measured.
- **The label's letters can differ by antialiasing** between the page's canvas and an off-screen drawing of the same maze; everything else matches pixel for pixel. A saved file matches a fresh drawing at its size to within one step in each color channel.
- **Wilson and Aldous-Broder are slow on large mazes**, as in the sketch: at a phone's portrait size and 2.5 × density, a few minutes at the default speed, worked out from the step count rather than timed on a phone. `speed` goes to 240.
- **Nothing is saved between visits except settings.** The algorithm, grid, density, speed, `show` choices and frame are remembered in the browser's local storage, under `mazeASK` and `mazeASK/frame`, the names they had before the project became mazes-ASK. The maze itself is not: a reload makes a new maze unless the URL names one.

## Not in this chapter

- Solving by hand, a timer, or any game.
- Saving and reopening a maze, or a share sheet.
- The iPhone and iPad build.

## URL parameters

None is needed for ordinary use. `seed=<n>`, `algorithm=<id or 1-8>`, `grid=rect|hex|triangle|radial`, `density=<0.5..2.5>`, `aspect=<width ÷ height>` (the frame shape the first maze is composed for), `speed=<1..240>`, `ends=1`, `solution=1`, `label=0`, `finish=1` (show each new maze complete), `play=0`, `frame=free|square|four-three|wide`, and `store=0` (neither read nor write remembered settings). A value that cannot be read is ignored.
