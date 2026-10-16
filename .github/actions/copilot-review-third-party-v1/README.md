# copilot-review-third-party-v1

Gives third-party pull requests a consistent first response:

- If the contributor has not signed the CLA, the action moves the PR to draft and asks them to sign.
- If they have signed, the action requests a Copilot review using a company account.
- If Copilot does not recommend approval, the action asks the contributor to respond to its review.

The action skips bots, owners, members, collaborators, private org members, and draft PRs. It requests Copilot once per PR.

## Inputs

| Name                  | Required | Description                                                                                       | Default       |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------- | ------------- |
| `github-token`        | Yes      | The workflow `GITHUB_TOKEN`. Reads the PR, reads statuses, converts to draft, and posts comments. | NA            |
| `copilot-token`       | Yes      | A token for the company Copilot account. Requests the Copilot review and checks org membership.   | NA            |
| `cla-context`         | No       | The commit status context that reports the CLA.                                                   | `license/cla` |
| `cla-wait-seconds`    | No       | How long to wait for the CLA status to appear.                                                    | `120`         |
| `review-wait-seconds` | No       | How long to wait for the Copilot review.                                                          | `900`         |

A CLA status that is not `success`, or that is still missing after `cla-wait-seconds`, counts as unsigned. If Copilot does not review within `review-wait-seconds`, the action logs a warning and does not fail.

## Example usage

```yaml
name: Copilot review for third-party PRs

on:
  pull_request_target:
    types: [opened, reopened, ready_for_review]

permissions:
  pull-requests: write
  issues: write
  statuses: read

jobs:
  triage:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/copilot-review-third-party-v1@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          copilot-token: ${{ secrets.COPILOT_REVIEW_TOKEN }}
```

`pull_request_target` is required because fork PRs get a read-only token under `pull_request`. The action never checks out or runs PR code. It only calls the GitHub API.
