import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import { getOctokit } from '@actions/github'
import type { Endpoints } from '@octokit/types'
import { Core, GitHub } from './types'
import type { ParsedCommitList } from '../../generate-commit-list-v1/src/types'

type ExecOutput = { stdout: string; stderr?: string; exitCode?: number }

const getExecOutput = mock.fn<(cmd: string) => Promise<ExecOutput>>(() =>
  Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
)
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: run } = await import('./run.ts')

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

const MOCK_LABEL_NAME = 'VERSION: repo@1.0.0'

const MOCK_CREATED_LABEL = {
  id: 208045946,
  node_id: 'MDU6TGFiZWwyMDgwNDU5NDY=',
  url: 'https://api.github.com/repos/octocat/Hello-World/labels/version%3A%201.0.0',
  name: MOCK_LABEL_NAME,
  description: 'release 1.0.0',
  color: 'f29513',
  default: true
} as unknown as Endpoints['POST /repos/{owner}/{repo}/labels']['response']

const MOCK_PROJECT_BOARD_ID = {
  id: '123'
}

const MOCK_FIELD_LIST = {
  fields: [
    {
      id: '123',
      name: 'Status',
      type: 'ProjectV2',
      options: [
        {
          id: '456',
          name: 'Released'
        }
      ]
    }
  ],
  totalCount: 1
}

const ISSUE_OWNER = 'issue-owner'
const ISSUE_REPO = 'issue-repo-name'

const MOCK_REFERENCED_CLOSED_ISSUES = {
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

const MOCK_PROJECT_INFO = {
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

describe('run', () => {
  let info: ReturnType<typeof mock.fn>
  let getInput: ReturnType<typeof mock.fn<(name: string) => string>>
  let setFailed: ReturnType<typeof mock.fn>
  let listLabelsForRepoStub: ReturnType<typeof mock.fn>
  let createLabelStub: ReturnType<typeof mock.fn>
  let addLabelsStub: ReturnType<typeof mock.fn>

  const octokit = getOctokit('token')

  beforeEach(() => {
    info = mock.fn()
    getInput = mock.fn<(name: string) => string>(() => '')
    setFailed = mock.fn()
    listLabelsForRepoStub = mock.fn(() =>
      Promise.resolve({
        data: [MOCK_LIST_LABELS],
        status: 200
      })
    )
    createLabelStub = mock.fn(() =>
      Promise.resolve({
        data: MOCK_CREATED_LABEL
      })
    )
    addLabelsStub = mock.fn(() =>
      Promise.resolve({
        data: {
          labels: [MOCK_CREATED_LABEL],
          status: 200
        }
      })
    )
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() =>
      Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    )
  })

  interface GenerateInputsArgs {
    commitList?: ParsedCommitList[]
    version?: string
    token?: string
    projectNumber?: string
    releaseColumn?: string
  }

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    const values: Record<string, string> = {
      'commit-list': JSON.stringify(inputs?.commitList ?? MOCK_COMMIT_LIST),
      version: inputs?.version ?? '1.0.0',
      token: inputs?.token ?? 'token',
      'project-number': inputs?.projectNumber ?? '66',
      'column-name': inputs?.releaseColumn ?? 'released'
    }

    getInput.mock.mockImplementation((name: string) => values[name] ?? '')
  }

  // Helper to drive the sequence of getExecOutput resolutions used by the
  // add-to-board helpers (getProjectBoardID, getProjectBoardFieldList,
  // addIssueToBoard, moveIssueToColumn) which all call getExecOutput.
  const setExecSequence = (stdouts: string[]) => {
    let call = 0
    getExecOutput.mock.mockImplementation(() => {
      const stdout = stdouts[call] ?? ''
      call += 1
      return Promise.resolve({ stdout, stderr: '', exitCode: 0 })
    })
  }

  // Returns the graphql mock so call counts can be asserted. The first call
  // resolves the referenced closed issues, the second resolves project info.
  const stubGraphql = (referencedClosedIssues: object, projectInfo: object) => {
    let call = 0
    const graphql = mock.fn(() => {
      call += 1
      return Promise.resolve(call === 1 ? referencedClosedIssues : projectInfo)
    })
    octokit.graphql = graphql as unknown as typeof octokit.graphql
    return graphql
  }

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
        setFailed
      } as unknown as Core

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 0)
      assert.strictEqual(createLabelStub.mock.callCount(), 0)
      assert.strictEqual(addLabelsStub.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Input required and not supplied: commit-list'
      )
    })
  })

  describe('when the `version` input is not provided', () => {
    it('throws an error', async () => {
      getInput.mock.mockImplementation((name: string) => {
        if (name === 'version') {
          throw new Error('Input required and not supplied: version')
        }
        return ''
      })

      const core = {
        getInput,
        setFailed
      } as unknown as Core

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 0)
      assert.strictEqual(createLabelStub.mock.callCount(), 0)
      assert.strictEqual(addLabelsStub.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Input required and not supplied: version'
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
        setFailed
      } as unknown as Core

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 0)
      assert.strictEqual(createLabelStub.mock.callCount(), 0)
      assert.strictEqual(addLabelsStub.mock.callCount(), 0)
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
        if (name === 'commit-list') {
          return JSON.stringify(MOCK_COMMIT_LIST)
        }
        if (name === 'version') {
          return '1.0.0'
        }
        if (name === 'token') {
          return 'token'
        }
        return ''
      })

      const core = {
        getInput,
        setFailed
      } as unknown as Core

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 0)
      assert.strictEqual(createLabelStub.mock.callCount(), 0)
      assert.strictEqual(addLabelsStub.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        '`project-number` must be a number'
      )
    })
  })

  describe('given a commit list with no PR ID', () => {
    it('should not move any issues', async () => {
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

      // getProjectBoardID then getProjectBoardFieldList
      setExecSequence([
        JSON.stringify(MOCK_PROJECT_BOARD_ID),
        JSON.stringify(MOCK_FIELD_LIST)
      ])

      const core = {
        getInput,
        setFailed,
        info
      } as unknown as Core

      const github = {
        context: {
          repo: {
            owner: 'owner',
            repo: 'repo'
          }
        },
        getOctokit: () => {
          return {
            ...octokit,
            rest: {
              issues: {
                listLabelsForRepo: () => {
                  return {
                    data: [MOCK_LIST_LABELS],
                    status: 200
                  } as unknown as Endpoints['GET /repos/{owner}/{repo}/labels']['response']
                },
                createLabel: () => {
                  return {
                    data: MOCK_CREATED_LABEL
                  } as unknown as Endpoints['POST /repos/{owner}/{repo}/labels']['response']
                }
              }
            }
          }
        }
      } as unknown as GitHub

      await run(core, github)

      assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 0)
      assert.strictEqual(createLabelStub.mock.callCount(), 0)
      assert.strictEqual(addLabelsStub.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 0)
      assert.ok(
        info.mock.calls.some(
          call => call.arguments[0] === '\nNo PR found for commit, moving on...'
        )
      )
    })
  })

  describe('when the release column does not exist', () => {
    it('should error', async () => {
      generateInputs()
      // getProjectBoardID then getProjectBoardFieldList (with no matching column)
      setExecSequence([
        JSON.stringify(MOCK_PROJECT_BOARD_ID),
        JSON.stringify({
          fields: [
            {
              ...MOCK_FIELD_LIST.fields[0],
              options: [
                {
                  id: '456',
                  name: 'Backlog'
                }
              ]
            }
          ]
        })
      ])

      const core = {
        getInput,
        setFailed,
        info
      } as unknown as Core

      const github = {
        context: {
          repo: {
            owner: 'owner',
            repo: 'repo'
          }
        },
        getOctokit: () => {
          return {
            ...octokit,
            rest: {
              issues: {
                listLabelsForRepo: () => {
                  return {
                    data: [MOCK_LIST_LABELS],
                    status: 200
                  } as unknown as Endpoints['GET /repos/{owner}/{repo}/labels']['response']
                },
                createLabel: () => {
                  return {
                    data: MOCK_CREATED_LABEL
                  } as unknown as Endpoints['POST /repos/{owner}/{repo}/labels']['response']
                }
              }
            }
          }
        }
      } as unknown as GitHub

      await run(core, github)

      assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 0)
      assert.strictEqual(createLabelStub.mock.callCount(), 0)
      assert.strictEqual(addLabelsStub.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        `\nColumn released not found in project board 66`
      )
    })
  })

  describe('when the release column is not provided', () => {
    it('should not move the issue', async () => {
      generateInputs({ releaseColumn: '' })

      // getProjectBoardID, getProjectBoardFieldList, addIssueToBoard
      setExecSequence([
        JSON.stringify(MOCK_PROJECT_BOARD_ID),
        JSON.stringify(MOCK_FIELD_LIST),
        JSON.stringify({ id: '123' })
      ])

      const github = {
        context: {
          repo: {
            owner: 'owner',
            repo: 'repo'
          }
        },
        getOctokit: () => {
          return {
            ...octokit,
            rest: {
              issues: {
                listLabelsForRepo: listLabelsForRepoStub,
                createLabel: createLabelStub,
                get: () => {
                  return {
                    data: {
                      html_url: 'https://github.com/owner/repo/issues/1',
                      state: 'open'
                    },
                    status: 200
                  }
                },
                update: () => {
                  return {
                    data: {},
                    status: 200
                  }
                },
                addLabels: addLabelsStub
              }
            }
          }
        }
      } as unknown as GitHub

      stubGraphql(MOCK_REFERENCED_CLOSED_ISSUES, MOCK_PROJECT_INFO)

      const core = {
        getInput,
        setFailed,
        info
      } as unknown as Core

      await run(core, github)

      assert.strictEqual(getExecOutput.mock.callCount(), 3)
      assert.ok(
        info.mock.calls.some(
          call =>
            call.arguments[0] ===
            `\nNot moving issue card. No column name provided.`
        )
      )
    })
  })

  describe('given the required inputs', () => {
    interface GenerateResponsesArgs {
      referencedClosedIssues?: object
      projectInfo?: object
    }

    const generateResponses = ({
      referencedClosedIssues,
      projectInfo
    }: Partial<GenerateResponsesArgs> = {}) => {
      // getProjectBoardID, getProjectBoardFieldList, addIssueToBoard,
      // moveIssueToColumn
      setExecSequence([
        JSON.stringify(MOCK_PROJECT_BOARD_ID),
        JSON.stringify(MOCK_FIELD_LIST),
        JSON.stringify({ id: '123' }),
        JSON.stringify({ id: '123' })
      ])

      const graphql = stubGraphql(
        referencedClosedIssues ?? MOCK_REFERENCED_CLOSED_ISSUES,
        projectInfo ?? MOCK_PROJECT_INFO
      )

      return {
        graphql
      }
    }

    const makeGithub = () =>
      ({
        context: {
          repo: {
            owner: 'owner',
            repo: 'repo'
          }
        },
        getOctokit: () => {
          return {
            ...octokit,
            rest: {
              issues: {
                listLabelsForRepo: listLabelsForRepoStub,
                createLabel: createLabelStub,
                get: () => {
                  return {
                    data: {
                      html_url: 'https://github.com/owner/repo/issues/1',
                      state: 'open'
                    },
                    status: 200
                  }
                },
                update: () => {
                  return {
                    data: {},
                    status: 200
                  }
                },
                addLabels: addLabelsStub
              }
            }
          }
        }
      }) as unknown as GitHub

    it('should move issues to the released column', async () => {
      generateInputs()
      generateResponses()

      const core = {
        getInput,
        setFailed,
        info
      } as unknown as Core

      await run(core, makeGithub())

      assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 1)
      assert.deepStrictEqual(listLabelsForRepoStub.mock.calls[0].arguments[0], {
        repo: ISSUE_REPO,
        owner: ISSUE_OWNER
      })
      assert.strictEqual(createLabelStub.mock.callCount(), 1)
      assert.deepStrictEqual(createLabelStub.mock.calls[0].arguments[0], {
        repo: ISSUE_REPO,
        owner: ISSUE_OWNER,
        name: MOCK_LABEL_NAME,
        color: 'FFFFFF'
      })
      assert.strictEqual(addLabelsStub.mock.callCount(), 1)
      assert.deepStrictEqual(addLabelsStub.mock.calls[0].arguments[0], {
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
          call => call.arguments[0] === `\nSuccessfully moved issue card 123`
        )
      )
    })

    describe('when there are no referenced closed issues', () => {
      it('should not move any issues', async () => {
        generateInputs()
        const { graphql } = generateResponses({
          referencedClosedIssues: {
            repository: {
              pullRequest: {
                closingIssuesReferences: {
                  nodes: []
                }
              }
            }
          }
        })

        const core = {
          getInput,
          setFailed,
          info
        } as unknown as Core

        await run(core, makeGithub())

        assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 0)
        assert.strictEqual(createLabelStub.mock.callCount(), 0)
        assert.strictEqual(addLabelsStub.mock.callCount(), 0)
        assert.strictEqual(setFailed.mock.callCount(), 0)
        assert.ok(
          info.mock.calls.some(
            call =>
              call.arguments[0] === '\nNo issues found for commit, moving on...'
          )
        )
        // Only called once for getting the referenced closed issues
        assert.strictEqual(graphql.mock.callCount(), 1)
      })
    })

    describe('when the project board is not found for an issue', () => {
      it('should not move any issues', async () => {
        generateInputs()
        const { graphql } = generateResponses({
          projectInfo: {
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
          }
        })

        const core = {
          getInput,
          setFailed,
          info
        } as unknown as Core

        await run(core, makeGithub())

        assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 0)
        assert.strictEqual(createLabelStub.mock.callCount(), 0)
        assert.strictEqual(addLabelsStub.mock.callCount(), 0)
        assert.strictEqual(setFailed.mock.callCount(), 0)
        assert.ok(
          info.mock.calls.some(
            call =>
              call.arguments[0] ===
              '\nCould not find the project board "66" for issue 27, moving on...'
          )
        )
        /**
         * Called twice for getting the referenced closed issues and the project info
         */
        assert.strictEqual(graphql.mock.callCount(), 2)
      })
    })

    describe('when the issue is not in the done or dev done column', () => {
      it('should not move any issues', async () => {
        generateInputs()
        const { graphql } = generateResponses({
          projectInfo: {
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
          }
        })

        const core = {
          getInput,
          setFailed,
          info
        } as unknown as Core

        await run(core, makeGithub())

        assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 0)
        assert.strictEqual(createLabelStub.mock.callCount(), 0)
        assert.strictEqual(addLabelsStub.mock.callCount(), 0)
        assert.strictEqual(setFailed.mock.callCount(), 0)
        assert.ok(
          info.mock.calls.some(
            call =>
              call.arguments[0] ===
              '\nIssue 27 is not in the "done" or "dev done" column, moving on...'
          )
        )
        /**
         * Called twice for getting the referenced closed issues and the project info
         */
        assert.strictEqual(graphql.mock.callCount(), 2)
      })
    })

    describe('when the issue is related to another repo than action repo', () => {
      it('should create a new label', async () => {
        generateInputs()

        const { graphql } = generateResponses({
          projectInfo: {
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
        })

        const core = {
          getInput,
          setFailed,
          info
        } as unknown as Core

        await run(core, makeGithub())

        assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 1)
        assert.deepStrictEqual(
          listLabelsForRepoStub.mock.calls[0].arguments[0],
          {
            repo: ISSUE_REPO,
            owner: ISSUE_OWNER
          }
        )
        assert.strictEqual(createLabelStub.mock.callCount(), 1)
        assert.deepStrictEqual(createLabelStub.mock.calls[0].arguments[0], {
          repo: ISSUE_REPO,
          owner: ISSUE_OWNER,
          name: MOCK_LABEL_NAME,
          color: 'FFFFFF'
        })
        assert.strictEqual(addLabelsStub.mock.callCount(), 1)
        assert.deepStrictEqual(addLabelsStub.mock.calls[0].arguments[0], {
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
              `The label "${MOCK_LABEL_NAME}" does not exist for the issue repo ${ISSUE_OWNER}/${ISSUE_REPO}, creating...`
          )
        )
        /**
         * Called twice for getting the referenced closed issues and the project info
         */
        assert.strictEqual(graphql.mock.callCount(), 2)
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
        }

        listLabelsForRepoStub.mock.mockImplementation(() =>
          Promise.resolve({
            data: [MOCK_EXIST_LABEL],
            status: 200
          })
        )

        // getProjectBoardID, getProjectBoardFieldList, addIssueToBoard,
        // moveIssueToColumn
        setExecSequence([
          JSON.stringify(MOCK_PROJECT_BOARD_ID),
          JSON.stringify(MOCK_FIELD_LIST),
          JSON.stringify({ id: '123' }),
          JSON.stringify({ id: '123' })
        ])

        const graphql = stubGraphql(MOCK_REFERENCED_CLOSED_ISSUES, {
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
        })

        const github = {
          context: {
            repo: {
              owner: 'owner',
              repo: 'repo'
            }
          },
          getOctokit: () => {
            return {
              ...octokit,
              rest: {
                issues: {
                  listLabelsForRepo: listLabelsForRepoStub,
                  createLabel: createLabelStub,
                  get: () => {
                    return {
                      data: {
                        html_url: 'https://github.com/owner/repo/issues/1',
                        state: 'open'
                      },
                      status: 200
                    }
                  },
                  update: () => {
                    return {
                      data: {},
                      status: 200
                    }
                  },
                  addLabels: addLabelsStub
                }
              }
            }
          }
        } as unknown as GitHub

        const core = {
          getInput,
          setFailed,
          info
        } as unknown as Core

        await run(core, github)

        assert.strictEqual(listLabelsForRepoStub.mock.callCount(), 1)
        assert.deepStrictEqual(
          listLabelsForRepoStub.mock.calls[0].arguments[0],
          {
            repo: ISSUE_REPO,
            owner: ISSUE_OWNER
          }
        )
        assert.strictEqual(createLabelStub.mock.callCount(), 0)
        assert.strictEqual(addLabelsStub.mock.callCount(), 1)
        assert.deepStrictEqual(addLabelsStub.mock.calls[0].arguments[0], {
          repo: ISSUE_REPO,
          owner: ISSUE_OWNER,
          issue_number:
            MOCK_REFERENCED_CLOSED_ISSUES.repository.pullRequest
              .closingIssuesReferences.nodes[0].number,
          labels: [MOCK_LABEL_NAME]
        })
        assert.strictEqual(setFailed.mock.callCount(), 0)
        /**
         * Called twice for getting the referenced closed issues and the project info
         */
        assert.strictEqual(graphql.mock.callCount(), 2)
      })
    })
  })
})
