# axe-api-team-public

Shared configuration, settings, and reusable GitHub Actions for the Axe API Team.

This repository is the team's central library of GitHub Actions. Other repos consume these
actions by referencing them at `dequelabs/axe-api-team-public/.github/actions/<action>@main`,
and inherit shared repo settings via [Probot Settings](#probot-settings).

## Repository structure

```
.github/
  actions/<action-name>-vN/   # one directory per action (see Directory layout)
  workflows/                  # CI for this repo (lint, typecheck, per-action tests, build sync)
  settings.yml                # Probot Settings consumed by other repos via `_extends`
scripts/
  build-action.mjs            # shared esbuild bundler used by every Node action's `build`
package.json                  # npm workspaces root (`.github/actions/*`); shared dev dependencies
tsconfig.json                 # base TypeScript config that each action extends
```

The root `package.json` defines [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)
over `.github/actions/*`. Shared dependencies (`@actions/core`, `@actions/github`, `@actions/exec`,
`semver`, …) live in the root and are hoisted to every action, then **bundled into each action's
`dist/index.js` at build time** — so actions run with no `npm install` step. An action that needs
its own one-off dependency can declare it in its workspace `package.json` (e.g.
[checkov-scans-v1](.github/actions/checkov-scans-v1)). If a breaking change to an action also needs a breaking dependency bump,
install the old version under an alias (e.g. `npm install pkg-v1@npm:pkg@1`) alongside the new one.

## Two ways to build an action

Every action is one of two kinds. Pick based on **what the action does**, not how big it is.

### 1. Composite action (pure YAML)

Just an `action.yml` with `runs.using: 'composite'` and a list of `steps`. No source code, no
build. Use this when the action is **orchestration or thin shell scripting**:

- It chains other actions (ours and third-party) together.
- It runs `git` / `gh` CLI commands with little or no data transformation.
- It invokes a caller-supplied script and just passes inputs through.

A thin `git` wrapper — [get-latest-and-previous-tags-v1](.github/actions/get-latest-and-previous-tags-v1/action.yml):

```yaml
runs:
  using: 'composite'
  steps:
    - name: Get latest and previous tags
      id: get-tags
      shell: bash
      run: |
        echo "latest-tag=$(git describe --abbrev=0 --tags)" >> $GITHUB_OUTPUT
        echo "previous-tag=$(git describe --abbrev=0 --tags $(git rev-list --tags --skip=1 --max-count=1))" >> $GITHUB_OUTPUT
```

Orchestrating other actions — [move-released-issues-and-create-sync-pr-v1](.github/actions/move-released-issues-and-create-sync-pr-v1/action.yml):

```yaml
runs:
  using: 'composite'
  steps:
    - uses: dequelabs/axe-api-team-public/.github/actions/generate-commit-list-v1@main
      id: get-commit-list
      with: { tag: ${{ steps.get-previous-tag.outputs.tag }} }
    - uses: dequelabs/axe-api-team-public/.github/actions/label-and-move-released-issues-v1@main
      with: { commit-list: ${{ steps.get-commit-list.outputs.commit-list }}, token: ${{ inputs.token }} }
```

Other examples: [cancel-if-release-pr-exists](.github/actions/cancel-if-release-pr-exists/action.yml), [create-release-candidate-v1](.github/actions/create-release-candidate-v1/action.yml) (long but still pure orchestration of other actions).

### 2. Node action (TypeScript)

A TypeScript project compiled to a single bundled `dist/index.js` that the runner executes via
`runs.using: 'node24'`. Use this when the action carries **real logic that deserves unit tests**:

- It calls the GitHub API — via `github.getOctokit(...)` (REST or GraphQL) or by wrapping the `gh`
  CLI and parsing its JSON — with non-trivial queries or mutations (e.g. project-board field mapping).
- It parses or transforms data (e.g. parsing semantic commit messages, extracting PR numbers).
- It implements branchy business logic worth testing in isolation (e.g. "should we auto-release?").

A Node action's `action.yml` just points at the bundled entry — [get-package-version-v1](.github/actions/get-package-version-v1/action.yml):

```yaml
runs:
  using: 'node24'
  main: 'dist/index.js'
```

Examples: [move-issues-based-on-label-v1](.github/actions/move-issues-based-on-label-v1) (GraphQL
project queries), [add-to-board-v1](.github/actions/add-to-board-v1) (wraps the `gh` CLI and
parses its JSON), [generate-commit-list-v1](.github/actions/generate-commit-list-v1) (commit
parsing), [has-auto-releasable-commits-v1](.github/actions/has-auto-releasable-commits-v1)
(release-policy logic).

### Choosing between them

| If the action mainly…                                        | Use           |
| ------------------------------------------------------------ | ------------- |
| calls other actions / `gh` / `git` and passes values through | **Composite** |
| runs a few shell lines with no parsing                       | **Composite** |
| queries the GitHub API with custom GraphQL/REST              | **Node (TS)** |
| parses, transforms, or validates structured data             | **Node (TS)** |
| has conditionals/policy logic you'd want to unit-test        | **Node (TS)** |

Rule of thumb: **YAML for wiring, TypeScript for logic.** When a composite action's `run:` blocks
start growing `if`/loops/parsing, that logic belongs in a Node action (often a small one the
composite then calls).

## Creating a new action

### Directory layout & naming

Each action lives in its own directory under `.github/actions/`, named `<action-name>-vN` where
`N` is the major version. Breaking changes ship as a **new directory** (`...-v2`) so existing
callers pinned to `...-v1@main` keep working — we never branch per action.

```
my-new-action-v1/
  action.yml          # both kinds: metadata + inputs/outputs
  README.md           # both kinds: description, inputs/outputs table, permissions, usage example
  # — Node actions also have: —
  package.json        # workspace scripts (build/test/typecheck/lint)
  tsconfig.json       # extends ../../../tsconfig.json
  node.config.json    # Node test-runner options (tsx loader, 100% coverage thresholds)
  src/
    index.ts          # entry point — wires deps into run()
    run.ts            # reads inputs, orchestrates, sets outputs
    <feature>.ts      # one file per unit of logic…
    <feature>.test.ts # …each with a colocated test
    types.ts
  dist/index.js       # GENERATED by the build — must be committed
```

Inputs and outputs are always declared in `action.yml`:

```yaml
inputs:
  project-number:
    description: 'The project board number'
    required: false
    default: '188'
outputs:
  version:
    description: 'The extracted version'
```

### The Node action source pattern

Keep `index.ts` a one-liner that injects dependencies into `run`, so `run` and the helpers stay
pure and testable (no hidden globals):

```typescript
// src/index.ts
import * as core from '@actions/core'
import * as github from '@actions/github'
import run from './run'

run(core, github)
```

`run.ts` follows a fixed shape. **Validate inputs, apply defaults, and fail fast at the top of the
function**, before any real work — read every input, reject the bad ones with `core.setFailed(...)`
followed by an early `return`, and resolve defaults. Only once everything is known-good should the
action call its helpers. Wrap the whole body in a single `try/catch` that ends in `core.setFailed`
so any thrown error fails the step with a message instead of an opaque stack trace.
[set-date-closed-field-v1/src/run.ts](.github/actions/set-date-closed-field-v1/src/run.ts) is the
reference for this layout.

```typescript
// src/run.ts — validate & default first, then orchestrate small helpers
export default async function run(core: Core, github: Github): Promise<void> {
  try {
    // 1) Validate inputs and apply defaults FIRST — fail fast with a clear reason.
    const token = core.getInput('token')
    if (!token) {
      core.setFailed('`token` input is not set')
      return
    }

    const issueNumber = parseInt(
      core.getInput('issue-number', { required: true })
    )
    if (isNaN(issueNumber)) {
      core.setFailed('`issue-number` must be a number')
      return
    }

    const fieldName = core.getInput('date-field-name').trim() || 'DateClosed'

    // 2) Do the work, logging each stage (see Logging below).
    core.info(`Looking up issue #${issueNumber} for field "${fieldName}"`)
    const result = await updateDateField(/* … */)

    // 3) Surface results as outputs.
    core.setOutput('updated', String(result.updated))
  } catch (error) {
    core.setFailed(
      `Action failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
```

Split each distinct step into its own `<feature>.ts` with a colocated `<feature>.test.ts` (see
[generate-commit-list-v1/src](.github/actions/generate-commit-list-v1/src) for the example).
Tests must hit **100% coverage** of
`src` (lines, branches, functions) — `index.ts` and `*.test.ts` are excluded.

### Logging (required)

Every Node action **must** log its progress with `core.info` so that a failed run shows _which
stage_ it reached, _where_ it stopped, and _why_. Add a log line before each meaningful step (input
resolved, API call, decision branch, final result) — the run log is the only window into a
failed action. Use `core.warning` for recoverable oddities and `core.setFailed` (with a specific
message) for anything that should fail the step.

```typescript
core.info(`Issue state: "${issue.state}", closed_at: "${issue.closed_at}"`)
if (!issue.closed_at) {
  core.info(`Issue #${issueNumber} is not closed — nothing to do`)
  return
}
core.info(`Updating "${fieldName}" to ${dateString}`)
```

**Never log sensitive data.** Tokens, secrets, credentials, and full auth headers must never be
written to logs or error messages — log identifiers (issue numbers, URLs, field names, counts)
instead. GitHub automatically masks values that came from `${{ secrets.* }}`, showing them as `***`
in the run log, but that masking is a safety net, not permission: keep secrets and tokens out of
your `core.info` / `core.setFailed` strings entirely.

### Build (Node actions only)

`npm run build` runs the shared [`scripts/build-action.mjs`](scripts/build-action.mjs), which uses
esbuild to bundle `src/index.ts` → `dist/index.js` (single ESM file, `node24` target) and writes a
`dist/licenses.txt` summary. **`dist/` is committed** — the runner executes the committed bundle,
not your source. The [update-generated-files](.github/workflows/update-generated-files.yml)
workflow also rebuilds and opens a sync PR if `dist` drifts, but always commit your own build
output.

## Testing & checks before you open a PR

Run these from the action's directory (or use `--workspace=<action-name>` from the root). CI
([.github/workflows/tests.yml](.github/workflows/tests.yml)) runs the same on every PR:

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # Node's built-in test runner; enforces 100% coverage
npm run build       # rebuild dist/ — then commit it
```

- **Composite actions** have no unit tests; verify them by running the workflow that uses them
  (or a throwaway workflow on a branch). Still run `lint`/`typecheck` at the root.
- After **any** change to a Node action's `src/`, re-run `npm test` **and** `npm run build`, then
  commit the updated `dist/index.js`. A stale `dist` is the most common review catch.

## Probot Settings

Each repo extends this repo's [Probot Settings](https://probot.github.io/apps/settings/) by
creating a `.github/settings.yml` file that uses `_extends`:

```yml
_extends: 'dequelabs/axe-api-team-public'
```
