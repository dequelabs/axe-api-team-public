# set-pr-reviewer-based-on-issue-label-v1

A GitHub Action assigns a reviewer to a PR if at least one of the closed issues has a particular label.

## Inputs

| Name                   | Required | Description                                                                                                          | Default |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| `pull-request-number`  | Yes      | The pull request number to check for linked issues with a specific label                                             | NA      |
| `required-issue-label` | Yes      | The issue label that triggers the reviewer assignment when present on any linked issue                               | NA      |
| `reviewers`            | Yes      | The comma-separated reviewer user names are to be added as required reviewers when the specified label is found      | NA      |
| `team-reviewers`       | No       | The comma-separated reviewer team names are to be added as required reviewer teams when the specified label is found | NA      |
| `token`                | No       | The GitHub token with the required permissions (see below)                                                           | NA      |

### Note:

One of the inputs `reviewers` or `team-reviewers` has to be provided.

## Example usage

```yaml
jobs:
  set-pr-reviewer-based-on-issue-label:
    runs-on: ubuntu-latest
    timeout-minutes: 7
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          # Fetch all history
          fetch-depth: 0
      - uses: dequelabs/axe-api-team-public/.github/actions/set-pr-reviewer-based-on-issue-label-v1@main
        with:
          pull-request-number: 85
          required-issue-label: 'DesignSignoff: before merge'
          team-reviewers: 'test-team, test-team-2'
          reviewers: 'reviewer-1, reviewer-2'
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Permissions

This action requires the following permission scopes:

- `workflow` - To access the `GITHUB_TOKEN` secret
- `read:org` - To read the project board
