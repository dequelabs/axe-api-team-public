# label-issue-based-on-existing-labels-v1

This action labels GitHub issue based on existing labels already present on the issue.

## Inputs

| Name                   | Required | Description                                                               | Default            |
| ---------------------- | -------- | ------------------------------------------------------------------------- | ------------------ |
| `token`                | Yes      | A GitHub token with the required permissions                              | NA                 |
| `issue-number`         | Yes      | The issue number to process                                               | NA                 |
| `issue-organization`   | No       | The organization/owner of the repository                                  | Current repo owner |
| `issue-repo`           | No       | The repository name                                                       | Current repo name  |
| `trigger-labels`       | Yes      | Comma-separated list of labels that trigger this action when present      | NA                 |
| `add-labels`           | Yes      | Comma-separated list of labels to add when trigger conditions are met     | NA                 |
| `require-all-triggers` | No       | Whether ALL trigger labels must be present (`true`) or just ANY (`false`) | `false`            |

## Outputs

| Name              | Description                                                                            |
| ----------------- | -------------------------------------------------------------------------------------- |
| `actionProceeded` | Boolean indicating whether the action completed successfully and labels were processed |

## Example

```yaml
name: Auto Documentation Labels

on:
  issues:
    types: [closed]

jobs:
  add-doc-labels:
    runs-on: ubuntu-latest
    steps:
      - name: Add documentation label
        uses: dequelabs/axe-api-team-public/.github/actions/label-issue-based-on-existing-labels-v1@main
        with:
          token: ${{ secrets.GH_TOKEN }}
          issue-number: ${{ github.event.issue.number }}
          trigger-labels: 'docs-required'
          add-labels: 'needs-documentation'
          # issue-organization and issue-repo are optional - defaults to current repository
```

## Permissions

This action requires the following permission scopes:

- `issues:write` - To add labels to issues
- `contents:read` - To read repository information

For cross-repository usage, use a Personal Access Token (PAT) with `repo` scope.

## How it works

1. Fetches current labels on the specified issue using GraphQL
2. Checks if trigger conditions are met based on `require-all-triggers` setting
3. Automatically creates any missing labels
4. Adds the specified labels to the issue if conditions are met
5. Returns `actionProceeded` output indicating success/failure
