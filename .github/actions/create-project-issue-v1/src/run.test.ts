import 'mocha'
import { assert } from 'chai'
import * as exec from '@actions/exec'
import sinon from 'sinon'
import type { Core, GitHub } from './types'
import run from './run'
import { MOCK_PROJECT_BOARD_ID } from './getProjectBoardID.test'
import { MOCK_ISSUE_ADDED } from './addIssueToBoard.test'
import { MOCK_FIELD_LIST } from './getProjectFieldList.test'
import { MOCK_ISSUE_MOVED } from './moveIssueToColumn.test'
import type { ProjectFieldListResponse } from './getProjectFieldList'

describe('run', () => {
  let setFailed: sinon.SinonSpy
  let setOutput: sinon.SinonStub
  let info: sinon.SinonSpy
  let getInput: sinon.SinonStub
  let getExecOutput: sinon.SinonStub
  let createIssueStub: sinon.SinonStub
  const github = {
    context: {
      repo: {
        owner: 'owner',
        repo: 'repo'
      }
    },
    getOctokit: () => ({
      rest: {
        issues: {
          create: createIssueStub.resolves({
            data: {
              html_url: 'https://deque.bizzy.com',
              node_id: 'issue-id'
            }
          })
        }
      }
    })
  }

  beforeEach(() => {
    setFailed = sinon.spy()
    setOutput = sinon.stub()
    info = sinon.spy()
    getInput = sinon.stub()
    createIssueStub = sinon.stub()
    getExecOutput = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(sinon.restore)

  interface CreateAndMoveIssueStubArgs {
    projectNumber?: string
    owner?: string
    mockFieldList: ProjectFieldListResponse
  }

  const createAndMoveIssueStub = async (
    options?: Partial<CreateAndMoveIssueStubArgs>
  ) => {
    //`getProjectBoardID` stub
    getExecOutput
      .withArgs(
        `gh project view ${options?.projectNumber ?? 66} --owner ${
          options?.owner ?? 'owner'
        } --format json`
      )
      .resolves({
        stdout: JSON.stringify(MOCK_PROJECT_BOARD_ID),
        exitCode: 0
      })

    //`addIssueToBoard` stub
    getExecOutput
      .withArgs(
        `gh project item-add ${options?.projectNumber ?? '66'} --owner ${
          options?.owner ?? 'owner'
        } --url https://deque.bizzy.com --format json`
      )
      .resolves({
        stdout: JSON.stringify(MOCK_ISSUE_ADDED),
        exitCode: 0
      })

    //`getProjectFieldList` stub
    getExecOutput
      .withArgs(
        `gh project field-list ${options?.projectNumber ?? '66'} --owner ${
          options?.owner ?? 'owner'
        } --format json`
      )
      .resolves({
        stdout: options?.mockFieldList
          ? JSON.stringify(options.mockFieldList)
          : JSON.stringify(MOCK_FIELD_LIST),
        exitCode: 0
      })

    const mockId = options?.mockFieldList?.fields[0].options[0].id
    //`moveIssueToColumn` stub
    getExecOutput
      .withArgs(
        `gh project item-edit --id 123 --field-id 123 --single-select-option-id ${
          mockId ?? 456
        } --project-id 123 --format json`
      )
      .resolves({
        stdout: JSON.stringify(MOCK_ISSUE_MOVED),
        exitCode: 0
      })
  }

  interface GenerateInputs {
    github_token?: string
    title?: string
    body?: string
    repository?: string
    labels?: string
    assignees?: string
    project_number?: string
    column_name?: string
  }

  const generateInputs = (options?: Partial<GenerateInputs>) => {
    const token = getInput
      .withArgs('github_token', { required: true })
      .returns(options?.github_token ?? 'token')
    const title = getInput
      .withArgs('title', { required: true })
      .returns(options?.title ?? 'title')
    const body = getInput
      .withArgs('body', { required: true })
      .returns(options?.body ?? 'body')
    const repo = getInput
      .withArgs('repository')
      .returns(options?.repository ?? 'dequelabs/repo')
    const labels = getInput.withArgs('labels').returns(options?.labels ?? '')
    const assignees = getInput
      .withArgs('assignees')
      .returns(options?.assignees ?? '')
    const projectNumber = getInput
      .withArgs('project_number')
      .returns(options?.project_number ?? '66')
    const columnName = getInput
      .withArgs('column_name')
      .returns(options?.column_name ?? 'Backlog')

    return {
      token,
      title,
      body,
      repo,
      labels,
      assignees,
      projectNumber,
      columnName
    }
  }

  describe('when the `github_token` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('github_token', { required: true }).throws({
        message: 'Input required and not supplied: github_token'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: github_token')
      )
    })
  })

  describe('when the `title` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('title', { required: true }).throws({
        message: 'Input required and not supplied: title'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: title')
      )
    })
  })

  describe('when the `body` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('body', { required: true }).throws({
        message: 'Input required and not supplied: body'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: body')
      )
    })
  })

  describe('when the `project_number` input is not a number', () => {
    it('throws an error', async () => {
      generateInputs({ project_number: 'foo' })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(setFailed.calledWith('project_number must be a number'))
    })
  })

  describe('when the `repository` input is not provided', () => {
    it('uses the `github.context.repo` to create an issue and move it to board', async () => {
      generateInputs({ repository: '' })

      await createAndMoveIssueStub()

      const core = {
        getInput,
        setFailed,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(setFailed.notCalled)
      assert.equal(info.callCount, 6)
      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(
        setOutput.calledWith('issue_url', 'https://deque.bizzy.com')
      )
    })
  })

  describe('when the `repository` input is provided', () => {
    it('uses the `repository` to create an issue and move it to board', async () => {
      const inputs = generateInputs({ repository: 'other-repo' })

      await createAndMoveIssueStub()

      const core = {
        getInput,
        setFailed,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      const createdIssueArgs = github.getOctokit().rest.issues.create.args[0][0]
      assert.equal(createdIssueArgs.repo, 'other-repo')
      assert.equal(createdIssueArgs.title, inputs.title.returnValues[0])
      assert.equal(createdIssueArgs.body, inputs.body.returnValues[0])
      assert.isUndefined(createdIssueArgs.labels)
      assert.isUndefined(createdIssueArgs.assignees)

      assert.isTrue(setFailed.notCalled)
      assert.equal(info.callCount, 6)
      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(
        setOutput.calledWith('issue_url', 'https://deque.bizzy.com')
      )
    })
  })

  describe('when the `labels` input is provided', () => {
    it('creates an issue with the labels', async () => {
      const inputs = generateInputs({ labels: 'foo,bar' })

      await createAndMoveIssueStub()

      const core = {
        getInput,
        setFailed,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      const createdIssueArgs = github.getOctokit().rest.issues.create.args[0][0]

      assert.lengthOf(createdIssueArgs.labels, 2)
      assert.deepEqual(createdIssueArgs.labels, ['foo', 'bar'])
      assert.equal(createdIssueArgs.title, inputs.title.returnValues[0])
      assert.equal(createdIssueArgs.body, inputs.body.returnValues[0])
      assert.equal(createdIssueArgs.repo, 'repo')

      assert.isTrue(setFailed.notCalled)
      assert.equal(info.callCount, 6)
      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(
        setOutput.calledWith('issue_url', 'https://deque.bizzy.com')
      )
    })
  })

  describe('when the `assignees` input is provided', () => {
    it('creates an issue with the assignees', async () => {
      const inputs = generateInputs({ assignees: 'foo,bar' })

      await createAndMoveIssueStub()

      const core = {
        getInput,
        setFailed,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      const createdIssueArgs = github.getOctokit().rest.issues.create.args[0][0]

      assert.lengthOf(createdIssueArgs.assignees, 2)
      assert.deepEqual(createdIssueArgs.assignees, ['foo', 'bar'])
      assert.equal(createdIssueArgs.title, inputs.title.returnValues[0])
      assert.equal(createdIssueArgs.body, inputs.body.returnValues[0])
      assert.equal(createdIssueArgs.repo, 'repo')

      assert.isTrue(setFailed.notCalled)
      assert.equal(info.callCount, 6)
      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(
        setOutput.calledWith('issue_url', 'https://deque.bizzy.com')
      )
    })
  })

  describe('when the `column_name` is not found', () => {
    it('throws an error', async () => {
      generateInputs({ column_name: 'foobar' })

      await createAndMoveIssueStub()

      const core = {
        getInput,
        setFailed,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(setFailed.calledWith('Column foobar not found'))
    })
  })

  describe('given no `project_number` input', () => {
    it('defaults to 66', async () => {
      const inputs = generateInputs()

      await createAndMoveIssueStub()

      const core = {
        getInput,
        setFailed,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      // commands that require the project number
      const [projectBoardArgs, issueAddedArgs, fieldListArgs] =
        getExecOutput.args

      assert.equal(
        projectBoardArgs[0],
        'gh project view 66 --owner owner --format json'
      )
      assert.equal(
        issueAddedArgs[0],
        'gh project item-add 66 --owner owner --url https://deque.bizzy.com --format json'
      )
      assert.equal(
        fieldListArgs[0],
        'gh project field-list 66 --owner owner --format json'
      )

      const createdIssueArgs = github.getOctokit().rest.issues.create.args[0][0]
      assert.equal(createdIssueArgs.repo, 'repo')
      assert.equal(createdIssueArgs.title, inputs.title.returnValues[0])
      assert.equal(createdIssueArgs.body, inputs.body.returnValues[0])
      assert.isUndefined(createdIssueArgs.labels)
      assert.isUndefined(createdIssueArgs.assignees)

      assert.isTrue(setFailed.notCalled)
      assert.equal(info.callCount, 6)
      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(
        setOutput.calledWith('issue_url', 'https://deque.bizzy.com')
      )
    })
  })

  describe('given a `project_number` input', () => {
    it('uses the `project_number` input', async () => {
      const inputs = generateInputs({ project_number: '99' })

      await createAndMoveIssueStub({ projectNumber: '99' })

      const core = {
        getInput,
        setFailed,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      // commands that require the project number
      const [projectBoardArgs, issueAddedArgs, fieldListArgs] =
        getExecOutput.args

      assert.equal(
        projectBoardArgs[0],
        'gh project view 99 --owner owner --format json'
      )
      assert.equal(
        issueAddedArgs[0],
        'gh project item-add 99 --owner owner --url https://deque.bizzy.com --format json'
      )
      assert.equal(
        fieldListArgs[0],
        'gh project field-list 99 --owner owner --format json'
      )

      const createdIssueArgs = github.getOctokit().rest.issues.create.args[0][0]
      assert.equal(createdIssueArgs.repo, 'repo')
      assert.equal(createdIssueArgs.title, inputs.title.returnValues[0])
      assert.equal(createdIssueArgs.body, inputs.body.returnValues[0])
      assert.isUndefined(createdIssueArgs.labels)
      assert.isUndefined(createdIssueArgs.assignees)

      assert.isTrue(setFailed.notCalled)
      assert.equal(info.callCount, 6)
      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(
        setOutput.calledWith('issue_url', 'https://deque.bizzy.com')
      )
    })
  })

  describe('given a `column_name` input', () => {
    it('uses the `column_name` input', async () => {
      const inputs = generateInputs({ column_name: 'In Progress' })

      await createAndMoveIssueStub({
        mockFieldList: {
          fields: [
            {
              id: '123',
              name: 'Status',
              type: 'ProjectV2',
              options: [
                {
                  id: 'im-new',
                  name: 'In Progress'
                }
              ]
            }
          ],
          totalCount: 1
        }
      })

      const core = {
        getInput,
        setFailed,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      // commands that require the project number
      const [
        projectBoardArgs,
        issueAddedArgs,
        fieldListArgs,
        moveIssueToColumnArgs
      ] = getExecOutput.args

      assert.equal(
        projectBoardArgs[0],
        'gh project view 66 --owner owner --format json'
      )
      assert.equal(
        issueAddedArgs[0],
        'gh project item-add 66 --owner owner --url https://deque.bizzy.com --format json'
      )
      assert.equal(
        fieldListArgs[0],
        'gh project field-list 66 --owner owner --format json'
      )

      // `--single-select-option-id` should be `im-new` instead of `456`
      assert.equal(
        moveIssueToColumnArgs[0],
        'gh project item-edit --id 123 --field-id 123 --single-select-option-id im-new --project-id 123 --format json'
      )

      const createdIssueArgs = github.getOctokit().rest.issues.create.args[0][0]
      assert.equal(createdIssueArgs.repo, 'repo')
      assert.equal(createdIssueArgs.title, inputs.title.returnValues[0])
      assert.equal(createdIssueArgs.body, inputs.body.returnValues[0])
      assert.isUndefined(createdIssueArgs.labels)
      assert.isUndefined(createdIssueArgs.assignees)

      assert.isTrue(setFailed.notCalled)
      assert.equal(info.callCount, 6)
      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(
        setOutput.calledWith('issue_url', 'https://deque.bizzy.com')
      )
    })
  })
})
