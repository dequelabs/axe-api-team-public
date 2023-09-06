# is-release-week-v1

A GitHub Action to determine if release should continue to run or stop.

## Inputs

### `oddWeek`

**Required** `true` if the action should run on odd weeks, `false` if the action should run on even

## Outputs

### `isReleaseWeek`

`true` if the week of year matches the `oddWeek` input, `false` otherwise

## Example usage

```yaml
uses: dequelabs/axe-api-team-public/.github/actions/is-release-week-v1@main
with:
  oddWeek: true
```
