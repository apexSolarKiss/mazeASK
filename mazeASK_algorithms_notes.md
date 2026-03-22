# mazeASK // Maze Algorithms Notes

## What this repo is doing

This project builds mazes on a grid.

A maze is made of many little cells. Each cell starts with walls.  
A maze algorithm decides which walls to remove so all the cells connect.

Most of the algorithms here try to make a **perfect maze**:

- every cell can be reached
- there is exactly one path between any two cells
- there are no loops

That means the maze is really a kind of connected tree drawn on a grid.

---

## A simple way to think about it

Imagine a big building made of tiny rooms.

Each room has walls on all four sides.

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

### 1. How they choose the next cell
Do they go deep?  
Do they grow from the edge?  
Do they move row by row?

### 2. What kind of bias they introduce
Do they prefer some directions?  
Do they create long corridors?  
Do they make the maze feel more even or more wild?

### 3. What kind of visual texture they create
Long winding paths  
Bushy dead ends  
Horizontal runs  
Geometric structure

### 4. What tradeoff they make
Simplicity  
Speed  
Elegance  
Fairness  
Visual interest

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

# Algorithms currently in `mazeASK 2`

## 1. Recursive Backtracker

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

### Best use
A great first maze algorithm to learn and visualize.

---

## 2. Binary Tree

### Explanation
For every room, choose between only two favorite directions.

For example, each room might connect either:
- north
- or east

So every room makes one simple little decision.

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

### Best use
Good for understanding how bias changes maze style.

---

## 3. Prim

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

### Best use
Great for comparison against Recursive Backtracker.

---

## 4. Sidewinder

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

### Best use
Useful for studying how row-wise construction changes maze character.

---

# Algorithms not yet added, but useful later

## Eller’s Algorithm
Builds the maze one row at a time while tracking connected sets.

### Why it matters
- very memory efficient
- can generate mazes row by row
- conceptually more advanced

### Tradeoff
Harder to understand than the simpler starter algorithms.

---

## Kruskal’s Algorithm
Treat walls like possible connections and only remove a wall if it does not create a cycle.

### Why it matters
- teaches disjoint sets / union-find
- very graph-theoretic
- good for showing cycle avoidance explicitly

### Tradeoff
The bookkeeping is more abstract.

---

## Wilson’s Algorithm
Use random walks, but erase loops before connecting to the existing maze.

### Why it matters
- mathematically elegant
- produces a uniform spanning tree

### Tradeoff
Harder to explain and not as immediate visually.

---

## Aldous–Broder
Randomly wander around the grid and only carve when first visiting a new cell.

### Why it matters
- conceptually simple
- mathematically important

### Tradeoff
Very slow.

---

# Fast visual comparison

## Recursive Backtracker
Feels like:
- “go deep”
- long winding hallways

## Binary Tree
Feels like:
- “follow one of two favorite directions”
- strong bias

## Prim
Feels like:
- “grow from the edge”
- bushier, more distributed

## Sidewinder
Feels like:
- “make runs across rows”
- structured and directional

---

# What to ask while comparing algorithms

When switching algorithms, do not only ask, “Does it work?”

Ask:

- Which one makes the longest hallways?
- Which one feels most balanced?
- Which one feels most artificial?
- Which one feels most elegant?
- Which one looks easiest to solve?
- Which one looks most surprising?

That is how algorithm study becomes visual study.

---

# Suggested controls for the sketch

## Algorithm switching
- `1` Recursive Backtracker
- `2` Binary Tree
- `3` Prim
- `4` Sidewinder

## Regenerate
- `space`

## Density
- `[` decrease
- `]` increase

## Speed
- `-` slower
- `+` faster
- horizontal drag changes speed interactively

## Output mode
- `o` toggle viewing/output mode
- `p` toggle square/widescreen preset

## Recolor
- `r`

---

# Why start with Recursive Backtracker

If someone is learning maze generation for the first time, Recursive Backtracker is usually the best starting point because:

- it is easy to explain
- it is easy to animate
- it creates dramatic results quickly
- it teaches the core ideas of:
  - visited vs unvisited cells
  - neighbors
  - carving passages
  - backtracking when stuck

After that, the other algorithms become easier to understand as variations in selection strategy.

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
