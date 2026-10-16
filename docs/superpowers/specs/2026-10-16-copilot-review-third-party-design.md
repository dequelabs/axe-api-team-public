# Copilot review for third-party PRs: design

Date: 2026-10-16

## Goal

Third-party PRs to the open-source axe-core API repos get a consistent first response:

- If the contributor has not signed the CLA, the PR moves to draft until they do.
- If they have signed, Copilot reviews the PR using a company account.
- If Copilot leaves comments, the contributor is asked to respond to them.

Maintainers then spend review time only on PRs that are signed and have had a Copilot pass.

## Scope

Repos:

- `dequelabs/axe-core-npm`
- `dequelabs/axe-core-nuget`
- `dequelabs/axe-core-gems`
- `dequelabs/axe-core-maven-html`

Non-goals:

- Changing how the CLA is signed. cla-assistant.io already posts the signing comment and sets the `license/cla` commit status.
- Reviewing PRs from org members, collaborators, or bots.
- Re-running Copilot on later pushes.
- Taking a PR out of draft. The contributor does that.

## Behavior

The flow runs when a PR is opened, reopened, or marked ready for review.

1. **Skip non-third-party authors.** Stop if the author is a bot. Stop if the author's association is `OWNER`, `MEMBER`, or `COLLABORATOR`. Also stop if the org membership API says the author is an org member, because members with private membership can appear as `CONTRIBUTOR`.
2. **Skip drafts.** Stop if the PR is already a draft. The flow runs again when it is marked ready.
3. **Read the CLA status.** Read the `license/cla` commit status on the PR's head commit. If it does not exist yet, poll for up to 2 minutes, because cla-assistant may not have posted it. Only `success` counts as signed. A status that is `pending`, `failure`, or missing after 2 minutes counts as unsigned.
4. **Unsigned: move to draft.** Convert the PR to draft. Post one comment that @-mentions the author. It says the PR was moved to draft until the CLA is signed, and that they should mark it ready for review after signing. Then stop.
5. **Signed: skip if already reviewed.** Stop if Copilot has already submitted a review on this PR.
6. **Request the Copilot review.** Request `copilot-pull-request-reviewer[bot]` as a reviewer, using the company account's token.
7. **Wait for the review.** Poll for a review from Copilot for up to 15 minutes. If none arrives, log a warning and stop without failing.
8. **Ping unless Copilot recommends approval.** Copilot's review body opens with a verdict heading: `🟢 Approval recommended`, `🟡 Changes recommended`, or `🔵 Needs a closer look`. Post one comment that @-mentions the author, links the review, and asks them to respond, unless the verdict is `Approval recommended`. Older reviews have no verdict heading. For those, ping only if the review has one or more inline comments.

Copilot never submits an approving review, so the verdict heading is the only approval signal. A `Needs a closer look` verdict can come with zero inline comments, so counting comments alone would miss it.

## Components

### Shared action: `copilot-review-third-party-v1`

Location: `dequelabs/axe-api-team-public/.github/actions/copilot-review-third-party-v1/`.

It follows the layout of the existing actions: `action.yml`, `src/run.ts`, small pure helpers with unit tests, and a built `dist/index.js` on `node24`.

Inputs:

| Input                 | Required | Purpose                                                                                                 |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `github-token`        | yes      | The workflow's `GITHUB_TOKEN`. Used to read the PR, read statuses, convert to draft, and post comments. |
| `copilot-token`       | yes      | A PAT for the company Copilot account. Used to request the Copilot review and to check org membership.  |
| `cla-context`         | no       | Status context to read. Default `license/cla`.                                                          |
| `cla-wait-seconds`    | no       | Default `120`.                                                                                          |
| `review-wait-seconds` | no       | Default `900`.                                                                                          |

Helpers that hold the decisions, each unit-tested:

- `isThirdParty(author, association, isOrgMember)`
- `claState(statuses, context)`, which returns `signed`, `unsigned`, or `missing`
- `findCopilotReview(reviews)`
- `needsResponse(body, commentCount)`, which reads the verdict heading
- the two comment bodies

`run.ts` wires these to the GitHub API. Its tests use a mocked Octokit, the same way `semantic-pr-footer-v1/src/run.test.ts` does.

### Caller workflow in each repo

File: `.github/workflows/copilot-review-third-party.yml`.

```yaml
name: Copilot review for third-party PRs

on:
  pull_request_target:
    types: [opened, reopened, ready_for_review]

permissions:
  pull-requests: write
  issues: write
  statuses: read

jobs:
  triage:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: dequelabs/axe-api-team-public/.github/actions/copilot-review-third-party-v1@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          copilot-token: ${{ secrets.COPILOT_REVIEW_TOKEN }}
```

The final pin (branch or commit SHA) follows whatever each repo already does for `axe-api-team-public` actions, and must pass that repo's `zizmor` audit.

## Security

`pull_request_target` runs in the base repo's context with write access and secrets. That is required, because fork PRs get a read-only token under `pull_request`. The job never checks out or runs PR code. It only calls the GitHub API with values from the event payload.

`COPILOT_REVIEW_TOKEN` is an org secret available to the 4 repos only. Its scopes: request reviewers on those repos, and read org membership.

## Why approach A

- One job requests the review and then waits for it. The alternative reacts to the `pull_request_review` event. But fork PRs get a read-only token and no secrets on that event, so the ping would need a second hand-off workflow through `workflow_run`. That means three files per repo instead of one.
- GitHub's built-in automatic Copilot review (an org ruleset) was rejected. It cannot skip unsigned PRs, and it does not use the company account.
- The cost of approach A is a runner that waits while Copilot works. That is usually 1 to 5 minutes, and at most 15.

## Error handling

- A missing `copilot-token`, or a failed review request, fails the job with a clear message. A maintainer then sees the red check.
- A Copilot review that does not arrive within the wait is a warning, not a failure.
- Copilot can post a note that it was unable to review, for example when the account has reached its quota. The action logs that note as a warning. The note does not count as a review, so a re-run requests Copilot again.
- Each step checks state before acting (draft, existing review). So a re-run is safe.

## Testing

- Unit tests cover each helper, including the edge cases: a bot author, a private org member, a missing CLA status that later appears, a pending status, a review with zero comments, and an earlier Copilot review.
- `run.ts` tests cover each branch of the flow with a mocked Octokit.
- Manual check before rollout: on one repo, open a PR from a fork using a test account that has not signed the CLA. Confirm it is drafted and gets the comment. Sign, mark ready, and confirm Copilot reviews and the ping appears.

## Rollout

1. Merge the shared action in `axe-api-team-public`.
2. Create the `COPILOT_REVIEW_TOKEN` org secret once the company account is supplied.
3. Open one caller-workflow PR in each of the 4 repos.

## Open item

- The company Copilot account and its token. This blocks rollout step 2 only, not building the action.
