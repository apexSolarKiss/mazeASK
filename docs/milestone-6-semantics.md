# Milestone 6 Semantics

## Purpose

This document is for Milestone 6 semantic design, not implementation.

[`docs/architecture.md`](docs/architecture.md) remains the milestone and ownership source of truth.

## Current State

The repo already supports:
- topology-owned neighbors
- canonical Maze State links
- selective portability for algorithms whose behavior stays honest through topology-owned structure

Current peer topologies are:
- rect
- hex
- triangle
- radial

Sidewinder and Eller remain rectangular-only.

This is intentional.

## Why Milestone 6 Needs Its Own Note

The remaining problem is semantic, not just structural.

Sidewinder and Eller cannot be handled by another narrow activation pass because their current behavior is defined by rectangular sweep and row/layer assumptions, not just by neighbor lookup.

## Sidewinder Problem Statement

The remaining Sidewinder question is not whether it can be generalized broadly.

The real question is narrower:

> Can Sidewinder honestly extend beyond rectangular grids only where topology owns a canonical band structure close enough to rectangular rows?

This keeps the burden of proof on honesty, not portability.

Current code behavior is explicitly rectangular.

Current essential behavior:
- run accumulation
- sweep across a row
- occasional carve out of the run

Current incidental rectangular details:
- row-local run accumulation
- literal east and north direction choices
- row and column counters as the traversal mechanism
- explicit eastern and northern boundary checks

Current decision:
- Sidewinder remains intentionally rectangular for now.

The blocker is semantic, not plumbing.

Current design space is intentionally narrow:
- rectangular is the baseline
- radial is the only serious current non-rectangular candidate
- hex remains out of scope unless a truly topology-owned band decomposition can be justified
- triangle remains out of scope unless a truly topology-owned band decomposition can be justified

If Sidewinder is revisited, the only serious current question is whether radial rings are close enough to rectangular rows for the algorithm to remain itself.

That requires an honest yes on all of these:
- rings are a topology-owned ordered band structure, not a rendering convenience
- same-ring continuation is canonical enough to play the role that eastward continuation plays on rows
- inward carving from a run member connects into prior structure in a way structurally comparable to carving north from a row
- the resulting behavior still reads as Sidewinder rather than as a different sweep-based algorithm

## Current Radial Conclusion

Radial was the only serious non-rectangular candidate.

The analogy got close because radial already provides:
- topology-owned rings
- topology-owned same-ring forward continuation
- topology-owned inward prior-structure

But the analogy still fails on current repo truth.

Sidewinder depends on bounded band closure, not only on lateral continuation plus carve-out.

Rectangular rows are bounded.
Radial rings are cyclic.

That difference is not incidental in the current algorithm shape.

So the current conclusion is:

- radial is interesting enough to clarify the boundary
- radial is not honest enough yet to justify a Sidewinder analogue
- Sidewinder should remain explicitly rectangular-only unless a future topology-owned bounded-band story exists without forcing an artificial seam

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

## Current Eller Conclusion

Eller remains explicitly rectangular-only on current repo truth.

The blocker is narrower than a generic layer/frontier abstraction.

Eller depends on successor-layer carry semantics with preserved set identity.

Its defining shape requires:
- ordered current and successor layers
- intra-layer merge adjacency
- guaranteed carry from each current-layer set into the successor layer
- identity continuity across that carry
- a terminal convergence rule

Current non-rectangular peer topologies do not provide an honest topology-owned carry model comparable to rectangular same-column downward propagation.

Radial comes closest because it has ordered rings and inter-ring adjacency.

But uneven ring sizes and fan-out break the stability of the carry relation in a way that changes the algorithm rather than honestly extending it.

So the current conclusion is:
- Eller is still useful for clarifying the semantic boundary
- no honest non-rectangular Eller analogue is currently available from the existing topology seam
- Eller should remain explicitly rectangular-only unless a future topology-owned successor-layer carry model exists without forcing an artificial mapping

## Required Decisions Before Implementation

For Sidewinder:
- whether radial has a topology-owned band structure close enough to rectangular rows
- whether that structure preserves Sidewinder rather than producing a different algorithm

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
- no API design

## Decision Outcomes

Current outcome of this note:
- Sidewinder remains rectangular-only
- Eller remains rectangular-only

Future decision boundary for Sidewinder:
- current repo truth is not yet honest enough for a radial Sidewinder analogue
- Sidewinder should remain explicitly rectangular-only
- only a future topology-owned bounded-band story would justify reopening the question

Future decision boundary for Eller:
- current repo truth is not yet honest enough for a non-rectangular Eller analogue
- Eller should remain explicitly rectangular-only
- only a future topology-owned successor-layer carry model would justify reopening the question

Only after those decisions are made should implementation branches be created.
