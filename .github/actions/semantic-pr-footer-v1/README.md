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
