# is-release-week-v1

A GitHub Action to determine if release should continue to run or stop.

## Inputs

| Name      | Required | Description                                                                            | Default |
| --------- | -------- | -------------------------------------------------------------------------------------- | ------- |
| `oddWeek` | yes      | `true` if the action should run on odd weeks, `false` if the action should run on even | `false` |

## Outputs

| Name            | Description                                            |
| --------------- | ------------------------------------------------------ |
| `isReleaseWeek` | `true` if the week of year matches the `oddWeek` input |

## Example usage

```yaml
uses: dequelabs/axe-api-team-public/.github/actions/is-release-week-v1@main
with:
  oddWeek: true
```
