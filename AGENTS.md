# Project Rules

## Environment Variables

- Keep `.env` and `.env.example` in sync: every environment variable key present in one file must be present in the other.
- Every environment variable used by project source code or runtime configuration must be listed in both `.env` and `.env.example`.
- Store real local values only in `.env`. Use safe placeholder values in `.env.example`; never commit real secrets.
- When adding, renaming, or removing an environment variable, update both env files in the same change and run `npm run env:check`.
