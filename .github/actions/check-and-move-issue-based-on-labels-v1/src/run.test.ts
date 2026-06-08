import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import { Core, GitHub } from './types.ts'
import type { GetIssueLabelsResult } from './getIssueLabels.ts'

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

type GraphqlResult = GetIssueLabelsResult
type BoardId = { id: string }

const graphql = mock.fn<() => Promise<GraphqlResult>>(() =>
  Promise.resolve(ISSUES_NODE_MOCK)
)
const getProjectBoardID = mock.fn<() => Promise<BoardId>>(() =>
  Promise.resolve({ id: projectBoardId })
)
const getProjectBoardFieldList = mock.fn<() => Promise<typeof FIELD_LIST_MOCK>>(
  () => Promise.resolve(FIELD_LIST_MOCK)
)
const moveIssueToColumn = mock.fn<() => Promise<void>>(() => Promise.resolve())

mock.module('../../add-to-board-v1/src/getProjectBoardID.ts', {
  defaultExport: getProjectBoardID
})
mock.module('../../add-to-board-v1/src/getProjectBoardFieldList.ts', {
  defaultExport: getProjectBoardFieldList
})
mock.module('../../add-to-board-v1/src/moveIssueToColumn.ts', {
  defaultExport: moveIssueToColumn
})

const { default: run } = await import('./run.ts')

interface GenerateInputsArgs {
  token?: string
  projectNumber?: string
  targetColumn?: string
  issueNumber?: string
  issueOrganization?: string
  issueRepo?: string
  teamLabel?: string
  labelPrefixesToMatch?: string
  needMatchFromEachLabelPrefix?: string
  labelPrefixesToExclude?: string
  needExcludeFromEachLabelPrefix?: string
}

describe('run', () => {
  let getInput: ReturnType<typeof mock.fn>
  let info: ReturnType<typeof mock.fn>
  let setFailed: ReturnType<typeof mock.fn>
  let setOutput: ReturnType<typeof mock.fn>
  let core: Core
  let github: GitHub

  // Per-test input values and "throw" overrides.
  let inputValues: Partial<Record<string, unknown>>
  let inputThrows: Partial<Record<string, Error>>

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    inputValues = {
      token: inputs?.token ?? ghToken,
      'project-number': inputs?.projectNumber ?? project,
      'target-column': inputs?.targetColumn ?? targetColumnName,
      'issue-number': inputs?.issueNumber ?? issue,
      'issue-organization': inputs?.issueOrganization ?? owner,
      'issue-repo': inputs?.issueRepo ?? repo,
      'team-label': inputs?.teamLabel ?? teamLabelName,
      'label-prefixes-to-match': inputs?.labelPrefixesToMatch,
      'need-match-from-each-label-prefix':
        inputs?.needMatchFromEachLabelPrefix ?? false,
      'label-prefixes-to-exclude': inputs?.labelPrefixesToExclude,
      'need-exclude-from-each-label-prefix':
        inputs?.needExcludeFromEachLabelPrefix ?? false
    }
  }

  // Helper to assert a mock.fn was called exactly once with the given args.
  const calledOnceWith = (
    fn: ReturnType<typeof mock.fn>,
    ...expected: unknown[]
  ) => {
    assert.strictEqual(fn.mock.callCount(), 1)
    assert.deepStrictEqual(fn.mock.calls[0].arguments, expected)
  }

  // Helper to assert a mock.fn was called (at least once) with the given args.
  const calledWith = (
    fn: ReturnType<typeof mock.fn>,
    ...expected: unknown[]
  ): boolean =>
    fn.mock.calls.some(call => {
      try {
        assert.deepStrictEqual(call.arguments, expected)
        return true
      } catch {
        return false
      }
    })

  beforeEach(() => {
    inputValues = {}
    inputThrows = {}

    getInput = mock.fn((name: string) => {
      if (inputThrows[name]) {
        throw inputThrows[name]
      }
      return inputValues[name] as unknown
    })
    info = mock.fn()
    setFailed = mock.fn()
    setOutput = mock.fn()

    core = {
      getInput,
      info,
      setFailed,
      setOutput
    } as unknown as Core

    github = {
      getOctokit: () => ({ graphql })
    } as unknown as GitHub

    graphql.mock.resetCalls()
    graphql.mock.mockImplementation(() => Promise.resolve(ISSUES_NODE_MOCK))
    getProjectBoardID.mock.resetCalls()
    getProjectBoardID.mock.mockImplementation(() =>
      Promise.resolve({ id: projectBoardId })
    )
    getProjectBoardFieldList.mock.resetCalls()
    getProjectBoardFieldList.mock.mockImplementation(() =>
      Promise.resolve(FIELD_LIST_MOCK)
    )
    moveIssueToColumn.mock.resetCalls()
    moveIssueToColumn.mock.mockImplementation(() => Promise.resolve())
  })

  describe('when the `token` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: token'

      inputThrows['token'] = { message: errorMessage } as Error

      await run(core, {} as unknown as GitHub)

      calledOnceWith(setFailed, errorMessage)
    })
  })

  describe('when the `project-number` input', () => {
    it('is not provided throws an error', async () => {
      const errorMessage = 'Input required and not supplied: project-number'

      inputThrows['project-number'] = { message: errorMessage } as Error

      await run(core, {} as unknown as GitHub)

      calledOnceWith(setFailed, errorMessage)
    })

    it('is not a number throws an error', async () => {
      generateInputs()
      inputValues['project-number'] = 'abc'

      await run(core, {} as unknown as GitHub)

      calledOnceWith(setFailed, '`project-number` must be a number')
    })
  })

  describe('when the `target-column` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: target-column'

      inputThrows['target-column'] = { message: errorMessage } as Error

      await run(core, {} as unknown as GitHub)

      calledOnceWith(setFailed, errorMessage)
    })
  })

  describe('when the `issue-organization` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: issue-organization'

      inputThrows['issue-organization'] = { message: errorMessage } as Error

      await run(core, {} as unknown as GitHub)

      calledOnceWith(setFailed, errorMessage)
    })
  })

  describe('when the `issue-repo` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: issue-repo'

      inputThrows['issue-repo'] = { message: errorMessage } as Error

      await run(core, {} as unknown as GitHub)

      calledOnceWith(setFailed, errorMessage)
    })
  })

  describe('when the `issue-number` input', () => {
    it('is not provided throws an error', async () => {
      const errorMessage = 'Input required and not supplied: issue-number'

      inputThrows['issue-number'] = { message: errorMessage } as Error

      await run(core, {} as unknown as GitHub)

      calledOnceWith(setFailed, errorMessage)
    })

    it('is not a number throws an error', async () => {
      generateInputs()
      inputValues['project-number'] = project
      inputValues['issue-number'] = 'abc'

      await run(core, {} as unknown as GitHub)

      calledOnceWith(setFailed, '`issue-number` must be a number')
    })
  })

  describe('when the `team-label` input is not provided', () => {
    it('throws an error', async () => {
      const errorMessage = 'Input required and not supplied: team-label'

      inputThrows['team-label'] = { message: errorMessage } as Error

      await run(core, {} as unknown as GitHub)

      calledOnceWith(setFailed, errorMessage)
    })
  })

  describe('when non of `label-prefixes-to-match` and `label-prefixes-to-match` inputs are provided', () => {
    it('throws an error', async () => {
      generateInputs()
      inputValues['project-number'] = project
      inputValues['issue-number'] = issue

      await run(core, {} as unknown as GitHub)

      calledOnceWith(
        setFailed,
        'One of `label-prefixes-to-match` or `label-prefixes-to-exclude` is required'
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

        graphql.mock.mockImplementation(() =>
          Promise.resolve(ISSUES_NODE_MOCK_NO_ISSUE)
        )
        generateInputs({
          labelPrefixesToMatch: labelPrefixesToMatchString
        })

        await run(core, github)

        calledOnceWith(
          setFailed,
          `The issue "${issueUrl}" is not found in the project board "${project}"`
        )
      })
    })

    describe('when an issue does not have any label', () => {
      it(`throws an error`, async () => {
        const ISSUES_NODE_MOCK_NO_LABELS: GetIssueLabelsResult = JSON.parse(
          JSON.stringify(ISSUES_NODE_MOCK)
        )

        ISSUES_NODE_MOCK_NO_LABELS.repository.issue.labels.nodes = []

        graphql.mock.mockImplementation(() =>
          Promise.resolve(ISSUES_NODE_MOCK_NO_LABELS)
        )
        generateInputs({
          labelPrefixesToMatch: labelPrefixesToMatchString
        })

        await run(core, github)

        calledOnceWith(
          setFailed,
          `The issue "${issueUrl}" does not have any labels`
        )
      })
    })

    describe('when an issue does not have a team label', () => {
      it(`throws an error`, async () => {
        const ISSUES_NODE_MOCK_NO__TEAM_LABEL: GetIssueLabelsResult =
          JSON.parse(JSON.stringify(ISSUES_NODE_MOCK))

        ISSUES_NODE_MOCK_NO__TEAM_LABEL.repository.issue.labels.nodes.shift()

        graphql.mock.mockImplementation(() =>
          Promise.resolve(ISSUES_NODE_MOCK_NO__TEAM_LABEL)
        )
        generateInputs({
          labelPrefixesToMatch: labelPrefixesToMatchString
        })

        await run(core, github)

        assert.ok(
          calledWith(
            info,
            `The issue does not have the team label "${teamLabelName}", stopped the process.`
          )
        )
        calledOnceWith(setOutput, 'is-issue-moved', true)
        assert.strictEqual(setFailed.mock.callCount(), 0)
      })
    })

    describe('when an issue has a team label', () => {
      describe('and an issue has one of the provided labels', () => {
        it(`should be moved to the target column "${targetColumnName}"`, async () => {
          generateInputs({
            labelPrefixesToMatch: labelPrefixesToMatchString
          })

          await run(core, github)

          assert.ok(
            calledWith(
              info,
              `The issue should be moved because it matches at least ONE the labels: "${labelPrefixesToMatchString}"`
            )
          )
          calledOnceWith(getProjectBoardID, {
            projectNumber: project,
            owner
          })
          calledOnceWith(getProjectBoardFieldList, {
            projectNumber: project,
            owner
          })
          calledOnceWith(moveIssueToColumn, {
            issueCardID: issueBoardId,
            fieldID: statusFieldId,
            fieldColumnID: targetColumnId,
            projectID: projectBoardId
          })
          calledOnceWith(setOutput, 'is-issue-moved', true)
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })

      describe('and an issue does not have one of the provided labels', () => {
        it(`should NOT be moved`, async () => {
          const ISSUES_NODE_NOT_MOVE_MOCK: GetIssueLabelsResult = JSON.parse(
            JSON.stringify(ISSUES_NODE_MOCK)
          )

          ISSUES_NODE_NOT_MOVE_MOCK.repository.issue.labels.nodes.splice(1, 2)

          graphql.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_NODE_NOT_MOVE_MOCK)
          )
          generateInputs({
            labelPrefixesToMatch: labelPrefixesToMatchString
          })

          await run(core, github)

          assert.ok(
            calledWith(
              info,
              `The issue should NOT be moved because it does NOT match the conditions`
            )
          )
          assert.strictEqual(getProjectBoardID.mock.callCount(), 0)
          assert.strictEqual(getProjectBoardFieldList.mock.callCount(), 0)
          assert.strictEqual(moveIssueToColumn.mock.callCount(), 0)
          calledOnceWith(setOutput, 'is-issue-moved', false)
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })

      describe('and an issue has all the provided labels', () => {
        it(`should be moved to the target column "${targetColumnName}"`, async () => {
          generateInputs({
            labelPrefixesToMatch: labelPrefixesToMatchString,
            needMatchFromEachLabelPrefix: 'true'
          })

          await run(core, github)

          assert.ok(
            calledWith(
              info,
              `The issue should be moved because it matches ALL the labels: "${labelPrefixesToMatchString}"`
            )
          )
          calledOnceWith(getProjectBoardID, {
            projectNumber: project,
            owner
          })
          calledOnceWith(getProjectBoardFieldList, {
            projectNumber: project,
            owner
          })
          calledOnceWith(moveIssueToColumn, {
            issueCardID: issueBoardId,
            fieldID: statusFieldId,
            fieldColumnID: targetColumnId,
            projectID: projectBoardId
          })
          calledOnceWith(setOutput, 'is-issue-moved', true)
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })

      describe('and an issue does not have all the provided labels', () => {
        it(`should NOT be moved`, async () => {
          const ISSUES_NODE_NOT_MOVE_MOCK: GetIssueLabelsResult = JSON.parse(
            JSON.stringify(ISSUES_NODE_MOCK)
          )

          ISSUES_NODE_NOT_MOVE_MOCK.repository.issue.labels.nodes.pop()

          graphql.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_NODE_NOT_MOVE_MOCK)
          )
          generateInputs({
            labelPrefixesToMatch: labelPrefixesToMatchString,
            needMatchFromEachLabelPrefix: 'true'
          })

          await run(core, github)

          assert.ok(
            calledWith(
              info,
              `The issue should NOT be moved because it does NOT match the conditions`
            )
          )
          assert.strictEqual(getProjectBoardID.mock.callCount(), 0)
          assert.strictEqual(getProjectBoardFieldList.mock.callCount(), 0)
          assert.strictEqual(moveIssueToColumn.mock.callCount(), 0)
          calledOnceWith(setOutput, 'is-issue-moved', false)
          assert.strictEqual(setFailed.mock.callCount(), 0)
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

          graphql.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_NODE_ONE_EXCLUDED_LABEL_MOCK)
          )
          generateInputs({
            labelPrefixesToExclude: labelPrefixesToExcludeString
          })

          await run(core, github)

          assert.ok(
            calledWith(
              info,
              `The issue should be moved because it does NOT match the following labels: "${labelPrefixesToExcludeString.split(',')[1]}"`
            )
          )
          calledOnceWith(getProjectBoardID, {
            projectNumber: project,
            owner
          })
          calledOnceWith(getProjectBoardFieldList, {
            projectNumber: project,
            owner
          })
          calledOnceWith(moveIssueToColumn, {
            issueCardID: issueBoardId,
            fieldID: statusFieldId,
            fieldColumnID: targetColumnId,
            projectID: projectBoardId
          })
          calledOnceWith(setOutput, 'is-issue-moved', true)
          assert.strictEqual(setFailed.mock.callCount(), 0)
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

          graphql.mock.mockImplementation(() =>
            Promise.resolve(ISSUES_NODE_ALL_EXCLUDED_LABEL_MOCK)
          )
          generateInputs({
            labelPrefixesToExclude: labelPrefixesToExcludeString
          })

          await run(core, github)

          assert.ok(
            calledWith(
              info,
              `The issue should NOT be moved because it does NOT match the conditions`
            )
          )
          assert.strictEqual(getProjectBoardID.mock.callCount(), 0)
          assert.strictEqual(getProjectBoardFieldList.mock.callCount(), 0)
          assert.strictEqual(moveIssueToColumn.mock.callCount(), 0)
          calledOnceWith(setOutput, 'is-issue-moved', false)
          assert.strictEqual(setFailed.mock.callCount(), 0)
        })
      })

      describe('and an issue does not have any of the excluded labels', () => {
        it(`should be moved to the target column "${targetColumnName}"`, async () => {
          generateInputs({
            labelPrefixesToExclude: labelPrefixesToExcludeString,
            needExcludeFromEachLabelPrefix: 'true'
          })

          await run(core, github)

          assert.ok(
            calledWith(
              info,
              `The issue should be moved because it does NOT match ALL labels: "${labelPrefixesToExcludeString}"`
            )
          )
          calledOnceWith(getProjectBoardID, {
            projectNumber: project,
            owner
          })
          calledOnceWith(getProjectBoardFieldList, {
            projectNumber: project,
            owner
          })
          calledOnceWith(moveIssueToColumn, {
            issueCardID: issueBoardId,
            fieldID: statusFieldId,
            fieldColumnID: targetColumnId,
            projectID: projectBoardId
          })
          calledOnceWith(setOutput, 'is-issue-moved', true)
          assert.strictEqual(setFailed.mock.callCount(), 0)
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

            graphql.mock.mockImplementation(() =>
              Promise.resolve(ISSUES_NODE_WITH_ONE_EXCLUDED_LABEL_MOCK)
            )
            generateInputs({
              labelPrefixesToMatch: labelPrefixesToMatchString,
              labelPrefixesToExclude: labelPrefixesToExcludeString
            })

            await run(core, github)

            assert.ok(
              calledWith(
                info,
                `The issue should be moved because it does NOT match the following labels: "${labelPrefixesToExcludeString.split(',')[1]}"`
              )
            )
            calledOnceWith(getProjectBoardID, {
              projectNumber: project,
              owner
            })
            calledOnceWith(getProjectBoardFieldList, {
              projectNumber: project,
              owner
            })
            calledOnceWith(moveIssueToColumn, {
              issueCardID: issueBoardId,
              fieldID: statusFieldId,
              fieldColumnID: targetColumnId,
              projectID: projectBoardId
            })
            calledOnceWith(setOutput, 'is-issue-moved', true)
            assert.strictEqual(setFailed.mock.callCount(), 0)
          })
        })
      })
    })

    describe('when target column is not found on the board', () => {
      it('throws an error', async () => {
        const notFoundColumn = 'not-found-column'

        generateInputs({
          labelPrefixesToExclude: labelPrefixesToExcludeString,
          needExcludeFromEachLabelPrefix: 'true',
          targetColumn: notFoundColumn
        })

        await run(core, github)

        calledOnceWith(getProjectBoardID, {
          projectNumber: project,
          owner
        })
        calledOnceWith(getProjectBoardFieldList, {
          projectNumber: project,
          owner
        })
        assert.strictEqual(moveIssueToColumn.mock.callCount(), 0)
        calledOnceWith(
          setFailed,
          `The column "${notFoundColumn}" is not found in the project board "${project}"`
        )
      })
    })
  })
})
