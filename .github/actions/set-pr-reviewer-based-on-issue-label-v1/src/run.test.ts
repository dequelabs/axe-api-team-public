import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { Core, GitHub } from './types'
import type { default as runType } from './run'
import type { GetIssueLabelsResult } from '../../check-and-move-issue-based-on-labels-v1/src/getIssueLabels'
import type { GetReferencedClosedIssuesResult } from 'label-and-move-released-issues-v1/src/getReferencedClosedIssues'

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

describe('run', () => {
  let core: Core
  let run: typeof runType
  let octokitRequestReviewersStub: sinon.SinonStub
  let infoStub: sinon.SinonStub
  let warningStub: sinon.SinonStub
  let getInputStub: sinon.SinonStub
  let setFailedStub: sinon.SinonStub
  let getIssueLabelsStub: sinon.SinonStub
  let getReferencedClosedIssuesStub: sinon.SinonStub
  let github: object
  let octokitMock: object

  interface GenerateInputsArgs {
    token?: string
    pullRequestNumber?: number
    requiredIssueLabel?: string
    reviewers?: string
    teamReviewers?: string
  }

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    const token = getInputStub
      .withArgs('token', { required: true })
      .returns(inputs?.token ?? ghToken)
    const pullRequestNumber = getInputStub
      .withArgs('pull-request-number', { required: true })
      .returns(inputs?.pullRequestNumber ?? pullRequest)
    const requiredIssueLabel = getInputStub
      .withArgs('required-issue-label', { required: true })
      .returns(inputs?.requiredIssueLabel ?? requiredLabel)
    const reviewers = getInputStub
      .withArgs('reviewers', { required: false })
      .returns(inputs?.reviewers ?? reviewersString)
    const teamReviewers = getInputStub
      .withArgs('team-reviewers', { required: false })
      .returns(inputs?.teamReviewers ?? teamReviewersString)

    return {
      token,
      pullRequestNumber,
      requiredIssueLabel,
      reviewers,
      teamReviewers
    }
  }

  beforeEach(() => {
    octokitRequestReviewersStub = sinon.stub()
    infoStub = sinon.stub()
    warningStub = sinon.stub()
    getInputStub = sinon.stub()
    setFailedStub = sinon.stub()
    getIssueLabelsStub = sinon.stub()
    getReferencedClosedIssuesStub = sinon.stub()
    octokitMock = {
      rest: {
        pulls: {
          requestReviewers: octokitRequestReviewersStub
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
    }

    core = {
      getInput: getInputStub,
      info: infoStub,
      setFailed: setFailedStub,
      warning: warningStub
    }
    ;({ default: run } = proxyquire('./run', {
      '../../label-and-move-released-issues-v1/src/getReferencedClosedIssues': {
        default: getReferencedClosedIssuesStub,
        __esModule: true,
        '@noCallThru': true
      },
      '../../check-and-move-issue-based-on-labels-v1/src/getIssueLabels': {
        default: getIssueLabelsStub,
        __esModule: true,
        '@noCallThru': true
      }
    }))
  })

  afterEach(sinon.restore)

  describe('when the `token` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: token'

      getInputStub.withArgs('token', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWithExactly(errorMessage))
    })
  })

  describe('when the `pull-request-number` input', () => {
    it('is not provided throws an error', async () => {
      const errorMessage =
        'Input required and not supplied: pull-request-number'

      getInputStub.withArgs('pull-request-number', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWithExactly(errorMessage))
    })

    it('is not a number throws an error', async () => {
      getInputStub.withArgs('pull-request-number').returns('abc')

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(
        setFailedStub.calledOnceWithExactly(
          '`pull-request-number` must be a number'
        )
      )
    })
  })

  describe('when the `required-issue-label` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage =
        'Input required and not supplied: required-issue-label'

      getInputStub.withArgs('required-issue-label', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWithExactly(errorMessage))
    })
  })

  describe('when the `reviewers` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: reviewers'

      getInputStub.withArgs('reviewers', { required: false }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWithExactly(errorMessage))
    })
  })

  describe('when the `team-reviewers` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: team-reviewers'

      getInputStub.withArgs('team-reviewers', { required: false }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWithExactly(errorMessage))
    })
  })

  describe('when neither `reviewers` nor `team-reviewers` inputs are provided', () => {
    it('throws an error', async () => {
      getInputStub.withArgs('token').returns(ghToken)
      getInputStub.withArgs('required-issue-label').returns(requiredLabel)
      getInputStub.withArgs('pull-request-number').returns(pullRequest)
      // the empty string is the default value for the input is not provided
      getInputStub.withArgs('reviewers').returns('')
      getInputStub.withArgs('team-reviewers').returns('')

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(
        setFailedStub.calledOnceWithExactly(
          'One of the inputs `reviewers` or `team-reviewers` must be provided'
        )
      )
    })
  })

  describe('given the required inputs', () => {
    describe('when a PR does not have any closed issues', () => {
      it('should stop the process', async () => {
        getReferencedClosedIssuesStub.resolves({
          repository: {
            pullRequest: {
              closingIssuesReferences: {
                nodes: []
              }
            }
          }
        })
        generateInputs()

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(
          getReferencedClosedIssuesStub.calledOnceWithExactly({
            owner,
            repo,
            pullRequestID: pullRequest,
            octokit: octokitMock
          })
        )
        assert.isTrue(
          infoStub.calledWithExactly(
            `No issues found for the PR "${pullRequestUrl}", stopped the process.`
          )
        )
        assert.isTrue(setFailedStub.notCalled)
      })
    })

    describe('when a PR has closed issues', () => {
      describe('and one issue is not found', () => {
        it('should show a warning message', async () => {
          getReferencedClosedIssuesStub.resolves(ISSUES_MOCK)
          getIssueLabelsStub.onFirstCall().resolves()
          getIssueLabelsStub.onSecondCall().resolves(ISSUE_DATA_MOCK)
          octokitRequestReviewersStub.resolves()
          generateInputs()

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            getReferencedClosedIssuesStub.calledOnceWithExactly({
              owner,
              repo,
              pullRequestID: pullRequest,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledWith({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledWith({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber: issueNumber2,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            warningStub.calledOnceWithExactly(
              `The issue "${issueUrl}" is not found, moving on...`
            )
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and one issue does not have any labels', () => {
        it('should show an info message', async () => {
          const issueWithoutLabels = JSON.parse(JSON.stringify(ISSUE_DATA_MOCK))

          issueWithoutLabels.repository.issue.labels.nodes = []

          getReferencedClosedIssuesStub.resolves(ISSUES_MOCK)
          getIssueLabelsStub.onFirstCall().resolves(issueWithoutLabels)
          getIssueLabelsStub.onSecondCall().resolves(ISSUE_DATA_MOCK)
          octokitRequestReviewersStub.resolves()
          generateInputs({
            teamReviewers: ''
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            getReferencedClosedIssuesStub.calledOnceWithExactly({
              owner,
              repo,
              pullRequestID: pullRequest,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledWith({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledWith({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber: issueNumber2,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            infoStub.calledWithExactly(
              `The issue "${issueUrl}" does not have any labels, skipping the issue...`
            )
          )
          assert.isTrue(
            octokitRequestReviewersStub.calledOnceWithExactly({
              owner,
              repo,
              pull_number: pullRequest,
              team_reviewers: [],
              reviewers: reviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim())
            })
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and all issues do not have required label', () => {
        it('should show an info message', async () => {
          const issueWithoutLabels = JSON.parse(JSON.stringify(ISSUE_DATA_MOCK))

          issueWithoutLabels.repository.issue.labels.nodes = []

          getReferencedClosedIssuesStub.resolves(ISSUES_MOCK)
          getIssueLabelsStub.onFirstCall().resolves(issueWithoutLabels)
          getIssueLabelsStub.onSecondCall().resolves(issueWithoutLabels)
          octokitRequestReviewersStub.resolves()
          generateInputs()

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            getReferencedClosedIssuesStub.calledOnceWithExactly({
              owner,
              repo,
              pullRequestID: pullRequest,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledWith({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledWith({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber: issueNumber2,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            infoStub.calledWithExactly(
              `No issues of the PR ${pullRequestUrl} have the required label "${requiredLabel}"`
            )
          )
          assert.isTrue(octokitRequestReviewersStub.notCalled)
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and one issue does not have required label', () => {
        it('should show an info message', async () => {
          const issueWithoutRequiredLabel = JSON.parse(
            JSON.stringify(ISSUE_DATA_MOCK)
          )

          issueWithoutRequiredLabel.repository.issue.labels.nodes = []
          issueWithoutRequiredLabel.repository.issue.labels.nodes.push({
            name: 'another-label'
          })

          getReferencedClosedIssuesStub.resolves(ISSUES_MOCK)
          getIssueLabelsStub.onFirstCall().resolves(issueWithoutRequiredLabel)
          getIssueLabelsStub.onSecondCall().resolves(ISSUE_DATA_MOCK)
          octokitRequestReviewersStub.resolves()
          generateInputs({
            teamReviewers: ''
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            getReferencedClosedIssuesStub.calledOnceWithExactly({
              owner,
              repo,
              pullRequestID: pullRequest,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledWith({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledWith({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber: issueNumber2,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            infoStub.calledWithExactly(
              `The issue "${issueUrl}" does not have the required label "${requiredLabel}", skipping the issue...`
            )
          )
          assert.isTrue(
            octokitRequestReviewersStub.calledOnceWithExactly({
              owner,
              repo,
              pull_number: pullRequest,
              team_reviewers: [],
              reviewers: reviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim())
            })
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and only the `reviewers` input is provided', () => {
        it('should set only reviewer users', async () => {
          getReferencedClosedIssuesStub.resolves(ISSUES_MOCK)
          getIssueLabelsStub.resolves(ISSUE_DATA_MOCK)
          octokitRequestReviewersStub.resolves()
          generateInputs({
            teamReviewers: ''
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            getReferencedClosedIssuesStub.calledOnceWithExactly({
              owner,
              repo,
              pullRequestID: pullRequest,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledOnceWithExactly({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            infoStub.calledWithExactly(
              `Reviewers added to PR "${pullRequestUrl}": ` +
                `reviewers: ${reviewersString}, ` +
                `no team reviewers`
            )
          )
          assert.isTrue(
            octokitRequestReviewersStub.calledOnceWithExactly({
              owner,
              repo,
              pull_number: pullRequest,
              team_reviewers: [],
              reviewers: reviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim())
            })
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and only the `team-reviewers` input is provided', () => {
        it('should set only team-reviewers', async () => {
          getReferencedClosedIssuesStub.resolves(ISSUES_MOCK)
          getIssueLabelsStub.resolves(ISSUE_DATA_MOCK)
          octokitRequestReviewersStub.resolves()
          generateInputs({
            reviewers: ''
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            getReferencedClosedIssuesStub.calledOnceWithExactly({
              owner,
              repo,
              pullRequestID: pullRequest,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledOnceWithExactly({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            infoStub.calledWithExactly(
              `Reviewers added to PR "${pullRequestUrl}": ` +
                `no individual reviewers, ` +
                `team reviewers: ${teamReviewersString}`
            )
          )
          assert.isTrue(
            octokitRequestReviewersStub.calledOnceWithExactly({
              owner,
              repo,
              pull_number: pullRequest,
              reviewers: [],
              team_reviewers: teamReviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim())
            })
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and the `reviewers` and `team-reviewers` inputs are provided together', () => {
        it('should set reviewers and team-reviewers', async () => {
          getReferencedClosedIssuesStub.resolves(ISSUES_MOCK)
          getIssueLabelsStub.resolves(ISSUE_DATA_MOCK)
          octokitRequestReviewersStub.resolves()
          generateInputs()

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            getReferencedClosedIssuesStub.calledOnceWithExactly({
              owner,
              repo,
              pullRequestID: pullRequest,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            getIssueLabelsStub.calledOnceWithExactly({
              issueOwner: owner,
              issueRepo: repo,
              issueNumber,
              octokit: octokitMock
            })
          )
          assert.isTrue(
            infoStub.calledWithExactly(
              `Reviewers added to PR "${pullRequestUrl}": ` +
                `reviewers: ${reviewersString}, ` +
                `team reviewers: ${teamReviewersString}`
            )
          )
          assert.isTrue(
            octokitRequestReviewersStub.calledOnceWithExactly({
              owner,
              repo,
              pull_number: pullRequest,
              reviewers: reviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim()),
              team_reviewers: teamReviewersString
                .split(',')
                .map((reviewer: string) => reviewer.trim())
            })
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })
    })
  })
})
