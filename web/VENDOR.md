# VENDOR // design-system-ASK files in `web/`

Donor: [`apexSolarKiss/design-system-ASK`](https://github.com/apexSolarKiss/design-system-ASK) at commit `8b3ed833506edb1057abd4adcf9e5d09d4d2a6a1`.

Every file below is a byte-identical copy of the donor's file at that commit. None is edited here. The maze's own additions live in `app/maze.css`, which loads after them.

| Local path | Donor path | Bytes | SHA-256 | Git blob |
|---|---|---:|---|---|
| `_dsa-tokens/colors_and_type.css` | `colors_and_type.css` | 17,360 | `ec6790961ce6fc07a2403f3fa5c3d6a77ff1981c1a6bf0b2ac24fdb5d730a778` | `9b0ebc433d38c76f7a210f4e779a6a071edcbf01` |
| `_dsa-tokens/fonts/InterVariable.woff2` | `fonts/InterVariable.woff2` | 352,240 | `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3` | `5a8d3e72ad7ffb62af3b146e1b1f54ab5813a212` |
| `_dsa-tokens/fonts/InterVariable-Italic.woff2` | `fonts/InterVariable-Italic.woff2` | 387,976 | `e564f652916db6c139570fefb9524a77c4d48f30c92928de9db19b6b5c7a262a` | `b3530f3f5269165314114a9e1c2f129e20fddcbd` |
| `_dsa-tokens/fonts/JetBrainsMono.woff2` | `fonts/JetBrainsMono.woff2` | 113,672 | `31ec365b93e4bad6f202ce23352a56d01ca4462b2afc782ed2cf6fa42ca9ac0e` | `856547f84b0365f4db7bfee3ac88f558a117410e` |
| `_dsa-tokens/fonts/JetBrainsMono-Italic.woff2` | `fonts/JetBrainsMono-Italic.woff2` | 123,160 | `76a805b6ea613ce2e3973f1bac6fa29db23116b2881390b59247d22890844ecc` | `5e8a82e3669297716702f70a5f9ca242ca050896` |
| `_dsa-tokens/fonts/Inter-OFL.txt` | `fonts/Inter-OFL.txt` | 4,380 | `262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a` | `9b2ca37b3ffc77391d8b2ebef4a974ef32bf46ea` |
| `_dsa-tokens/fonts/JetBrainsMono-OFL.txt` | `fonts/JetBrainsMono-OFL.txt` | 4,399 | `a76abf002c49097d146e86740a3105a5d00450b1592e820a1109a8c5680cd697` | `5ceee0025da23d2cd5fd14b28569708a8db4db2b` |
| `_dsa-surface/surface-action.css` | `surface-action.css` | 21,898 | `f00ccde1b4db17687fd6ecd62644700932107352b37476184718f2036209fb2e` | `9d827ae1f4814c45353e4a1a61cc8814e26f0ed5` |
| `_dsa-surface/surface-panel.css` | `surface-panel.css` | 11,230 | `883e24ac5407a4fe24f9149b0d8964a06995cc88b6b6150b1a1bdfd9aee2976e` | `12582f538ad7b3c7e2ba229101e481a39dd5657a` |
| `_dsa-surface/surface-treatments.css` | `surface-treatments.css` | 69,299 | `ae03dda052475be5d6ea14e0fab8dd3f1608fdf5b9d09b4859a1f146a08fc0dc` | `71ac72e16175c6a6a48db8dea3824bb6e67a3adb` |
| `instrument.css` | `patterns/instrument/instrument.css` | 15,381 | `c19d76b2c90c2d8b6572cd418010515be583856bc356362a0a090dbb2d4ba25d` | `1a623c1b5cc17883dfc732a7efd6a1b1b24a7935` |
| `instrument.js` | `patterns/instrument/instrument.js` | 27,672 | `84b951c3150dbedc35c11db5d37c573e8ce387ba7a90ab56af97caab29471f19` | `77f08d20c03bbe153d96f583d0ca1576f3d5f1ba` |
| `licenses/design-system-ASK/LICENSE` | `LICENSE` | 10,835 | `8188fe74beac4005f834721ae459e84909cd42c55554549ad750f50fcfc20801` | `0c382f604647738e78449026c3dd3d5c26702a6f` |
| `licenses/design-system-ASK/NOTICE` | `NOTICE` | 1,602 | `8b6de487f00ed3b3ec4835b9a3ed44a3785d705e2840157d165d8e96356759aa` | `985a32e5583c599c494d16030fb5d2dae6fe4fbf` |

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

`colors_and_type.css` reaches its fonts by a path relative to itself, so `fonts/` stays beside it. `instrument.css` and `instrument.js` sit beside the page, as in the pattern's template (`patterns/instrument/instrument.template.html`).

## What is used, and what is not vendored

- `colors_and_type.css`: tokens, type, and the light / dark mechanism. The page sets no theme attribute, so the chrome follows the operating system.
- `surface-action.css`: every action button.
- `surface-panel.css`: the controls panel.
- `surface-treatments.css`: the stage frame's axis classes and the `controls` and `tuning` disclosure triggers.
- `instrument.css`, `instrument.js`: the instrument pattern. Its contract is `patterns/instrument/README.md` in the donor.
- Not vendored: the pattern's example script (`instrument.example.js`, example content only), `art-palettes.json` (the maze draws its own sketch palette), `surface-text-link.css`, `surface-cta.css`, the page shell, `fonts-embedded.js` and `styleguide-theme-control.js`. Nothing here uses them.

## Licenses

The design-system files are Apache-2.0 (`licenses/design-system-ASK/LICENSE`, with its `NOTICE`). Inter and JetBrains Mono are under the SIL Open Font License 1.1; each license text sits beside the font files.

## Re-sync

Re-sync when the donor changes one of these files: copy each again from the donor commit with `git -C <donor> show <commit>:<donor path> > <local path>`, check the blob ids, and rewrite the donor commit and this table. Re-sync all of them at one commit; never edit a copy here.
