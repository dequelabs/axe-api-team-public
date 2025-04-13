# add-to-board-v1

A GitHub Action to move issues to a specific column on a project board.

## Inputs

| Name             | Required | Description                                                    | Default |
| ---------------- | -------- | -------------------------------------------------------------- | ------- |
| `issue-urls`     | Yes      | Comma delimited list of issue urls to add to the project board | NA      |
| `project-number` | No       | The project number to add the issue to                         | `188`   |
| `column-name`    | No       | The column name to move the issue to                           | `New`   |

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
          issue-urls: 'https://github.com/owner/repo/issues/1'
          # or
          # issue-urls: 'https://github.com/owner/repo/issues/1,https://github.com/owner/repo/issues/2'
        env:
          # Required for the GH CLI
          GH_TOKEN: ${{ secrets.PAT }}
```

## Example (automatically add to board, when an issue is created)

```yaml
name: Add to board

on:
  issues:
    types: [opened]

jobs:
  add-to-board:
    runs-on: ubuntu-latest
    steps:
      - name: Add to board
        uses: ./.github/actions/add-to-board-v1
        with:
          issue-url: ${{ github.event.issue.html_url }}
          column-name: 'Ungroomed'
        env:
          # Required for the GH CLI
          GH_TOKEN: ${{ secrets.PAT }}
```
