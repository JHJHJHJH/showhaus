# Showhouse Monorepo

This repository combines the former standalone repositories:

- `showhouse.api` -> `apps/api`
- `showhouse.app` -> `apps/app`

## Common commands

```bash
# API
yarn api:install
yarn api:build
yarn api:test
yarn api:start:dev

# App
yarn app:install
yarn app:build
yarn app:start
```

Each app still owns its package manifest and lockfile under `apps/<name>/`.
