# Workflow Boundary

This repo contains the rules that govern work performed **inside the repo**.

Those rules live in `AGENTS.md` and apply to whoever executes work here:
- branch + PR workflow
- scope discipline
- separation of concerns
- comments, commits, and PR hygiene

Who frames, authorizes and reviews that work is set outside the repo:

- ASK sets intent and authorizes each unit of work.
- An advisor reviews proposed changes, independently of the executor.
- An assigned executor carries out the authorized work in the repo, under `AGENTS.md`, and stops at the repo's review gates.

The shared execution protocol behind that arrangement is maintained in [`apexSolarKiss/control-surface`](https://github.com/apexSolarKiss/control-surface). This repo keeps its own execution rules local and does not copy that protocol: two copies of the same rules would drift apart.

## Historical: the earlier arrangement

The account below describes how this repo was worked on earlier. It no longer describes the current arrangement.

> A separate external control layer governs how work is framed **before** it reaches Codex.
>
> In this project, ChatGPT acts as the prompt compiler / control surface. That external layer is defined in `control-surface.md`, which is intentionally kept outside the repo.
>
> This separation is intentional.
>
> A full mirrored copy of `control-surface.md` might seem tidy, but structurally it would collapse 2 different control planes into one repo surface:
> - execution rules for work inside the repo
> - prompt-compilation rules that operate outside the repo
>
> That would increase duplication risk, blur responsibility boundaries, and make drift more likely between the repo copy and the actual control source.
>
> So the repo documents the boundary and keeps the in-repo execution rules local, while `control-surface.md` remains the canonical source for prompt-compilation behavior.
