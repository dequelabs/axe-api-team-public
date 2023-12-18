# get-new-env-vars-v1

A GitHub action for getting the new environment variables for a release

## Inputs

| Name            | Required | Description                                         | Default   |
| --------------- | -------- | --------------------------------------------------- | --------- |
| `env-file-path` | Yes      | The path to the env file e.g. "src/service/.env"    | NA        |
| `head`          | No       | The branch that contains the changes e.g. "release" | `release` |
| `base`          | No       | The branch to compare against e.g. "master"         | `master`  |

## Outputs

| Name           | Description                   |
| -------------- | ----------------------------- |
| `new-env-vars` | The new environment variables |

## Example usage

```yaml
name: Get new env vars

on:
  workflow_dispatch:

jobs:
  get-new-env-vars:
    runs-on: ubuntu-latest
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/get-new-env-vars-v1@main
        id: get-new-env-vars
        with:
          env-file-path: 'src/service/.env'
          head: 'release'
          base: 'main'
```
