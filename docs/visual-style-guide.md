# Visual Style Guide

## Purpose

This document defines the repo's **computational visual language**.

Its shorthand or internal vibe is:

> terminal-inflected systems minimalism

This guide governs both:

- the p5.js sketch presentation language
- future didactic diagrams and visual explainers

It is not a brand guide, a marketing style guide, or a nostalgic terminal mood board.

It exists to keep mazeASK visually coherent as a technical, didactic, and computational system.

## Core Principles

### Structure over ornament

The visual system should make structure easier to read.

Decoration is secondary.

If a decorative move makes adjacency, hierarchy, ownership, or flow harder to read, it is the wrong move.

### Clarity before flourish

The first responsibility of the visual language is legibility.

Beauty matters, but it should emerge through:

- proportion
- rhythm
- spacing
- alignment
- restrained color relationships

not through extra styling noise.

### Diagrammatic legibility

The sketch and any future didactic diagrams should read like explanations of a system.

The viewer should be able to identify:

- what is structure
- what is connectivity
- what is active state
- what is annotation

without relying on decorative cues.

### Restraint with intention

Minimalism here does not mean blankness or indifference.

It means each visual decision should feel deliberate, placed, and necessary.

### Modern computational editorial tone

The target tone is:

- technical
- editorial
- clean
- modern
- computational

It should feel closer to a precise systems notebook or diagram sheet than to a playful interface or a retro-terminal costume.

## Typography and Labeling

### Alignment

Text should default to left alignment.

Left alignment supports:

- scanability
- hierarchy
- stable annotation rhythm
- system-diagram readability

### Label style

Labels should be terse and annotation-like.

Prefer:

- identifiers
- compact readouts
- short structural phrases
- system-language fragments

over chatty or expressive captions.

### Separator syntax

`//` is the preferred separator syntax for compact readouts and overlay metadata.

It should read as system annotation, not as decoration.

### Annotation over caption

Labels should behave like technical annotations attached to a system view.

They should not feel like UI bubbles, playful helper text, or narrative captions.

### Preference for abstraction

*Ceteris paribus*, abstract and minimal labels are preferred over literal descriptive labels when both are legible.

For example, a compact structural readout is usually better than a verbose explanatory tag if the shorter version still communicates the necessary distinction.

## Composition

### Anchored placement

Overlays, readouts, and explanatory labels should feel anchored to corners, margins, or clear structural zones.

They should look placed, not floating.

### Strong spatial order

Composition should communicate hierarchy through:

- consistent margins
- stable alignment
- predictable grouping
- repeatable layout logic

### Negative space

Generous negative space is part of the language.

It helps the sketch and diagrams feel:

- calm
- readable
- intentional

Crowding should be treated as a structural failure, not as energetic visual density.

### Hierarchy before decoration

Hierarchy should be created first through:

- spacing
- grouping
- alignment
- scale

Only after those are working should color, opacity, or weight be used to reinforce emphasis.

### Canonical aspect ratios

Prefer canonical aspect ratios across mazeASK visual outputs for the sake of consistency.

The canonical aspect ratios are:

- `1:1`
- `4:3`
- `16:9`

Using a small canonical set helps preserve structural consistency across outputs and reinforces the broader visual language of restraint, order, and repeatable layout logic.

In general, orientation can vary by context.

For didactic diagrams and visual explainers, horizontal composition will usually be preferred for layout and readability, but vertical composition is acceptable when the content genuinely benefits from it.

For rendered output mode in the sketch, prefer horizontal outputs only:
- `1:1`
- `4:3`
- `16:9`

Aspect ratio should support clarity, structural legibility, and intentional presentation, not novelty.

## Color Philosophy

### Palette logic

The palette is randomized, but constrained.

The goal is not maximal color contrast or fixed theme assignment.

The goal is to preserve subtle, computationally calm combinations while rejecting obviously unreadable role assignments.

### Legibility rule

Contrast should be governed by floors, not by a default preference for maximum separation.

Subtle beauty is allowed as long as the relevant structure remains readable.

### Current named swatches

The current palette should be understood as the following named swatches:

- `#FFFFFF` // `rgb(255, 255, 255)` // white
- `#8B79A2` // `rgb(139, 121, 162)` // smokey lavender 1
- `#C19AD8` // `rgb(193, 154, 216)` // warm lavender 1
- `#A492C8` // `rgb(164, 146, 200)` // warm lavender 2
- `#AE87C2` // `rgb(174, 135, 194)` // warm lavender 4
- `#E2D3F0` // `rgb(226, 211, 240)` // warm lavender 5
- `#84509B` // `rgb(132, 80, 155)` // smokey plum 1
- `#725583` // `rgb(114, 85, 131)` // smokey plum 2
- `#BE3FF6` // `rgb(190, 63, 246)` // violet 1

Some swatches carry more weight than others.

That weighting is represented explicitly in code.

### Current contrast-floor parameters

The current p5.js role-assignment floors are:

- stronger floor for `color4ASK` against the background = `95`
- lighter floor for `color1ASK` against the background = `52`

These values embody the current visual philosophy:

- preserve visibility for the active cell, border, and overlay role
- preserve minimum wall readability
- avoid forcing every palette outcome into a stark high-contrast look

## Diagram Style

Explanatory graphics should read as system diagrams, not as marketing infographics.

They should feel native to the repo's logic.

That means:

- geometry should come from actual structural ideas in the repo
- visual emphasis should clarify adjacency, links, ownership, flow, and state
- labels should help the viewer parse the system, not entertain them

When possible, a diagram should feel like a visual extension of the sketch's own logic rather than an externally imposed illustration style.

## Tone and Exclusions

The target tone is:

- technical
- clean
- didactic
- systems-oriented
- minimal but intentional

This style is explicitly **not**:

- whimsical
- UI-bubbly
- faux-hacker grunge
- skeuomorphic terminal nostalgia
- retro-terminal cosplay

The "terminal-inflected" part should remain mild.

It should show up in:

- annotation syntax
- alignment discipline
- compact readout language
- structural economy

not in fake scanlines, CRT nostalgia, glitch decoration, or heavy retro theming.

## Application Notes

### Sketch overlays and readouts

Use terse, left-aligned, margin-anchored overlays that read like system status rather than UI chrome.

Current readouts such as algorithm/topology/speed strings are good examples of the direction:

- compact
- structural
- annotation-like

### Topology visuals

Topology views should make structural difference readable through geometry and adjacency first.

The visual treatment should support comparison without making any topology feel ornamental or novelty-driven.

### Future didactic explainers

Didactic visuals should inherit the same language:

- clean fields
- strong alignment
- sparse but precise labeling
- system-diagram emphasis

The result should feel like a computational editorial document, not a presentation slide deck.
