# check-and-move-issue-based-on-labels-v1

This action moves the issue based on the label list to the project board's target column.

## Inputs

| Name                                  | Required | Description                                                                                              | Default |
| ------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- | ------- |
| `token`                               | Yes      | The GitHub token with the required permissions (see below)                                               | NA      |
| `project-number`                      | Yes      | The project number of the project board                                                                  | NA      |
| `target-column`                       | Yes      | The name of the column where matching issues will be moved to                                            | NA      |
| `issue-number`                        | Yes      | The issue number                                                                                         | NA      |
| `issue-owner`                         | Yes      | The issue organization name                                                                              | NA      |
| `issue-repo`                          | Yes      | The issue repository name                                                                                | NA      |
| `team-label`                          | Yes      | The team label name to work only with the team-related issues                                            | NA      |
| `label-prefixes-to-match`             | No       | Comma-separated list of label prefixes to match (e.g. "QA:, QA: hold for epic, Release:")                | NA      |
| `need-match-from-each-label-prefix`   | No       | The flag to check if every value in the "label-prefixes-to-match" should match                           | NA      |
| `label-prefixes-to-exclude`           | No       | Comma-separated list of label prefixes that should be excluded (e.g. "QA: failed, Some Excluded label:") | NA      |
| `need-exclude-from-each-label-prefix` | No       | The flag to check if every value in the "label-prefixes-to-exclude" should match                         | NA      |

### Notes:

Should be provided at least one of the `label-prefixes-to-match` or `label-prefixes-to-exclude` input.

## Permissions

This action requires the following permission scopes:

- `repo` - To create the issue within private repositories
- `workflow` - To access the `GH_TOKEN` secret
- `write:org` - To add the issue to a project board
- `read:org` - To read the project board
- `project` - access to project board

## Outputs

| Name             | Description                             |
| ---------------- | --------------------------------------- |
| `is-issue-moved` | The flag to check if the issue is moved |

## Example

If a ticket has the label `DesignSignoff: hold for epic` and does NOT have the label `DesignSignoff: passed` then move it to the column `DesignSignoffHoldForEpic`.  
Issue's labels: `team-name-label`, `DesignSignoff: hold for epic`.

```yaml
name: Check and move issue based on labels

on: workflow_dispatch

jobs:
  check-and-move-issue-based-on-labels:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          # Fetch all history
          fetch-depth: 0
      - uses: dequelabs/axe-api-team-public/.github/actions/check-and-move-issue-based-on-labels-v1@main
        with:
          token: ${{ secrets.GH_TOKEN }}
          project-number: 188
          issue-number: 70
          issue-owner: owner-name
          issue-repo: repo-name
          team-label: 'team-name-label'
          label-prefixes-to-match: 'DesignSignoff: hold for epic'
          label-prefixes-to-exclude: 'DesignSignoff: passed'
          target-column: DesignSignoffHoldForEpic
    env:
      # Requires for GH CLI
      GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

## Different cases how to use the action

- If a ticket does NOT have any of the following labels: "DesignSignoff: required", "DesignSignoff: hold for epic", or "DesignSignoff: none" -> move it to column ManualGHA

```yaml
# Issue's labels: team-results

team-label: 'team-results'
label-prefixes-to-exclude: 'DesignSignoff: required, DesignSignoff: hold for epic, DesignSignoff: none'
need-exclude-from-each-label-prefix: true
target-column: ManualGHA
```

- If a ticket does NOT have at least one of the following labels: "DesignSignoff: required", "DesignSignoff: hold for epic", or "DesignSignoff: none" -> move it to column ManualGHA

```yaml
# Issue's labels: team-results, DesignSignoff: required, DesignSignoff: hold for epic

team-label: 'team-results'
label-prefixes-to-exclude: 'DesignSignoff: required, DesignSignoff: hold for epic, DesignSignoff: none'
target-column: ManualGHA
```

- If a ticket has the label "DesignSignoff: hold for epic" and does NOT have the label "DesignSignoff: passed" -> move it to column DesignSignoffHoldForEpic

```yaml
# Issue's labels: team-results, DesignSignoff: hold for epic

team-label: 'team-results'
label-prefixes-to-match: 'DesignSignoff: hold for epic'
label-prefixes-to-exclude: 'DesignSignoff: passed'
target-column: DesignSignoffHoldForEpic
```

- If a ticket has the labels "DesignSignoff: hold for epic, DesignSignoff: passed" -> move it to column DesignSignoffPassed

```yaml
# Issue's labels: team-results, DesignSignoff: hold for epic, DesignSignoff: passed

team-label: 'team-results'
label-prefixes-to-match: 'DesignSignoff: hold for epic, DesignSignoff: passed'
need-match-from-each-label-prefix: true
target-column: DesignSignoffPassed
```

- If a ticket has at least one of the labels "DesignSignoff: hold for epic, DesignSignoff: passed" -> move it to column DesignSignoffPassed

```yaml
# Issue's labels: team-results, DesignSignoff: passed

team-label: 'team-results'
label-prefixes-to-match: 'DesignSignoff: hold for epic, DesignSignoff: passed'
target-column: DesignSignoffPassed
```
