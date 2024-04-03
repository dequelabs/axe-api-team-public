# create-release-v1

A GitHub Action to create a release.

## Inputs

| Name             | Required | Description                                                                   | Default        |
| ---------------- | -------- | ----------------------------------------------------------------------------- | -------------- |
| `base`           | Yes      | The base branch to merge the release into                                     | NA             |
| `token`          | No       | The GitHub token to use                                                       | `github.token` |
| `migrations-dir` | No       | The directory containing the database migrations e.g. src/database/migrations | NA             |
| `env-file-path`  | No       | The path to the `.env` file e.g. src/service/sample.env                       | NA             |

## Example usage

```yaml
name: create release

on: workflow_dispatch

jobs:
  create-release:
    runs-on: ubuntu-latest
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/create-release-v1@main
        with:
          base: 'main'
```
