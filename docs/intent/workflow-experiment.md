# Workflow Experiment

mazeASK is also a workflow-refinement experiment.

It is a case study in governed AI collaboration around a real repo with explicit boundaries.

Within this project >>

- ASK sets intent and authorizes each unit of work
- an advisor reviews proposed changes, independently of the executor
- an assigned executor carries out authorized work in the repo
- planning, implementation, and PR work are treated as distinct modes
- intent is expressed through docs and workflow rules rather than ad hoc prompting alone

It is a repo-specific attempt to subject machine-assisted work to defined boundaries, cleaner review, and stronger structural discipline.

Earlier, ChatGPT acted as the external control surface and prompt compiler, and Codex as the in-repo executor. [`docs/workflow-boundary.md`](../workflow-boundary.md) keeps that account as history.

The workflow experiment remains repo-specific and explicit in scope.

That is why mazeASK keeps a clear boundary between >>

- repo-local execution rules
- the external workflow that frames and reviews the work

[`docs/workflow-boundary.md`](../workflow-boundary.md) defines that separation.

The point is to test whether explicit intent architecture can produce better planning, cleaner implementation boundaries, and more honest change control than improvisational prompting.

So the workflow experiment is part of the project itself, not only a method used around it.
