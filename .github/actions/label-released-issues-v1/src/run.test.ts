import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import { getOctokit } from '@actions/github'
import type { Endpoints } from '@octokit/types'
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
const DEFAULT_DONE_COLUMNS = 'done,devDone'

describe('run', () => {
  let info: sinon.SinonStub
  let getInput: sinon.SinonStub
  let setFailed: sinon.SinonStub
  let setOutput: sinon.SinonSpy
  let listLabelsForRepoStub: sinon.SinonStub
  let createLabelStub: sinon.SinonStub
  let addLabelsStub: sinon.SinonStub
  let paginateStub: sinon.SinonStub

  const octokit = getOctokit('token')

  beforeEach(() => {
    info = sinon.stub()
    getInput = sinon.stub()
    setFailed = sinon.stub()
    setOutput = sinon.spy()
    listLabelsForRepoStub = sinon.stub()
    createLabelStub = sinon.stub()
    addLabelsStub = sinon.stub()
    paginateStub = sinon.stub()
  })

  afterEach(() => {
    sinon.restore()
  })

  interface GenerateInputsArgs {
    commitList?: ParsedCommitList[]
    labelTag?: string
    token?: string
    projectNumber?: string
    boardDoneColumnsString?: string
  }

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    const commitList = getInput
      .withArgs('commit-list', { required: true })
      .returns(JSON.stringify(inputs?.commitList ?? MOCK_COMMIT_LIST))
    const labelTag = getInput
      .withArgs('label-tag', { required: true })
      .returns(inputs?.labelTag ?? 'v1.0.0')
    const token = getInput
      .withArgs('token', { required: true })
      .returns(inputs?.token ?? 'token')
    const projectNumber = getInput
      .withArgs('project-number', { required: true })
      .returns(inputs?.projectNumber ?? '66')
    const boardDoneColumnsString = getInput
      .withArgs('done-columns')
      .returns(inputs?.boardDoneColumnsString ?? DEFAULT_DONE_COLUMNS)

    return {
      commitList,
      labelTag,
      token,
      projectNumber,
      boardDoneColumnsString
    }
  }

  describe('when the `commit-list` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('commit-list', { required: true }).throws({
        message: 'Input required and not supplied: commit-list'
      })

      const core = {
        getInput,
        setOutput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(paginateStub.notCalled)
      assert.isTrue(createLabelStub.notCalled)
      assert.isTrue(addLabelsStub.notCalled)
      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: commit-list')
      )
    })
  })

  describe('when the `label-tag` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('label-tag', { required: true }).throws({
        message: 'Input required and not supplied: label-tag'
      })

      const core = {
        getInput,
        setOutput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(paginateStub.notCalled)
      assert.isTrue(createLabelStub.notCalled)
      assert.isTrue(addLabelsStub.notCalled)
      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: label-tag')
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
        setOutput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(paginateStub.notCalled)
      assert.isTrue(createLabelStub.notCalled)
      assert.isTrue(addLabelsStub.notCalled)
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
        setOutput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(paginateStub.notCalled)
      assert.isTrue(createLabelStub.notCalled)
      assert.isTrue(addLabelsStub.notCalled)
      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(setFailed.calledWith('`project-number` must be a number'))
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

      const core = {
        getInput,
        setOutput,
        setFailed,
        info
      }

      const github = {
        context: {
          repo: {
            owner: ISSUE_OWNER,
            repo: ISSUE_REPO
          }
        },
        getOctokit: () => {
          return {
            ...octokit,
            paginate: paginateStub,
            rest: {
              issues: {
                listLabelsForRepo: listLabelsForRepoStub,
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

      paginateStub
        .withArgs(listLabelsForRepoStub, sinon.match.any)
        .resolves([MOCK_LIST_LABELS])

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(paginateStub.notCalled)
      assert.isTrue(createLabelStub.notCalled)
      assert.isTrue(addLabelsStub.notCalled)
      assert.isTrue(setFailed.notCalled)
      assert.isTrue(
        info.calledWith(`\nNo PR found for the commit "123", moving on...`)
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
          owner: ISSUE_OWNER,
          repo: ISSUE_REPO
        }
      },
      getOctokit: () => {
        return {
          ...octokit,
          paginate: paginateStub,
          rest: {
            issues: {
              listLabelsForRepo: listLabelsForRepoStub,
              createLabel: createLabelStub.resolves({
                data: MOCK_CREATED_LABEL
              } as unknown as Endpoints['POST /repos/{owner}/{repo}/labels']['response']),
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
              addLabels: addLabelsStub.resolves({
                data: {
                  labels: [MOCK_CREATED_LABEL],
                  status: 200
                }
              } as unknown as Endpoints['POST /repos/{owner}/{repo}/issues/{issue_number}/labels']['response'])
            }
          }
        }
      }
    }

    it('should create a new label and set output with the issue URLs', async () => {
      generateInputs()
      generateResponses()

      const core = {
        getInput,
        setOutput,
        setFailed,
        info
      }
      paginateStub
        .withArgs(listLabelsForRepoStub, sinon.match.any)
        .resolves([MOCK_LIST_LABELS])

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(paginateStub.calledOnce)
      assert.deepEqual(paginateStub.args[0][1], {
        owner: ISSUE_OWNER,
        repo: ISSUE_REPO,
        per_page: 100
      })
      assert.isTrue(
        createLabelStub.calledOnceWithExactly({
          repo: ISSUE_REPO,
          owner: ISSUE_OWNER,
          name: MOCK_LABEL_NAME,
          color: 'FFFFFF'
        })
      )
      assert.isTrue(
        addLabelsStub.calledOnceWithExactly({
          repo: ISSUE_REPO,
          owner: ISSUE_OWNER,
          issue_number:
            MOCK_REFERENCED_CLOSED_ISSUES.repository.pullRequest
              .closingIssuesReferences.nodes[0].number,
          labels: [MOCK_LABEL_NAME]
        })
      )
      assert.isTrue(setFailed.notCalled)
      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(setOutput.calledWith('issue-urls'))

      const output = setOutput.args[0][1]
      assert.deepEqual(JSON.parse(output), [
        'https://github.com/owner/repo/issues/1'
      ])

      assert.isTrue(
        info.calledWith(
          `\n~~~ All issues have been successfully closed and labeled with "${MOCK_LABEL_NAME}" ~~~`
        )
      )
    })

    describe('when there are no referenced closed issues', () => {
      it('should not label any issues', async () => {
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
          setOutput,
          setFailed,
          info
        }

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(paginateStub.notCalled)
        assert.isTrue(createLabelStub.notCalled)
        assert.isTrue(addLabelsStub.notCalled)
        assert.isTrue(setFailed.notCalled)
        assert.isTrue(
          info.calledWith(
            `\nNo issues found for the commit "123", moving on...`
          )
        )
        // Only called once for getting the referenced closed issues
        assert.equal(graphqlStub.callCount, 1)
      })
    })

    describe('when the project board is not found for an issue', () => {
      it('should not label an issue', async () => {
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
          setOutput,
          setFailed,
          info
        }
        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(paginateStub.notCalled)
        assert.isTrue(createLabelStub.notCalled)
        assert.isTrue(addLabelsStub.notCalled)
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

    describe('when the issue is not in one of the provided columns', () => {
      it('should not label an issue', async () => {
        const boardDoneColumnsString = 'done'

        generateInputs({ boardDoneColumnsString })

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
          setOutput,
          setFailed,
          info
        }

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(paginateStub.notCalled)
        assert.isTrue(createLabelStub.notCalled)
        assert.isTrue(addLabelsStub.notCalled)
        assert.isTrue(setFailed.notCalled)
        assert.isTrue(
          info.calledWith(
            `\nThe issue 27 is not in one of the "${boardDoneColumnsString}" columns, moving on...`
          )
        )
        /**
         * Called twice for getting the referenced closed issues and the project info
         */
        assert.equal(graphqlStub.callCount, 2)
      })
    })

    describe('when the input property `done-columns` is not provided', () => {
      it('should use default values', async () => {
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
          setOutput,
          setFailed,
          info
        }

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(paginateStub.notCalled)
        assert.isTrue(createLabelStub.notCalled)
        assert.isTrue(addLabelsStub.notCalled)
        assert.isTrue(setFailed.notCalled)
        assert.isTrue(
          info.calledWith(
            `\nThe issue 27 is not in one of the "${DEFAULT_DONE_COLUMNS}" columns, moving on...`
          )
        )
        /**
         * Called twice for getting the referenced closed issues and the project info
         */
        assert.equal(graphqlStub.callCount, 2)
      })
    })

    describe('when the issue is related to another repo than action repo', () => {
      it('should create a new label', async () => {
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
          setOutput,
          setFailed,
          info
        }

        paginateStub
          .withArgs(listLabelsForRepoStub, sinon.match.any)
          .resolves([MOCK_LIST_LABELS])

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(paginateStub.calledOnce)
        assert.deepEqual(paginateStub.args[0][1], {
          owner: ISSUE_OWNER,
          repo: ISSUE_REPO,
          per_page: 100
        })
        assert.isTrue(
          createLabelStub.calledOnceWithExactly({
            repo: ISSUE_REPO,
            owner: ISSUE_OWNER,
            name: MOCK_LABEL_NAME,
            color: 'FFFFFF'
          })
        )
        assert.isTrue(
          addLabelsStub.calledOnceWithExactly({
            repo: ISSUE_REPO,
            owner: ISSUE_OWNER,
            issue_number:
              MOCK_REFERENCED_CLOSED_ISSUES.repository.pullRequest
                .closingIssuesReferences.nodes[0].number,
            labels: [MOCK_LABEL_NAME]
          })
        )
        assert.isTrue(setFailed.notCalled)
        assert.isTrue(
          info.calledWith(
            `\nThe label "${MOCK_LABEL_NAME}" does not exist for the issue repo ${ISSUE_OWNER}/${ISSUE_REPO}, creating...`
          )
        )
        /**
         * Called twice for getting the referenced closed issues and the project info
         */
        assert.equal(graphqlStub.callCount, 2)
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
                        name: 'Done'
                      }
                    }
                  ]
                }
              }
            }
          }
        })

        const github = {
          context: {
            repo: {
              owner: ISSUE_OWNER,
              repo: ISSUE_REPO
            }
          },
          getOctokit: () => {
            return {
              ...octokit,
              paginate: paginateStub,
              rest: {
                issues: {
                  listLabelsForRepo: listLabelsForRepoStub,
                  createLabel: createLabelStub.resolves({
                    data: MOCK_CREATED_LABEL
                  } as unknown as Endpoints['POST /repos/{owner}/{repo}/labels']['response']),
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
                  addLabels: addLabelsStub.resolves({
                    data: {
                      labels: [MOCK_CREATED_LABEL],
                      status: 200
                    }
                  } as unknown as Endpoints['POST /repos/{owner}/{repo}/issues/{issue_number}/labels']['response'])
                }
              }
            }
          }
        }

        const core = {
          getInput,
          setOutput,
          setFailed,
          info
        }

        paginateStub
          .withArgs(listLabelsForRepoStub, sinon.match.any)
          .resolves([MOCK_EXIST_LABEL])

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(paginateStub.calledOnce)
        assert.deepEqual(paginateStub.args[0][1], {
          owner: ISSUE_OWNER,
          repo: ISSUE_REPO,
          per_page: 100
        })
        assert.isTrue(createLabelStub.notCalled)
        assert.isTrue(
          addLabelsStub.calledOnceWithExactly({
            repo: ISSUE_REPO,
            owner: ISSUE_OWNER,
            issue_number:
              MOCK_REFERENCED_CLOSED_ISSUES.repository.pullRequest
                .closingIssuesReferences.nodes[0].number,
            labels: [MOCK_LABEL_NAME]
          })
        )
        assert.isTrue(setFailed.notCalled)
        /**
         * Called twice for getting the referenced closed issues and the project info
         */
        assert.equal(graphqlStub.callCount, 2)
      })
    })
  })
})
