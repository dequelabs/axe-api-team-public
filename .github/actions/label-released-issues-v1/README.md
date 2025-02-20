# label-released-issues-v1

This action labels and closes issues that have been released.

## Inputs

| Name             | Required | Description                                                             | Default      |
| ---------------- | -------- | ----------------------------------------------------------------------- | ------------ |
| `commit-list`    | Yes      | The list of released commits                                            | NA           |
| `label-tag`      | Yes      | The released tag name (e.g. v1.2.0)                                     | NA           |
| `project-number` | Yes      | The project number of the project board                                 | NA           |
| `done-columns`   | No       | Board column names mean that an issue is done (must be comma separated) | done,devDone |
| `token`          | Yes      | The GitHub token with the required permissions (see below)              | NA           |

## Outputs

| Name         | Description                                     |
| ------------ | ----------------------------------------------- |
| `issue-urls` | The issues URLs that are related to the release |

## Example

```yaml
name: Label released issues

on: workflow_dispatch

jobs:
  label-released-issues:
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

## Example output

```json
[
  "https://github.com/org-name/repo-name/issues/70",
  "https://github.com/org-name/repo-name/issues/71"
]
```
