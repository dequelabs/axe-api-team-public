# is-release-in-progress-v1

A GitHub Action to determine if a parent GHA should continue to run or stop.

## Inputs

| Name          | Required | Description         |
| ------------- | -------- | ------------------- |
| `githubToken` | yes      | GitHub Secret Token |

## Outputs

| Name                  | Description                                         |
| --------------------- | --------------------------------------------------- |
| `isReleaseInProgress` | `true` if an open RC or a release PR already exists |

## Example usage

```yaml
uses: dequelabs/axe-api-team-public/.github/actions/is-release-in-progress-v1@main
with:
  githubToken: ${{ secrets.GITHUB_TOKEN }}
```
