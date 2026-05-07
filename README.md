# Roast Dinners in London

A site reviewing roast dinners across London — rating pubs, restaurants, and chains, with stats, maps, and rankings.

Built with [Astro](https://astro.build), deployed on [Vercel](https://vercel.com). Content is pulled from a WordPress GraphQL backend. Auth is handled by [Clerk](https://clerk.com). Data is stored in [Neon](https://neon.tech) (Postgres) via [Drizzle ORM](https://orm.drizzle.team).

## Getting started

```sh
yarn install
yarn dev
```

The dev server starts at `http://localhost:4321`.

## Commands

| Command | Action |
| :--- | :--- |
| `yarn dev` | Start local dev server |
| `yarn build` | Build for production |
| `yarn preview` | Preview the production build locally |
| `yarn test` | Run unit tests (Vitest) |
| `yarn test:watch` | Run unit tests in watch mode |
| `yarn test:coverage` | Generate code coverage report |
| `yarn test:e2e` | Run end-to-end tests (Playwright) |
| `yarn lint` | Check code with Biome |
| `yarn lint:fix` | Auto-fix lint issues |
| `yarn db:generate` | Generate Drizzle migrations |
| `yarn db:migrate` | Run migrations |

## Tech stack

- **Framework:** Astro 6 with React and Alpine.js islands
- **Styling:** CSS (per-component files)
- **Testing:** Vitest (unit), Playwright (e2e)
- **Linting:** Biome
- **Database:** Neon (Postgres) + Drizzle ORM
- **Auth:** Clerk
- **Deployment:** Vercel
