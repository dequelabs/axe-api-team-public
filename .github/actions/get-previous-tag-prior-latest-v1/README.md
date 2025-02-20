# get-previous-tag-prior-latest-v1

A GitHub Action to retrieve the previous Git tag before the latest one, with an option to get a version without the `v` prefix.

## Inputs

No inputs are required for this action

## Outputs

| Name          | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| `tag`         | A Git tag name of the previous tag before the latest one (eg. v1.2.3)   |
| `tag-version` | A Git tag version of the previous tag before the latest one (eg. 1.2.3) |

## Example usage

```yaml
name: Get the previous tag prior to the latest

on: workflow_dispatch

jobs:
  get-previous-tag-prior-latest:
    runs-on: ubuntu-latest
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/get-previous-tag-prior-latest-v1@main
        id: get-previous-tag
```
