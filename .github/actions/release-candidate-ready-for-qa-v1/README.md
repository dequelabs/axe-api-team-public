# release-candidate-ready-for-qa-v1

A GitHub Action to prepare already created a release candidate for QA.

## Inputs

| Name            | Required | Description                                                | Default            |
| --------------- | -------- | ---------------------------------------------------------- | ------------------ |
| `sha-rc`        | Yes      | SHA of the release commit from the release branch          | NA                 |
| `slack-webhook` | Yes      | A Slack channel webhook URL where the message will be sent | NA                 |
| `owner`         | No       | An owner of the repository                                 | $GITHUB_REPOSITORY |
| `repo`          | No       | A repository name                                          | $GITHUB_REPOSITORY |

## Example usage

```yaml
name: Release candidate ready for qa

jobs:
  release-candidate:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@v4
      - uses: dequelabs/axe-api-team-public/.github/actions/release-candidate-ready-for-qa-v1-v1@main
        with:
          sha-rc: 4b632c61
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
        env:
          # Required for the GH CLI
          GH_TOKEN: ${{ secrets.PAT }}
```