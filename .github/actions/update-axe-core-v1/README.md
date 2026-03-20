# update-axe-core-v1

A GitHub action for updating axe-core to the latest stable version.

- It updates `package.json`, `yarn.lock`, `package-lock.json`, and `pnpm-lock.yaml`.
- It is compatible with both workspaces and non-workspaces monorepos.
- It auto-updates dependencies and devDependencies.
- It validates that peerDependency ranges satisfy the new version.
- It maintains whatever pinning strategy was already in place (`~`, `^`, or `=`).
- It does _not_ commit changes or create a PR.

Workflows should generally use [create-update-axe-core-pull-request](../create-update-axe-core-pull-request-v1/README.md) instead of using this action directly.

## How it works

```mermaid
flowchart TD
    A["Fetch latest axe-core version"] --> B["Detect root package manager"]
    B --> C["Find all package.json files"]
    C --> D{"Next package"}

    D -- None left --> L{"Any packages<br>updated?"}
    D -- Process package.json --> E{"Has axe-core<br>peerDependency?"}

    E -- Yes --> F{"Latest version<br>satisfies peerDep range?"}
    F -- No --> STOP_FAIL["Fail: human decision needed"]
    F -- Yes --> G
    E -- No --> G

    G{"Has axe-core in deps<br>or devDeps?"}
    G -- No --> D
    G -- Yes --> H["Detect package manager<br>npm > yarn > pnpm"]

    H --> I{"Package manager<br>found?"}
    I -- No --> D
    I -- Yes --> J{"Already at<br>latest version?"}

    J -- Yes --> OUT_NULL["Output: commit-type = null"]
    J -- No --> K["Run install command"]
    K --> D

    L -- No --> OUT_NULL
    L -- Yes --> M{"Major or minor<br>version bump?"}
    M -- Yes --> OUT_FEAT["Output: commit-type = feat"]
    M -- No --> OUT_FIX["Output: commit-type = fix"]

    classDef default fill:#e8e8e8,stroke:#595959,color:#1a1a1a
    classDef decision fill:#fff4dd,stroke:#595959,color:#1a1a1a
    classDef fail fill:#f8d7da,stroke:#595959,color:#1a1a1a
    classDef output fill:#d4edda,stroke:#595959,color:#1a1a1a

    class D,E,F,G,I,J,L,M decision
    class STOP_FAIL fail
    class OUT_NULL,OUT_FEAT,OUT_FIX output
```

## Outputs

| Name          | Description                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `commit-type` | `feat` if axe-core updated to a major or minor version, `fix` if it updated to a patch version, or `null` if no update occurred |
| `version`     | The version that axe-core was updated to                                                                                        |

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
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - id: update
        uses: dequelabs/axe-api-team-public/.github/actions/update-axe-core-v1@main
```
