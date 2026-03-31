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

## Working style

### Comments
Comments should preserve local invariants, not project philosophy.

Good comments explain local source of truth or boundary rules, for example:
- MazeState owns canonical carved links.
- Rectangular wall segments are derived at render time.

Bad comments explain prior discussions, design debates, or architectural history.

Rule:
- comments = local truth needed to understand code
- docs = architectural truth
- PRs = migration intent

### Commit messages
Keep commit messages short, concrete, and scoped to the change.

Good:
- Introduce MazeState canonical link ownership
- Derive rectangular walls from topology and links
- Route algorithms through link creation instead of wall mutation

Bad:
- long essay commit messages
- references to prior discussion threads
- mixed milestone + theory language

### PR descriptions
Use PR descriptions to capture:
- the architectural decision being implemented
- what changed
- what did not change
- the next milestone

Do not move architectural narrative into source comments or commit messages.

### Branching and PR workflow

Treat pull requests as the default review boundary for meaningful changes.

Rules:
- code changes = always use a branch + PR, even for solo work
- code changes = always use a branch + PR
- architecture or workflow docs changes = use a branch + PR
- small non-architectural docs edits = PR optional
- do not push code changes directly to `main` unless explicitly instructed
- do not merge code changes without opening a PR first
- PR descriptions should capture migration intent:
  - why this change exists
  - what changed
  - what did not change
  - what remains out of scope

If a branch has been committed and pushed but no PR has been opened yet, prefer opening the PR rather than pushing additional changes directly to `main`.

If a direct push to `main` happens accidentally, do not rewrite history unless explicitly asked. Instead, prefer documenting the milestone clearly in `docs/architecture.md` or another repo doc when appropriate.
