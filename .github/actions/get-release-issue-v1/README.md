# get-release-issue-v1

A GitHub action for getting the release issue for a release candidate.

## Inputs

| Name             | Required | Description                                                                  | Default               |
| ---------------- | -------- | ---------------------------------------------------------------------------- | --------------------- |
| `version`        | Yes      | The version of the release candidate                                         | NA                    |
| `owner-and-repo` | No       | The owner and repo where the release issue lives in the format: `owner/repo` | `github.context.repo` |

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
      - uses: actions/checkout@v4
      - uses: dequelabs/axe-api-team-public/.github/actions/get-release-issue-v1@main
        id: get-release-issue
        with:
          version: '1.0.0'
      - name: Print the release issue URL
        run: echo ${{ steps.get-release-issue.outputs.issue-url }}
```
