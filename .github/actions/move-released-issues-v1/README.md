# move-released-issues-v1

This action moves issues that have been released.

## Inputs

| Name              | Required | Description                             | Default |
| ----------------- | -------- | --------------------------------------- | ------- |
| `issues-url-list` | Yes      | The list of released issues URL\*       | NA      |
| `project-number`  | Yes      | The project number of the project board | NA      |
| `release-сolumn`  | Yes      | Column name to move a released issue    | NA      |

### Notes:

\*The value for the input `issues-url-list` should be taken from the [label-released-issues-v1](https://github.com/dequelabs/axe-api-team-public/tree/main/.github/actions/label-released-issues-v1) GitHub action output.

## Example

```yaml
name: Move released issues

on: workflow_dispatch

jobs:
  move-released-issues:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          # Fetch all history
          fetch-depth: 0
      - uses: dequelabs/axe-api-team-public/.github/actions/get-latest-and-previous-tags-v1@main
        id: get-tags
      - uses: dequelabs/axe-api-team-public/.github/actions/generate-commit-list-v1@main
        id: get-commit-list
        with:
          tag: ${{ steps.get-tags.outputs.previous-tag }}
      - uses: dequelabs/axe-api-team-public/.github/actions/label-released-issues-v1@main
        id: label-released-issues
        with:
          commit-list: ${{ steps.get-commit-list.outputs.commit-list }}
          label-tag: ${{ steps.get-tags.outputs.latest-tag }}
          project-number: 186
          done-columns: done
          token: ${{ secrets.PAT }}
      - uses: dequelabs/axe-api-team-public/.github/actions/move-released-issues-v1@main
        with:
          issues-url-list: ${{ steps.label-released-issues.outputs.issue-urls }}
          project-number: 186
          release-column: Released
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
