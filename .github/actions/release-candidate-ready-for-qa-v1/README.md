# release-candidate-ready-for-qa-v1

A GitHub Action to prepare already created a release candidate for QA.

## Inputs

| Name            | Required | Description                                                | Default                      |
| --------------- | -------- | ---------------------------------------------------------- | ---------------------------- |
| `sha-rc`        | No       | SHA of the release commit from the release branch          | git rev-parse --short=8 HEAD |
| `slack-webhook` | Yes      | A Slack channel webhook URL where the message will be sent | NA                           |
| `owner`         | No       | An owner of the repository                                 | $GITHUB_REPOSITORY           |
| `repo`          | No       | A repository name                                          | $GITHUB_REPOSITORY           |

## Example usage

```yaml
name: Release candidate ready for qa

jobs:
  release-candidate:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    permissions:
      issues: write
    steps:
      - uses: actions/checkout@v4
      - uses: dequelabs/axe-api-team-public/.github/actions/release-candidate-ready-for-qa-v1-v1@main
        with:
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
        env:
          # Required for the GH CLI
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
