import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Core, GitHub } from './types.ts'
import type { ProjectBoardFieldListResponse } from '../../add-to-board-v1/src/getProjectBoardFieldList.ts'
import type { AddIssueToBoardResponse } from '../../add-to-board-v1/src/addIssueToBoard.ts'
import type { MoveIssueToColumnResponse } from '../../add-to-board-v1/src/moveIssueToColumn.ts'

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
const MOCK_FIELD_LIST: ProjectBoardFieldListResponse = {
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

const getProjectBoardID = mock.fn<
  (args: { projectNumber: number; owner: string }) => Promise<{ id: number }>
>(() => Promise.resolve(MOCK_PROJECT_BOARD_ID))
const getProjectBoardFieldList = mock.fn<
  (args: {
    projectNumber: number
    owner: string
  }) => Promise<ProjectBoardFieldListResponse>
>(() => Promise.resolve(MOCK_FIELD_LIST))
const addIssueToBoard = mock.fn<
  (args: {
    projectNumber: number
    owner: string
    issueUrl: string
  }) => Promise<AddIssueToBoardResponse>
>(() => Promise.resolve(MOCK_ISSUE_ID as unknown as AddIssueToBoardResponse))
const moveIssueToColumn = mock.fn<
  (args: {
    issueCardID: string
    fieldID: string
    fieldColumnID: string
    projectID: number
  }) => Promise<MoveIssueToColumnResponse>
>(() => Promise.resolve(undefined as unknown as MoveIssueToColumnResponse))

mock.module('../../add-to-board-v1/src/getProjectBoardID.ts', {
  defaultExport: getProjectBoardID
})
mock.module('../../add-to-board-v1/src/getProjectBoardFieldList.ts', {
  defaultExport: getProjectBoardFieldList
})
mock.module('../../add-to-board-v1/src/addIssueToBoard.ts', {
  defaultExport: addIssueToBoard
})
mock.module('../../add-to-board-v1/src/moveIssueToColumn.ts', {
  defaultExport: moveIssueToColumn
})

const { default: run } = await import('./run.ts')

const github = {
  context: {
    repo: {
      owner: ISSUE_OWNER,
      repo: ISSUE_REPO
    }
  }
} as unknown as GitHub

interface GenerateInputsArgs {
  issuesUrlList: string[]
  projectNumber: string
  releaseColumn: string
}

describe('run', () => {
  let info: ReturnType<typeof mock.fn>
  let setFailed: ReturnType<typeof mock.fn>
  let inputValues: Record<string, string>
  let inputErrors: Record<string, string>
  let core: Core

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    inputValues['issues-url-list'] = JSON.stringify(
      inputs?.issuesUrlList ?? ISSUES_URLS_MOCK
    )
    inputValues['project-number'] = String(
      inputs?.projectNumber ?? MOCK_PROJECT_BOARD_ID.id
    )
    inputValues['release-column'] =
      inputs?.releaseColumn ?? MOCK_RELEASED_COLUMN_NAME
  }

  beforeEach(() => {
    getProjectBoardID.mock.resetCalls()
    getProjectBoardID.mock.mockImplementation(() =>
      Promise.resolve(MOCK_PROJECT_BOARD_ID)
    )
    getProjectBoardFieldList.mock.resetCalls()
    getProjectBoardFieldList.mock.mockImplementation(() =>
      Promise.resolve(MOCK_FIELD_LIST)
    )
    addIssueToBoard.mock.resetCalls()
    addIssueToBoard.mock.mockImplementation(() =>
      Promise.resolve(MOCK_ISSUE_ID as unknown as AddIssueToBoardResponse)
    )
    moveIssueToColumn.mock.resetCalls()
    moveIssueToColumn.mock.mockImplementation(() =>
      Promise.resolve(undefined as unknown as MoveIssueToColumnResponse)
    )

    info = mock.fn()
    setFailed = mock.fn()
    inputValues = {}
    inputErrors = {}

    const getInput = mock.fn((name: string) => {
      if (inputErrors[name]) {
        throw { message: inputErrors[name] }
      }
      return inputValues[name] ?? ''
    })

    core = {
      getInput,
      info,
      setFailed
    } as unknown as Core
  })

  describe('when the `issues-url-list` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: issues-url-list'

      inputErrors['issues-url-list'] = errorMessage

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })
  })

  describe('when the `project-number` input', () => {
    it('is not provided throws an error', async () => {
      const errorMessage = 'Input required and not supplied: project-number'

      inputValues['issues-url-list'] = JSON.stringify(ISSUES_URLS_MOCK)
      inputErrors['project-number'] = errorMessage

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })

    it('is not a number throws an error', async () => {
      inputValues['issues-url-list'] = JSON.stringify(ISSUES_URLS_MOCK)
      inputValues['project-number'] = 'abc'
      inputValues['release-column'] = MOCK_RELEASED_COLUMN_NAME

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        '`project-number` must be a number'
      )
    })
  })

  describe('when the `release-column` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: release-column'

      inputValues['issues-url-list'] = JSON.stringify(ISSUES_URLS_MOCK)
      inputValues['project-number'] = String(MOCK_PROJECT_BOARD_ID.id)
      inputErrors['release-column'] = errorMessage

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })
  })

  describe('given the required inputs', () => {
    it('should move issues to the released column', async () => {
      generateInputs()

      await run(core, github)

      assert.strictEqual(getProjectBoardID.mock.callCount(), 1)
      assert.deepStrictEqual(getProjectBoardID.mock.calls[0].arguments[0], {
        projectNumber: MOCK_PROJECT_BOARD_ID.id,
        owner: ISSUE_OWNER
      })
      assert.strictEqual(getProjectBoardFieldList.mock.callCount(), 1)
      assert.deepStrictEqual(
        getProjectBoardFieldList.mock.calls[0].arguments[0],
        {
          projectNumber: MOCK_PROJECT_BOARD_ID.id,
          owner: ISSUE_OWNER
        }
      )
      assert.deepStrictEqual(addIssueToBoard.mock.calls[0].arguments[0], {
        projectNumber: MOCK_PROJECT_BOARD_ID.id,
        owner: ISSUE_OWNER,
        issueUrl: ISSUES_URLS_MOCK[0]
      })
      assert.deepStrictEqual(addIssueToBoard.mock.calls[1].arguments[0], {
        projectNumber: MOCK_PROJECT_BOARD_ID.id,
        owner: ISSUE_OWNER,
        issueUrl: ISSUES_URLS_MOCK[1]
      })
      assert.deepStrictEqual(moveIssueToColumn.mock.calls[0].arguments[0], {
        issueCardID: MOCK_ISSUE_ID.id,
        fieldID: MOCK_FIELD_LIST.fields[0].id,
        fieldColumnID: MOCK_FIELD_LIST.fields[0].options[0].id,
        projectID: MOCK_PROJECT_BOARD_ID.id
      })
      assert.ok(
        info.mock.calls.some(
          call =>
            call.arguments[0] ===
            `\nSuccessfully moved issue card ${MOCK_ISSUE_ID.id}`
        )
      )
      assert.strictEqual(setFailed.mock.callCount(), 0)
    })

    it('and released column is not fount should throw an error', async () => {
      const releaseColumn = 'notValidColumnName'

      generateInputs({ releaseColumn })

      await run(core, github)

      assert.strictEqual(getProjectBoardID.mock.callCount(), 1)
      assert.deepStrictEqual(getProjectBoardID.mock.calls[0].arguments[0], {
        projectNumber: MOCK_PROJECT_BOARD_ID.id,
        owner: ISSUE_OWNER
      })
      assert.strictEqual(getProjectBoardFieldList.mock.callCount(), 1)
      assert.deepStrictEqual(
        getProjectBoardFieldList.mock.calls[0].arguments[0],
        {
          projectNumber: MOCK_PROJECT_BOARD_ID.id,
          owner: ISSUE_OWNER
        }
      )
      assert.strictEqual(addIssueToBoard.mock.callCount(), 0)
      assert.strictEqual(moveIssueToColumn.mock.callCount(), 0)
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        `\nThe column "${releaseColumn}" is not found in the project board "${MOCK_PROJECT_BOARD_ID.id}"`
      )
    })
  })
})
