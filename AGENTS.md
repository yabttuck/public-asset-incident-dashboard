# Repository Guidelines

## Project Structure & Module Organization

This repository is planned as a Next.js and Supabase public-facilities incident dashboard. Keep application routes in `src/app/`, reusable UI in `src/components/`, shared helpers in `src/lib/`, Supabase migrations and seed data in `supabase/`, tests near the behavior they cover or under `tests/`, and static assets in `public/`. Follow the structure established by the app scaffold if it differs; do not create extra layers without a concrete need.

## Build, Test, and Development Commands

Use the package manager and scripts recorded in `package.json` and its lockfile. Typical Next.js commands are `npm run dev` for local development, `npm run build` for a production build, `npm run lint` for lint checks, and `npm test` for tests when configured. Add or change scripts only when the corresponding tooling is present, and document required Supabase local services or environment variables.

## Coding Style & Naming Conventions

Use TypeScript for application code and follow the repository formatter and lint configuration. Name React components and types in `PascalCase`, hooks with the `use` prefix, and ordinary functions and variables in `camelCase`. Prefer the smallest change that meets the requirement; avoid speculative abstractions and unrelated cleanup.

## Testing Guidelines

Use the test runner configured by the project; do not assume a framework or coverage threshold before one is selected. Cover incident reporting, role-based access, status transitions, and audit-history behavior as those features are implemented. For each change, state how success will be checked and run the relevant checks.

## Commits and Pull Requests

No Git history is available yet, so no existing commit convention can be verified. Use a concise, imperative commit subject, such as `Add incident status history`. Pull requests should explain the user-visible change, list checks run and their results, link related issues when available, and include screenshots for UI changes.

## Security and Working Practices

Never commit Supabase service-role keys or other secrets; use local environment variables and provide a sanitized `.env.example`. Enforce authorization with Supabase Row Level Security, not only UI checks. Before coding, state assumptions and clarify material ambiguity; prefer simple, targeted edits, then verify the defined success criteria.
