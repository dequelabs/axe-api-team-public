import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import * as exec from '@actions/exec'
import type { Core, Github } from './types'
import type { MoveIssueToColumnArgs } from './moveIssueToColumn'
import run from './run'

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
  let info: sinon.SinonStub
  let getInput: sinon.SinonStub
  let setFailed: sinon.SinonStub
  let getExecOutputStub: sinon.SinonStub

  const github = {
    context: {
      repo: {
        owner: 'owner',
        repo: 'repo'
      }
    }
  } as unknown as Github

  beforeEach(() => {
    info = sinon.stub()
    getInput = sinon.stub()
    setFailed = sinon.stub()
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(sinon.restore)

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

    getInput.withArgs('project-number').returns(projectNumber)
    getInput.withArgs('issue-urls').returns(issueUrls)
    getInput.withArgs('column-name').returns(columnName)

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

    getExecOutputStub
      .withArgs(projectIDCommand)
      .resolves({ stdout: '{"id": "1"}', stderr: '', exitCode: 0 })
    getExecOutputStub.withArgs(projectFieldListCommand).resolves({
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
    getExecOutputStub
      .withArgs(addIssueToBoardCommand)
      .resolves({ stdout: '{"id": "2"}', stderr: '', exitCode: 0 })
    getExecOutputStub
      .withArgs(moveIssueToColumnCommand)
      .resolves({ stdout: '{"id": "3"}', stderr: '', exitCode: 0 })

    return {
      projectIDCommand,
      projectFieldListCommand,
      addIssueToBoardCommand,
      moveIssueToColumnCommand
    }
  }

  describe('when projectNumber is not a number', () => {
    it('should set failed', async () => {
      getInput.withArgs('project-number').returns('not-a-number')

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as any)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(setFailed.calledWith('`project-number` must be a number'))
    })
  })

  describe('when issueUrls is not provided', () => {
    it('should set failed', async () => {
      getInput.withArgs('issue-urls', { required: true }).throws({
        message: 'Input required and not supplied: issue-urls'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as Github)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith(
          'Error adding issue to project board: Input required and not supplied: issue-urls'
        )
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
        ] = getExecOutputStub.args

        assert.equal(getProjectID, projectIDCommand)
        assert.equal(addIssueToBoard, addIssueToBoardCommand)
        assert.equal(getProjectFieldList, projectFieldListCommand)
        assert.equal(moveIssueToColumn, moveIssueToColumnCommand)
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
        ] = getExecOutputStub.args

        assert.equal(getProjectID, projectIDCommand)
        assert.equal(addIssueToBoard, addIssueToBoardCommand)
        assert.equal(getProjectFieldList, projectFieldListCommand)
        assert.equal(moveIssueToColumn, moveIssueToColumnCommand)
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

        const [[getProjectID], [getProjectFieldList]] = getExecOutputStub.args

        assert.equal(getProjectID, projectIDCommand)
        assert.equal(getProjectFieldList, projectFieldListCommand)
        assert.isTrue(
          setFailed.calledWith(
            `\nColumn ${inputs.columnName} not found in project board ${inputs.projectNumber}`
          )
        )
      })
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
      getExecOutputStub.withArgs(projectIDCommand).resolves({
        stdout: JSON.stringify({ id: 1 }),
        stderr: '',
        exitCode: 0
      })
      getExecOutputStub.withArgs(projectFieldListCommand).resolves({
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

        getExecOutputStub.withArgs(addIssueToBoardCommand).resolves({
          stdout: JSON.stringify({ id: index }),
          stderr: '',
          exitCode: 0
        })

        getExecOutputStub.withArgs(moveIssueToColumnCommand).resolves({
          stdout: JSON.stringify({ id: index }),
          stderr: '',
          exitCode: 0
        })

        addIssueToBoardCommands.push(addIssueToBoardCommand)
        moveIssueToColumnCommands.push(moveIssueToColumnCommand)
      }

      await run(core as unknown as Core, github)

      assert.lengthOf(addIssueToBoardCommands, urlsSplit.length)
      assert.lengthOf(moveIssueToColumnCommands, urlsSplit.length)

      const [
        [getProjectID],
        [getProjectFieldList],
        [addIssueToBoardFirstCall],
        [addIssueToBoardSecondCall],
        [moveIssueToColumnFirstCall],
        [moveIssueToColumnSecondCall]
      ] = getExecOutputStub.args

      assert.equal(getProjectID, projectIDCommand)
      assert.equal(getProjectFieldList, projectFieldListCommand)

      // One call for each issue URL
      assert.equal(addIssueToBoardFirstCall, addIssueToBoardCommands[0])
      assert.equal(addIssueToBoardSecondCall, addIssueToBoardCommands[1])

      assert.equal(moveIssueToColumnFirstCall, moveIssueToColumnCommands[0])
      assert.equal(moveIssueToColumnSecondCall, moveIssueToColumnCommands[1])
    })
  })

  describe('when an error occurred', () => {
    it('should catch the error', async () => {
      getInput.withArgs('issue-urls').throws(new Error('boom'))

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as any)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Error adding issue to project board: boom')
      )
    })
  })
})
