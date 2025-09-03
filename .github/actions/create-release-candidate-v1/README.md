# create-release-candidate-v1

A GitHub Action to create a release candidate.

## Inputs

| Name                           | Required | Description                                                                                                                                                                                                                     | Default |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `token`                        | Yes      | A GitHub token used for octokit and GH CLI with the [required permissions](#permissions)                                                                                                                                        | NA      |
| `base`                         | Yes      | The branch that should be compared to `head` when identifying commits for the release, usually `main` or `master`. **NOT** the base branch of the release candidate PR (that is not configurable and will always be `release`). | NA      |
| `head`                         | Yes      | The branch that contains the changes the pull request is trying to merge (usually `develop`)                                                                                                                                    | NA      |
| `release-script-path`          | Yes      | The path to the [release script](#release-script-requirements) that creates the changelogs and bumps the version of the package(s)                                                                                              | NA      |
| `version-locked`               | No       | Whether or not the version bump should treat major/minor as "locked". Repos which version-lock to axe-core should default this to `true`, overriding it to `false` only for releases that update `axe-core`.                    | `false` |
| `should-checkout`              | No       | Whether or not the action should checkout the repository.                                                                                                                                                                       | `true`  |
| `docs-repo`                    | No       | The name of the repo where the release notes live                                                                                                                                                                               | `null`  |
| `docs-labels`                  | No       | Labels for release notes issue. Comma-delimited list of labels (e.g. "release,PRIORITY: high")                                                                                                                                  | NA      |
| `docs-issue-assignees`         | No       | Assignees for the release notes issue.                                                                                                                                                                                          | NA      |
| `docs-issue-project-number`    | No       | Project number for the release notes issue.                                                                                                                                                                                     | NA      |
| `docs-issue-column-name`       | No       | Column name for the release notes issue (e.g. "Todo").                                                                                                                                                                          | NA      |
| `release-issue-assignees`      | No       | Assignees for the release issue.                                                                                                                                                                                                | NA      |
| `release-issue-labels`         | No       | Labels for the release issue. Comma-delimited list of labels (e.g. "release,PRIORITY: high").                                                                                                                                   | NA      |
| `release-issue-project-number` | No       | Project number for the release issue.                                                                                                                                                                                           | NA      |
| `release-issue-column-name`    | No       | Column name for the release issue (e.g. "New").                                                                                                                                                                                 | NA      |

## Example usage

```yaml
name: Create release candidate

on: workflow_dispatch

jobs:
  create-project-issue:
    runs-on: ubuntu-latest
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/create-release-candidate-v1@main
        with:
          token: ${{ secrets.PAT }}
          base: 'main'
          head: 'develop'
          release-script-path: './prepare_release.sh'
          docs-repo: 'my-docs-repo'
          docs-labels: 'release,PRIORITY: high'
          docs-issue-project-number: '1000'
          docs-issue-column-name: 'Todo'
          release-issue-project-number: '2000'
          release-issue-column-name: 'New'
        env:
          GH_TOKEN: ${{ secrets.PAT }}
```

## Permissions

This action requires the following permission scopes:

- `repo` - To create the issue within private repositories
- `workflow` - To access the `GITHUB_TOKEN` secret
- `write:org` - To add the issue to a project board
- `read:org` - To read the project board
- `project` - access to project board

## Release script requirements

The `release-script-path` should point to a script which meets the following requirements:

- May be invoked with either no arguments or a single argument (the string `patch`)
  - in `patch` mode, version should bump to the next patch version
  - in no-argument mode, version should bump to the appropriate next semver determined by commits since the previous version (via `lerna version`, `commit-and-tag-version`, or similar)
- Should use `$GITHUB_REF` to determine a version suffix:
  - if `$GITHUB_REF` is `refs/heads/develop`, append a `-next` version suffix (eg, `"-next." + process.env.GITHUB_SHA.substring(0, 8)` for NPM)
  - if `$GITHUB_REF` is `refs/heads/main`, do not append a version suffix
  - if `$GITHUB_REF` is anything else, exit with fail
- Should update the version numbers in all files in the repo (`lerna.json`, `package.json`, `pom.xml`, etc.)
  - This MUST include either a `lerna.json` or `package.json` at the root of the repo (even for non-js repos)
- Should update CHANGELOG.md files
- Should exit with 0 on success or non-zero on failure
- No specific requirements on stdout/stderr format

An example of a [`prepare_release.sh` script](https://github.com/dequelabs/axe-core-npm/blob/develop/.github/scripts/prepare_release.sh).

## Updating QA Issue Template

If you ever need to update the QA issue template, please do the following:

1. Open `action.yml`
2. Go to the `Create release issue` step
3. Edit as needed
