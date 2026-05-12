# Update Dependencies and Configurations

## Objective
Update the outdated NestJS repository to modern standards by upgrading to NestJS 11, Node 20 LTS, TypeScript 5.x, and standardizing on `yarn` as the package manager.

## Key Files & Context
- `package.json`: Needs major version bumps for NestJS (`@nestjs/*`), TypeScript, TypeORM, RxJS, and other ecosystem dependencies. Script adjustments to prefer `yarn` where `npm` was hardcoded.
- `Dockerfile`: Needs to use `node:20-alpine`, replace `npm install` with `yarn install`, and `npm run build` with `yarn build`.
- `docker-compose.yml`: Change `command: npm run start:dev` to `command: yarn start:dev`.
- `tsconfig.json`: Update `target` to `es2022`, ensuring compatibility with TS 5.x and NestJS 11.

## Implementation Steps
1. **Dependency Upgrade**:
   - Update all `@nestjs/*` packages to `^11.0.0`.
   - Update `typescript` to `^5.0.0`.
   - Update `rxjs` to latest compatible version (typically `^7.8.0` or `^8.0.0`).
   - Update `@nestjs/typeorm`, `typeorm`, and `pg` to their latest compatible versions.
   - Update other ecosystem packages (`class-validator`, `class-transformer`, `jest`, etc.).
   - Standardize `scripts` in `package.json` to avoid `npm` hardcoding (e.g., `deploy` script).
2. **Package Manager Standardization**:
   - Clean up `package-lock.json` if it exists.
   - Run `yarn install` to generate an updated `yarn.lock`.
3. **TypeScript Configuration (`tsconfig.json`)**:
   - Update `target` to `es2022` to leverage modern JavaScript features natively.
   - Maintain `experimentalDecorators` and `emitDecoratorMetadata`.
4. **Docker Updates**:
   - Update `Dockerfile`: `FROM node:20-alpine`. Replace `npm install --only=development` with `yarn install`, and `npm install --only=production` with `yarn install --production`.
   - Update `docker-compose.yml`: Use `yarn start:dev` for the main service command.
5. **Code Fixes (if required)**:
   - Resolve any immediate breaking changes introduced between NestJS 8 and 11, TypeScript 4 to 5, or TypeORM updates.

## Verification & Testing
- Run `yarn build` to ensure the project compiles without TypeScript errors.
- Run `yarn test` to ensure all unit and integration tests pass.
- Start the application via `docker-compose up --build` and verify the server starts correctly and connects to the Postgres database.
