import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { Core, GitHub } from './types'
import type { default as runType } from './run'

const ghToken = 'github token'
const owner = 'owner_name'
const teamLabelName = 'team-name-label'
const label = 'release:'
const project = 123
const projectBoardId = 'PVT_kwDOAD55W84AjfJE'
const statusFieldId = 'PVTSSF_lADOAD55W84AjfJEzgb1044'
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
const ISSUES_MOCK = [
  {
    id: 'PVTI_lADOAD55W84AjfJEzgYHRJo',
    title: 'First issue title',
    number: 1234,
    url: 'https://github.com/owner_name/repo_name/issues/1234',
    repository: { owner: 'owner_name', repo: 'repo_name' }
  },
  {
    id: 'PVTI_lADOAD55W84AjfJEzgUXO8s',
    title: 'Second issue title',
    number: 3456,
    url: 'https://github.com/owner_name/repo_name/issues/3456',
    repository: { owner: 'owner_name', repo: 'repo_name' }
  }
]

describe('run', () => {
  let core: Core
  let run: typeof runType
  let infoStub: sinon.SinonStub
  let getInputStub: sinon.SinonStub
  let setFailedStub: sinon.SinonStub
  let getIssuesByProjectAndLabelStub: sinon.SinonStub
  let moveIssueToColumnStub: sinon.SinonStub
  let getProjectBoardIDStub: sinon.SinonStub
  let getProjectBoardFieldListStub: sinon.SinonStub

  const github = {
    getOctokit: () => ({}),
    context: {
      repo: {
        owner: owner
      }
    }
  }

  interface GenerateInputsArgs {
    projectNumber?: string
    sourceColumn?: string
    targetColumn?: string
    teamLabel?: string
    labelPrefix?: string
    token?: string
  }

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    const projectNumber = getInputStub
      .withArgs('project-number', { required: true })
      .returns(inputs?.projectNumber ?? project)
    const sourceColumn = getInputStub
      .withArgs('source-column', { required: false })
      .returns(inputs?.sourceColumn ?? sourceColumnName)
    const targetColumn = getInputStub
      .withArgs('target-column', { required: true })
      .returns(inputs?.targetColumn ?? targetColumnName)
    const teamLabel = getInputStub
      .withArgs('team-label', { required: false })
      .returns(inputs?.teamLabel ?? teamLabelName)
    const labelPrefix = getInputStub
      .withArgs('label-prefix', { required: true })
      .returns(inputs?.labelPrefix ?? label)
    const token = getInputStub
      .withArgs('token', { required: true })
      .returns(inputs?.token ?? ghToken)

    return {
      projectNumber,
      sourceColumn,
      targetColumn,
      teamLabel,
      labelPrefix,
      token
    }
  }

  beforeEach(() => {
    infoStub = sinon.stub()
    getInputStub = sinon.stub()
    setFailedStub = sinon.stub()
    getIssuesByProjectAndLabelStub = sinon.stub()
    moveIssueToColumnStub = sinon.stub()
    getProjectBoardIDStub = sinon.stub()
    getProjectBoardFieldListStub = sinon.stub()

    core = {
      getInput: getInputStub,
      info: infoStub,
      setFailed: setFailedStub
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
      './getIssuesByProjectAndLabel': {
        default: getIssuesByProjectAndLabelStub,
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

  describe('when the `label-prefix` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: label-prefix'

      getInputStub.withArgs('label-prefix', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWith(errorMessage))
    })
  })

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

  describe('when target column is not found on the board', () => {
    it('throws an error', async () => {
      const notFoundColumn = 'not-found-column'

      getProjectBoardIDStub.resolves({ id: projectBoardId })
      getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
      getIssuesByProjectAndLabelStub.resolves(ISSUES_MOCK)
      moveIssueToColumnStub.resolves()
      generateInputs({ targetColumn: notFoundColumn })

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(
        getProjectBoardIDStub.calledOnceWithExactly({
          projectNumber: project,
          owner
        })
      )

      assert.isTrue(
        setFailedStub.calledOnceWith(
          `\nThe column "${notFoundColumn}" is not found in the project board "${project}"`
        )
      )
    })
  })

  describe('given the required inputs', () => {
    it(`should move all issues to the "${targetColumnName}" column`, async () => {
      getProjectBoardIDStub.resolves({ id: projectBoardId })
      getProjectBoardFieldListStub.resolves(FIELD_LIST_MOCK)
      getIssuesByProjectAndLabelStub.resolves(ISSUES_MOCK)
      moveIssueToColumnStub.resolves()
      generateInputs()

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
      assert.isTrue(
        getIssuesByProjectAndLabelStub.calledOnceWithExactly({
          core,
          owner,
          octokit: {},
          labelPrefix: label,
          projectNumber: project,
          statusFieldId,
          targetColumnId,
          sourceColumnId,
          sourceColumn: sourceColumnName,
          teamLabel: teamLabelName
        })
      )
      assert.isTrue(
        moveIssueToColumnStub.getCall(0).calledWithExactly({
          issueCardID: ISSUES_MOCK[0].id,
          fieldID: statusFieldId,
          fieldColumnID: targetColumnId,
          projectID: projectBoardId
        })
      )
      assert.isTrue(
        moveIssueToColumnStub.getCall(1).calledWithExactly({
          issueCardID: ISSUES_MOCK[1].id,
          fieldID: statusFieldId,
          fieldColumnID: targetColumnId,
          projectID: projectBoardId
        })
      )
      assert.isTrue(
        infoStub.calledWith(
          `\nAll ${ISSUES_MOCK.length} issues have been moved successfully`
        )
      )
      assert.isTrue(setFailedStub.notCalled)
    })
  })
})
