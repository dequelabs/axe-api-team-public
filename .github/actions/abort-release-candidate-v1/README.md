# abort-release-candidate-v1

A GitHub Action to abort a release candidate.

## Inputs

| Name        | Required | Description                                                                              | Default |
| ----------- | -------- | ---------------------------------------------------------------------------------------- | ------- |
| `token`     | Yes      | A GitHub token used for octokit and GH CLI with the [required permissions](#permissions) | NA      |
| `base`      | Yes      | The base branch the release candidate was going to be merged into                        | NA      |
| `docs-repo` | No       | The docs repo where the release notes issue is located                                   | NA      |
| `version`   | No       | The release candidate version number that will be aborted (e.g 1.0.0)                    | NA      |

## Permissions

This action requires the following permission scopes:

- `repo` - To create the issue within private repositories
- `write:org` - To add the issue to a project board
- `read:org` - To read the project board
- `project` - access to project board

## Example usage

```yaml
name: Abort release candidate

on: workflow_dispatch

jobs:
  abort-release-candidate:
    runs-on: ubuntu-latest
    steps:
      - name: Abort release candidate
        uses: dequelabs/axe-api-team-public/.github/actions/abort-release-candidate-v1@main
        with:
          token: ${{ secrets.PAT }}
          base: 'main'
          docs-repo: 'my-docs-repo'
          version: '1.0.0'
```
