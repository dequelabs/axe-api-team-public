# create-update-axe-pull-core-request-v1

A GitHub Action to update axe-core and create a pull request.

## Inputs

| Name                  | Required | Description                                                                                | Default |
| --------------------- | -------- | ------------------------------------------------------------------------------------------ | ------- |
| `token`               | Yes      | `GITHUB_TOKEN` (permissions `contents: write` and `pull-requests: write`) or a repo scoped Personal Access Token (PAT).                   | NA      |
| `base`                | No       | The branch the pull request will be merged into                                            | `develop`      |

## Example usage

```yaml
name: Update axe-core

on:
  schedule:
    # Run every night at midnight
    - cron: '0 0 * * *'
  workflow_dispatch:

jobs:
  create-project-issue:
    runs-on: ubuntu-latest
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/create-update-axe-core-pull-request-v1@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```