# semantic-pr-footer-v1

A GitHub action for updating axe-core to the latest stable version.

## Outputs

| Name                     | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `commit-type` | The SemVer type of the axe-core update. Is `null` if no update occurred |

## Example usage

```yaml
name: Update axe-core

on:
  schedule:
    # Run every night at midnight
    - cron: '0 0 * * *'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - id: update
        uses: dequelabs/axe-api-team-public/.github/actions/update-axe-core-v1@main
```
