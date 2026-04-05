# Milestone 6 Semantics

## Purpose

This document is for Milestone 6 semantic design, not implementation.

[`docs/architecture.md`](docs/architecture.md) remains the milestone and ownership source of truth.

## Current State

The repo already supports:
- topology-owned neighbors
- canonical Maze State links
- hex support for Recursive Backtracker, Binary Tree, Prim, Aldous-Broder, Wilson, and Kruskal

Sidewinder and Eller remain rectangular-only.

## Why Milestone 6 Needs Its Own Note

The remaining problem is semantic, not just structural.

Sidewinder and Eller cannot be handled by another narrow activation pass because their current behavior is defined by rectangular sweep and row/layer assumptions, not just by neighbor lookup.

## Sidewinder Problem Statement

Current essential behavior:
- run accumulation
- sweep across a row
- occasional carve out of the run

Current incidental rectangular details:
- literal east and north direction choices
- row and column counters as the traversal mechanism
- explicit eastern and northern boundary checks

Current decision:
- Sidewinder remains intentionally rectangular for now.

The blocker is semantic, not plumbing.

Any future generalization would require a deliberate topology-owned sweep/run model first.

## Eller Problem Statement

Current essential behavior:
- set propagation across successive rows
- intra-row merges
- guaranteed carry into the next row
- terminal-row convergence

Current incidental rectangular details:
- column-indexed set storage
- literal left/right merge checks
- direct downward propagation to the next row

Current decision:
- Eller remains intentionally rectangular for now.

The blocker is semantic, not plumbing.

Any future generalization would require a deliberate topology-owned layer/frontier model first.

## Required Decisions Before Implementation

For Sidewinder:
- what is a sweep unit
- what counts as continuing a run
- what counts as carving out of a run

For Eller:
- what is a layer or frontier
- how sets propagate between layers
- how terminal convergence is defined

For both:
- what stays topology-owned versus algorithm-owned
- whether remaining rectangular-only is an acceptable final outcome

Current outcome:
- remaining rectangular-only is acceptable for now
- no implementation branch is justified until a new semantic model is explicitly chosen

## Non-Goals

- no code changes
- no activation promises
- no broad capability system
- no rendering or Maze State changes

## Decision Outcomes

Current outcome of this note:
- Sidewinder remains rectangular-only
- Eller remains rectangular-only

Future outcome if revisited later:
- one or both get a future topology-owned semantic model

Only after those decisions are made should implementation branches be created.
