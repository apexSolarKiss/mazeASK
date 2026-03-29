# AGENTS.md

## Architecture intent

mazeASK is evolving toward a three-layer architecture:

- topology = graph structure
- algorithm = spanning tree generation
- rendering = topology-specific visualization

## Guidance

- Avoid introducing topology-specific logic into algorithms.
- Prefer a neighbors + links abstraction over hardcoded wall directions.
- Keep generation logic separate from rendering logic.
- Keep diffs minimal and scoped to the task.
- Prefer planning and explanation before implementation when architecture is in flux.
- Do not make unrelated refactors.
- When proposing changes, identify whether they affect topology, algorithm, rendering, or multiple layers.
