# sync-branches-v1

Keeps a long-lived branch merged into another through a pull request.

Each run points `chore/sync/<head>/into/<base>` at the current commit of `head`, force-moving it if it already exists.
It then opens a PR from that branch into `base`, unless one is already open or `base` already contains `head`.
When `base` already contains `head`, it closes any sync PR still open, since that PR has nothing left to merge.

Merge the sync PR with a merge commit, not a squash or rebase.
Squashing leaves `base` without `head`'s history, so the next sync shows the same changes again, often with conflicts.
Resolve conflicts on the sync branch by merging `base` into it, then merge the sync PR.
A push to `head` before the sync PR is merged replaces the sync branch, so redo the resolution if that happens.

If a ruleset allows only squash merges into `base`, a repository admin has to bypass it to merge the sync PR with a merge commit.

## Usage

```yaml
name: Sync Main Into Develop

on:
  push:
    branches:
      - main

permissions:
  contents: read

concurrency:
  # Shared by every workflow that syncs main into develop, so github.workflow is left out;
  # runs queue instead of cancelling so an older run can't move the sync branch back.
  group: sync-branches-main-develop
  cancel-in-progress: false

jobs:
  sync:
    name: Sync Main Into Develop
    runs-on: ubuntu-slim
    timeout-minutes: 5
    steps:
      - name: Sync Branches
        uses: dequelabs/axe-api-team-public/.github/actions/sync-branches-v1@<sha> # <version>
        with:
          head: main
          base: develop
          token: ${{ secrets.SYNC_PAT }}
```

The `concurrency` group is required.
Every workflow that syncs the same `head` and `base` must share one group with `cancel-in-progress: false`.
Without it, an older run that finishes last moves the sync branch back to an older commit.

## Inputs

| Input   | Required | Description                                                                                                                                    |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `head`  | yes      | Short name of the branch to merge from, such as `main`.                                                                                        |
| `base`  | yes      | Short name of the branch to merge into, such as `develop`.                                                                                     |
| `token` | yes      | Token for the calling repository. See [Token](#token).                                                                                         |
| `title` | no       | PR title. Defaults to `chore: merge <head> into <base>`. Blank or omitted uses the default. Used only when a new PR is opened.                 |
| `body`  | no       | PR body. Defaults to a merge-commit reminder ending in `No QA Required`. Blank or omitted uses the default. Used only when a new PR is opened. |

Branch names may contain only letters, digits, `.`, `_`, `/` and `-`, and may not have a path segment named `into`.

## Outputs

| Output   | Description                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------- |
| `branch` | The sync branch name, set even when no PR is opened.                                                  |
| `pr-url` | The open sync PR's URL, empty when `base` already contains `head` (any sync PR still open is closed). |

## Token

Pass a PAT or GitHub App token, not `GITHUB_TOKEN`.
PRs opened with `GITHUB_TOKEN` do not trigger CI, so the action fails if given it.

The token needs contents and pull-requests write on the calling repository.
If `head` can contain changes under `.github/workflows/`, it also needs workflows write.
