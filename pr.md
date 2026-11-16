## Description of the Change

Adds two scripts that run `@vscode/vsce` via `pnpm dlx`: `pnpm package` builds `daily-tasks-<version>.vsix`, and `pnpm release` uploads exactly that file to the VS Code Marketplace. Using `pnpm dlx` keeps vsce and its ~140 transitive packages out of the dependencies and lockfile.

## Benefits

Releasing no longer relies on a globally installed vsce or remembering the right commands, and the README documents the steps. Building and uploading are separate steps, so the uploaded package is the one that was checked.

## Applicable Issues

None
