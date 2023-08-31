# semantic-pr-footer-v1

A GitHub Action to validate pull request footers against our team policy

## Example usage

```yaml
name: Semantic PR footer

on:
  pull_request:
    types:
      - opened
      - reopened
      - edited
      - synchronize

jobs:
  semantic-pr-footer:
    runs-on: ubuntu-latest
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/semantic-pr-footer-v1@main
```
