import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import { Core, GitHub } from './types'
import type { GetIssueLabelsResult } from '../../check-and-move-issue-based-on-labels-v1/src/getIssueLabels'
import type { GetReferencedClosedIssuesResult } from '../../label-and-move-released-issues-v1/src/getReferencedClosedIssues'

const ghToken = 'github token'
const owner = 'owner_name'
const repo = 'repo_name'
const requiredLabel = 'some-required-label'
const pullRequest = 77
const reviewersString = 'first-user-reviewer, second-user-reviewer'
const teamReviewersString = 'first-team-reviewer, second-team-reviewer'
const issueNumber = 1
const issueNumber2 = 2
const pullRequestUrl = `https://github.com/${owner}/${repo}/pull/${pullRequest}`
const issueUrl = `https://github.com/${owner}/${repo}/issues/${issueNumber}`
const ISSUES_MOCK: GetReferencedClosedIssuesResult = {
  repository: {
    pullRequest: {
      closingIssuesReferences: {
        nodes: [
          {
            number: issueNumber,
            repository: {
              owner: {
                login: owner
              },
              name: repo
            }
          },
          {
            number: issueNumber2,
            repository: {
              owner: {
                login: owner
              },
              name: repo
            }
          }
        ]
      }
    }
  }
}
const ISSUE_DATA_MOCK: GetIssueLabelsResult = {
  repository: {
    issue: {
      id: 'I_kwDOLYvJE86pLaA1',
      number: issueNumber,
      url: `https://github.com/dequelabs/repo/issues/${issueNumber}`,
      labels: {
        nodes: [
          {
            name: requiredLabel
          }
        ]
      },
      projectItems: {
        nodes: [
          {
            id: 'PVTI_lADOAD55W84AjfJEzgYzmqU4',
            project: {
              number: 123
            }
          },
          {
            id: 'PVTI_lADOAD55W84Aj5R-zgYzmqZ1',
            project: {
              number: 456
            }
          }
        ]
      }
    }
  }
}

type GetReferencedClosedIssuesArgs = {
  owner: string
  repo: string
  pullRequestID: number
  octokit: unknown
}
type GetIssueLabelsArgs = {
  issueOwner: string
  issueRepo: string
  issueNumber: number
  octokit: unknown
}

const getReferencedClosedIssues = mock.fn<
  (
    args: GetReferencedClosedIssuesArgs
  ) => Promise<GetReferencedClosedIssuesResult>
>(() => Promise.resolve(ISSUES_MOCK))
const getIssueLabels = mock.fn<
  (args: GetIssueLabelsArgs) => Promise<GetIssueLabelsResult | undefined>
>(() => Promise.resolve(ISSUE_DATA_MOCK))

mock.module(
  '../../label-and-move-released-issues-v1/src/getReferencedClosedIssues',
  { defaultExport: getReferencedClosedIssues }
)
mock.module(
  '../../check-and-move-issue-based-on-labels-v1/src/getIssueLabels',
  { defaultExport: getIssueLabels }
)

const { default: run } = await import('./run.ts')

interface GenerateInputsArgs {
  token?: string
  pullRequestNumber?: number | string
  requiredIssueLabel?: string
  reviewers?: string
  teamReviewers?: string
}

describe('run', () => {
  let octokitRequestReviewers: ReturnType<typeof mock.fn>
  let info: ReturnType<typeof mock.fn>
  let warning: ReturnType<typeof mock.fn>
  let setFailed: ReturnType<typeof mock.fn>
  let getInput: ReturnType<
    typeof mock.fn<(name: string, opts?: object) => string>
  >
  let core: Core
  let github: GitHub
  let octokitMock: object

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    const values: Record<string, string> = {
      token: String(inputs?.token ?? ghToken),
      'pull-request-number': String(inputs?.pullRequestNumber ?? pullRequest),
      'required-issue-label': String(
        inputs?.requiredIssueLabel ?? requiredLabel
      ),
      reviewers: inputs?.reviewers ?? reviewersString,
      'team-reviewers': inputs?.teamReviewers ?? teamReviewersString
    }

    getInput.mock.mockImplementation((name: string) => values[name] ?? '')
  }

  beforeEach(() => {
    getReferencedClosedIssues.mock.resetCalls()
    getReferencedClosedIssues.mock.mockImplementation(() =>
      Promise.resolve(ISSUES_MOCK)
    )
    getIssueLabels.mock.resetCalls()
    getIssueLabels.mock.mockImplementation(() =>
      Promise.resolve(ISSUE_DATA_MOCK)
    )

    octokitRequestReviewers = mock.fn(() => Promise.resolve())
    info = mock.fn()
    warning = mock.fn()
    setFailed = mock.fn()
    getInput = mock.fn<(name: string, opts?: object) => string>(() => '')

    octokitMock = {
      rest: {
        pulls: {
          requestReviewers: octokitRequestReviewers
        }
      }
    }

    github = {
      getOctokit: () => octokitMock,
      context: {
        repo: {
          owner,
          repo
        }
      }
    } as unknown as GitHub

    core = {
      getInput,
      info,
      setFailed,
      warning
    } as unknown as Core
  })

  describe('when the `token` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: token'

      getInput.mock.mockImplementation((name: string) => {
        if (name === 'token') {
          throw new Error(errorMessage)
        }
        return ''
      })

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })
  })

  describe('when the `pull-request-number` input', () => {
    it('is not provided throws an error', async () => {
      const errorMessage =
        'Input required and not supplied: pull-request-number'

      getInput.mock.mockImplementation((name: string) => {
        if (name === 'pull-request-number') {
          throw new Error(errorMessage)
        }
        return ''
      })

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })

    it('is not a number throws an error', async () => {
      generateInputs({ pullRequestNumber: 'abc' })

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        '`pull-request-number` must be a number'
      )
    })
  })

  describe('when the `required-issue-label` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage =
        'Input required and not supplied: required-issue-label'

      getInput.mock.mockImplementation((name: string) => {
        if (name === 'required-issue-label') {
          throw new Error(errorMessage)
        }
        return ''
      })

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })
  })

  describe('when the `reviewers` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: reviewers'

      getInput.mock.mockImplementation((name: string) => {
        if (name === 'reviewers') {
          throw new Error(errorMessage)
        }
        return ''
      })

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })
  })

  describe('when the `team-reviewers` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: team-reviewers'

      getInput.mock.mockImplementation((name: string) => {
        if (name === 'team-reviewers') {
          throw new Error(errorMessage)
        }
        return ''
      })

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })
  })

  describe('when neither `reviewers` nor `team-reviewers` inputs are provided', () => {
    it('throws an error', async () => {
      generateInputs({ reviewers: '', teamReviewers: '' })

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'One of the inputs `reviewers` or `team-reviewers` must be provided'
      )
    })
  })

  describe('given the required inputs', () => {
    describe('when a PR does not have any closed issues', () => {
      it('should stop the process', async () => {
        getReferencedClosedIssues.mock.mockImplementation(() =>
          Promise.resolve({
            repository: {
              pullRequest: {
                closingIssuesReferences: {
                  nodes: []
                }
              }
            }
          })
        )
        generateInputs()

        await run(core, github)

        assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
        assert.deepStrictEqual(
          getReferencedClosedIssues.mock.calls[0].arguments[0],
          {
            owner,
            repo,
            pullRequestID: pullRequest,
            octokit: octokitMock
          }
        )
        assert.ok(
          info.mock.calls.some(
            call =>
              call.arguments[0] ===
              `No issues found for the PR "${pullRequestUrl}", stopped the process.`
          )
        )
        assert.strictEqual(setFailed.mock.callCount(), 0)
      })
    })

    describe('when a PR has closed issues', () => {
      describe('and one issue is not found', () => {
        it('should show a warning message', async () => {
          getReferencedClosedIssues.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_MOCK)
          )
          let callIndex = 0
          getIssueLabels.mock.mockImplementation(() => {
            callIndex += 1
            return Promise.resolve(
              callIndex === 1 ? undefined : ISSUE_DATA_MOCK
            )
          })
          generateInputs()

          await run(core, github)

          assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
          assert.deepStrictEqual(
            getReferencedClosedIssues.mock.calls[0].arguments[0],
            {
              owner,
              repo,
              pullRequestID: pullRequest,
              octokit: octokitMock
            }
          )
          assert.ok(
            getIssueLabels.mock.calls.some(
              call =>
                call.arguments[0].issueOwner === owner &&
                call.arguments[0].issueRepo === repo &&
                call.arguments[0].issueNumber === issueNumber &&
                call.arguments[0].octokit === octokitMock
            )
          )
          assert.ok(
            getIssueLabels.mock.calls.some(
              call =>
                call.arguments[0].issueOwner === owner &&
                call.arguments[0].issueRepo === repo &&
                call.arguments[0].issueNumber === issueNumber2 &&
                call.arguments[0].octokit === octokitMock
            )
          )
          assert.strictEqual(warning.mock.callCount(), 1)
          assert.strictEqual(
            warning.mock.calls[0].arguments[0],
            `The issue "${issueUrl}" is not found, moving on...`
          )
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })

      describe('and one issue does not have any labels', () => {
        it('should show an info message', async () => {
          const issueWithoutLabels: GetIssueLabelsResult = JSON.parse(
            JSON.stringify(ISSUE_DATA_MOCK)
          )

          issueWithoutLabels.repository.issue.labels.nodes = []

          getReferencedClosedIssues.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_MOCK)
          )
          let callIndex = 0
          getIssueLabels.mock.mockImplementation(() => {
            callIndex += 1
            return Promise.resolve(
              callIndex === 1 ? issueWithoutLabels : ISSUE_DATA_MOCK
            )
          })
          generateInputs({
            teamReviewers: ''
          })

          await run(core, github)

          assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
          assert.ok(
            getIssueLabels.mock.calls.some(
              call =>
                call.arguments[0].issueNumber === issueNumber &&
                call.arguments[0].octokit === octokitMock
            )
          )
          assert.ok(
            getIssueLabels.mock.calls.some(
              call =>
                call.arguments[0].issueNumber === issueNumber2 &&
                call.arguments[0].octokit === octokitMock
            )
          )
          assert.ok(
            info.mock.calls.some(
              call =>
                call.arguments[0] ===
                `The issue "${issueUrl}" does not have any labels, skipping the issue...`
            )
          )
          assert.strictEqual(octokitRequestReviewers.mock.callCount(), 1)
          assert.deepStrictEqual(
            octokitRequestReviewers.mock.calls[0].arguments[0],
            {
              owner,
              repo,
              pull_number: pullRequest,
              team_reviewers: [],
              reviewers: reviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim())
            }
          )
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })

      describe('and all issues do not have required label', () => {
        it('should show an info message', async () => {
          const issueWithoutLabels: GetIssueLabelsResult = JSON.parse(
            JSON.stringify(ISSUE_DATA_MOCK)
          )

          issueWithoutLabels.repository.issue.labels.nodes = []

          getReferencedClosedIssues.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_MOCK)
          )
          getIssueLabels.mock.mockImplementation(() =>
            Promise.resolve(issueWithoutLabels)
          )
          generateInputs()

          await run(core, github)

          assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
          assert.ok(
            getIssueLabels.mock.calls.some(
              call => call.arguments[0].issueNumber === issueNumber
            )
          )
          assert.ok(
            getIssueLabels.mock.calls.some(
              call => call.arguments[0].issueNumber === issueNumber2
            )
          )
          assert.ok(
            info.mock.calls.some(
              call =>
                call.arguments[0] ===
                `No issues of the PR ${pullRequestUrl} have the required label "${requiredLabel}"`
            )
          )
          assert.strictEqual(octokitRequestReviewers.mock.callCount(), 0)
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })

      describe('and one issue does not have required label', () => {
        it('should show an info message', async () => {
          const issueWithoutRequiredLabel: GetIssueLabelsResult = JSON.parse(
            JSON.stringify(ISSUE_DATA_MOCK)
          )

          issueWithoutRequiredLabel.repository.issue.labels.nodes = []
          issueWithoutRequiredLabel.repository.issue.labels.nodes.push({
            name: 'another-label'
          })

          getReferencedClosedIssues.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_MOCK)
          )
          let callIndex = 0
          getIssueLabels.mock.mockImplementation(() => {
            callIndex += 1
            return Promise.resolve(
              callIndex === 1 ? issueWithoutRequiredLabel : ISSUE_DATA_MOCK
            )
          })
          generateInputs({
            teamReviewers: ''
          })

          await run(core, github)

          assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
          assert.ok(
            getIssueLabels.mock.calls.some(
              call => call.arguments[0].issueNumber === issueNumber
            )
          )
          assert.ok(
            getIssueLabels.mock.calls.some(
              call => call.arguments[0].issueNumber === issueNumber2
            )
          )
          assert.ok(
            info.mock.calls.some(
              call =>
                call.arguments[0] ===
                `The issue "${issueUrl}" does not have the required label "${requiredLabel}", skipping the issue...`
            )
          )
          assert.strictEqual(octokitRequestReviewers.mock.callCount(), 1)
          assert.deepStrictEqual(
            octokitRequestReviewers.mock.calls[0].arguments[0],
            {
              owner,
              repo,
              pull_number: pullRequest,
              team_reviewers: [],
              reviewers: reviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim())
            }
          )
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })

      describe('and only the `reviewers` input is provided', () => {
        it('should set only reviewer users', async () => {
          getReferencedClosedIssues.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_MOCK)
          )
          getIssueLabels.mock.mockImplementation(() =>
            Promise.resolve(ISSUE_DATA_MOCK)
          )
          generateInputs({
            teamReviewers: ''
          })

          await run(core, github)

          assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
          assert.strictEqual(getIssueLabels.mock.callCount(), 1)
          assert.deepStrictEqual(getIssueLabels.mock.calls[0].arguments[0], {
            issueOwner: owner,
            issueRepo: repo,
            issueNumber,
            octokit: octokitMock
          })
          assert.ok(
            info.mock.calls.some(
              call =>
                call.arguments[0] ===
                `Reviewers added to PR "${pullRequestUrl}": ` +
                  `reviewers: ${reviewersString}, ` +
                  `no team reviewers`
            )
          )
          assert.strictEqual(octokitRequestReviewers.mock.callCount(), 1)
          assert.deepStrictEqual(
            octokitRequestReviewers.mock.calls[0].arguments[0],
            {
              owner,
              repo,
              pull_number: pullRequest,
              team_reviewers: [],
              reviewers: reviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim())
            }
          )
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })

      describe('and only the `team-reviewers` input is provided', () => {
        it('should set only team-reviewers', async () => {
          getReferencedClosedIssues.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_MOCK)
          )
          getIssueLabels.mock.mockImplementation(() =>
            Promise.resolve(ISSUE_DATA_MOCK)
          )
          generateInputs({
            reviewers: ''
          })

          await run(core, github)

          assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
          assert.strictEqual(getIssueLabels.mock.callCount(), 1)
          assert.deepStrictEqual(getIssueLabels.mock.calls[0].arguments[0], {
            issueOwner: owner,
            issueRepo: repo,
            issueNumber,
            octokit: octokitMock
          })
          assert.ok(
            info.mock.calls.some(
              call =>
                call.arguments[0] ===
                `Reviewers added to PR "${pullRequestUrl}": ` +
                  `no individual reviewers, ` +
                  `team reviewers: ${teamReviewersString}`
            )
          )
          assert.strictEqual(octokitRequestReviewers.mock.callCount(), 1)
          assert.deepStrictEqual(
            octokitRequestReviewers.mock.calls[0].arguments[0],
            {
              owner,
              repo,
              pull_number: pullRequest,
              reviewers: [],
              team_reviewers: teamReviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim())
            }
          )
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })

      describe('and the `reviewers` and `team-reviewers` inputs are provided together', () => {
        it('should set reviewers and team-reviewers', async () => {
          getReferencedClosedIssues.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_MOCK)
          )
          getIssueLabels.mock.mockImplementation(() =>
            Promise.resolve(ISSUE_DATA_MOCK)
          )
          generateInputs()

          await run(core, github)

          assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
          assert.strictEqual(getIssueLabels.mock.callCount(), 1)
          assert.deepStrictEqual(getIssueLabels.mock.calls[0].arguments[0], {
            issueOwner: owner,
            issueRepo: repo,
            issueNumber,
            octokit: octokitMock
          })
          assert.ok(
            info.mock.calls.some(
              call =>
                call.arguments[0] ===
                `Reviewers added to PR "${pullRequestUrl}": ` +
                  `reviewers: ${reviewersString}, ` +
                  `team reviewers: ${teamReviewersString}`
            )
          )
          assert.strictEqual(octokitRequestReviewers.mock.callCount(), 1)
          assert.deepStrictEqual(
            octokitRequestReviewers.mock.calls[0].arguments[0],
            {
              owner,
              repo,
              pull_number: pullRequest,
              reviewers: reviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim()),
              team_reviewers: teamReviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim())
            }
          )
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })
    })
  })
})
