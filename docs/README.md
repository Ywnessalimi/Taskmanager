# Project Documentation (Documentation Index)

This folder is the source of truth for the project's product, design, frontend, and backend. Before changing any code, read the relevant document and update it if needed (see the rules in [AGENTS.md](../AGENTS.md)).

## Suggested reading order

1. **[PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md)** — product vision, glossary, conceptual data model, information architecture (the 4 main tabs), and a full description of the pages. The starting point for every other decision.
2. **[DESIGN.md](./DESIGN.md)** — the visual language: color, typography, element sizing, and button/view patterns.
3. **[FRONTEND.md](./FRONTEND.md)** — the frontend architecture with Next.js: routes, components, the data layer.
4. **[BACKEND.md](./BACKEND.md)** — the backend architecture with Django + SQLite: apps, data model, API, migration path.
5. **[DEPLOYMENT.md](./DEPLOYMENT.md)** — running the demo build on a server: standalone output, systemd service, port, and firewall.

## Current project status

Phase 1: only the frontend (Next.js) is being fully built; the backend (Django + SQLite) is simple and basic, but structured so a later migration to a more professional system stays easy. Details are in the closing section of [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md#۴-نقشه‌ی-راه-فاز-اول-phase-1-scope).
