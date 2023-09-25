# is-release-in-progress-v1

A GitHub Action to determine if the repository already has a release pr open

## Inputs

| Name           | Required | Description         |
| -------------- | -------- | ------------------- |
| `github-token` | yes      | GitHub Secret Token |

## Outputs

| Name                     | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `is-release-in-progress` | `true` if an open RC or a release PR already exists |

## Example usage

```yaml
uses: dequelabs/axe-api-team-public/.github/actions/is-release-in-progress-v1@main
with:
  github-token: ${{ secrets.GITHUB_TOKEN }}
```
