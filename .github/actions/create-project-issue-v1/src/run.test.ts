import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import type { Core, GitHub } from './types'
import run from './run'
import {
  ADD_PROJECT_CARD_RESPONSE,
  MOVE_CARD_TO_COLUMN_RESPONSE,
  PROJECT_BOARD_RESPONSE
} from './addToBoard.test'

describe('run', () => {
  let setFailed: sinon.SinonSpy
  let setOutput: sinon.SinonStub
  let info: sinon.SinonSpy
  let getInput: sinon.SinonStub
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
              url: 'https://deque.biz',
              node_id: 'generated-node-id'
            }
          })
        }
      },
      graphql: sinon
        .stub()
        .onFirstCall()
        .resolves(PROJECT_BOARD_RESPONSE)
        .onSecondCall()
        .resolves(ADD_PROJECT_CARD_RESPONSE)
        .onThirdCall()
        .resolves(MOVE_CARD_TO_COLUMN_RESPONSE)
    })
  }

  beforeEach(() => {
    setFailed = sinon.spy()
    setOutput = sinon.stub()
    info = sinon.spy()
    getInput = sinon.stub()
  })

  afterEach(sinon.restore)

  describe('when the `github_token` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('github_token', { required: true }).throws({
        message: 'Input required and not supplied: github_token'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as any)

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

      await run(core as unknown as Core, {} as any)

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

      await run(core as unknown as Core, {} as any)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: body')
      )
    })
  })

  describe('when the `project_number` input is not a number', () => {
    it('throws an error', async () => {
      getInput.withArgs('github_token', { required: true }).returns('token')
      getInput.withArgs('title', { required: true }).returns('title')
      getInput.withArgs('body', { required: true }).returns('body')
      getInput.withArgs('repository').returns('dequelabs/repo')
      getInput.withArgs('labels').returns('')
      getInput.withArgs('assignees').returns('')
      getInput.withArgs('project_number').returns('foobar')
      getInput.withArgs('column_name').returns('Backlog')

      const core = {
        getInput,
        setFailed
      }

      const github = {
        context: {
          repo: {
            owner: 'owner',
            repo: 'repo'
          }
        }
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(setFailed.calledWith('project_number must be a number'))
    })
  })

  describe('when the `repository` input is not provided', () => {
    it('uses `github.repository` as the repository and creates an issue', async () => {
      getInput.withArgs('github_token', { required: true }).returns('token')
      getInput.withArgs('title', { required: true }).returns('title')
      getInput.withArgs('body', { required: true }).returns('body')
      getInput.withArgs('repository').returns('dequelabs/repo')
      getInput.withArgs('labels').returns('')
      getInput.withArgs('assignees').returns('')
      getInput.withArgs('project_number').returns('1')
      getInput.withArgs('column_name').returns('Backlog')

      const core = {
        getInput,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(
        info.firstCall.calledWith('Created issue: https://deque.biz')
      )
      assert.isTrue(
        info.secondCall.calledWith(
          'Added issue to project board in column Backlog'
        )
      )
      assert.isTrue(setOutput.calledWith('issue_url', 'https://deque.biz'))
    })
  })

  describe('when the `repository` input is provided', () => {
    it('uses the provided repository and creates an issue', async () => {
      getInput.withArgs('github_token', { required: true }).returns('token')
      getInput.withArgs('title', { required: true }).returns('title')
      getInput.withArgs('body', { required: true }).returns('body')
      getInput.withArgs('repository').returns('repo')
      getInput.withArgs('labels').returns('')
      getInput.withArgs('assignees').returns('')
      getInput.withArgs('project_number').returns('1')
      getInput.withArgs('column_name').returns('Backlog')

      const core = {
        getInput,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(
        info.firstCall.calledWith('Created issue: https://deque.biz')
      )
      assert.isTrue(
        info.secondCall.calledWith(
          'Added issue to project board in column Backlog'
        )
      )
      assert.isTrue(setOutput.calledWith('issue_url', 'https://deque.biz'))
    })
  })

  describe('when the `labels` input is provided', () => {
    it('creates an issue with the provided labels', async () => {
      getInput.withArgs('github_token', { required: true }).returns('token')
      getInput.withArgs('title', { required: true }).returns('title')
      getInput.withArgs('body', { required: true }).returns('body')
      getInput.withArgs('repository').returns('repo')
      getInput.withArgs('labels').returns('foo,bar')
      getInput.withArgs('assignees').returns('')
      getInput.withArgs('project_number').returns('1')
      getInput.withArgs('column_name').returns('Backlog')

      const core = {
        getInput,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(
        info.firstCall.calledWith('Created issue: https://deque.biz')
      )
      assert.isTrue(
        info.secondCall.calledWith(
          'Added issue to project board in column Backlog'
        )
      )
      assert.isTrue(setOutput.calledWith('issue_url', 'https://deque.biz'))
    })
  })

  describe('when the `assignees` input is provided', () => {
    it('creates an issue with the provided assignees', async () => {
      getInput.withArgs('github_token', { required: true }).returns('token')
      getInput.withArgs('title', { required: true }).returns('title')
      getInput.withArgs('body', { required: true }).returns('body')
      getInput.withArgs('repository').returns('repo')
      getInput.withArgs('labels').returns('')
      getInput.withArgs('assignees').returns('foo,bar')
      getInput.withArgs('project_number').returns('1')
      getInput.withArgs('column_name').returns('Backlog')

      const core = {
        getInput,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(
        info.firstCall.calledWith('Created issue: https://deque.biz')
      )
      assert.isTrue(
        info.secondCall.calledWith(
          'Added issue to project board in column Backlog'
        )
      )
      assert.isTrue(setOutput.calledWith('issue_url', 'https://deque.biz'))
    })
  })
})
