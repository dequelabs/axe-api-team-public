# deploy-release-candidate-v1

A GitHub Action to prepare already created release candidate for QA.

## Inputs

| Name            | Required | Description                                                | Default |
| --------------- | -------- | ---------------------------------------------------------- | ------- |
| `version`       | Yes      | A version of the release candidate                         | NA      |
| `revision-url`  | Yes      | A commit revision URL                                      | NA      |
| `owner`         | Yes      | An owner of the repository                                 | NA      |
| `repo`          | Yes      | A repository name                                          | NA      |
| `slack-webhook` | Yes      | A Slack channel webhook URL where the message will be sent | NA      |
| `slack-channel` | No       | A Slack channel name where the message will be sent        | NA      |

## Example usage

```yaml
name: Deploy release candidate

jobs:
  deploy-release-candidate:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/deploy-release-candidate-v1@main
        with:
          version: '1.0.0'
          revision-url: https://github.com/org-name/repo-name/commit/ee5c8490
          owner: 'org-name'
          repo: 'repo-name'
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
          slack-channel: releases
        env:
          # Required for the GH CLI
          GH_TOKEN: ${{ secrets.PAT }}
```
