# Workflow Boundary

This repo contains the rules that govern work performed **inside the repo**.

Those rules live in `AGENTS.md` and apply to Codex execution behavior such as:
- branch + PR workflow
- scope discipline
- separation of concerns
- comments, commits, and PR hygiene

A separate external control layer governs how work is framed **before** it reaches Codex.

In this project, ChatGPT acts as the prompt compiler / control surface. That external layer is defined in `codexControl.md`, which is intentionally kept outside the repo.

This separation is intentional.

A full mirrored copy of `codexControl.md` might seem tidy, but structurally it would collapse 2 different control planes into one repo surface:
- execution rules for work inside the repo
- prompt-compilation rules that operate outside the repo

That would increase duplication risk, blur responsibility boundaries, and make drift more likely between the repo copy and the actual control source.

So the repo documents the boundary and keeps the in-repo execution rules local, while `codexControl.md` remains the canonical source for prompt-compilation behavior.
