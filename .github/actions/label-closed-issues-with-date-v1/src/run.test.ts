import { expect } from 'chai'
import * as sinon from 'sinon'
import * as core from '@actions/core'
import * as github from '@actions/github'
import run from './run'

const MOCK_ISSUE = {owner: 'test-org',
  repo: 'test-repo',
  issue_number: 123,
  labels: ['Closed: 2024-01-15']}

  interface GenerateInputsArgs {
    issueNumber: string
    issueOrganization: string
    issueRepo: string
    token: string
  } 

  const generateInputs = (coreStub: sinon.SinonStubbedInstance<typeof core>, inputs: GenerateInputsArgs) => {
    coreStub.getInput.withArgs('issue-number', { required: true }).returns(inputs.issueNumber)
    coreStub.getInput.withArgs('issue-organization', { required: true }).returns(inputs.issueOrganization)
    coreStub.getInput.withArgs('issue-repo', { required: true }).returns(inputs.issueRepo)
    coreStub.getInput.withArgs('token', { required: true }).returns(inputs.token)
    return coreStub;  
  }


describe('run', () => {
  let coreStub: sinon.SinonStubbedInstance<typeof core>
  let githubStub: sinon.SinonStubbedInstance<typeof github>
  let octokitStub: {
    rest: {
      issues: {
        get: sinon.SinonStub
        addLabels: sinon.SinonStub
        removeLabel: sinon.SinonStub
      }
    }
  }

  beforeEach(() => {
    coreStub = sinon.stub(core)
    githubStub = sinon.stub(github)
    
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
          }),
          addLabels: sinon.stub().resolves(),
          removeLabel: sinon.stub().resolves()
        }
      }
    }
    
    githubStub.getOctokit.returns(octokitStub as unknown as ReturnType<typeof github.getOctokit>)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should add date label when issue is closed', async () => {
    const coreStubOutput = generateInputs(coreStub, {issueNumber: '123', issueOrganization: 'test-org', issueRepo: 'test-repo', token: 'test-token'})

    await run(coreStubOutput, githubStub)

    const addLabelsCalled = octokitStub.rest.issues.addLabels.called
    void expect(addLabelsCalled).to.be.true
    const addLabelsArgs = octokitStub.rest.issues.addLabels.firstCall.args[0]
    void expect(addLabelsArgs).to.deep.include(MOCK_ISSUE)
  })

  it('should remove existing "Closed:" labels before adding new one', async () => {
    const coreStubOutput = generateInputs(coreStub, {issueNumber: '123', issueOrganization: 'test-org', issueRepo: 'test-repo', token: 'test-token'})

    // Mock issue with existing "Closed:" labels
    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'closed',
        closed_at: '2024-01-15T10:30:00Z',
        html_url: 'https://github.com/test/repo/issues/123',
        labels: [
          { name: 'Closed: 2024-01-10' },
          { name: 'Closed: 2024-01-12' },
          { name: 'bug' },
          { name: 'enhancement' }
        ]
      }
    })

    await run(coreStubOutput, githubStub)

    // Should remove existing "Closed:" labels
    const removeLabelCalled = octokitStub.rest.issues.removeLabel.called
    void expect(removeLabelCalled).to.be.true
    const removeLabelArgs = octokitStub.rest.issues.removeLabel.firstCall.args[0]
    void expect(removeLabelArgs).to.deep.include({
      owner: 'test-org',
      repo: 'test-repo',
      issue_number: 123,
      name: 'Closed: 2024-01-10'
    })

    // Should add new "Closed:" label
    const addLabelsCalled = octokitStub.rest.issues.addLabels.called
    void expect(addLabelsCalled).to.be.true
    const addLabelsArgs = octokitStub.rest.issues.addLabels.firstCall.args[0]
    void expect(addLabelsArgs).to.deep.include(MOCK_ISSUE)
  })

  it('should handle mixed label formats (string and object)', async () => {
    const coreStubOutput = generateInputs(coreStub, {issueNumber: '123', issueOrganization: 'test-org', issueRepo: 'test-repo', token: 'test-token'})

    // Mock issue with mixed label formats - both string and object
    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'closed',
        closed_at: '2024-01-15T10:30:00Z',
        html_url: 'https://github.com/test/repo/issues/123',
        labels: [
          'Closed: 2024-01-10', // String format
          { name: 'Closed: 2024-01-12' }, // Object format
          'bug', // String format
          { name: 'enhancement' } // Object format
        ]
      }
    })

    await run(coreStubOutput, githubStub)

    // Should remove existing "Closed:" labels (only object format ones)
    const removeLabelCalled = octokitStub.rest.issues.removeLabel.called
    void expect(removeLabelCalled).to.be.true
    const removeLabelArgs = octokitStub.rest.issues.removeLabel.firstCall.args[0]
    void expect(removeLabelArgs).to.deep.include({
      owner: 'test-org',
      repo: 'test-repo',
      issue_number: 123,
      name: 'Closed: 2024-01-12'
    })

    // Should add new "Closed:" label
    const addLabelsCalled = octokitStub.rest.issues.addLabels.called
    void expect(addLabelsCalled).to.be.true
    const addLabelsArgs = octokitStub.rest.issues.addLabels.firstCall.args[0]
    void expect(addLabelsArgs).to.deep.include(MOCK_ISSUE)
  })

  it('should not add label when issue is not closed', async () => {
    const coreStubOutput = generateInputs(coreStub, {issueNumber: '123', issueOrganization: 'test-org', issueRepo: 'test-repo', token: 'test-token'})

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

    const addLabelsCalled = octokitStub.rest.issues.addLabels.called
    void expect(addLabelsCalled).to.be.false
    const removeLabelCalled = octokitStub.rest.issues.removeLabel.called
    void expect(removeLabelCalled).to.be.false
  })

  it('should not add label when issue is closed but has no closed_at date', async () => {
    const coreStubOutput = generateInputs(coreStub, {issueNumber: '123', issueOrganization: 'test-org', issueRepo: 'test-repo', token: 'test-token'})

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

    const addLabelsCalled = octokitStub.rest.issues.addLabels.called
    void expect(addLabelsCalled).to.be.false
    const removeLabelCalled = octokitStub.rest.issues.removeLabel.called
    void expect(removeLabelCalled).to.be.false
  })

  it('should handle errors gracefully', async () => {
    coreStub.getInput.throws(new Error('Test error'))

    await run(coreStub, githubStub)

    const setFailedCalled = coreStub.setFailed.called
    void expect(setFailedCalled).to.be.true
    const setFailedArgs = coreStub.setFailed.firstCall.args[0]
    void expect(setFailedArgs).to.include('Test error')
  })
}) 
