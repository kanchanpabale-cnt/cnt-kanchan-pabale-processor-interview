/**
 * Root-level Jest config.
 *
 * Only the client workspace uses Jest (@swc/jest + React Testing Library).
 * The server uses Vitest — its tests live in server/tests and use the `vi.*`
 * API, which would fail to parse under Jest.
 *
 * Running `npx jest` from the repo root delegates here, which in turn scopes
 * Jest to the client project. For server tests, use `npm test -w server`
 * (or the root-level `npm test`, which runs both runners in sequence).
 */
module.exports = {
  projects: ['<rootDir>/client'],
};
