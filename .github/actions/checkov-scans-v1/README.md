# checkov-scans-v1

A GitHub Action to run [Checkov scans](https://github.com/bridgecrewio/checkov-action/tree/v12#readme) and a result will be shown in Prisma Cloud.

## Inputs

| Name                | Required | Description                       | Default |
| ------------------- | -------- | --------------------------------- | ------- |
| `output-file-path`  | Yes      | Output file path of Checkov scans | NA      |
| `prisma-access-key` | Yes      | Prisma Cloud access key           | NA      |
| `prisma-secret-key` | Yes      | Prisma Cloud secret key           | NA      |
| `prisma-api-url`    | Yes      | Prisma Cloud API URL              | NA      |

## Example usage

```yaml
name: Checkov

on:
  push:
    branches:
      - release
      - main

jobs:
  checkov-scan:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/checkov-scans-v1@main
        with:
          output-file-path: sca/
          prisma-access-key: ${{ secrets.PRISMA_ACCESS_KEY }}
          prisma-secret-key: ${{ secrets.PRISMA_SECRET_KEY }}
          prisma-api-url: ${{ secrets.PRISMA_URL }}
```
