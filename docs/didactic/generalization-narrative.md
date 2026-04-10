# From Rectangular to Topology

mazeASK did not begin as a general maze system.

It began from the most intuitive version of the problem:

- a rectangular grid
- visible walls
- rows and columns
- algorithms that seem to "break walls"

That is a natural starting point because rectangular mazes are easy to picture and easy to teach.

But if the repo stayed at that level, it would never really become a topology-driven maze lab.

This document explains the conceptual move that made the generalization path possible.

## Rectangular baseline

The rectangular version gives you a very friendly mental model:

- each cell sits in a row and column
- each cell has up to four neighbors
- the maze looks like a field of boxes
- carving feels like deleting walls between boxes

That model is useful because it matches what people see on screen.

It is also misleading in an important way.

It makes the maze feel like it is fundamentally made out of walls.

That works as a teaching picture at first, but it becomes a trap if you want to generalize.

## Why wall-thinking breaks down

Wall-thinking is tied to one particular drawing.

Once you move beyond a rectangular grid, many of the assumptions hidden inside that picture start to fail:

- not every cell has the same shape
- not every cell has the same number of neighbors
- "up, right, down, left" stops being a universal language
- rows and columns stop being a reliable way to describe structure

If walls are treated as the maze's source of truth, then every new topology starts to feel like a special case.

That is the real limitation.

The problem is not that hex, triangle, or radial mazes are exotic.

The problem is that a wall-first model confuses **how the maze is drawn** with **what the maze is**.

## Graph-first reframing: topology plus carved links

The key conceptual move is this:

> A maze is not fundamentally a collection of walls.  
> A maze is a topology plus a chosen set of carved links on that topology.

That reframing changes everything.

Topology answers:

- which cells exist
- which cells could be adjacent
- what geometric shape each cell has

The carved link set answers:

- which of those possible adjacencies are actually open passages

Once the maze is understood that way, visible walls become a derived rendering outcome rather than the canonical state.

This is what makes generalization possible.

## What was generalized

The generalization move was not just "add more shapes."

It was:

- rectangular wall-thinking to topology plus carved links
- matrix iteration to topology-owned cell enumeration
- renderer-specific geometry to peer topology ownership
- selective portability instead of pretending every algorithm generalizes equally

## The topology seam and ownership split

mazeASK now separates four concerns:

- topology = possible structure
- Maze State = carved connectivity
- algorithm runtime = transient generation progress
- rendering = visible interpretation

That separation matters because each layer answers a different kind of question.

Topology owns structure:

- cell identities
- adjacency
- geometry
- topology-specific traversal helpers

Maze State owns carved connectivity:

- which passages are open
- stored canonically as normalized undirected links

Algorithm runtime owns process:

- stacks
- frontiers
- union-find state
- current cell and other temporary progress

Rendering owns appearance:

- borders
- fills
- overlays
- line segments

This is the architectural pivot of the repo.

Without it, every non-rectangular step would collapse back into special-case wall logic.

## Hex and triangle prove the seam is real

Hex and triangle matter because they prove the system is not just recoloring or redrawing rectangles.

They are real peer topologies.

Each one owns its own:

- adjacency model
- geometry
- border behavior
- cell polygons
- render-facing edge structure

That is why they count as architectural proof, not just visual variation.

They show that the topology seam is strong enough to support genuinely different cell structures while keeping Maze State ownership intact.

## Selective portability: neighbors plus links versus semantic blockers

Generalization does not mean every algorithm ports automatically.

mazeASK now makes an important distinction:

- some algorithms are mostly about neighbor access and carved links
- some algorithms are defined by deeper directional or layer semantics

Neighbor-driven algorithms port more cleanly because they mainly need:

- valid adjacency
- a way to carve links
- topology-owned geometry for display

That is why algorithms like:

- Recursive Backtracker
- Prim
- Wilson
- Aldous-Broder

can move across topologies relatively honestly.

Kruskal also ports once topology can enumerate canonical candidate edges.

Other algorithms are different.

Sidewinder and Eller are not blocked by missing plumbing alone.

They are blocked by semantics:

- sweep direction
- run behavior
- row/layer propagation

For Sidewinder specifically, radial was the closest serious non-rectangular candidate because topology already owns rings, same-ring forward continuation, and inward prior-structure.

But that analogy still fails on current repo truth because Sidewinder depends on bounded band closure, while radial rings are cyclic rather than bounded.

That is why mazeASK treats portability as selective rather than universal.

That open Binary Tree-on-radial question has since been resolved through a topology-owned preferred-direction analogue.

The lesson is not "everything generalizes if you try hard enough."

The lesson is:

> Some algorithms are structurally portable through neighbors and links.  
> Others depend on topology-specific semantics that must be designed honestly.

## Why `getCells()` mattered

Once the repo moved past matrix-like topologies, even shared iteration became a structural issue.

A rectangular grid lets you pretend that "all cells" just means nested loops over rows and columns.

That assumption quietly breaks once a topology has:

- uneven row sizes
- sparse structure
- non-matrix organization

The topology-owned cell enumeration seam, `getCells()`, mattered because it moved shared iteration onto topology truth.

That change did not just support a new helper.

It made the repo less secretly rectangular underneath.

It was the prerequisite for treating uneven topologies honestly in shared logic such as:

- global cell iteration
- visited-state scans
- shared render passes
- Kruskal setup

## Why radial is the stronger test

Radial is not just "another shape."

It is the strongest test the repo has passed so far because it pressures the exact places where a fake generalization would break.

Radial asks harder questions:

- can the topology own uneven ring structure
- can adjacency stop pretending every row has the same width
- can shared logic iterate true cells rather than a dense matrix
- can rendering stay derived from topology plus links

If the system were still secretly rectangular, radial would expose it quickly.

That is why radial matters so much in the repo's story.

It tests whether the architecture is really topology-first, not just rectangle-first with a few alternate drawings.

## Where mazeASK stands now

mazeASK is now best understood as a maze lab built around generalization.

It still teaches algorithms.

It still starts from intuitive maze pictures.

But its deeper lesson is about representation:

- changing the source of truth changes what becomes possible
- separating structure from carved connectivity changes what can generalize
- topology ownership makes peer structures possible
- selective portability is more honest than pretending every algorithm is equally general

So the repo's current story is not only:

> Here are several maze algorithms.

It is also:

> Here is how a rectangular maze sketch became a topology-driven system, and how that shift made broader structure possible.

That is the real generalization path mazeASK now demonstrates.
