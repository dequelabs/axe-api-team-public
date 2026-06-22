import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Core, GitHub } from './types'
import type { ProjectItemsResponse } from './getIssuesByProjectAndLabel'

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

// Two project items that pass the real `getIssuesByProjectAndLabel` filter:
// they live in the source column, carry a label matching the prefix and the
// team label. The resulting `IssueResult`s are what `run` moves.
const FIRST_ISSUE_ID = 'PVTI_lADOAD55W84AjfJEzgYHRJo'
const SECOND_ISSUE_ID = 'PVTI_lADOAD55W84AjfJEzgUXO8s'
const buildItem = (id: string, number: number) => ({
  id,
  fieldValues: {
    nodes: [
      {
        field: { id: statusFieldId },
        optionId: sourceColumnId
      }
    ]
  },
  content: {
    id: `content-${number}`,
    number,
    title: `Issue ${number} title`,
    url: `https://github.com/${owner}/repo_name/issues/${number}`,
    repository: {
      name: 'repo_name',
      owner: { login: owner }
    },
    labels: {
      nodes: [{ name: `${label} 1.0.0` }, { name: teamLabelName }]
    }
  }
})
const ISSUES_NODE_MOCK: ProjectItemsResponse = {
  organization: {
    projectV2: {
      items: {
        pageInfo: {
          hasNextPage: false,
          endCursor: 'Y3Vyc29yOnYyOpKqMDAwMDAwOTQuMM4FFzvL'
        },
        nodes: [
          buildItem(FIRST_ISSUE_ID, 1234),
          buildItem(SECOND_ISSUE_ID, 3456)
        ]
      }
    }
  }
}

const getProjectBoardIDMock = mock.fn<(args: unknown) => Promise<unknown>>(
  async () => ({ id: projectBoardId })
)
const getProjectBoardFieldListMock = mock.fn<
  (args: unknown) => Promise<unknown>
>(async () => FIELD_LIST_MOCK)
const moveIssueToColumnMock = mock.fn<(args: unknown) => Promise<unknown>>(
  async () => undefined
)

mock.module('../../add-to-board-v1/src/getProjectBoardID', {
  defaultExport: getProjectBoardIDMock
})
mock.module('../../add-to-board-v1/src/getProjectBoardFieldList', {
  defaultExport: getProjectBoardFieldListMock
})
mock.module('../../add-to-board-v1/src/moveIssueToColumn', {
  defaultExport: moveIssueToColumnMock
})

const { default: run } = await import('./run.ts')

interface GenerateInputsArgs {
  projectNumber?: string | number
  sourceColumn?: string
  targetColumn?: string
  teamLabel?: string
  labelPrefix?: string
  token?: string
}

describe('run', () => {
  let setFailed: ReturnType<typeof mock.fn>
  let info: ReturnType<typeof mock.fn>
  let graphql: ReturnType<typeof mock.fn<() => unknown>>
  let inputValues: Record<string, string | number>
  let inputErrors: Record<string, string>
  let core: Core

  const makeGithub = () => ({
    getOctokit: () => ({ graphql }),
    context: {
      repo: {
        owner: owner
      }
    }
  })

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    inputValues = {
      'project-number': inputs?.projectNumber ?? project,
      'source-column': inputs?.sourceColumn ?? sourceColumnName,
      'target-column': inputs?.targetColumn ?? targetColumnName,
      'team-label': inputs?.teamLabel ?? teamLabelName,
      'label-prefix': inputs?.labelPrefix ?? label,
      token: inputs?.token ?? ghToken
    }
  }

  beforeEach(() => {
    getProjectBoardIDMock.mock.resetCalls()
    getProjectBoardFieldListMock.mock.resetCalls()
    moveIssueToColumnMock.mock.resetCalls()

    getProjectBoardIDMock.mock.mockImplementation(async () => ({
      id: projectBoardId
    }))
    getProjectBoardFieldListMock.mock.mockImplementation(
      async () => FIELD_LIST_MOCK
    )
    moveIssueToColumnMock.mock.mockImplementation(async () => undefined)

    inputValues = {}
    inputErrors = {}

    graphql = mock.fn<() => unknown>(() => ISSUES_NODE_MOCK)
    setFailed = mock.fn()
    info = mock.fn()
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

  describe('when the `project-number` input', () => {
    it('is not provided throws an error', async () => {
      const errorMessage = 'Input required and not supplied: project-number'

      inputErrors['project-number'] = errorMessage

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })

    it('is not a number throws an error', async () => {
      generateInputs({ projectNumber: 'abc' })

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        '`project-number` must be a number'
      )
    })
  })

  describe('when the `target-column` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: target-column'

      generateInputs()
      inputErrors['target-column'] = errorMessage

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })
  })

  describe('when the `label-prefix` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: label-prefix'

      generateInputs()
      inputErrors['label-prefix'] = errorMessage

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })
  })

  describe('when the `token` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: token'

      generateInputs()
      inputErrors['token'] = errorMessage

      await run(core, {} as unknown as GitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
    })
  })

  describe('when target column is not found on the board', () => {
    it('throws an error', async () => {
      const notFoundColumn = 'not-found-column'

      generateInputs({ targetColumn: notFoundColumn })

      await run(core, makeGithub() as unknown as GitHub)

      assert.strictEqual(getProjectBoardIDMock.mock.callCount(), 1)
      assert.deepStrictEqual(getProjectBoardIDMock.mock.calls[0].arguments[0], {
        projectNumber: project,
        owner
      })

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        `\nThe column "${notFoundColumn}" is not found in the project board "${project}"`
      )
    })
  })

  describe('given the required inputs', () => {
    it(`should move all issues to the "${targetColumnName}" column`, async () => {
      generateInputs()

      await run(core, makeGithub() as unknown as GitHub)

      assert.strictEqual(getProjectBoardIDMock.mock.callCount(), 1)
      assert.deepStrictEqual(getProjectBoardIDMock.mock.calls[0].arguments[0], {
        projectNumber: project,
        owner
      })

      assert.strictEqual(getProjectBoardFieldListMock.mock.callCount(), 1)
      assert.deepStrictEqual(
        getProjectBoardFieldListMock.mock.calls[0].arguments[0],
        {
          projectNumber: project,
          owner
        }
      )

      assert.strictEqual(moveIssueToColumnMock.mock.callCount(), 2)
      assert.deepStrictEqual(moveIssueToColumnMock.mock.calls[0].arguments[0], {
        issueCardID: FIRST_ISSUE_ID,
        fieldID: statusFieldId,
        fieldColumnID: targetColumnId,
        projectID: projectBoardId
      })
      assert.deepStrictEqual(moveIssueToColumnMock.mock.calls[1].arguments[0], {
        issueCardID: SECOND_ISSUE_ID,
        fieldID: statusFieldId,
        fieldColumnID: targetColumnId,
        projectID: projectBoardId
      })

      const infoCalledWithFinalMessage = info.mock.calls.some(
        call =>
          call.arguments[0] === `\nAll 2 issues have been moved successfully`
      )
      assert.ok(infoCalledWithFinalMessage)

      assert.strictEqual(setFailed.mock.callCount(), 0)
    })
  })
})
