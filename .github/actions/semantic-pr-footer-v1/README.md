# semantic-pr-footer-v1

A GitHub Action to validate pull request footers against our team policy

## Inputs

| Name                       | Required | Description                                                                                                                                                                                                        | Default |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `ignore_additional_actors` | No       | 'Comma delimited list of additional actors to ignore when validating pull request footer. List of actors already ignored: dependabot[bot], dependabot-preview[bot], github-actions[bot], axe-core, attest-team-ci' | NA      |

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

## Allowable footers

The footer of a PR will fail unless it [_starts with_ one of the following strings (case insensitive)](https://github.com/dequelabs/axe-api-team-public/blob/main/.github/actions/semantic-pr-footer-v1/src/isValidFooter.ts#L1):

- "close: "
- "closes: "
- "closed: "
- "fix: "
- "fixes: "
- "fixed: "
- "resolve: "
- "resolves: "
- "resolved: "
- "ref: "
- "refs: "
- "qa notes: "
- "no qa required"
- "no qa needed"
