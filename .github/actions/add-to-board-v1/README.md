# add-to-board-v1

A GitHub Action to add (if not already) and move issues to a project board.

## Inputs

| Name             | Required | Description                                                 | Default   |
| ---------------- | -------- | ----------------------------------------------------------- | --------- |
| `issue-url`      | Yes      | A single issue URL, or a stringified list of URLS the board | NA        |
| `project-number` | No       | The project number to add the issue to                      | `66`      |
| `column-name`    | No       | The column name to move the issue to                        | `Backlog` |

## Permissions

This action requires the following permission scopes:

- `repo` - To create the issue within private repositories
- `workflow` - To access the `GITHUB_TOKEN` secret
- `write:org` - To add the issue to a project board
- `read:org` - To read the project board
- `project` - access to project board

## Example usage

```yaml
name: Add to board

on: workflow_dispatch

jobs:
  add-to-board:
    runs-on: ubuntu-latest
    steps:
      - name: Add to board
        uses: ./.github/actions/add-to-board-v1
        with:
          issue-url: 'https://github.com/owner/repo/issues/1'
        env:
          # Required for the GH CLI
          GH_TOKEN: ${{ secrets.PAT }}
```
