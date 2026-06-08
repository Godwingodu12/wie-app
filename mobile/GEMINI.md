# Metro Configuration for Windows (pnpm Monorepo)

## Watch Mode and Path Resolution Fix
The "UnableToResolveError" (404) for `expo-router/entry` on Windows was caused by Metro's inability to serve files from the root `.pnpm` store when they were outside the `watchFolders`.

### Fixes applied:
- Re-added `workspaceRoot` to `config.watchFolders` to allow Metro to serve files from the root `node_modules/.pnpm` store.
- Introduced a local `mobile/index.js` as the entry point (`"main": "index.js"`) to ensure Metro starts its resolution from within the project directory.
- Enhanced `config.resolver.blockList` to exclude non-mobile folders (like `server/`, `.git/`, `dist/`) to mitigate performance issues on Windows when watching the entire workspace.
- Kept `config.resolver.unstable_enableSymlinks: true` and `config.resolver.nodeModulesPaths` for correct pnpm resolution.
- Kept `config.maxWorkers: 4` for faster bundling.

**Note:** If performance is still an issue, consider installing [Watchman](https://facebook.github.io/watchman/docs/install#windows) for more efficient file watching.

