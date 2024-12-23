# require-multiple-reviewers-v1

A GitHub Action that requires multiple reviewers for important files

## Inputs

| Name                   | Required | Description                                                                                                                              | Default |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `token`                | Yes      | A GitHub token with the [required permissions](#permissions)                                                                             | NA      |
| `number-of-reviewers`  | Yes      | The number of reviewers required.                                                                                                        | 2       |
| `important-files-path` | Yes      | The path to the file containing a list of important files. It should comply with [gitignore syntax](https://git-scm.com/docs/gitignore). | NA      |

## Example usage

```yaml
name: Require multiple reviewers

jobs:
  require-multiple-reviewers:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    permissions:
      pull-requests: read
      contents: read
      checks: write
    steps:
      - name: Require two reviewers for important files
        uses: dequelabs/axe-api-team-public/.github/actions/require-multiple-reviewers-v1@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          number-of-reviewers: 2
          important-files-path: .github/important-files.txt
```

## Permissions

This action requires the following permission scopes:

- `pull-requests: read` - To get pull request reviews.
- `contents: read` - To read the contents of the repository, including the changed and important files.
- `checks: write` - To create and update check runs with the results of the action.
