import { expect } from 'chai'
import * as sinon from 'sinon'
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import run from './run'

const MOCK_PROJECT_ITEM_ID = 'PVTI_lADOAD55W84AVmLazgJbJGI'
const MOCK_DATE_CLOSED_FIELD_ID = 'field_id_123'
const MOCK_CLOSED_DATE = '2024-01-15'

interface GenerateInputsArgs {
  issueNumber?: string
  issueOrganization?: string
  issueRepo?: string
  projectNumber?: string
}

const generateInputs = (
  coreStub: sinon.SinonStubbedInstance<typeof core>,
  inputs?: Partial<GenerateInputsArgs>
) => {
  const issueNumber = coreStub.getInput
    .withArgs('issue-number', { required: true })
    .returns(inputs?.issueNumber ?? '123')
  const issueOrganization = coreStub.getInput
    .withArgs('issue-organization', { required: true })
    .returns(inputs?.issueOrganization ?? 'test-org')
  const issueRepo = coreStub.getInput
    .withArgs('issue-repo', { required: true })
    .returns(inputs?.issueRepo ?? 'test-repo')
  const projectNumber = coreStub.getInput
    .withArgs('project-number', { required: true })
    .returns(inputs?.projectNumber ?? '123')
  return {
    issueNumber,
    issueOrganization,
    issueRepo,
    projectNumber,
    coreStub
  }
}

describe('run', () => {
  let coreStub: sinon.SinonStubbedInstance<typeof core>
  let githubStub: sinon.SinonStubbedInstance<typeof github>
  let execStub: sinon.SinonStubbedInstance<typeof exec>
  let octokitStub: {
    rest: {
      issues: {
        get: sinon.SinonStub
      }
    }
    graphql: sinon.SinonStub
  }

  beforeEach(() => {
    // Set up environment variable for tests
    process.env.GH_TOKEN = 'test-token'

    coreStub = sinon.stub(core)
    githubStub = sinon.stub(github)
    execStub = sinon.stub(exec)

    octokitStub = {
      rest: {
        issues: {
          get: sinon.stub().resolves({
            data: {
              state: 'closed',
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
                    number: 123
                  }
                }
              ]
            }
          }
        }
      })
    }

    githubStub.getOctokit.returns(
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
  })

  afterEach(() => {
    sinon.restore()
    // Clean up environment variable
    delete process.env.GH_TOKEN
  })

  it('should update DateClosed field when issue is closed', async () => {
    const { coreStub: coreStubOutput } = generateInputs(coreStub)

    await run(coreStubOutput, githubStub)

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
    void expect(itemEditCall.args[0]).to.include(MOCK_CLOSED_DATE)
  })

  it('should not update field when issue is not closed', async () => {
    const { coreStub: coreStubOutput } = generateInputs(coreStub)

    // Mock issue as open
    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'open',
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/123',
        labels: []
      }
    })

    await run(coreStubOutput, githubStub)

    const graphqlCalled = octokitStub.graphql.called
    void expect(graphqlCalled).to.be.false
    const getExecOutputCalled = execStub.getExecOutput.called
    void expect(getExecOutputCalled).to.be.false
  })

  it('should not update field when issue is closed but has no closed_at date', async () => {
    const { coreStub: coreStubOutput } = generateInputs(coreStub)

    // Mock issue as closed but with no closed_at date
    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'closed',
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/123',
        labels: []
      }
    })

    await run(coreStubOutput, githubStub)

    const graphqlCalled = octokitStub.graphql.called
    void expect(graphqlCalled).to.be.false
    const getExecOutputCalled = execStub.getExecOutput.called
    void expect(getExecOutputCalled).to.be.false
  })

  it('should handle case when issue is not in project', async () => {
    const { coreStub: coreStubOutput } = generateInputs(coreStub)

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

    await run(coreStubOutput, githubStub)

    const getExecOutputCalled = execStub.getExecOutput.called
    void expect(getExecOutputCalled).to.be.false
  })

  it('should handle case when DateClosed field is not found', async () => {
    const { coreStub: coreStubOutput } = generateInputs(coreStub)

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

    await run(coreStubOutput, githubStub)

    const itemEditCalled = execStub.getExecOutput.calledTwice
    void expect(itemEditCalled).to.be.false
  })

  it('should handle errors gracefully', async () => {
    coreStub.getInput.throws(new Error('Test error'))

    await run(coreStub, githubStub)

    const setFailedCalled = coreStub.setFailed.called
    void expect(setFailedCalled).to.be.true
    const setFailedArgs = coreStub.setFailed.firstCall.args[0]
    void expect(setFailedArgs).to.include('Test error')
  })

  it('should fail when issue-number is not a valid number', async () => {
    const { coreStub: coreStubOutput } = generateInputs(coreStub, {
      issueNumber: 'invalid-number'
    })

    await run(coreStubOutput, githubStub)

    const setFailedCalled = coreStub.setFailed.called
    void expect(setFailedCalled).to.be.true
    const setFailedArgs = coreStub.setFailed.firstCall.args[0]
    void expect(setFailedArgs).to.equal('`issue-number` must be a number')
  })

  it('should fail when project-number is not a valid number', async () => {
    const { coreStub: coreStubOutput } = generateInputs(coreStub, {
      projectNumber: 'invalid-number'
    })

    await run(coreStubOutput, githubStub)

    const setFailedCalled = coreStub.setFailed.called
    void expect(setFailedCalled).to.be.true
    const setFailedArgs = coreStub.setFailed.firstCall.args[0]
    void expect(setFailedArgs).to.equal('`project-number` must be a number')
  })
})
