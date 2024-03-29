# get-package-version-v1

A GitHub action for getting the package version from lerna.json or package.json.

## Outputs

| Name      | Description         |
| --------- | ------------------- |
| `version` | The package version |

## Example usage

```yaml
name: Get package version

on:
  workflow_dispatch:

jobs:
  get-package-version:
    runs-on: ubuntu-latest
    steps:
      # This is required to gain access to files
      - uses: actions/checkout@v4
      - uses: dequelabs/axe-api-team-public/.github/actions/get-package-version-v1@main
        id: get-package-version
      - name: Print the package version
        run: echo ${{ steps.get-package-version.outputs.version }}
```
