# VENDOR // design-system-ASK files in `web/`

Donor: [`apexSolarKiss/design-system-ASK`](https://github.com/apexSolarKiss/design-system-ASK) at commit `89397df24550bd5c7f1d64d1c8a8b46143c0219f`.

Every file below is a byte-identical copy of the donor's file at that commit. None is edited here. The maze's own additions live in `app/maze.css`, which loads after them.

| Local path | Donor path | Bytes | SHA-256 | Git blob |
|---|---|---:|---|---|
| `_dsa-tokens/colors_and_type.css` | `colors_and_type.css` | 17,649 | `5aceed44caea4a7643de432deb4370ce43a848a16e5e75ddcfb5a6bb93f62481` | `9e120023ee55347160e230103451219f1b19ae6f` |
| `_dsa-tokens/fonts/InterVariable.woff2` | `fonts/InterVariable.woff2` | 352,240 | `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3` | `5a8d3e72ad7ffb62af3b146e1b1f54ab5813a212` |
| `_dsa-tokens/fonts/InterVariable-Italic.woff2` | `fonts/InterVariable-Italic.woff2` | 387,976 | `e564f652916db6c139570fefb9524a77c4d48f30c92928de9db19b6b5c7a262a` | `b3530f3f5269165314114a9e1c2f129e20fddcbd` |
| `_dsa-tokens/fonts/JetBrainsMono.woff2` | `fonts/JetBrainsMono.woff2` | 113,672 | `31ec365b93e4bad6f202ce23352a56d01ca4462b2afc782ed2cf6fa42ca9ac0e` | `856547f84b0365f4db7bfee3ac88f558a117410e` |
| `_dsa-tokens/fonts/JetBrainsMono-Italic.woff2` | `fonts/JetBrainsMono-Italic.woff2` | 123,160 | `76a805b6ea613ce2e3973f1bac6fa29db23116b2881390b59247d22890844ecc` | `5e8a82e3669297716702f70a5f9ca242ca050896` |
| `_dsa-tokens/fonts/Inter-OFL.txt` | `fonts/Inter-OFL.txt` | 4,380 | `262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a` | `9b2ca37b3ffc77391d8b2ebef4a974ef32bf46ea` |
| `_dsa-tokens/fonts/JetBrainsMono-OFL.txt` | `fonts/JetBrainsMono-OFL.txt` | 4,399 | `a76abf002c49097d146e86740a3105a5d00450b1592e820a1109a8c5680cd697` | `5ceee0025da23d2cd5fd14b28569708a8db4db2b` |
| `_dsa-surface/surface-action.css` | `surface-action.css` | 21,898 | `f00ccde1b4db17687fd6ecd62644700932107352b37476184718f2036209fb2e` | `9d827ae1f4814c45353e4a1a61cc8814e26f0ed5` |
| `_dsa-surface/surface-panel.css` | `surface-panel.css` | 11,230 | `883e24ac5407a4fe24f9149b0d8964a06995cc88b6b6150b1a1bdfd9aee2976e` | `12582f538ad7b3c7e2ba229101e481a39dd5657a` |
| `_dsa-surface/surface-treatments.css` | `surface-treatments.css` | 71,897 | `03bb8b36c5f058d8783442cc1ea499b0076892ca27047d80f2a1ccd99a56f6ba` | `d0972f121fd7e65976149d53e4a2ef385ef3960f` |
| `instrument.css` | `patterns/instrument/instrument.css` | 15,381 | `c19d76b2c90c2d8b6572cd418010515be583856bc356362a0a090dbb2d4ba25d` | `1a623c1b5cc17883dfc732a7efd6a1b1b24a7935` |
| `instrument.js` | `patterns/instrument/instrument.js` | 27,672 | `84b951c3150dbedc35c11db5d37c573e8ce387ba7a90ab56af97caab29471f19` | `77f08d20c03bbe153d96f583d0ca1576f3d5f1ba` |
| `licenses/design-system-ASK/LICENSE` | `LICENSE` | 10,835 | `8188fe74beac4005f834721ae459e84909cd42c55554549ad750f50fcfc20801` | `0c382f604647738e78449026c3dd3d5c26702a6f` |
| `licenses/design-system-ASK/NOTICE` | `NOTICE` | 1,602 | `8b6de487f00ed3b3ec4835b9a3ed44a3785d705e2840157d165d8e96356759aa` | `985a32e5583c599c494d16030fb5d2dae6fe4fbf` |
| `favicon.svg` | `favicon.svg` | 1,585 | `1033f1c23123d78b8650de49ea413c85e1937014c866812229552c89d645cc6b` | `b753ce2377098b3e670935393b5ebf5b69de2114` |
| `favicon-32.png` | `favicon-32.png` | 1,451 | `9f08639c0523fae1aa7a782567b66d3ca5a9ac0929150a72deca9455f397d390` | `3b133ce50f7c1e3cad67fea5ca481c8705d40a42` |
| `favicon.ico` | `favicon.ico` | 1,473 | `6e34ba4e8ce3519aac8e244ac456c4523dd238237f8ac6104708e0b8e1ca6c1d` | `23e97f6efc77845b72d944a7daf6d1e4d47cf42a` |
| `apple-touch-icon.png` | `apple-touch-icon.png` | 6,715 | `e2fc718650c99c9e610ad232a30dcf9308dcd5223094e06f04eeb502f2313b5d` | `5ffdfb6373d8d75ed0ad2c2e7c65a98a8423e28b` |

The Git blob column is the id `git rev-parse <commit>:<donor path>` gives in the donor and `git hash-object <local path>` gives here.

## Load order

```text
_dsa-tokens/colors_and_type.css
_dsa-surface/surface-action.css
_dsa-surface/surface-panel.css
_dsa-surface/surface-treatments.css      must follow surface-panel.css
instrument.css                           the design system's instrument pattern
app/maze.css                             the maze page's own additions, last
```

Scripts: `app/maze-engine.js`, then `instrument.js`, then `app/maze-app.js`.

`colors_and_type.css` reaches its fonts by a path relative to itself, so `fonts/` stays beside it. `instrument.css` and `instrument.js` sit beside the page, as in the pattern's template (`patterns/instrument/instrument.template.html`). The four browser-icon files sit at the folder root, which is the deployed site's root.

## What is used, and what is not vendored

- `colors_and_type.css`: tokens, type, and the light / dark mechanism. The page sets no theme attribute, so the chrome follows the operating system.
- `surface-action.css`: every action button.
- `surface-panel.css`: the controls panel, and the stage frame's panel material and free attachment.
- `surface-treatments.css`: the stage frame's flush elevation, and the `controls` and `tuning` disclosure triggers.
- `instrument.css`, `instrument.js`: the instrument pattern. Its contract is `patterns/instrument/README.md` in the donor.
- `favicon.svg`, `favicon-32.png`, `favicon.ico`, `apple-touch-icon.png`: the ASK browser-icon package, which ASK assigns to this instrument's browser chrome. The page declares `favicon.svg`, `favicon-32.png` and `apple-touch-icon.png` with root paths, in the form the donor's README gives for a deployed origin (§Browser icons); `favicon.ico` answers the browser's own request for it.
- Not vendored: the pattern's example script (`instrument.example.js`, example content only), `art-palettes.json` (the maze draws its own sketch palette), `surface-text-link.css`, `surface-cta.css`, the page shell, `fonts-embedded.js` and `styleguide-theme-control.js`, and the donor's `og-image.png` (the ASK social card; this site has its own card). Nothing here uses them.

## Licenses

The design-system files are Apache-2.0 (`licenses/design-system-ASK/LICENSE`, with its `NOTICE`). Inter and JetBrains Mono are under the SIL Open Font License 1.1; each license text sits beside the font files.

## Re-sync

Re-sync when the donor changes one of these files: copy each again from the donor commit with `git -C <donor> show <commit>:<donor path> > <local path>`, check the blob ids, and rewrite the donor commit and this table. Re-sync all of them at one commit; never edit a copy here.
