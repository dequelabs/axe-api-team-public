import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Core, Github } from './types'
import type { MoveIssueToColumnArgs } from './moveIssueToColumn'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

// Routing map: command string -> response. Populated per test.
let execResponses: Map<string, ExecOutput>

const getExecOutput = mock.fn<(cmd: string) => Promise<ExecOutput>>(
  (cmd: string) => {
    const response = execResponses.get(cmd)
    if (!response) {
      return Promise.reject(new Error(`Unexpected command: ${cmd}`))
    }
    return Promise.resolve(response)
  }
)
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: run } = await import('./run.ts')

const getProjectIdCommand = (projectNumber?: string) => {
  const projectNumberArg = projectNumber ?? '66'

  return `gh project view ${projectNumberArg} --owner owner --format json`
}

const getAddIssueToBoardCommand = (
  projectNumber?: string,
  issueUrls?: string
) => {
  const projectNumberArg = projectNumber ?? '66'
  const issueUrlsArg = issueUrls ?? 'https://github.com/owner/repo/issues/1'

  return `gh project item-add ${projectNumberArg} --owner owner --url ${issueUrlsArg} --format json`
}

const getProjectFieldListCommand = (projectNumber?: string) => {
  const projectNumberArg = projectNumber ?? '66'

  return `gh project field-list ${projectNumberArg} --owner owner --format json`
}

const getMoveIssueToColumnCommand = ({
  issueCardID,
  fieldID,
  fieldColumnID,
  projectID
}: Partial<MoveIssueToColumnArgs>) => {
  const issueCardIDArg = issueCardID ?? '1'
  const fieldIDArg = fieldID ?? '2'
  const fieldColumnIDArg = fieldColumnID ?? '3'
  const projectIDArg = projectID ?? '4'

  return `gh project item-edit --id ${issueCardIDArg} --field-id ${fieldIDArg} --single-select-option-id ${fieldColumnIDArg} --project-id ${projectIDArg} --format json`
}

describe('run', () => {
  let info: ReturnType<typeof mock.fn>
  let getInput: ReturnType<typeof mock.fn>
  let setFailed: ReturnType<typeof mock.fn>

  const github = {
    context: {
      repo: {
        owner: 'owner',
        repo: 'repo'
      }
    }
  } as unknown as Github

  // simple input store used by the getInput mock
  let inputStore: Record<string, string>

  beforeEach(() => {
    execResponses = new Map()
    inputStore = {}
    getExecOutput.mock.resetCalls()

    info = mock.fn()
    getInput = mock.fn((name: string) => inputStore[name] ?? '')
    setFailed = mock.fn()
  })

  interface GenerateInputArgs {
    projectNumber?: string
    issueUrls?: string
    columnName?: string
  }

  const generatedInputs = (args?: Partial<GenerateInputArgs>) => {
    const projectNumber = args?.projectNumber ?? '1'
    const issueUrls =
      args?.issueUrls ?? 'https://github.com/owner/repo/issues/1'
    const columnName = args?.columnName ?? 'Backlog'

    inputStore['project-number'] = projectNumber
    inputStore['issue-urls'] = issueUrls
    inputStore['column-name'] = columnName

    return {
      projectNumber,
      issueUrls,
      columnName
    }
  }

  const generateExecOutput = (inputs: ReturnType<typeof generatedInputs>) => {
    const projectIDCommand = getProjectIdCommand(inputs.projectNumber)
    const projectFieldListCommand = getProjectFieldListCommand(
      inputs.projectNumber
    )
    const addIssueToBoardCommand = getAddIssueToBoardCommand(
      inputs.projectNumber,
      inputs.issueUrls
    )
    const moveIssueToColumnCommand = getMoveIssueToColumnCommand({
      issueCardID: '2',
      fieldID: 'id-status',
      fieldColumnID: `id-${inputs.columnName}`,
      projectID: '1'
    })

    execResponses.set(projectIDCommand, {
      stdout: '{"id": "1"}',
      stderr: '',
      exitCode: 0
    })
    execResponses.set(projectFieldListCommand, {
      stdout: JSON.stringify({
        fields: [
          {
            id: 'id-status',
            name: 'Status',
            type: 'ProjectV2',
            options: [
              { id: `id-${inputs.columnName}`, name: `${inputs.columnName}` }
            ]
          }
        ],
        totalCount: 1
      }),
      stderr: '',
      exitCode: 0
    })
    execResponses.set(addIssueToBoardCommand, {
      stdout: '{"id": "2"}',
      stderr: '',
      exitCode: 0
    })
    execResponses.set(moveIssueToColumnCommand, {
      stdout: '{"id": "3"}',
      stderr: '',
      exitCode: 0
    })

    return {
      projectIDCommand,
      projectFieldListCommand,
      addIssueToBoardCommand,
      moveIssueToColumnCommand
    }
  }

  describe('when projectNumber is not a number', () => {
    it('should set failed', async () => {
      inputStore['project-number'] = 'not-a-number'

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        '`project-number` must be a number'
      )
    })
  })

  describe('when issueUrls is not provided', () => {
    it('should set failed', async () => {
      getInput.mock.mockImplementation((name: string) => {
        if (name === 'issue-urls') {
          throw new Error('Input required and not supplied: issue-urls')
        }
        return ''
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Error adding issue to project board: Input required and not supplied: issue-urls'
      )
    })
  })

  describe('given a single issue URL', () => {
    describe('and the default column name', () => {
      it('should add the issue to the project board', async () => {
        const inputs = generatedInputs()
        const {
          projectIDCommand,
          projectFieldListCommand,
          addIssueToBoardCommand,
          moveIssueToColumnCommand
        } = generateExecOutput(inputs)

        const core = {
          getInput,
          info
        }

        await run(core as unknown as Core, github)

        const [
          [getProjectID],
          [getProjectFieldList],
          [addIssueToBoard],
          [moveIssueToColumn]
        ] = getExecOutput.mock.calls.map(call => call.arguments)

        assert.strictEqual(getProjectID, projectIDCommand)
        assert.strictEqual(addIssueToBoard, addIssueToBoardCommand)
        assert.strictEqual(getProjectFieldList, projectFieldListCommand)
        assert.strictEqual(moveIssueToColumn, moveIssueToColumnCommand)
      })
    })

    describe('and a custom column name', () => {
      it('should add the issue to the project board', async () => {
        const inputs = generatedInputs({ columnName: 'In progress' })
        const {
          projectIDCommand,
          projectFieldListCommand,
          addIssueToBoardCommand,
          moveIssueToColumnCommand
        } = generateExecOutput(inputs)

        const core = {
          getInput,
          info
        }

        await run(core as unknown as Core, github)

        const [
          [getProjectID],
          [getProjectFieldList],
          [addIssueToBoard],
          [moveIssueToColumn]
        ] = getExecOutput.mock.calls.map(call => call.arguments)

        assert.strictEqual(getProjectID, projectIDCommand)
        assert.strictEqual(addIssueToBoard, addIssueToBoardCommand)
        assert.strictEqual(getProjectFieldList, projectFieldListCommand)
        assert.strictEqual(moveIssueToColumn, moveIssueToColumnCommand)
      })
    })

    describe('and the column name is not found', () => {
      it('should set failed', async () => {
        const inputs = generatedInputs({ columnName: 'Not found' })
        const { projectIDCommand, projectFieldListCommand } =
          generateExecOutput({
            ...inputs,
            columnName: 'Backlog'
          })

        const core = {
          info,
          getInput,
          setFailed
        }

        await run(core as unknown as Core, github)

        const [[getProjectID], [getProjectFieldList]] =
          getExecOutput.mock.calls.map(call => call.arguments)

        assert.strictEqual(getProjectID, projectIDCommand)
        assert.strictEqual(getProjectFieldList, projectFieldListCommand)
        assert.ok(
          setFailed.mock.calls.some(
            call =>
              call.arguments[0] ===
              `\nColumn ${inputs.columnName} not found in project board ${inputs.projectNumber}`
          )
        )
      })
    })
  })

  describe('when the Status field is not found', () => {
    it('should set failed', async () => {
      const inputs = generatedInputs()
      const projectIDCommand = getProjectIdCommand(inputs.projectNumber)
      const projectFieldListCommand = getProjectFieldListCommand(
        inputs.projectNumber
      )

      execResponses.set(projectIDCommand, {
        stdout: '{"id": "1"}',
        stderr: '',
        exitCode: 0
      })
      execResponses.set(projectFieldListCommand, {
        stdout: JSON.stringify({
          fields: [
            {
              id: 'id-assignees',
              name: 'Assignees',
              type: 'ProjectV2',
              options: []
            }
          ],
          totalCount: 1
        }),
        stderr: '',
        exitCode: 0
      })

      const core = {
        info,
        getInput,
        setFailed
      }

      await run(core as unknown as Core, github)

      assert.ok(
        setFailed.mock.calls.some(
          call =>
            call.arguments[0] ===
            `\nStatus field not found in project board ${inputs.projectNumber}`
        )
      )
    })
  })

  describe('given multiple issue URLs', () => {
    it('should add the issues to the project board', async () => {
      const urls =
        'https://github.com/owner/repo/issues/1,https://github.com/owner/repo/issues/2'

      const inputs = generatedInputs({
        issueUrls: urls
      })

      const core = {
        getInput,
        info
      }
      const projectIDCommand = getProjectIdCommand(inputs.projectNumber)
      const projectFieldListCommand = getProjectFieldListCommand(
        inputs.projectNumber
      )
      execResponses.set(projectIDCommand, {
        stdout: JSON.stringify({ id: 1 }),
        stderr: '',
        exitCode: 0
      })
      execResponses.set(projectFieldListCommand, {
        stdout: JSON.stringify({
          fields: [
            {
              id: 'id-status',
              name: 'Status',
              type: 'ProjectV2',
              options: [
                {
                  id: `id-${inputs.columnName}`,
                  name: `${inputs.columnName}`
                }
              ]
            }
          ],
          totalCount: 1
        }),
        stderr: '',
        exitCode: 0
      })

      const addIssueToBoardCommands: string[] = []
      const moveIssueToColumnCommands: string[] = []
      const urlsSplit = urls.split(',')
      for (const [index, url] of urlsSplit.entries()) {
        const addIssueToBoardCommand = getAddIssueToBoardCommand(
          inputs.projectNumber,
          url
        )
        const moveIssueToColumnCommand = getMoveIssueToColumnCommand({
          issueCardID: `${index}`,
          fieldID: 'id-status',
          fieldColumnID: `id-${inputs.columnName}`,
          projectID: '1'
        })

        execResponses.set(addIssueToBoardCommand, {
          stdout: JSON.stringify({ id: index }),
          stderr: '',
          exitCode: 0
        })

        execResponses.set(moveIssueToColumnCommand, {
          stdout: JSON.stringify({ id: index }),
          stderr: '',
          exitCode: 0
        })

        addIssueToBoardCommands.push(addIssueToBoardCommand)
        moveIssueToColumnCommands.push(moveIssueToColumnCommand)
      }

      await run(core as unknown as Core, github)

      assert.strictEqual(addIssueToBoardCommands.length, urlsSplit.length)
      assert.strictEqual(moveIssueToColumnCommands.length, urlsSplit.length)

      const [
        [getProjectID],
        [getProjectFieldList],
        [addIssueToBoardFirstCall],
        [addIssueToBoardSecondCall],
        [moveIssueToColumnFirstCall],
        [moveIssueToColumnSecondCall]
      ] = getExecOutput.mock.calls.map(call => call.arguments)

      assert.strictEqual(getProjectID, projectIDCommand)
      assert.strictEqual(getProjectFieldList, projectFieldListCommand)

      // One call for each issue URL
      assert.strictEqual(addIssueToBoardFirstCall, addIssueToBoardCommands[0])
      assert.strictEqual(addIssueToBoardSecondCall, addIssueToBoardCommands[1])

      assert.strictEqual(
        moveIssueToColumnFirstCall,
        moveIssueToColumnCommands[0]
      )
      assert.strictEqual(
        moveIssueToColumnSecondCall,
        moveIssueToColumnCommands[1]
      )
    })
  })

  describe('when an error occurred', () => {
    it('should catch the error', async () => {
      getInput.mock.mockImplementation((name: string) => {
        if (name === 'issue-urls') {
          throw new Error('boom')
        }
        return ''
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Error adding issue to project board: boom'
      )
    })
  })
})
