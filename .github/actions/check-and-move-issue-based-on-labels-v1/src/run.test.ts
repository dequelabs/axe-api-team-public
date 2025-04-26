import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { Core, GitHub } from './types'
import type { default as runType } from './run'
import type { GetIssueLabelsResult } from './getIssueLabels'

const ghToken = 'github token'
const owner = 'owner_name'
const repo = 'repo_name'
const teamLabelName = 'team-name-label'
const project = 123
const issue = 70
const labelPrefixesToMatchString = 'first-label,second-label'
const labelPrefixesToExcludeString =
  'first-excluded-label,second-excluded-label'
const projectBoardId = 'PVT_kwDOAD55W84AjfJE'
const statusFieldId = 'PVTSSF_lADOAD55W84AjfJEzgb1044'
const issueBoardId = 'PVTI_lADOAD55W84AjfJEzgYzmSA'
const targetColumnName = 'released'
const targetColumnId = '2b75f771'
const sourceColumnName = 'done'
const sourceColumnId = '815769d5'
const FIELD_LIST_MOCK = {
  fields: [
    {
      id: statusFieldId,
      name: 'Status',
      type: 'ProjectV2',
      options: [
        {
          id: targetColumnId,
          name: targetColumnName
        },
        {
          id: sourceColumnId,
          name: sourceColumnName
        }
      ]
    }
  ],
  totalCount: 1
}
const ISSUES_NODE_MOCK: GetIssueLabelsResult = {
  repository: {
    issue: {
      id: 'I_kwDOLYvJE86pLaF5',
      number: issue,
      url: `https://github.com/${owner}/${repo}/issues/${issue}`,
      labels: {
        nodes: [
          {
            name: teamLabelName
          },
          {
            name: labelPrefixesToMatchString.split(',')[0]
          },
          {
            name: labelPrefixesToMatchString.split(',')[1]
          }
        ]
      },
      projectItems: {
        nodes: [
          {
            id: issueBoardId,
            project: {
              number: project
            }
          },
          {
            id: 'another-board-id',
            project: {
              number: 111
            }
          }
        ]
      }
    }
  }
}
const issueUrl = ISSUES_NODE_MOCK.repository.issue.url

describe('run', () => {
  let core: Core
  let run: typeof runType
  let infoStub: sinon.SinonStub
  let getInputStub: sinon.SinonStub
  let setFailedStub: sinon.SinonStub
  let setOutputStub: sinon.SinonStub
  let moveIssueToColumnStub: sinon.SinonStub
  let getProjectBoardIDStub: sinon.SinonStub
  let getProjectBoardFieldListStub: sinon.SinonStub
  let graphqlStub: sinon.SinonStub
  let github: object

  interface GenerateInputsArgs {
    token?: string
    projectNumber?: string
    targetColumn?: string
    issueNumber?: string
    issueOwner?: string
    issueRepo?: string
    teamLabel?: string
    labelPrefixesToMatch?: string
    needMatchFromEachLabelPrefix?: string
    labelPrefixesToExclude?: string
    needExcludeFromEachLabelPrefix?: string
  }

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    const token = getInputStub
      .withArgs('token', { required: true })
      .returns(inputs?.token ?? ghToken)
    const projectNumber = getInputStub
      .withArgs('project-number', { required: true })
      .returns(inputs?.projectNumber ?? project)
    const targetColumn = getInputStub
      .withArgs('target-column', { required: true })
      .returns(inputs?.targetColumn ?? targetColumnName)
    const issueNumber = getInputStub
      .withArgs('issue-number', { required: true })
      .returns(inputs?.issueNumber ?? issue)
    const issueOwner = getInputStub
      .withArgs('issue-owner', { required: true })
      .returns(inputs?.issueOwner ?? owner)
    const issueRepo = getInputStub
      .withArgs('issue-repo', { required: true })
      .returns(inputs?.issueRepo ?? repo)
    const teamLabel = getInputStub
      .withArgs('team-label', { required: true })
      .returns(inputs?.teamLabel ?? teamLabelName)
    const labelPrefixesToMatch = getInputStub
      .withArgs('label-prefixes-to-match', { required: false })
      .returns(inputs?.labelPrefixesToMatch)
    const needMatchFromEachLabelPrefix = getInputStub
      .withArgs('need-match-from-each-label-prefix', { required: false })
      .returns(inputs?.needMatchFromEachLabelPrefix ?? false)
    const labelPrefixesToExclude = getInputStub
      .withArgs('label-prefixes-to-exclude', { required: false })
      .returns(inputs?.labelPrefixesToExclude)
    const needExcludeFromEachLabelPrefix = getInputStub
      .withArgs('need-exclude-from-each-label-prefix', { required: false })
      .returns(inputs?.needExcludeFromEachLabelPrefix ?? false)

    return {
      token,
      projectNumber,
      targetColumn,
      issueNumber,
      issueOwner,
      issueRepo,
      teamLabel,
      labelPrefixesToMatch,
      needMatchFromEachLabelPrefix,
      labelPrefixesToExclude,
      needExcludeFromEachLabelPrefix
    }
  }

  beforeEach(() => {
    infoStub = sinon.stub()
    getInputStub = sinon.stub()
    setFailedStub = sinon.stub()
    setOutputStub = sinon.stub()
    moveIssueToColumnStub = sinon.stub()
    getProjectBoardIDStub = sinon.stub()
    getProjectBoardFieldListStub = sinon.stub()
    graphqlStub = sinon.stub()

    github = {
      getOctokit: () => ({
        graphql: graphqlStub
      })
    }

    core = {
      getInput: getInputStub,
      info: infoStub,
      setFailed: setFailedStub,
      setOutput: setOutputStub
    }
    ;({ default: run } = proxyquire('./run', {
      '../../add-to-board-v1/src/getProjectBoardID': {
        default: getProjectBoardIDStub,
        __esModule: true,
        '@noCallThru': true
      },
      '../../add-to-board-v1/src/getProjectBoardFieldList': {
        default: getProjectBoardFieldListStub,
        __esModule: true,
        '@noCallThru': true
      },
      '../../add-to-board-v1/src/moveIssueToColumn': {
        default: moveIssueToColumnStub,
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

      assert.isTrue(setFailedStub.calledOnceWith(errorMessage))
    })
  })

  describe('when the `project-number` input', () => {
    it('is not provided throws an error', async () => {
      const errorMessage = 'Input required and not supplied: project-number'

      getInputStub.withArgs('project-number', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWith(errorMessage))
    })

    it('is not a number throws an error', async () => {
      getInputStub.withArgs('project-number').returns('abc')

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(
        setFailedStub.calledOnceWith('`project-number` must be a number')
      )
    })
  })

  describe('when the `target-column` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: target-column'

      getInputStub.withArgs('target-column', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWith(errorMessage))
    })
  })

  describe('when the `issue-owner` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: issue-owner'

      getInputStub.withArgs('issue-owner', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWith(errorMessage))
    })
  })

  describe('when the `issue-repo` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: issue-repo'

      getInputStub.withArgs('issue-repo', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWith(errorMessage))
    })
  })

  describe('when the `issue-number` input', () => {
    it('is not provided throws an error', async () => {
      const errorMessage = 'Input required and not supplied: issue-number'

      getInputStub.withArgs('issue-number', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWith(errorMessage))
    })

    it('is not a number throws an error', async () => {
      getInputStub.withArgs('project-number').returns(project)
      getInputStub.withArgs('issue-number').returns('abc')

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(
        setFailedStub.calledOnceWith('`issue-number` must be a number')
      )
    })
  })

  describe('when the `team-label` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: team-label'

      getInputStub.withArgs('team-label', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWith(errorMessage))
    })
  })

  describe('when non of `label-prefixes-to-match` and `label-prefixes-to-match` inputs are provided', () => {
    it('throws an error', async () => {
      getInputStub.withArgs('project-number').returns(project)
      getInputStub.withArgs('issue-number').returns(issue)

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(
        setFailedStub.calledOnceWith(
          'One of `label-prefixes-to-match` or `label-prefixes-to-exclude` is required'
        )
      )
    })
  })

  describe('given the required inputs', () => {
    describe('when an issue is not found in the project board', () => {
      it('throws an error', async () => {
        const ISSUES_NODE_MOCK_NO_ISSUE: GetIssueLabelsResult = JSON.parse(
          JSON.stringify(ISSUES_NODE_MOCK)
        )

        ISSUES_NODE_MOCK_NO_ISSUE.repository.issue.projectItems.nodes.shift()

        graphqlStub.resolves(ISSUES_NODE_MOCK_NO_ISSUE)
        generateInputs({
          labelPrefixesToMatch: labelPrefixesToMatchString
        })

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(
          setFailedStub.calledOnceWith(
            `The issue "${issueUrl}" is not found in the project board "${project}"`
          )
        )
      })
    })

    describe('when an issue does not have any label', () => {
      it(`throws an error`, async () => {
        const ISSUES_NODE_MOCK_NO_LABELS: GetIssueLabelsResult = JSON.parse(
          JSON.stringify(ISSUES_NODE_MOCK)
        )

        ISSUES_NODE_MOCK_NO_LABELS.repository.issue.labels.nodes = []

        graphqlStub.resolves(ISSUES_NODE_MOCK_NO_LABELS)
        generateInputs({
          labelPrefixesToMatch: labelPrefixesToMatchString
        })

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(
          setFailedStub.calledOnceWith(
            `The issue "${issueUrl}" does not have any labels`
          )
        )
      })
    })

    describe('when an issue does not have a team label', () => {
      it(`throws an error`, async () => {
        const ISSUES_NODE_MOCK_NO__TEAM_LABEL: GetIssueLabelsResult =
          JSON.parse(JSON.stringify(ISSUES_NODE_MOCK))

        ISSUES_NODE_MOCK_NO__TEAM_LABEL.repository.issue.labels.nodes.shift()

        graphqlStub.resolves(ISSUES_NODE_MOCK_NO__TEAM_LABEL)
        generateInputs({
          labelPrefixesToMatch: labelPrefixesToMatchString
        })

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(
          infoStub.calledWith(
            `The issue does not have the team label "${teamLabelName}", stopped the process.`
          )
        )
        assert.isTrue(
          setOutputStub.calledOnceWithExactly('is-issue-moved', true)
        )
        assert.isTrue(setFailedStub.notCalled)
      })
    })

    describe('when an issue has a team label', () => {
      describe('and an issue has one of the provided labels', () => {
        it(`should be moved to the target column "${targetColumnName}"`, async () => {
          graphqlStub.resolves(ISSUES_NODE_MOCK)
          getProjectBoardIDStub.resolves({ id: projectBoardId })
          getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
          moveIssueToColumnStub.resolves()
          generateInputs({
            labelPrefixesToMatch: labelPrefixesToMatchString
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            infoStub.calledWith(
              `The issue should be moved because it matches at least ONE the labels: "${labelPrefixesToMatchString}"`
            )
          )
          assert.isTrue(
            getProjectBoardIDStub.calledOnceWithExactly({
              projectNumber: project,
              owner
            })
          )
          assert.isTrue(
            getProjectBoardFieldListStub.calledOnceWithExactly({
              projectNumber: project,
              owner
            })
          )
          assert.isTrue(
            moveIssueToColumnStub.calledOnceWithExactly({
              issueCardID: issueBoardId,
              fieldID: statusFieldId,
              fieldColumnID: targetColumnId,
              projectID: projectBoardId
            })
          )
          assert.isTrue(
            setOutputStub.calledOnceWithExactly('is-issue-moved', true)
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and an issue does not have one of the provided labels', () => {
        it(`should NOT be moved`, async () => {
          const ISSUES_NODE_NOT_MOVE_MOCK: GetIssueLabelsResult = JSON.parse(
            JSON.stringify(ISSUES_NODE_MOCK)
          )

          ISSUES_NODE_NOT_MOVE_MOCK.repository.issue.labels.nodes.splice(1, 2)

          graphqlStub.resolves(ISSUES_NODE_NOT_MOVE_MOCK)
          getProjectBoardIDStub.resolves({ id: projectBoardId })
          getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
          moveIssueToColumnStub.resolves()
          generateInputs({
            labelPrefixesToMatch: labelPrefixesToMatchString
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            infoStub.calledWith(
              `The issue should NOT be moved because it does NOT match the conditions`
            )
          )
          assert.isTrue(getProjectBoardIDStub.notCalled)
          assert.isTrue(getProjectBoardFieldListStub.notCalled)
          assert.isTrue(moveIssueToColumnStub.notCalled)
          assert.isTrue(
            setOutputStub.calledOnceWithExactly('is-issue-moved', false)
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and an issue has all the provided labels', () => {
        it(`should be moved to the target column "${targetColumnName}"`, async () => {
          graphqlStub.resolves(ISSUES_NODE_MOCK)
          getProjectBoardIDStub.resolves({ id: projectBoardId })
          getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
          moveIssueToColumnStub.resolves()
          generateInputs({
            labelPrefixesToMatch: labelPrefixesToMatchString,
            needMatchFromEachLabelPrefix: 'true'
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            infoStub.calledWith(
              `The issue should be moved because it matches ALL the labels: "${labelPrefixesToMatchString}"`
            )
          )
          assert.isTrue(
            getProjectBoardIDStub.calledOnceWithExactly({
              projectNumber: project,
              owner
            })
          )
          assert.isTrue(
            getProjectBoardFieldListStub.calledOnceWithExactly({
              projectNumber: project,
              owner
            })
          )
          assert.isTrue(
            moveIssueToColumnStub.calledOnceWithExactly({
              issueCardID: issueBoardId,
              fieldID: statusFieldId,
              fieldColumnID: targetColumnId,
              projectID: projectBoardId
            })
          )
          assert.isTrue(
            setOutputStub.calledOnceWithExactly('is-issue-moved', true)
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and an issue does not have all the provided labels', () => {
        it(`should NOT be moved`, async () => {
          const ISSUES_NODE_NOT_MOVE_MOCK: GetIssueLabelsResult = JSON.parse(
            JSON.stringify(ISSUES_NODE_MOCK)
          )

          ISSUES_NODE_NOT_MOVE_MOCK.repository.issue.labels.nodes.pop()

          graphqlStub.resolves(ISSUES_NODE_NOT_MOVE_MOCK)
          getProjectBoardIDStub.resolves({ id: projectBoardId })
          getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
          moveIssueToColumnStub.resolves()
          generateInputs({
            labelPrefixesToMatch: labelPrefixesToMatchString,
            needMatchFromEachLabelPrefix: 'true'
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            infoStub.calledWith(
              `The issue should NOT be moved because it does NOT match the conditions`
            )
          )
          assert.isTrue(getProjectBoardIDStub.notCalled)
          assert.isTrue(getProjectBoardFieldListStub.notCalled)
          assert.isTrue(moveIssueToColumnStub.notCalled)
          assert.isTrue(
            setOutputStub.calledOnceWithExactly('is-issue-moved', false)
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and an issue does not have at least one of the excluded labels', () => {
        it(`should be moved to the target column "${targetColumnName}"`, async () => {
          const ISSUES_NODE_ONE_EXCLUDED_LABEL_MOCK: GetIssueLabelsResult =
            JSON.parse(JSON.stringify(ISSUES_NODE_MOCK))

          ISSUES_NODE_ONE_EXCLUDED_LABEL_MOCK.repository.issue.labels.nodes.push(
            {
              name: labelPrefixesToExcludeString.split(',')[0]
            }
          )

          graphqlStub.resolves(ISSUES_NODE_ONE_EXCLUDED_LABEL_MOCK)
          getProjectBoardIDStub.resolves({ id: projectBoardId })
          getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
          moveIssueToColumnStub.resolves()
          generateInputs({
            labelPrefixesToExclude: labelPrefixesToExcludeString
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            infoStub.calledWith(
              `The issue should be moved because it does NOT match the following labels: "${labelPrefixesToExcludeString.split(',')[1]}"`
            )
          )
          assert.isTrue(
            getProjectBoardIDStub.calledOnceWithExactly({
              projectNumber: project,
              owner
            })
          )
          assert.isTrue(
            getProjectBoardFieldListStub.calledOnceWithExactly({
              projectNumber: project,
              owner
            })
          )
          assert.isTrue(
            moveIssueToColumnStub.calledOnceWithExactly({
              issueCardID: issueBoardId,
              fieldID: statusFieldId,
              fieldColumnID: targetColumnId,
              projectID: projectBoardId
            })
          )
          assert.isTrue(
            setOutputStub.calledOnceWithExactly('is-issue-moved', true)
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and an issue has all of the excluded labels', () => {
        it(`should NOT be moved`, async () => {
          const ISSUES_NODE_ALL_EXCLUDED_LABEL_MOCK: GetIssueLabelsResult =
            JSON.parse(JSON.stringify(ISSUES_NODE_MOCK))

          ISSUES_NODE_ALL_EXCLUDED_LABEL_MOCK.repository.issue.labels.nodes.push(
            {
              name: labelPrefixesToExcludeString.split(',')[0]
            },
            {
              name: labelPrefixesToExcludeString.split(',')[1]
            }
          )

          graphqlStub.resolves(ISSUES_NODE_ALL_EXCLUDED_LABEL_MOCK)
          getProjectBoardIDStub.resolves({ id: projectBoardId })
          getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
          moveIssueToColumnStub.resolves()
          generateInputs({
            labelPrefixesToExclude: labelPrefixesToExcludeString
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            infoStub.calledWith(
              `The issue should NOT be moved because it does NOT match the conditions`
            )
          )
          assert.isTrue(getProjectBoardIDStub.notCalled)
          assert.isTrue(getProjectBoardFieldListStub.notCalled)
          assert.isTrue(moveIssueToColumnStub.notCalled)
          assert.isTrue(
            setOutputStub.calledOnceWithExactly('is-issue-moved', false)
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and an issue does not have any of the excluded labels', () => {
        it(`should be moved to the target column "${targetColumnName}"`, async () => {
          graphqlStub.resolves(ISSUES_NODE_MOCK)
          getProjectBoardIDStub.resolves({ id: projectBoardId })
          getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
          moveIssueToColumnStub.resolves()
          generateInputs({
            labelPrefixesToExclude: labelPrefixesToExcludeString,
            needExcludeFromEachLabelPrefix: 'true'
          })

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(
            infoStub.calledWith(
              `The issue should be moved because it does NOT match ALL labels: "${labelPrefixesToExcludeString}"`
            )
          )
          assert.isTrue(
            getProjectBoardIDStub.calledOnceWithExactly({
              projectNumber: project,
              owner
            })
          )
          assert.isTrue(
            getProjectBoardFieldListStub.calledOnceWithExactly({
              projectNumber: project,
              owner
            })
          )
          assert.isTrue(
            moveIssueToColumnStub.calledOnceWithExactly({
              issueCardID: issueBoardId,
              fieldID: statusFieldId,
              fieldColumnID: targetColumnId,
              projectID: projectBoardId
            })
          )
          assert.isTrue(
            setOutputStub.calledOnceWithExactly('is-issue-moved', true)
          )
          assert.isTrue(setFailedStub.notCalled)
        })
      })

      describe('and an issue has one of the provided labels', () => {
        describe('and does not have at least one of the excluded labels', () => {
          it(`should be moved to the target column "${targetColumnName}"`, async () => {
            const ISSUES_NODE_WITH_ONE_EXCLUDED_LABEL_MOCK: GetIssueLabelsResult =
              JSON.parse(JSON.stringify(ISSUES_NODE_MOCK))

            ISSUES_NODE_WITH_ONE_EXCLUDED_LABEL_MOCK.repository.issue.labels.nodes.push(
              {
                name: labelPrefixesToExcludeString.split(',')[0]
              }
            )

            graphqlStub.resolves(ISSUES_NODE_WITH_ONE_EXCLUDED_LABEL_MOCK)
            getProjectBoardIDStub.resolves({ id: projectBoardId })
            getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
            moveIssueToColumnStub.resolves()
            generateInputs({
              labelPrefixesToMatch: labelPrefixesToMatchString,
              labelPrefixesToExclude: labelPrefixesToExcludeString
            })

            await run(core as unknown as Core, github as unknown as GitHub)

            assert.isTrue(
              infoStub.calledWith(
                `The issue should be moved because it does NOT match the following labels: "${labelPrefixesToExcludeString.split(',')[1]}"`
              )
            )
            assert.isTrue(
              getProjectBoardIDStub.calledOnceWithExactly({
                projectNumber: project,
                owner
              })
            )
            assert.isTrue(
              getProjectBoardFieldListStub.calledOnceWithExactly({
                projectNumber: project,
                owner
              })
            )
            assert.isTrue(
              moveIssueToColumnStub.calledOnceWithExactly({
                issueCardID: issueBoardId,
                fieldID: statusFieldId,
                fieldColumnID: targetColumnId,
                projectID: projectBoardId
              })
            )
            assert.isTrue(
              setOutputStub.calledOnceWithExactly('is-issue-moved', true)
            )
            assert.isTrue(setFailedStub.notCalled)
          })
        })
      })
    })

    describe('when target column is not found on the board', () => {
      it('throws an error', async () => {
        const notFoundColumn = 'not-found-column'

        graphqlStub.resolves(ISSUES_NODE_MOCK)
        getProjectBoardIDStub.resolves({ id: projectBoardId })
        getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
        moveIssueToColumnStub.resolves()
        generateInputs({
          labelPrefixesToExclude: labelPrefixesToExcludeString,
          needExcludeFromEachLabelPrefix: 'true',
          targetColumn: notFoundColumn
        })

        await run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(
          getProjectBoardIDStub.calledOnceWithExactly({
            projectNumber: project,
            owner
          })
        )
        assert.isTrue(
          getProjectBoardFieldListStub.calledOnceWithExactly({
            projectNumber: project,
            owner
          })
        )
        assert.isTrue(moveIssueToColumnStub.notCalled)
        assert.isTrue(
          setFailedStub.calledOnceWith(
            `The column "${notFoundColumn}" is not found in the project board "${project}"`
          )
        )
      })
    })
  })
})
