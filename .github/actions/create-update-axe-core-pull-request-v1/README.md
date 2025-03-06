# create-update-axe-core-pull-request-v1

A GitHub action to create a PR that updates axe-core to the latest stable version. It noops if no update is available.

- It updates `package.json`, `yarn.lock`, and `package-lock.json`.
- It is compatible with both workspaces and non-workspaces monorepos.
- It handles dependencies and devDependencies.
- It maintains whatever pinning strategy was already in place (`~`, `^`, or `=`).

Workflows should generally use this instead of using [update-axe-core](../update-axe-core-v1/README.md) directly.

This action can be replaced with dependabot config once [dependabot-core#1778](https://github.com/dependabot/dependabot-core/issues/1778) is resolved.

## Inputs

| Name    | Required | Description                                                                                                             | Default   |
| ------- | -------- | ----------------------------------------------------------------------------------------------------------------------- | --------- |
| `token` | Yes      | `GITHUB_TOKEN` (permissions `contents: write` and `pull-requests: write`) or a repo scoped Personal Access Token (PAT). | NA        |
| `base`  | No       | The branch the pull request will be merged into                                                                         | `develop` |
| `should-checkout`  | No       | Whether or not the action should checkout the repository                                                                           | `true` |
| `should-setup-node`  | No       | Whether or not the action should setup node on behalf of the consumer                                                                         | `true` |

## Example usage

```yaml
name: Update axe-core

on:
  schedule:
    # Run every night at midnight
    - cron: '0 0 * * *'
  workflow_dispatch:

jobs:
  update-axe-core:
    runs-on: ubuntu-latest
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/create-update-axe-core-pull-request-v1@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```
