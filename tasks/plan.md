# Implementation Plan: Vera-Inspired Titans Storefront

## Overview

Strengthen the Titans storefront with the conversion logic observed on Vera Scripts while preserving Titans' dark coral identity, verified Whop products, first-party proof, and product-first homepage structure.

## Architecture Decisions

- Keep the site dependency-free and static; extend the existing shared HTML/CSS system.
- Keep all verified prices, plan links, access boundaries, and Whop authentication routes unchanged.
- Use only existing Titans media and factual claims. No fabricated counters, testimonials, discounts, or guarantees.
- Apply Vera-inspired hierarchy, section rhythm, proof sequencing, and mobile card peeks without copying Vera's brand assets or language.

## Task List

### Phase 1: Conversion Architecture

- [x] Reframe the homepage around the creator's desired outcome and three clear product paths.
- [x] Add first-party proof immediately after the offer selector.
- [x] Add a three-step mechanism, objection handling, and a final future-state CTA.

### Checkpoint: Conversion Architecture

- [x] Product selector remains the first homepage section.
- [x] Prices, routes, and product boundaries remain accurate.
- [x] Launch validation passes.

### Phase 2: Visual System and Responsive Polish

- [x] Add charcoal surfaces, subtle grid/glow, bordered cards, and stronger CTA hierarchy.
- [x] Add mobile horizontal card previews with scroll snapping and no horizontal page overflow.
- [x] Preserve visible focus states, reduced-motion behavior, heading order, and touch target sizes.

### Checkpoint: Complete

- [x] Authentication tests and launch validation pass.
- [x] Desktop and mobile browser screenshots match the intended hierarchy.
- [x] Browser console contains no new first-party errors.
- [x] `dist/`, secrets, auth code, and deployment files remain untouched.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Homepage becomes too long or generic | Medium | Keep each section focused on one conversion question and reuse only real Titans assets. |
| Visual changes weaken Titans identity | Medium | Retain Inter, black/coral tokens, Titans logo, and restrained motion. |
| Mobile swipe cards hide choices | Medium | Show a visible next-card peek, keep all links keyboard reachable, and avoid page-level overflow. |
| Marketing copy overpromises | High | Use verified product facts, first-party proof, and explicit results disclaimers. |

## Open Questions

- None blocking. Deployment remains outside this task unless separately requested.
