# label-and-move-released-issues-v1

This action labels and moves issues that have been released.

## Inputs

| Name             | Required | Description                                                          | Default |
| ---------------- | -------- | -------------------------------------------------------------------- | ------- |
| `commit-list`    | Yes      | The list of commits generated from the "Generate commit list" action | NA      |
| `version`        | Yes      | The version number of the release                                    | NA      |
| `token`          | Yes      | The GitHub token with the required permissions (see below)           | NA      |
| `project-number` | No       | The project number of the project board                              | 186     |
| `column-name`    | No       | Name of column to move to, if provided                               | `''`    |

## Example

```yaml
name: Label and move released issues

on: workflow_dispatch

jobs:
  create-project-issue:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          # Fetch all history
          fetch-depth: 0
      - uses: dequelabs/axe-api-team-public/.github/actions/generate-commit-list-v1@main
        id: commits
        with:
          base: 'main'
          head: 'develop'
      - uses: dequelabs/axe-api-team-public/.github/actions/label-and-move-released-issues-v1@main
        with:
          token: ${{ secrets.PAT }}
          commit-list: '${{ steps.commits.outputs.commit-list }}'
          version: 1.1.0
          project-number: '66'
          column-name: 'released'
        env:
          # Requires for GH CLI
          GH_TOKEN: ${{ secrets.PAT }}
```

## Permissions

This action requires the following permission scopes:

- `repo` - To create the issue within private repositories
- `workflow` - To access the `GITHUB_TOKEN` secret
- `write:org` - To add the issue to a project board
- `read:org` - To read the project board
- `project` - access to project board
