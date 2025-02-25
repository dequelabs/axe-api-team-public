# get-latest-and-previous-tags-v1

A GitHub Action to retrieve the latest and the previous one Git tags.

## Inputs

No inputs are required for this action

## Outputs

| Name           | Description                        |
| -------------- | ---------------------------------- |
| `latest-tag`   | Latest Git tag name (eg. v1.2.0)   |
| `previous-tag` | Previous Git tag name (eg. v1.1.0) |

## Example usage

```yaml
name: Get the latest and previous Git tags

on: workflow_dispatch

jobs:
  get-latest-and-previous-tags:
    runs-on: ubuntu-latest
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/get-latest-and-previous-tags-v1@main
        id: get-tags
```
