# get-release-issue-v1

A GitHub action for getting the release issue for a release candidate.

## Inputs

| Name      | Required | Description                                                                      | Default                     |
| --------- | -------- | -------------------------------------------------------------------------------- | --------------------------- |
| `version` | Yes      | The version of the release candidate                                             | NA                          |
| `owner`   | No       | The owner of the repository e.g. dequelabs/axe-core-npm, then supply "dequelabs" | `github.context.repo.owner` |
| `repo`    | No       | The repository e.g. dequelabs/axe-core-npm, then supply "axe-core-npm"           | `github.context.repo.repo`  |

## Outputs

| Name        | Description                  |
| ----------- | ---------------------------- |
| `issue-url` | The URL of the release issue |

## Example usage

```yaml
name: Get release issue

on:
  push:
    branches:
      - release

jobs:
  get-release-issue:
    runs-on: ubuntu-latest
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/get-release-issue-v1@main
        id: get-release-issue
        with:
          version: '1.0.0'
      - name: Print the release issue URL
        run: echo ${{ steps.get-release-issue.outputs.issue-url }}
    env:
      # Required for the GH CLI
      GH_TOKEN: ${{ github.token }}
```
