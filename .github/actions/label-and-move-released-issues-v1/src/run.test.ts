import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import { getOctokit } from '@actions/github'
import type { Endpoints } from '@octokit/types'
import * as exec from '@actions/exec'
import { Core, GitHub } from './types'
import type { ParsedCommitList } from '../../generate-commit-list-v1/src/types'
import run from './run'

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

const MOCK_CREATED_LABEL = {
  id: 208045946,
  node_id: 'MDU6TGFiZWwyMDgwNDU5NDY=',
  url: 'https://api.github.com/repos/octocat/Hello-World/labels/version%3A%201.0.0',
  name: 'VERSION: 1.0.0',
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

const MOCK_REFERENCED_CLOSED_ISSUES = {
  repository: {
    pullRequest: {
      closingIssuesReferences: {
        nodes: [
          {
            number: 27
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
  let info: sinon.SinonStub
  let getInput: sinon.SinonStub
  let setFailed: sinon.SinonStub
  let getExecOutput: sinon.SinonStub

  const octokit = getOctokit('token')

  beforeEach(() => {
    info = sinon.stub()
    getInput = sinon.stub()
    setFailed = sinon.stub()
    getExecOutput = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(sinon.restore)

  interface GenerateInputsArgs {
    commitList?: ParsedCommitList[]
    version?: string
    token?: string
    projectNumber?: string
  }

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    const commitList = getInput
      .withArgs('commit-list', { required: true })
      .returns(JSON.stringify(inputs?.commitList ?? MOCK_COMMIT_LIST))
    const version = getInput
      .withArgs('version', { required: true })
      .returns(inputs?.version ?? '1.0.0')
    const token = getInput
      .withArgs('token', { required: true })
      .returns(inputs?.token ?? 'token')
    const projectNumber = getInput
      .withArgs('project-number')
      .returns(inputs?.projectNumber ?? '66')

    return {
      commitList,
      version,
      token,
      projectNumber
    }
  }

  describe('when the `commit-list` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('commit-list', { required: true }).throws({
        message: 'Input required and not supplied: commit-list'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: commit-list')
      )
    })
  })

  describe('when the `version` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('version', { required: true }).throws({
        message: 'Input required and not supplied: version'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: version')
      )
    })
  })

  describe('when the `token` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('token', { required: true }).throws({
        message: 'Input required and not supplied: token'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: token')
      )
    })
  })

  describe('when the `project-number` input is not a number', () => {
    it('throws an error', async () => {
      getInput.withArgs('project-number').returns('abc')

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(setFailed.calledWith('`project-number` must be a number'))
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

      // getProjectBoardID Stub
      getExecOutput.onFirstCall().resolves({
        stdout: JSON.stringify(MOCK_PROJECT_BOARD_ID)
      })
      // getProjectBoardFieldList Stub
      getExecOutput.onSecondCall().resolves({
        stdout: JSON.stringify(MOCK_FIELD_LIST)
      })

      const core = {
        getInput,
        setFailed,
        info
      }

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
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(setFailed.notCalled)
      assert.isTrue(info.calledWith('\nNo PR found for commit, moving on...'))
    })
  })

  describe('when the release column does not exist', () => {
    it('should error', async () => {
      generateInputs()
      // getProjectBoardID Stub
      getExecOutput.onFirstCall().resolves({
        stdout: JSON.stringify(MOCK_PROJECT_BOARD_ID)
      })
      // getProjectBoardFieldList Stub
      getExecOutput.onSecondCall().resolves({
        stdout: JSON.stringify({
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
      })

      const core = {
        getInput,
        setFailed,
        info
      }

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
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith(`\nColumn released not found in project board 66`)
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
      // Quiet awkward to test single cases here (individually tested in add-to-board-v1 withArgs, using onCall here instead)

      // getProjectBoardID Stub
      getExecOutput.onFirstCall().resolves({
        stdout: JSON.stringify(MOCK_PROJECT_BOARD_ID)
      })
      // getProjectBoardFieldList Stub
      getExecOutput.onSecondCall().resolves({
        stdout: JSON.stringify(MOCK_FIELD_LIST)
      })

      // addIssueToBoard Stub
      getExecOutput.onThirdCall().resolves({
        stdout: JSON.stringify({
          id: '123'
        })
      })

      // moveIssueToColumn Stub
      getExecOutput.onCall(3).resolves({
        stdout: JSON.stringify({
          id: '123'
        })
      })

      const graphqlStub = sinon.stub(octokit, 'graphql')

      // getReferencedClosedIssues 1st call
      graphqlStub
        .onFirstCall()
        .resolves(referencedClosedIssues ?? MOCK_REFERENCED_CLOSED_ISSUES)
      // getIssueProjectInfo 1st call
      graphqlStub.onSecondCall().resolves(projectInfo ?? MOCK_PROJECT_INFO)

      return {
        graphqlStub
      }
    }

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
              },
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
              addLabels: () => {
                return {
                  data: {
                    labels: [MOCK_CREATED_LABEL],
                    status: 200
                  }
                } as unknown as Endpoints['POST /repos/{owner}/{repo}/issues/{issue_number}/labels']['response']
              }
            }
          }
        }
      }
    }

    it('should move issues to the released column', async () => {
      generateInputs()
      generateResponses()

      const core = {
        getInput,
        setFailed,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(setFailed.notCalled)
      assert.isTrue(info.calledWith(`\nSuccessfully moved issue card 123`))
    })

    describe('when there are no referenced closed issues', () => {
      it('should not move any issues', async () => {
        generateInputs()
        const { graphqlStub } = generateResponses({
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
        }

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(setFailed.notCalled)
        assert.isTrue(
          info.calledWith('\nNo issues found for commit, moving on...')
        )
        // Only called once for getting the referenced closed issues
        assert.equal(graphqlStub.callCount, 1)
      })
    })

    describe('when the project board is not found for an issue', () => {
      it('should not move any issues', async () => {
        generateInputs()
        const { graphqlStub } = generateResponses({
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
        }

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(setFailed.notCalled)
        assert.isTrue(
          info.calledWith(
            '\nCould not find the project board "66" for issue 27, moving on...'
          )
        )
        /**
         * Called twice for getting the referenced closed issues and the project info
         */
        assert.equal(graphqlStub.callCount, 2)
      })
    })

    describe('when the issue is not in the done or dev done column', () => {
      it('should not move any issues', async () => {
        generateInputs()
        const { graphqlStub } = generateResponses({
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
        }

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(setFailed.notCalled)
        assert.isTrue(
          info.calledWith(
            '\nIssue 27 is not in the "done" or "dev done" column, moving on...'
          )
        )
        /**
         * Called twice for getting the referenced closed issues and the project info
         */
        assert.equal(graphqlStub.callCount, 2)
      })
    })
  })
})
