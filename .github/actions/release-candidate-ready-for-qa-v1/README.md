# release-candidate-ready-for-qa-v1

A GitHub Action that lets the QA team know a release candidate is ready for QA

## Inputs

| Name            | Required | Description                                                    | Default                      |
| --------------- | -------- | -------------------------------------------------------------- | ---------------------------- |
| `sha-rc`        | No       | 8 characters SHA of the release commit from the release branch | git rev-parse --short=8 HEAD |
| `slack-webhook` | Yes      | A Slack channel webhook URL where the message will be sent     | NA                           |

## Example usage

```yaml
name: Release candidate ready for qa

jobs:
  release-candidate:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: dequelabs/axe-api-team-public/.github/actions/release-candidate-ready-for-qa-v1-v1@main
        with:
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
        env:
          # Required for the GH CLI
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Permissions

This action requires the following permission scopes:

- `issues: write` - To add a comment into an issue
- `contents: read` - To work with the contents of the repository
