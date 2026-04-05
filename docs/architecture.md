# Architecture

## Goal

mazeASK is moving toward a graph-first architecture in which:

- Topology defines possible structure
- Maze State defines carved connectivity
- Algorithms build spanning-tree links
- Renderers interpret topology + maze state for display

## Ownership Model

### Topology
Owns:
- cell identities
- cell location / geometry metadata
- neighbor relationships
- topology-specific traversal helpers

Does not own:
- carved links
- algorithm progress state
- rendering style or overlays

### Maze State
Owns:
- canonical carved links
- canonical normalized link set (each link stored once as an undirected cell pair)
- maze-level completion state if needed

Does not own:
- topology adjacency
- algorithm runtime structures
- renderer/view state

### Algorithm Runtime State
Owns:
- transient generation state
- stack / frontier / walk / union-find / current cell
- algorithm-specific progress data

Does not own:
- canonical links as source of truth
- direct mutation of connectivity outside Maze State
- topology structure
- renderer/view state

### Renderer / View State
Owns:
- presentation controls
- overlays
- labels
- palette / layout / animation speed

Consumes:
- topology
- maze state
- view/debug snapshot derived from runtime state

## Source of Truth

Canonical maze connectivity is represented as links.

Walls are not canonical state.
Walls must not be stored as mutable maze state.
For rectangular rendering, wall segments are derived from topology adjacency plus canonical links at render time.

## Canonical Maze Model

A maze is:

- a topology
- plus a set of chosen links on that topology

This keeps:
- possible connections separate from actual carved passages
- algorithms topology-agnostic at the connectivity level
- rendering topology-specific but not algorithm-owned

## Milestone 1

The first implementation milestone is:

- introduce explicit Topology ownership for the current rectangular grid
- introduce Maze State with canonical links
- replace wall mutation as maze source of truth with link creation
- update rectangular rendering to derive wall segments from topology + links
- keep existing rectangular behavior intact

## Explicitly Out of Scope for Milestone 1

- non-rectangular topologies
- full algorithm modularization
- full visualization/debug state refactor
- simultaneous migration of every algorithm
- persistent co-ownership of both walls and links

## Working Rule

Prefer narrow, architectural moves.

Do not add transitional abstractions unless they clearly support the Path 2 direction:
- topology = structure
- maze state = connectivity
- algorithm runtime = transient generation state
- renderer/view = presentation

## Milestone 2 (Rectangular neighbor seam)

- introduced shared rectangular neighbor helpers
- unified adjacency logic through topology seam
- routed renderer through same neighbor access

No algorithm refactors.
No Maze State changes.
No topology expansion.

## Milestone 3 (Hex topology proof of concept)

- added a hex topology peer alongside the rectangular topology
- kept rectangular as the default baseline
- preserved Maze State link ownership and normalized link storage unchanged
- introduced a topology-driven rendering path sufficient for the proof of concept:
  - filled visited cells
  - current-cell highlight
  - outer border rendering
- kept hex intentionally limited to an opt-in proof path for Recursive Backtracker only

This milestone proves that:
- topology can own non-rectangular neighbor relationships
- topology can own enough geometry for non-rectangular rendering
- the existing link-based Maze State can support that path without storage changes

This milestone does not claim:
- full topology-generalized algorithm support
- parity across every existing algorithm
- completion of renderer generalization beyond the current proof path

## Milestone 4 (Neighbor-driven algorithm portability)

This milestone extends hex portability across the algorithms that already operate primarily through neighbor access.

- Recursive Backtracker, Prim, Aldous-Broder, and Wilson now run through the topology seam on hex.

This milestone proves that:
- additional neighbor-driven algorithms can run on multiple topologies without topology-specific carve logic
- Maze State link ownership remains unchanged while topology controls adjacency and geometry
- the existing rectangular baseline can remain stable while hex support expands through the same seam

This milestone does not claim portability for:
- Binary Tree
- Sidewinder
- Eller
- Kruskal

Those remain structurally rectangular for now.

## Milestone 5 (Rectangular-structured algorithm split)

This milestone split the remaining rectangular-structured algorithms into separate redesign tracks instead of treating them as one undifferentiated portability bucket.

This milestone now includes:
- Binary Tree redesigned through a topology seam
- Kruskal redesigned through topology-owned edges and activated on hex

This milestone still does not claim portability for:
- Sidewinder
- Eller

Those remain rectangular-only for now.

This milestone proves that:
- some rectangular-structured algorithms can be separated into smaller redesign tracks
- topology-owned structure can replace hardcoded rectangular assumptions where the algorithm shape remains local
- Maze State link ownership remains unchanged through that redesign work

This milestone leaves open:
- algorithms whose defining control flow still depends on sweep semantics or row/layer propagation
- any claim of full topology-generalized support across the remaining rectangular-oriented algorithms

## Milestone 6 (Topology-owned sweep / layer semantics)

The next architectural frontier is not another activation pass.

The remaining work is to define topology-owned sweep or layer semantics, or an equivalent structure, that could support honest future reformulations of:
- Sidewinder
- Eller

This milestone is a design problem first.

See [`docs/milestone-6-semantics.md`](docs/milestone-6-semantics.md) for the dedicated semantic design note.

It should clarify:
- whether Sidewinder should gain a topology-owned sweep/run analogue or remain intentionally rectangular
- whether Eller should gain a topology-owned layer/set propagation analogue or remain intentionally rectangular
- the minimum topology-owned semantic needed before any implementation promise is credible
