# move-released-issues-and-create-sync-pr-v1

A GitHub Action to label all related issues with the package version and create a PR to sync branches

## Inputs

| Name                | Required | Description                                  | Default      |
| ------------------- | -------- | -------------------------------------------- | ------------ |
| `token`             | Yes      | A GitHub token with the required permissions | NA           |
| `project-number`    | No       | A project number of the project board        | 188          |
| `column-name`       | No       | Name of column to move to                    | Released     |
| `head`              | No       | A head branch to sync from                   | main         |
| `base`              | No       | A target branch for the created pull request | develop      |
| `pr-team-reviewers` | No       | Reviewers to tag on the created pull request | results-team |

## Example usage

```yaml
name: Deploy release

jobs:
  move-released-issues-and-create-sync-pr:
    runs-on: ubuntu-latest
    timeout-minutes: 7
    steps:
      - uses: actions/checkout@v4
        with:
          # Fetch all history
          fetch-depth: 0
      - uses: dequelabs/axe-api-team-public/.github/actions/move-released-issues-and-create-sync-pr-v1@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          project-number: '66'
          column-name: 'released'
          head: main
          base: develop
          pr-team-reviewers: axe-api-team
        env:
          # Required for the GH CLI
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Permissions

This action requires the following permission scopes:

- `repository-projects: read` - To move issues into a project
- `issues: write` - To add a label into an issue
- `contents: read` - To work with the contents of the repository
