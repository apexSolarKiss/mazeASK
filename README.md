![mazeASK](mazeASK.jpg)

# mazeASK

Maze generation algorithms as systems.

---

## Live

Open and duplicate the sketch:

https://editor.p5js.org/asymptoticSystemKey/sketches/FJk1OWjNb

---

## What this is

An interactive p5.js lab for exploring maze generation algorithms through their behavior and output.

Switch between algorithms and watch how each one builds structure in real time.

Same grid. Same constraints. Different rules.

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
- `space` regenerate  
- `r` recolor  
- drag horizontally to change speed  

### Density
- `[` decrease grid  
- `]` increase grid  

### Output
- `o` toggle output mode  
- `p` toggle square / widescreen  

---

## Notes

See:

    mazeASK-algorithm-notes.md

for a breakdown of each algorithm and what it produces.

---

## Run locally (source)

1. Rename:

    mazeASK.js → sketch.js

2. Place inside a p5.js project

3. Run:

    npx serve

4. Open the local URL shown in your terminal

---

## License

Apache 2.0
