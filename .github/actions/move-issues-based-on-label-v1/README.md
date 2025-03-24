# move-issues-based-on-label-v1

This action moves issues based on a label and a source column (if it is provided) to the target column in a project board.

## Inputs

| Name             | Required | Description                                                                                                     | Default |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------- | ------- |
| `project-number` | Yes      | The project number of the project board                                                                         | NA      |
| `source-column`  | No       | The name of the column where issues should be found and moved from                                              | NA      |
| `target-column`  | Yes      | The name of the column where matching issues will be moved to                                                   | NA      |
| `team-label`     | No       | The team label name to move only team-related issues                                                            | NA      |
| `label-prefix`   | Yes      | The label to match against issues (e.g. "release" will find all issues with a label that starts with "release") | NA      |
| `token`          | Yes      | The GitHub token with the required permissions (see below)                                                      | NA      |

## Example

```yaml
name: Move issues based on label

on: workflow_dispatch

jobs:
  move-issues-based-on-label:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          # Fetch all history
          fetch-depth: 0
      - uses: dequelabs/axe-api-team-public/.github/actions/move-issues-based-on-label-v1@main
        with:
          project-number: 186
          target-column: 'released'
          source-column: 'done'
          team-label: 'team-name'
          label-prefix: 'RELEASED:'
          token: ${{ secrets.GITHUB_TOKEN }}
    env:
      # Requires for GH CLI
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Permissions

This action requires the following permission scopes:

- `repo` - To create the issue within private repositories
- `workflow` - To access the `GITHUB_TOKEN` secret
- `write:org` - To add the issue to a project board
- `read:org` - To read the project board
- `project` - access to project board
