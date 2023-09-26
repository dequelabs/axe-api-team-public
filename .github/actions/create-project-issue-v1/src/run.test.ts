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

describe('run', () => {
  let setFailed: sinon.SinonSpy
  let setOutput: sinon.SinonStub
  let info: sinon.SinonSpy
  let getInput: sinon.SinonStub
  let getExecOutput: sinon.SinonStub
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
          create: sinon.stub().resolves({
            data: {
              html_url: 'https://deque.bizzy.com',
              node_id: 'generated-node-id'
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
    getExecOutput = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(sinon.restore)

  const createAndMoveIssueStub = async () => {
    //`getProjectBoardID` stub
    getExecOutput.onFirstCall().resolves({
      stdout: JSON.stringify(MOCK_PROJECT_BOARD_ID),
      exitCode: 0
    })

    //`addIssueToBoard` stub
    getExecOutput.onSecondCall().resolves({
      stdout: JSON.stringify(MOCK_ISSUE_ADDED),
      exitCode: 0
    })

    //`getProjectFieldList` stub
    getExecOutput.onThirdCall().resolves({
      stdout: JSON.stringify(MOCK_FIELD_LIST),
      exitCode: 0
    })

    //`moveIssueToColumn` stub
    getExecOutput.onCall(3).resolves({
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
    getInput
      .withArgs('github_token', { required: true })
      .returns(options?.github_token ?? 'token')
    getInput
      .withArgs('title', { required: true })
      .returns(options?.title ?? 'title')
    getInput
      .withArgs('body', { required: true })
      .returns(options?.body ?? 'body')
    getInput
      .withArgs('repository')
      .returns(options?.repository ?? 'dequelabs/repo')
    getInput.withArgs('labels').returns(options?.labels ?? '')
    getInput.withArgs('assignees').returns(options?.assignees ?? '')
    getInput.withArgs('project_number').returns(options?.project_number ?? '66')
    getInput.withArgs('column_name').returns(options?.column_name ?? 'Backlog')
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
      generateInputs({ repository: 'repo' })

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

  describe('when the `labels` input is provided', () => {
    it('creates an issue with the labels', async () => {
      generateInputs({ labels: 'foo,bar' })

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

  describe('when the `assignees` input is provided', () => {
    it('creates an issue with the assignees', async () => {
      generateInputs({ assignees: 'foo,bar' })

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
})
