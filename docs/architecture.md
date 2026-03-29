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
