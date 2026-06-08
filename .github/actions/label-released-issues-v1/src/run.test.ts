import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Endpoints } from '@octokit/types'
import type { Core, GitHub } from './types.ts'
import type { ParsedCommitList } from '../../generate-commit-list-v1/src/types.ts'
import type { GetReferencedClosedIssuesResult } from '../../label-and-move-released-issues-v1/src/getReferencedClosedIssues.ts'
import type { GetIssueProjectInfoResult } from '../../label-and-move-released-issues-v1/src/getIssueProjectInfo.ts'

const MOCK_COMMIT_LIST: ParsedCommitList[] = [
  {
    commit: 'feat: add new feature',
    title: 'add new feature',
    sha: '123',
    type: 'feat',
    id: '1',
    link: 'https://github.com/dequelabs/axe-core/issues/456'
  }
]
const MOCK_LIST_LABELS = {
  id: 1,
  node_id: 'abcd123',
  url: 'https://api.github.com/repos/octocat/Hello-World/labels/bug',
  name: 'bug',
  description: "Something isn't working",
  color: 'f29513',
  default: true
} as unknown as Endpoints['GET /repos/{owner}/{repo}/labels']['response']
const ISSUE_OWNER = 'issue-owner'
const ISSUE_REPO = 'issue-repo-name'
const MOCK_LABEL_NAME = `RELEASED: ${ISSUE_REPO} v1.0.0`
const MOCK_CREATED_LABEL = {
  id: 208045946,
  node_id: 'MDU6TGFiZWwyMDgwNDU5NDY=',
  url: 'https://api.github.com/repos/octocat/Hello-World/labels/version%3A%201.0.0',
  name: MOCK_LABEL_NAME,
  description: 'The released label',
  color: 'f29513',
  default: true
} as unknown as Endpoints['POST /repos/{owner}/{repo}/labels']['response']
const MOCK_REFERENCED_CLOSED_ISSUES: GetReferencedClosedIssuesResult = {
  repository: {
    pullRequest: {
      closingIssuesReferences: {
        nodes: [
          {
            number: 27,
            repository: {
              owner: { login: ISSUE_OWNER },
              name: ISSUE_REPO
            }
          }
        ]
      }
    }
  }
}
const MOCK_PROJECT_INFO: GetIssueProjectInfoResult = {
  repository: {
    issue: {
      projectItems: {
        nodes: [
          {
            id: '123',
            type: 'ISSUE',
            project: {
              number: 66
            },
            fieldValueByName: {
              name: 'Done'
            }
          }
        ]
      }
    }
  }
}
const DEFAULT_DONE_COLUMNS = 'done,devDone'

const getReferencedClosedIssues = mock.fn<
  () => Promise<GetReferencedClosedIssuesResult>
>(async () => MOCK_REFERENCED_CLOSED_ISSUES)
const getIssueProjectInfo = mock.fn<() => Promise<GetIssueProjectInfoResult>>(
  async () => MOCK_PROJECT_INFO
)

mock.module(
  '../../label-and-move-released-issues-v1/src/getReferencedClosedIssues.ts',
  {
    defaultExport: getReferencedClosedIssues
  }
)
mock.module(
  '../../label-and-move-released-issues-v1/src/getIssueProjectInfo.ts',
  {
    defaultExport: getIssueProjectInfo
  }
)

const { default: run } = await import('./run.ts')

describe('run', () => {
  let info: ReturnType<typeof mock.fn>
  let getInput: ReturnType<typeof mock.fn<(name: string) => string>>
  let setFailed: ReturnType<typeof mock.fn<(message: string) => void>>
  let setOutput: ReturnType<
    typeof mock.fn<(name: string, value: string) => void>
  >
  let listLabelsForRepo: ReturnType<typeof mock.fn>
  let createLabel: ReturnType<typeof mock.fn>
  let addLabels: ReturnType<typeof mock.fn>
  let paginate: ReturnType<
    typeof mock.fn<
      (
        ...args: unknown[]
      ) => Promise<Endpoints['GET /repos/{owner}/{repo}/labels']['response'][]>
    >
  >
  let issuesGet: ReturnType<typeof mock.fn>
  let issuesUpdate: ReturnType<typeof mock.fn>

  beforeEach(() => {
    getReferencedClosedIssues.mock.resetCalls()
    getReferencedClosedIssues.mock.mockImplementation(
      async () => MOCK_REFERENCED_CLOSED_ISSUES
    )
    getIssueProjectInfo.mock.resetCalls()
    getIssueProjectInfo.mock.mockImplementation(async () => MOCK_PROJECT_INFO)

    info = mock.fn()
    getInput = mock.fn<(name: string) => string>(() => '')
    setFailed = mock.fn<(message: string) => void>()
    setOutput = mock.fn<(name: string, value: string) => void>()
    listLabelsForRepo = mock.fn()
    createLabel = mock.fn(
      async () =>
        ({
          data: MOCK_CREATED_LABEL
        }) as unknown
    )
    addLabels = mock.fn(
      async () =>
        ({
          data: {
            labels: [MOCK_CREATED_LABEL],
            status: 200
          }
        }) as unknown
    )
    paginate = mock.fn(async () => [MOCK_LIST_LABELS])
    issuesGet = mock.fn(async () => ({
      data: {
        html_url: 'https://github.com/owner/repo/issues/1',
        state: 'open'
      },
      status: 200
    }))
    issuesUpdate = mock.fn(async () => ({
      data: {},
      status: 200
    }))
  })

  interface GenerateInputsArgs {
    commitList?: ParsedCommitList[]
    labelTag?: string
    token?: string
    projectNumber?: string
    boardDoneColumnsString?: string
  }

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    getInput.mock.mockImplementation((name: string) => {
      switch (name) {
        case 'commit-list':
          return JSON.stringify(inputs?.commitList ?? MOCK_COMMIT_LIST)
        case 'label-tag':
          return inputs?.labelTag ?? 'v1.0.0'
        case 'token':
          return inputs?.token ?? 'token'
        case 'project-number':
          return inputs?.projectNumber ?? '66'
        case 'done-columns':
          return inputs?.boardDoneColumnsString ?? DEFAULT_DONE_COLUMNS
        default:
          return ''
      }
    })
  }

  const makeCore = () =>
    ({
      getInput,
      setOutput,
      setFailed,
      info
    }) as unknown as Core

  const makeGitHub = () =>
    ({
      context: {
        repo: {
          owner: ISSUE_OWNER,
          repo: ISSUE_REPO
        }
      },
      getOctokit: () => ({
        paginate,
        rest: {
          issues: {
            listLabelsForRepo,
            createLabel,
            get: issuesGet,
            update: issuesUpdate,
            addLabels
          }
        }
      })
    }) as unknown as GitHub

  describe('when the `commit-list` input is not provided', () => {
    it('throws an error', async () => {
      getInput.mock.mockImplementation((name: string) => {
        if (name === 'commit-list') {
          throw new Error('Input required and not supplied: commit-list')
        }
        return ''
      })

      const core = {
        getInput,
        setOutput,
        setFailed
      } as unknown as Core

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(paginate.mock.callCount(), 0)
      assert.strictEqual(createLabel.mock.callCount(), 0)
      assert.strictEqual(addLabels.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Input required and not supplied: commit-list'
      )
    })
  })

  describe('when the `label-tag` input is not provided', () => {
    it('throws an error', async () => {
      getInput.mock.mockImplementation((name: string) => {
        if (name === 'label-tag') {
          throw new Error('Input required and not supplied: label-tag')
        }
        return ''
      })

      const core = {
        getInput,
        setOutput,
        setFailed
      } as unknown as Core

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(paginate.mock.callCount(), 0)
      assert.strictEqual(createLabel.mock.callCount(), 0)
      assert.strictEqual(addLabels.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Input required and not supplied: label-tag'
      )
    })
  })

  describe('when the `token` input is not provided', () => {
    it('throws an error', async () => {
      getInput.mock.mockImplementation((name: string) => {
        if (name === 'token') {
          throw new Error('Input required and not supplied: token')
        }
        return ''
      })

      const core = {
        getInput,
        setOutput,
        setFailed
      } as unknown as Core

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(paginate.mock.callCount(), 0)
      assert.strictEqual(createLabel.mock.callCount(), 0)
      assert.strictEqual(addLabels.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Input required and not supplied: token'
      )
    })
  })

  describe('when the `project-number` input is not a number', () => {
    it('throws an error', async () => {
      getInput.mock.mockImplementation((name: string) => {
        if (name === 'project-number') {
          return 'abc'
        }
        return ''
      })

      const core = {
        getInput,
        setOutput,
        setFailed
      } as unknown as Core

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(paginate.mock.callCount(), 0)
      assert.strictEqual(createLabel.mock.callCount(), 0)
      assert.strictEqual(addLabels.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        '`project-number` must be a number'
      )
    })
  })

  describe('given a commit list with no PR ID', () => {
    it('should not label any issues', async () => {
      generateInputs({
        commitList: [
          {
            commit: 'feat: add new feature',
            title: 'add new feature',
            sha: '123',
            type: 'feat',
            id: null,
            link: null
          }
        ]
      })

      await run(makeCore(), makeGitHub())

      assert.strictEqual(paginate.mock.callCount(), 0)
      assert.strictEqual(createLabel.mock.callCount(), 0)
      assert.strictEqual(addLabels.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 0)
      assert.ok(
        info.mock.calls.some(
          call =>
            call.arguments[0] ===
            '\nNo PR found for the commit "123", moving on...'
        )
      )
    })
  })

  describe('given the required inputs', () => {
    it('should create a new label and set output with the issue URLs', async () => {
      generateInputs()

      await run(makeCore(), makeGitHub())

      assert.strictEqual(paginate.mock.callCount(), 1)
      assert.deepStrictEqual(paginate.mock.calls[0].arguments[1], {
        owner: ISSUE_OWNER,
        repo: ISSUE_REPO,
        per_page: 100
      })
      assert.strictEqual(createLabel.mock.callCount(), 1)
      assert.deepStrictEqual(createLabel.mock.calls[0].arguments[0], {
        repo: ISSUE_REPO,
        owner: ISSUE_OWNER,
        name: MOCK_LABEL_NAME,
        color: 'FFFFFF'
      })
      assert.strictEqual(addLabels.mock.callCount(), 1)
      assert.deepStrictEqual(addLabels.mock.calls[0].arguments[0], {
        repo: ISSUE_REPO,
        owner: ISSUE_OWNER,
        issue_number:
          MOCK_REFERENCED_CLOSED_ISSUES.repository.pullRequest
            .closingIssuesReferences.nodes[0].number,
        labels: [MOCK_LABEL_NAME]
      })
      assert.strictEqual(setFailed.mock.callCount(), 0)
      assert.strictEqual(setOutput.mock.callCount(), 1)
      assert.strictEqual(setOutput.mock.calls[0].arguments[0], 'issue-urls')

      const output = setOutput.mock.calls[0].arguments[1]
      assert.deepStrictEqual(JSON.parse(output), [
        'https://github.com/owner/repo/issues/1'
      ])

      assert.ok(
        info.mock.calls.some(
          call =>
            call.arguments[0] ===
            `\n~~~ All issues have been successfully closed and labeled with "${MOCK_LABEL_NAME}" ~~~`
        )
      )
    })

    describe('when there are no referenced closed issues', () => {
      it('should not label any issues', async () => {
        generateInputs()
        getReferencedClosedIssues.mock.mockImplementation(async () => ({
          repository: {
            pullRequest: {
              closingIssuesReferences: {
                nodes: []
              }
            }
          }
        }))

        await run(makeCore(), makeGitHub())

        assert.strictEqual(paginate.mock.callCount(), 0)
        assert.strictEqual(createLabel.mock.callCount(), 0)
        assert.strictEqual(addLabels.mock.callCount(), 0)
        assert.strictEqual(setFailed.mock.callCount(), 0)
        assert.ok(
          info.mock.calls.some(
            call =>
              call.arguments[0] ===
              `\nNo issues found for the commit "123", moving on...`
          )
        )
        // Only called once for getting the referenced closed issues
        assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
        assert.strictEqual(getIssueProjectInfo.mock.callCount(), 0)
      })
    })

    describe('when the project board is not found for an issue', () => {
      it('should not label an issue', async () => {
        generateInputs()
        getIssueProjectInfo.mock.mockImplementation(async () => ({
          repository: {
            issue: {
              projectItems: {
                nodes: [
                  {
                    id: '123',
                    type: 'ISSUE',
                    project: {
                      // does not match projectNumber (Default 66)
                      number: 100
                    },
                    fieldValueByName: {
                      name: 'Done'
                    }
                  }
                ]
              }
            }
          }
        }))

        await run(makeCore(), makeGitHub())

        assert.strictEqual(paginate.mock.callCount(), 0)
        assert.strictEqual(createLabel.mock.callCount(), 0)
        assert.strictEqual(addLabels.mock.callCount(), 0)
        assert.strictEqual(setFailed.mock.callCount(), 0)
        assert.ok(
          info.mock.calls.some(
            call =>
              call.arguments[0] ===
              '\nCould not find the project board "66" for issue 27, moving on...'
          )
        )
        /**
         * Called once each for getting the referenced closed issues and the project info
         */
        assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
        assert.strictEqual(getIssueProjectInfo.mock.callCount(), 1)
      })
    })

    describe('when the issue is not in one of the provided columns', () => {
      it('should not label an issue', async () => {
        const boardDoneColumnsString = 'done'

        generateInputs({ boardDoneColumnsString })

        getIssueProjectInfo.mock.mockImplementation(async () => ({
          repository: {
            issue: {
              projectItems: {
                nodes: [
                  {
                    id: '123',
                    type: 'ISSUE',
                    project: {
                      number: 66
                    },
                    fieldValueByName: {
                      name: 'Backlog'
                    }
                  }
                ]
              }
            }
          }
        }))

        await run(makeCore(), makeGitHub())

        assert.strictEqual(paginate.mock.callCount(), 0)
        assert.strictEqual(createLabel.mock.callCount(), 0)
        assert.strictEqual(addLabels.mock.callCount(), 0)
        assert.strictEqual(setFailed.mock.callCount(), 0)
        assert.ok(
          info.mock.calls.some(
            call =>
              call.arguments[0] ===
              `\nThe issue 27 is not in one of the "${boardDoneColumnsString}" columns, moving on...`
          )
        )
        /**
         * Called once each for getting the referenced closed issues and the project info
         */
        assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
        assert.strictEqual(getIssueProjectInfo.mock.callCount(), 1)
      })
    })

    describe('when the input property `done-columns` is not provided', () => {
      it('should use default values', async () => {
        getInput.mock.mockImplementation((name: string) => {
          switch (name) {
            case 'commit-list':
              return JSON.stringify(MOCK_COMMIT_LIST)
            case 'label-tag':
              return 'v1.0.0'
            case 'token':
              return 'token'
            case 'project-number':
              return '66'
            // done-columns intentionally returns '' to trigger the default
            default:
              return ''
          }
        })

        getIssueProjectInfo.mock.mockImplementation(async () => ({
          repository: {
            issue: {
              projectItems: {
                nodes: [
                  {
                    id: '123',
                    type: 'ISSUE',
                    project: {
                      number: 66
                    },
                    fieldValueByName: {
                      name: 'Backlog'
                    }
                  }
                ]
              }
            }
          }
        }))

        await run(makeCore(), makeGitHub())

        assert.strictEqual(paginate.mock.callCount(), 0)
        assert.strictEqual(createLabel.mock.callCount(), 0)
        assert.strictEqual(addLabels.mock.callCount(), 0)
        assert.strictEqual(setFailed.mock.callCount(), 0)
        assert.ok(
          info.mock.calls.some(
            call =>
              call.arguments[0] ===
              `\nThe issue 27 is not in one of the "${DEFAULT_DONE_COLUMNS}" columns, moving on...`
          )
        )
        /**
         * Called once each for getting the referenced closed issues and the project info
         */
        assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
        assert.strictEqual(getIssueProjectInfo.mock.callCount(), 1)
      })
    })

    describe('when the issue is related to another repo than action repo', () => {
      it('should create a new label', async () => {
        generateInputs()

        await run(makeCore(), makeGitHub())

        assert.strictEqual(paginate.mock.callCount(), 1)
        assert.deepStrictEqual(paginate.mock.calls[0].arguments[1], {
          owner: ISSUE_OWNER,
          repo: ISSUE_REPO,
          per_page: 100
        })
        assert.strictEqual(createLabel.mock.callCount(), 1)
        assert.deepStrictEqual(createLabel.mock.calls[0].arguments[0], {
          repo: ISSUE_REPO,
          owner: ISSUE_OWNER,
          name: MOCK_LABEL_NAME,
          color: 'FFFFFF'
        })
        assert.strictEqual(addLabels.mock.callCount(), 1)
        assert.deepStrictEqual(addLabels.mock.calls[0].arguments[0], {
          repo: ISSUE_REPO,
          owner: ISSUE_OWNER,
          issue_number:
            MOCK_REFERENCED_CLOSED_ISSUES.repository.pullRequest
              .closingIssuesReferences.nodes[0].number,
          labels: [MOCK_LABEL_NAME]
        })
        assert.strictEqual(setFailed.mock.callCount(), 0)
        assert.ok(
          info.mock.calls.some(
            call =>
              call.arguments[0] ===
              `\nThe label "${MOCK_LABEL_NAME}" does not exist for the issue repo ${ISSUE_OWNER}/${ISSUE_REPO}, creating...`
          )
        )
        /**
         * Called once each for getting the referenced closed issues and the project info
         */
        assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
        assert.strictEqual(getIssueProjectInfo.mock.callCount(), 1)
      })

      it('should set existing label', async () => {
        generateInputs()

        const MOCK_EXIST_LABEL = {
          id: 123,
          node_id: 'yyy123',
          url: 'https://api.github.com/repos/octocat/Hello-World/labels/bug',
          name: MOCK_LABEL_NAME,
          description: 'Existing label',
          color: 'ffffff',
          default: true
        } as unknown as Endpoints['GET /repos/{owner}/{repo}/labels']['response']

        paginate.mock.mockImplementation(async () => [MOCK_EXIST_LABEL])

        await run(makeCore(), makeGitHub())

        assert.strictEqual(paginate.mock.callCount(), 1)
        assert.deepStrictEqual(paginate.mock.calls[0].arguments[1], {
          owner: ISSUE_OWNER,
          repo: ISSUE_REPO,
          per_page: 100
        })
        assert.strictEqual(createLabel.mock.callCount(), 0)
        assert.strictEqual(addLabels.mock.callCount(), 1)
        assert.deepStrictEqual(addLabels.mock.calls[0].arguments[0], {
          repo: ISSUE_REPO,
          owner: ISSUE_OWNER,
          issue_number:
            MOCK_REFERENCED_CLOSED_ISSUES.repository.pullRequest
              .closingIssuesReferences.nodes[0].number,
          labels: [MOCK_LABEL_NAME]
        })
        assert.strictEqual(setFailed.mock.callCount(), 0)
        /**
         * Called once each for getting the referenced closed issues and the project info
         */
        assert.strictEqual(getReferencedClosedIssues.mock.callCount(), 1)
        assert.strictEqual(getIssueProjectInfo.mock.callCount(), 1)
      })
    })
  })
})
