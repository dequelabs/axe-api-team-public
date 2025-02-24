import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { Core, GitHub } from './types'
import type { default as runType } from './run'

const ISSUE_OWNER = 'issue-owner'
const ISSUE_REPO = 'issue-repo-name'
const ISSUES_URLS_MOCK = [
  'https://github.com/org-name/repo-name/issues/70',
  'https://github.com/org-name/repo-name/issues/71'
]
const MOCK_PROJECT_BOARD_ID = {
  id: 123
}
const MOCK_ISSUE_ID = {
  id: '321'
}
const MOCK_RELEASED_COLUMN_NAME = 'Released'
const MOCK_FIELD_LIST = {
  fields: [
    {
      id: '123',
      name: 'Status',
      type: 'ProjectV2',
      options: [
        {
          id: '456',
          name: MOCK_RELEASED_COLUMN_NAME
        }
      ]
    }
  ],
  totalCount: 1
}

describe('run', () => {
  let core: Core
  let run: typeof runType
  let infoStub: sinon.SinonStub
  let getInputStub: sinon.SinonStub
  let setFailedStub: sinon.SinonStub
  let getProjectBoardIDStub: sinon.SinonStub
  let getProjectBoardFieldListStub: sinon.SinonStub
  let addIssueToBoardStub: sinon.SinonStub
  let moveIssueToColumnStub: sinon.SinonStub

  const github = {
    context: {
      repo: {
        owner: ISSUE_OWNER,
        repo: ISSUE_REPO
      }
    }
  }

  interface GenerateInputsArgs {
    issuesUrlList?: string[]
    projectNumber?: string
    releaseColumn?: string
  }

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    const issuesUrlList = getInputStub
      .withArgs('issues-url-list', { required: true })
      .returns(JSON.stringify(inputs?.issuesUrlList ?? ISSUES_URLS_MOCK))
    const projectNumber = getInputStub
      .withArgs('project-number', { required: true })
      .returns(inputs?.projectNumber ?? MOCK_PROJECT_BOARD_ID.id)
    const releaseColumn = getInputStub
      .withArgs('release-column', { required: true })
      .returns(inputs?.releaseColumn ?? MOCK_RELEASED_COLUMN_NAME)

    return {
      issuesUrlList,
      projectNumber,
      releaseColumn
    }
  }

  beforeEach(() => {
    infoStub = sinon.stub()
    getInputStub = sinon.stub()
    setFailedStub = sinon.stub()
    getProjectBoardIDStub = sinon.stub()
    getProjectBoardFieldListStub = sinon.stub()
    addIssueToBoardStub = sinon.stub()
    moveIssueToColumnStub = sinon.stub()

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
      '../../add-to-board-v1/src/addIssueToBoard': {
        default: addIssueToBoardStub,
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

  afterEach(() => {
    sinon.restore()
  })

  describe('when the `issues-url-list` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: issues-url-list'

      getInputStub.withArgs('issues-url-list', { required: true }).throws({
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

  describe('when the `release-column` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: release-column'

      getInputStub.withArgs('release-column', { required: true }).throws({
        message: errorMessage
      })

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailedStub.calledOnceWith(errorMessage))
    })
  })

  describe('given the required inputs', () => {
    it('should move issues to the released column', async () => {
      getProjectBoardIDStub.resolves(MOCK_PROJECT_BOARD_ID)
      getProjectBoardFieldListStub.resolves(MOCK_FIELD_LIST)
      addIssueToBoardStub.resolves(MOCK_ISSUE_ID)
      moveIssueToColumnStub.resolves()
      generateInputs()

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(
        getProjectBoardIDStub.calledOnceWithExactly({
          projectNumber: MOCK_PROJECT_BOARD_ID.id,
          owner: ISSUE_OWNER
        })
      )
      assert.isTrue(
        getProjectBoardFieldListStub.calledOnceWithExactly({
          projectNumber: MOCK_PROJECT_BOARD_ID.id,
          owner: ISSUE_OWNER
        })
      )
      assert.isTrue(
        addIssueToBoardStub.getCall(0).calledWithExactly({
          projectNumber: MOCK_PROJECT_BOARD_ID.id,
          owner: ISSUE_OWNER,
          issueUrl: ISSUES_URLS_MOCK[0]
        })
      )
      assert.isTrue(
        addIssueToBoardStub.getCall(1).calledWithExactly({
          projectNumber: MOCK_PROJECT_BOARD_ID.id,
          owner: ISSUE_OWNER,
          issueUrl: ISSUES_URLS_MOCK[1]
        })
      )
      assert.isTrue(
        moveIssueToColumnStub.getCall(0).calledWithExactly({
          issueCardID: MOCK_ISSUE_ID.id,
          fieldID: MOCK_FIELD_LIST.fields[0].id,
          fieldColumnID: MOCK_FIELD_LIST.fields[0].options[0].id,
          projectID: MOCK_PROJECT_BOARD_ID.id
        })
      )
      assert.isTrue(
        infoStub.calledWith(
          `\nSuccessfully moved issue card ${MOCK_ISSUE_ID.id}`
        )
      )
      assert.isTrue(setFailedStub.notCalled)
    })

    it('and released column is not fount should throw an error', async () => {
      const releaseColumn = 'notValidColumnName'

      getProjectBoardIDStub.resolves(MOCK_PROJECT_BOARD_ID)
      getProjectBoardFieldListStub.resolves(MOCK_FIELD_LIST)
      addIssueToBoardStub.resolves(MOCK_ISSUE_ID)
      moveIssueToColumnStub.resolves()
      generateInputs({ releaseColumn })

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(
        getProjectBoardIDStub.calledOnceWithExactly({
          projectNumber: MOCK_PROJECT_BOARD_ID.id,
          owner: ISSUE_OWNER
        })
      )
      assert.isTrue(
        getProjectBoardFieldListStub.calledOnceWithExactly({
          projectNumber: MOCK_PROJECT_BOARD_ID.id,
          owner: ISSUE_OWNER
        })
      )
      assert.isTrue(addIssueToBoardStub.notCalled)
      assert.isTrue(moveIssueToColumnStub.notCalled)
      assert.isTrue(
        setFailedStub.calledOnceWith(
          `\nThe column "${releaseColumn}" is not found in the project board "${MOCK_PROJECT_BOARD_ID.id}"`
        )
      )
    })
  })
})
