# mazeASK

An interactive p5.js lab for exploring maze generation algorithms as systems, structures, and visual forms.

This is not just a collection of algorithms.  
It is a study of how rules produce structure and how selection strategy shapes visual outcomes.

---

## What this is

mazeASK is a real-time maze generation environment where you can:

- switch between multiple algorithms
- watch them build structure step-by-step
- compare their visual and structural biases
- treat algorithms as compositional tools, not just code

---

## Why this exists

Most explanations of maze algorithms focus on implementation.

That misses the more interesting question:

> How do different rule systems produce different visual and structural outcomes?

This project treats maze generation as:

- graph construction  
- procedural design  
- algorithmic aesthetics  

---

## Algorithms included

- Recursive Backtracker
- Binary Tree
- Prim
- Sidewinder
- Eller
- Kruskal
- Wilson
- Aldous–Broder

These are not presented as isolated tricks, but as variations of:

> building a connected structure under different constraints

---

## Key idea

All of these algorithms are solving the same problem:

- connect all cells  
- avoid disconnected regions  
- usually avoid cycles  

They differ in:

- how they choose the next step  
- how local vs global their decisions are  
- what biases they introduce  
- what kind of structure they produce  

**Result:** different textures of mazes

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
- `space` regenerate  
- `r` recolor  
- drag horizontally to change speed  

### Density
- `[` decrease grid  
- `]` increase grid  

### Output / Rendering
- `o` toggle output mode  
- `p` toggle square / widescreen  

---

## How to run

### Option 1 — use the hosted sketch (recommended)

Open and duplicate this sketch in the p5.js editor:

https://editor.p5js.org/asymptoticSystemKey/full/FJk1OWjNb

This is the fastest way to explore and modify the system.

---

### Option 2 — run locally

1. Rename:

    mazeASK.js → sketch.js

2. Place it inside a standard p5.js project (or alongside an `index.html` that loads p5)

3. Run a local server:

    npx serve

4. Open the local URL shown in your terminal

---

## File structure

    /mazeASK.js                      -> main interactive system
    /mazeASK_algorithms_notes.md     -> algorithm explanations
    /mazeASK.jpg                     -> reference image
    /LICENSE

---

## Suggested way to explore

Do not just run it once.

Cycle through algorithms and observe:

- corridor length  
- branching density  
- directional bias  
- symmetry vs randomness  
- perceived difficulty  

Compare:

- Recursive Backtracker vs Prim  
- Binary Tree vs Sidewinder  
- Kruskal vs Wilson vs Aldous–Broder  

---

## Critical perspective

Maze algorithms are often taught as separate recipes.

A better framing:

> They are different strategies for constructing a spanning tree.

Once you see that, the differences become:

- selection rule  
- constraint handling  
- bias injection  

That perspective generalizes beyond mazes.

---

## Notes

See:

    mazeASK_algorithms_notes.md

for deeper breakdowns of each algorithm.

---

## License

Apache 2.0

---

## Context

Part of the broader ASK system work:

- procedural structures  
- generative systems  
- mathematically driven aesthetics  
