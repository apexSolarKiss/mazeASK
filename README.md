<!-- Codex workflow test -->
![mazeASK](mazeASK-banner.png)

# mazeASK

Maze generation algorithms

---

## Live

Live sketch >>

https://editor.p5js.org/asymptoticSystemKey/full/FJk1OWjNb

Best viewed on desktop in Chrome.

---

## What this is

An interactive p5.js lab for exploring maze generation algorithms through their behavior and output.

Switch between algorithms and watch how each one builds structure in real time.

Same grid. Same constraints. Different rules.

## Why this repo exists

mazeASK is an expression of intent on three layers >>

- artistic purpose: [docs/intent/artistic-purpose.md](docs/intent/artistic-purpose.md)
- didactic purpose: [docs/intent/didactic-purpose.md](docs/intent/didactic-purpose.md)
- workflow experiment: [docs/intent/workflow-experiment.md](docs/intent/workflow-experiment.md)

---

## Architecture

`mazeASK.js` is structured as a single p5.js sketch with three phases >> initialization, incremental generation, and rendering. The `step...()` functions contain the algorithm-specific generation logic.

For the conceptual generalization path from rectangular mazes to topology-owned structure, see [docs/didactic/generalization-narrative.md](docs/didactic/generalization-narrative.md).

---

## Algorithms

- Recursive Backtracker  
- Binary Tree  
- Prim  
- Sidewinder  
- Eller  
- Kruskal  
- Wilson  
- Aldous–Broder  

See [docs/didactic/algorithm-notes.md](docs/didactic/algorithm-notes.md) for a breakdown of each algorithm and what it produces.

---

## Key idea

All of these are doing the same thing >>

building a spanning tree.

What changes is how the next connection is chosen.

That choice introduces bias.  
That bias shapes the structure.  
That structure is what you see.

---

## Controls

### Algorithms
- `1` Recursive Backtracker  
- `2` Binary Tree  
- `3` Prim  
- `4` Sidewinder  
- `5` Eller  
- `6` Kruskal  
- `7` Wilson  
- `8` Aldous–Broder  

### Interaction
- `click` save PNG output  
- `e` toggle start + finish overlay  
- `s` toggle solution path overlay  
- `space` regenerate  
- `r` recolor  
- `h` toggle rectangular / hex topology  
- `c` toggle rectangular / radial topology  
- `t` toggle rectangular / triangle topology  
- `-` / `+` adjust speed  

### Density
- `[` decrease grid  
- `]` increase grid  

### Output
- `o` toggle output mode  
- `p` cycle square / `4:3` / widescreen  

---

## Topology mode

Rectangular is the default baseline.

Hex is opt-in through the `H` toggle and currently works for >>
- Recursive Backtracker
- Binary Tree
- Prim
- Aldous–Broder
- Wilson
- Kruskal

Radial is opt-in through the `C` toggle and currently works for >>
- Recursive Backtracker
- Binary Tree
- Prim
- Aldous–Broder
- Wilson
- Kruskal

Radial does not yet claim support for >>
- Sidewinder
- Eller

Triangle is opt-in through the `T` toggle and currently works for >>
- Recursive Backtracker
- Binary Tree
- Prim
- Aldous–Broder
- Wilson
- Kruskal

Sidewinder and Eller remain rectangular-only for now.

---

## Run locally (source)

1. Rename:
1. Rename >>
    mazeASK.js → sketch.js

2. Place inside a p5.js project

3. Run >>
    npx serve

4. Open the local URL shown in your terminal

---

## License

Apache 2.0
