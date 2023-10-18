# get-issue-url-and-version-number-v1

This GitHub Action gets the version number and issue url from the release candidate issue.

## Outputs

| Output           | Description                                                 |
| ---------------- | ----------------------------------------------------------- |
| `version-number` | The version number of the release candidate.                |
| `issue-url`      | The url of the issue associated with the release candidate. |

## Example usage

```yaml
name: Get version number and issue url and post to Slack

on: push

jobs:
  post-to-slack:
    runs-on: ubuntu-latest
    steps:
      - name: get version number and release-candidate issue URL
      - uses: dequelabs/axe-api-team-public/.github/actions/get-version-number-and-issue-url-v1@main
        id: get-version-number-and-issue-url

      - name: Slack Notification
      # https://github.com/rtCamp/action-slack-notify/commit/b24d75fe0e728a4bf9fc42ee217caa686d141ee8
      uses: rtCamp/action-slack-notify@12e36fc18b0689399306c2e0b3e0f2978b7f1ee7
      env:
        SLACK_CHANNEL: example-channel
        SLACK_COLOR: ${{ job.status }}
        SLACK_TITLE: '${{ github.event.repository.name }} v${{ steps.get-version-number-and-issue-url.outputs.version-number }} QA NEEDED'
        SLACK_MESSAGE: '${{ steps.get-version-number-and-issue-url.outputs.issue-url }}'
        SLACK_WEBHOOK: ${{ inputs.slack-webhook }}
        MSG_MINIMAL: true
```
