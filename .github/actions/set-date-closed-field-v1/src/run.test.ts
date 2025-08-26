import { expect } from 'chai'
import * as sinon from 'sinon'
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import run from './run'

const MOCK_PROJECT_ITEM_ID = 'PVTI_lADOAD55W84AVmLazgJbJGI'
const MOCK_PROJECT_ID = 'PVT_123'
const MOCK_DATE_CLOSED_FIELD_ID = 'field_id_123'

describe('run', () => {
  let coreStub: sinon.SinonStubbedInstance<typeof core>
  let execStub: sinon.SinonStubbedInstance<typeof exec>
  let octokitStub: {
    rest: {
      issues: {
        get: sinon.SinonStub
      }
    }
    graphql: sinon.SinonStub
  }
  let mockGitHub: any // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    coreStub = sinon.stub(core)
    execStub = sinon.stub(exec)

    mockGitHub = {
      context: {
        repo: {
          owner: 'default-owner',
          repo: 'default-repo'
        }
      },
      getOctokit: sinon.stub()
    }

    octokitStub = {
      rest: {
        issues: {
          get: sinon.stub().resolves({
            data: {
              state: 'closed',
              state_reason: 'completed',
              closed_at: '2024-01-15T10:30:00Z',
              html_url: 'https://github.com/test/repo/issues/123',
              labels: []
            }
          })
        }
      },
      graphql: sinon.stub().resolves({
        repository: {
          issue: {
            projectItems: {
              nodes: [
                {
                  id: MOCK_PROJECT_ITEM_ID,
                  project: {
                    number: 123,
                    id: MOCK_PROJECT_ID
                  }
                }
              ]
            }
          }
        }
      })
    }

    mockGitHub.getOctokit.returns(
      octokitStub as unknown as ReturnType<typeof github.getOctokit>
    )

    // Mock the exec command for getting field list
    execStub.getExecOutput.resolves({
      stdout: JSON.stringify({
        fields: [
          {
            id: MOCK_DATE_CLOSED_FIELD_ID,
            name: 'DateClosed',
            type: 'Date'
          }
        ]
      }),
      stderr: '',
      exitCode: 0
    })

    // Mock the exec command for updating the field
    execStub.getExecOutput
      .onFirstCall()
      .resolves({
        stdout: JSON.stringify({
          fields: [
            {
              id: MOCK_DATE_CLOSED_FIELD_ID,
              name: 'DateClosed',
              type: 'Date'
            }
          ]
        }),
        stderr: '',
        exitCode: 0
      })
      .onSecondCall()
      .resolves({
        stdout: '{}',
        stderr: '',
        exitCode: 0
      })
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should update DateClosed field when issue is closed and completed', async () => {
    // Set up mocks for this test
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')

    await run(coreStub, mockGitHub)

    const graphqlCalled = octokitStub.graphql.called
    void expect(graphqlCalled).to.be.true

    const getExecOutputCalled = execStub.getExecOutput.called
    void expect(getExecOutputCalled).to.be.true

    // Check that the field list command was called
    const fieldListCall = execStub.getExecOutput.firstCall
    void expect(fieldListCall.args[0]).to.include('gh project field-list')

    // Check that the item-edit command was called to update the date
    const itemEditCall = execStub.getExecOutput.secondCall
    void expect(itemEditCall.args[0]).to.include('gh project item-edit')
    void expect(itemEditCall.args[0]).to.include('--date')
    void expect(itemEditCall.args[0]).to.include(MOCK_PROJECT_ITEM_ID)
    void expect(itemEditCall.args[0]).to.include(MOCK_DATE_CLOSED_FIELD_ID)
    void expect(itemEditCall.args[0]).to.include(MOCK_PROJECT_ID)
  })

  it('should not update field when issue is not closed', async () => {
    // Set up mocks for this test
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')

    // Mock issue as open
    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'open',
        state_reason: null,
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/123',
        labels: []
      }
    })

    await run(coreStub, mockGitHub)

    const graphqlCalled = octokitStub.graphql.called
    void expect(graphqlCalled).to.be.false
    const getExecOutputCalled = execStub.getExecOutput.called
    void expect(getExecOutputCalled).to.be.false
  })

  it('should not update field when issue is closed but not completed', async () => {
    // Set up mocks for this test
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')

    // Mock issue as closed but not completed
    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'closed',
        state_reason: 'not_planned',
        closed_at: '2024-01-15T10:30:00Z',
        html_url: 'https://github.com/test/repo/issues/123',
        labels: []
      }
    })

    await run(coreStub, mockGitHub)

    const graphqlCalled = octokitStub.graphql.called
    void expect(graphqlCalled).to.be.false
    const getExecOutputCalled = execStub.getExecOutput.called
    void expect(getExecOutputCalled).to.be.false
  })

  it('should not update field when issue is closed but has no closed_at date', async () => {
    // Set up mocks for this test
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')

    // Mock issue as closed but with no closed_at date
    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'closed',
        state_reason: 'completed',
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/123',
        labels: []
      }
    })

    await run(coreStub, mockGitHub)

    const graphqlCalled = octokitStub.graphql.called
    void expect(graphqlCalled).to.be.false
    const getExecOutputCalled = execStub.getExecOutput.called
    void expect(getExecOutputCalled).to.be.false
  })

  it('should handle case when issue is not in project', async () => {
    // Set up mocks for this test
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')

    // Mock issue not in project
    octokitStub.graphql.resolves({
      repository: {
        issue: {
          projectItems: {
            nodes: []
          }
        }
      }
    })

    await run(coreStub, mockGitHub)

    const getExecOutputCalled = execStub.getExecOutput.called
    void expect(getExecOutputCalled).to.be.false
  })

  it('should handle case when DateClosed field is not found', async () => {
    // Set up mocks for this test
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')

    // Reset the mock for this specific test
    execStub.getExecOutput.reset()

    // Mock field list without DateClosed field
    execStub.getExecOutput.resolves({
      stdout: JSON.stringify({
        fields: [
          {
            id: 'field_id_456',
            name: 'Status',
            type: 'SingleSelect'
          }
        ]
      }),
      stderr: '',
      exitCode: 0
    })

    await run(coreStub, mockGitHub)

    // The function should call getExecOutput once for field list, but not for item edit
    // since the DateClosed field is not found
    const getExecOutputCallCount = execStub.getExecOutput.callCount
    void expect(getExecOutputCallCount).to.equal(1)
  })

  it('should fail when token is not provided', async () => {
    coreStub.getInput.withArgs('token').returns('')

    await run(coreStub, mockGitHub)

    const setFailedCalled = coreStub.setFailed.called
    void expect(setFailedCalled).to.be.true
    const setFailedArgs = coreStub.setFailed.firstCall.args[0]
    void expect(setFailedArgs).to.equal('`GH_TOKEN` is not set')
  })

  it('should handle errors gracefully', async () => {
    coreStub.getInput.throws(new Error('Test error'))

    await run(coreStub, mockGitHub)

    const setFailedCalled = coreStub.setFailed.called
    void expect(setFailedCalled).to.be.true
    const setFailedArgs = coreStub.setFailed.firstCall.args[0]
    void expect(setFailedArgs).to.include('Test error')
  })

  it('should fail when issue-number is not a valid number', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('invalid-number')

    await run(coreStub, mockGitHub)

    const setFailedCalled = coreStub.setFailed.called
    void expect(setFailedCalled).to.be.true
    const setFailedArgs = coreStub.setFailed.firstCall.args[0]
    void expect(setFailedArgs).to.equal('`issue-number` must be a number')
  })

  it('should fail when project-number is not a valid number', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('invalid-number')

    await run(coreStub, mockGitHub)

    const setFailedCalled = coreStub.setFailed.called
    void expect(setFailedCalled).to.be.true
    const setFailedArgs = coreStub.setFailed.firstCall.args[0]
    void expect(setFailedArgs).to.equal('`project-number` must be a number')
  })

  it('should use default organization and repo from context when not provided', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('')
    coreStub.getInput.withArgs('issue-repo').returns('')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')

    await run(coreStub, mockGitHub)

    const graphqlCalled = octokitStub.graphql.called
    void expect(graphqlCalled).to.be.true
    const getExecOutputCalled = execStub.getExecOutput.called
    void expect(getExecOutputCalled).to.be.true
  })
})
