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

The footer of a PR will fail unless it [_starts with_ one of the following strings (case insensitive, and the colon may be omitted)](https://github.com/dequelabs/axe-api-team-public/blob/main/.github/actions/semantic-pr-footer-v1/src/isValidFooter.ts#L1):

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

Markdown is tolerated, so a footer may be written as a heading or with emphasis —
`## QA Notes: verify X`, `**No QA required**` — and the leading `#`s or `*`s are
ignored when matching.

### QA notes as a trailing section

QA notes may also be written as the last section of the body, with the detail
underneath the heading rather than on one line:

```markdown
This PR does some things.

## QA Notes

Build the binary, then confirm it starts and writes a report.
```

This is only checked if the last line is not itself a valid footer, so existing
single-line footers behave exactly as before. Two constraints:

- **The section must have content.** A bare `## QA Notes` with nothing beneath it
  fails — a heading promising QA notes that never arrive is not a footer.
- **Only "qa notes" may stand alone this way.** Issue-linking keywords still need
  their reference on the same line, so `## Closes` with `#123` beneath it fails.
