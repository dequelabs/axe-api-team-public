# require-multiple-reviewers-v1

A GitHub Action that requires multiple reviewers for important files

## Inputs

| Name                   | Required | Description                                                | Default |
| ---------------------- | -------- | ---------------------------------------------------------- | ------- |
| `token`                | Yes      | A GitHub token with the required permissions               | NA      |
| `number-of-reviewers`  | Yes      | The number of reviewers required.                          | 2       |
| `changed-files-path`   | Yes      | The path to the file containing a list of changed files.   | NA      |
| `important-files-path` | Yes      | The path to the file containing a list of important files. | NA      |

## Example usage

```yaml
name: Require multiple reviewers

jobs:
  require-multiple-reviewers:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    permissions:
      pull-requests: write
      contents: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Fetch all branches
        run: git fetch --all

      - name: Get changed files for the entire PR
        run: |
          # Get the changed files by comparing base and head branches
          git diff --name-only origin/${{ github.event.pull_request.base.ref }}...origin/${{ github.event.pull_request.head.ref }} > .github/changed-files.txt

      - name: Require two reviewers for important files
        uses: dequelabs/axe-api-team-public/.github/actions/require-multiple-reviewers-v1@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          number-of-reviewers: 2
          changed-files-path: .github/changed-files.txt
          important-files-path: .github/important-files.txt
```

## Permissions

This action requires the following permission scopes:

- `pull-requests: read` - To get pull request reviews.
- `contents: read` - To read the contents of the repository, including the changed and important files.
- `checks: write` - To create and update check runs with the results of the action.
