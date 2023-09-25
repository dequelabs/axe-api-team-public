# generate-commit-list-v1

A GitHub Action to generate a list of commits between two branches.

## Inputs

| Name   | Required | Description                                                              |
| ------ | -------- | ------------------------------------------------------------------------ |
| `base` | yes      | The branch that the pull request will merge into                         |
| `head` | yes      | The branch that contains the changes the pull request is trying to merge |

## Outputs

| Name          | Description                                |
| ------------- | ------------------------------------------ |
| `commit-list` | A list of commits between the two branches |

## Example usage

```yaml
name: Generate commit list

on:
  workflow-dispatch:

jobs:
  generate-commit-list:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          # Fetch all history
          fetch-depth: 0
      - uses: dequelabs/axe-api-team-public/.github/actions/generate-commit-list-v1@main
        with:
          base: release
          head: develop
```

## Example output

```json
[
  {
    "commit": "061acd5 refactor(integrations/javascript): some refactor (#664)",
    "title": "refactor(integrations/javascript): some refactor",
    "sha": "061acd5",
    "type": "refactor",
    "id": "664",
    "link": "https://github.com/dequelabs/axe-api-team-public/pull/664"
  },
  {
    "commit": "4d6220e chore: Update dependencies (#680)",
    "title": "chore: Update dependencies",
    "sha": "4d6220e",
    "type": "chore",
    "id": "680",
    "link": "https://github.com/dequelabs/axe-api-team-public/pull/680"
  },
  {
    "commit": "3d6220e fix(packages/axe-core): some fix (#1337)",
    "title": "fix(packages/axe-core): some fix",
    "sha": "3d6220e",
    "type": "fix",
    "id": "1337",
    "link": "https://github.com/dequelabs/axe-api-team-public/pull/1337"
  }
]
```
