<!--© 2026 Andrew S Klug // ASK
Apache License, Version 2.0-->
![mazeASK](mazeASK.jpg)

# mazeASK // algorithm notes

## What mazeASK is doing

This project builds mazes on a topology of connected cells.

A maze is made of many little cells. Each cell starts with possible boundaries between it and its neighbors.  
A maze algorithm decides which walls to remove so all the cells connect.

Most of the algorithms here try to make a **perfect maze**:

- every cell can be reached
- there is exactly one path between any two cells
- there are no loops

That means the maze is really a kind of connected tree drawn on a topology.

This does not mean “one unique path from a predeclared start to finish.”

It means the maze is connected and has no cycles — in graph terms, it is a tree over the set of cells.

That is why any two cells in a perfect maze already have exactly one simple path between them.

Start and finish are a later puzzle-framing layer, not part of the structural definition.

---

## Core Pattern // across all algorithms

All of these follow the same underlying structure:

- pick a next step  
- connect cells  
- avoid breaking the structure  

What changes is:

- how the next step is chosen  
- how much randomness is allowed  
- how much structure is enforced  

That is what creates different maze “textures”.

---

## A simple way to think about it

Imagine a big building made of tiny rooms.

Each room begins with boundaries to its neighboring rooms.

A maze algorithm is just a set of rules for deciding:

- which walls to knock down
- in what order
- with what kind of pattern

Different rules create different maze personalities.

Some make long twisty hallways.  
Some make lots of short dead ends.  
Some make very obvious directional patterns.  
Some feel more balanced.

---

## Big conceptual takeaway

The important lesson is not just that there are many maze algorithms.

The deeper lesson is:

> Different maze algorithms are different strategies for building one connected structure.

They mainly differ in a few ways:

### 1. How they choose the next step
Do they go deep?  
Do they grow from the edge?  
Do they move row by row?  
Do they choose walls instead of cells?  
Do they walk randomly and then clean up loops?

### 2. What kind of bias they introduce
Do they prefer some directions?  
Do they create long corridors?  
Do they make the maze feel more even or more wild?

### 3. What kind of visual texture they create
Long winding paths  
Bushy dead ends  
Horizontal runs  
Geometric structure  
Row-by-row patterns  
Cycle-avoiding graph structure  
Uniform spanning-tree behavior

### 4. What tradeoff they make
Simplicity  
Speed  
Elegance  
Fairness  
Visual interest  
Bookkeeping complexity  
Mathematical purity

So the real transferable idea is this:

> The selection rule changes the style of the maze.

---

## Critical perspective

People often talk about maze algorithms as if each one is a totally separate magic trick.

That is not the best way to think about it.

A better framing is:

> These are different ways of building a connected graph while avoiding broken regions and unwanted loops.

So instead of memorizing them as disconnected recipes, compare them by asking:

- How does this algorithm choose what to grow next?
- How local or global is that choice?
- What visual bias does that choice create?
- What kind of maze does it tend to make?

That viewpoint is more useful than just memorizing names.

---

## Current sketch status

Hex currently works for:
- Recursive Backtracker
- Binary Tree
- Prim
- Aldous-Broder
- Wilson
- Kruskal

Triangle currently works for:
- Recursive Backtracker
- Binary Tree
- Prim
- Aldous-Broder
- Wilson
- Kruskal

Radial currently works for:
- Recursive Backtracker
- Binary Tree
- Prim
- Aldous-Broder
- Wilson
- Kruskal

Radial does not yet claim support for:
- Sidewinder
- Eller

Sidewinder and Eller remain intentionally rectangular-only for now.

## Portability crosswalk

| Algorithm | Rect | Hex | Triangle | Radial | Note |
| --- | --- | --- | --- | --- | --- |
| Recursive Backtracker | yes | yes | yes | yes | broadly portable through neighbors + links |
| Binary Tree | yes | yes | yes | yes | radial uses an analogue built from topology-owned inward + lateral preferred directions |
| Prim | yes | yes | yes | yes | frontier growth ports through neighbors + links |
| Sidewinder | yes | no | no | no | sweep semantics remain rectangular |
| Eller | yes | no | no | no | row/layer semantics remain rectangular |
| Kruskal | yes | yes | yes | yes | ports once topology owns candidate edges |
| Wilson | yes | yes | yes | yes | loop-erased walk ports through adjacency |
| Aldous-Broder | yes | yes | yes | yes | random-walk structure ports through adjacency |

---

# Algorithms implemented in `mazeASK`

## 1. Recursive Backtracker

1. Start in any cell and mark it as visited.  
2. Look for neighboring cells that haven’t been visited.  
3. If there are unvisited neighbors:  
   - pick one at random  
   - remove the wall between them  
   - move to that neighbor  
4. If there are no unvisited neighbors:  
   - go back to the previous cell  
5. Repeat until every cell has been visited.

> Go forward randomly. If you can’t, go backward.

### Explanation
Start in one room.  
Pick a neighboring room you have not visited yet.  
Go there and knock down the wall between them.  
Keep going deeper and deeper.

When you get stuck, go backward until you find a room where there is still another unvisited choice.

Then keep going.

### Note
This is depth-first search with backtracking.

### What it tends to look like
- long winding corridors
- dramatic deep branches
- fewer short stubby regions than some other methods

### Pros
- easy to understand
- easy to code
- very fun to animate
- makes visually striking mazes

### Cons
- not especially balanced
- can go very deep before filling in other areas
- not uniform or unbiased

---

## 2. Binary Tree

1. For each cell in the topology:  
2. Ask the topology for the cell's two preferred directions.  
3. If one or both neighbors exist:  
   - pick one at random  
   - remove the wall between them  
4. Move on to the next cell.  
5. Continue until all cells have been processed.

> In each cell, connect in one of two preferred directions.

### Explanation
For every room, choose between only two favorite directions.

For example, each room might connect either:
- north
- or east

So every room makes one simple little decision.

In radial mode, mazeASK uses a Binary Tree analogue built from topology-owned preferred directions:
- inward
- lateral

Here, lateral means the topology's canonical same-ring forward neighbor.

### Note
This is a very simple biased carving rule.

### What it tends to look like
- obvious directional bias
- diagonal-ish overall flow
- very regular feeling compared to more organic mazes

### Pros
- extremely simple
- very fast
- great for teaching how a tiny local rule can generate a whole structure

### Cons
- strongly biased
- can look artificial
- some directions get favored too much

---

## 3. Prim

1. Start in any cell and mark it as visited.  
2. Add its neighbors to a “frontier” list.  
3. While there are frontier cells:  
   - pick one at random  
   - connect it to one of its visited neighbors  
   - mark it as visited  
   - add its unvisited neighbors to the frontier  
4. Repeat until all cells are visited.

> Grow the maze outward from its edges.

### Explanation
Start with one room.

Then keep growing the maze from the **outside edge** of the part you already built.

It is like making a snowball bigger by adding new snow around the outside.

### Note
This is a randomized frontier-growth version of Prim’s algorithm.

### What it tends to look like
- more evenly spread growth
- lots of shorter dead ends
- less dramatic long-corridor feeling than Recursive Backtracker

### Pros
- gives a nice contrast to depth-first carving
- grows in a way that feels more distributed
- helps show how frontier-based growth differs from deep exploration

### Cons
- can feel bushier
- often produces fewer memorable long passages
- less “adventure tunnel” feeling than Recursive Backtracker

---

## 4. Sidewinder

1. Go row by row, left to right.  
2. Keep a “run” of connected cells in the current row.  
3. For each cell:  
   - add it to the current run  
   - decide: continue the run or break it  
4. If continuing:  
   - connect to the cell on the right  
5. If breaking:  
   - choose a random cell from the run  
   - connect it upward  
   - reset the run  
6. Repeat for all rows.

> Build horizontal runs, occasionally linking upward.

### Explanation
Go across a row and keep making a connected run.

Every so often, choose one room in that run and make a passage upward.

Then start a new run.

### Note
This is a row-based algorithm with a directional bias, but it is more interesting than Binary Tree.

### What it tends to look like
- horizontal runs
- periodic upward links
- visible row structure

### Pros
- simple and elegant
- less crude than Binary Tree
- good for understanding row-based construction

### Cons
- still biased
- can look structured in a very obvious way
- often feels less natural than more exploratory algorithms

---

## 5. Eller

1. Work one row at a time.  
2. Assign each cell in the row to a set (group).  
3. Randomly connect adjacent cells in the row:  
   - merge their sets when connected  
4. For each set:  
   - connect at least one cell downward into the next row  
5. Carry the sets into the next row.  
6. On the final row:  
   - connect all remaining adjacent sets  
7. Repeat until complete.

> Build row by row, tracking which cells are connected.

### Explanation
Build the maze one row at a time while keeping track of which cells are already connected.

Each row gets partially joined together sideways, then some cells are forced to connect downward so the next row stays connected to the maze above it.

Then the process repeats for the next row.

### Note
This is a row-by-row algorithm that tracks connected sets.

### What it tends to look like
- structured but still varied
- shaped by row-wise decisions
- less like deep wandering and more like disciplined construction

### Pros
- very memory efficient
- elegant once understood
- useful for thinking about connectivity as a set problem
- good for very large or streaming mazes

### Cons
- harder to understand than the simpler starter algorithms
- requires more bookkeeping than Backtracker or Binary Tree
- the logic is less visually obvious at first glance

---

## 6. Kruskal

1. Treat every cell as its own separate group.  
2. List all possible walls between cells.  
3. Shuffle the list randomly.  
4. For each wall:  
   - if the cells are in different groups:  
     - remove the wall  
     - merge the groups  
   - otherwise, leave the wall  
5. Repeat until all cells are connected.

> Remove walls only when they connect different regions.

### Explanation
Treat walls like possible connections between cells.

Look at the walls in random order.  
Remove a wall only if it joins two different regions.

If removing a wall would make a loop inside a region that is already connected, leave that wall in place.

### Note
This is a graph-based algorithm that uses disjoint sets / union-find to track connectivity.

### What it tends to look like
- often bushier than Recursive Backtracker
- lots of small branching structure
- less corridor-dominant than depth-first carving

### Pros
- very clear graph logic
- excellent for teaching cycle prevention
- connects maze generation to broader computer science ideas

### Cons
- the bookkeeping is more abstract
- less immediate to explain than simpler carving algorithms
- usually needs an extra supporting data structure

---

## 7. Wilson

1. Start by marking one random cell as part of the maze.  
2. Pick a random unvisited cell.  
3. Begin a random walk from it.  
4. While walking:  
   - if you revisit a cell in your path, erase the loop  
   - continue walking  
5. When the walk reaches the maze:  
   - carve the entire path into the maze  
   - mark all cells in the path as visited  
6. Repeat until all cells are visited.

> Wander, erase loops, then attach the path.

### Explanation
Pick an unvisited room and start wandering randomly.

While wandering, if the path loops back into itself, erase the loop so the path stays clean.

Keep wandering until the path touches the part of the maze that already exists. Then carve the cleaned-up path into the maze.

Repeat this until every room has been added.

### Note
This is a loop-erased random walk algorithm and it produces a **uniform spanning tree**.

### What it tends to look like
- less biased than many simple algorithms
- more mathematically “fair”
- often less obviously stylized than Recursive Backtracker

### Pros
- elegant
- important mathematically
- produces uniform spanning trees
- great for learning how loop erasure changes a random walk

### Cons
- harder to understand at first
- slower than simpler algorithms
- the implementation has more moving parts

---

## 8. Aldous–Broder

1. Start in any cell and mark it as visited.  
2. Randomly move to a neighboring cell.  
3. If the cell has not been visited:  
   - remove the wall between the two cells  
   - mark it as visited  
4. If it has already been visited:  
   - do nothing  
5. Repeat until all cells are visited.

> Wander randomly, carve only on first visits.

### Explanation
Start in any room and wander randomly.

Every time you enter a room for the **first** time, carve the passage that brought you there.

If you enter a room you have already seen, do not carve anything new. Just keep wandering.

Eventually, after enough wandering, every room gets visited and the maze is complete.

### Note
This is another random-walk algorithm that also produces a **uniform spanning tree**.

### What it tends to look like
- unbiased in the uniform-spanning-tree sense
- visually less predictable than strongly biased methods
- slow to build because the walk revisits old places a lot

### Pros
- conceptually simple
- mathematically important
- a clean baseline for understanding uniform random mazes

### Cons
- very slow
- many steps do not visibly change the maze
- not the most satisfying one to animate unless speed is increased

---

# Controls

## Algorithm switching
- `1` Recursive Backtracker
- `2` Binary Tree
- `3` Prim
- `4` Sidewinder
- `5` Eller
- `6` Kruskal
- `7` Wilson
- `8` Aldous-Broder

## Save output
- `click` save PNG output

## Overlay
- `e` toggle start + finish overlay
- `s` toggle solution path overlay

## Regenerate
- `space` regenerate

## Recolor
- `r` recolor

## Density
- `[` decrease
- `]` increase

## Speed
- `-` slower
- `+` faster

## Output mode
- `o` toggle output mode
- `p` cycle square / `4:3` / widescreen

## Topology
- `h` toggle rectangular/hex
- `c` toggle rectangular/radial
- `t` toggle rectangular/triangle

---

# Comparison prompts

When switching algorithms, do not only ask, “Does it work?”

Ask:

- Which one makes the longest hallways?
- Which one feels most balanced?
- Which one feels most artificial?
- Which one feels most elegant?
- Which one looks easiest to solve?
- Which one looks most surprising?
- Which one feels most local in its decisions?
- Which one feels most graph-like?
- Which one feels most random?
- Which one feels most mathematically fair?

That is how algorithm study becomes visual study.

---

# Main lesson of the repo

This repo is not just about mazes.

It is also about learning that:

- rules create structure
- small local decisions can create large global patterns
- different algorithms produce different aesthetics
- code is not only functional, it is compositional

That is why comparing algorithms is interesting:
it is both computer science and visual design.
