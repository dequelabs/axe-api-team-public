import { expect } from 'chai'
import * as sinon from 'sinon'
import * as core from '@actions/core'
import * as github from '@actions/github'
import run from './run'

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
    
    githubStub.getOctokit.returns(octokitStub as ReturnType<typeof github.getOctokit>)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should add date label when issue is closed', async () => {
    coreStub.getInput.withArgs('issue-number', { required: true }).returns('123')
    coreStub.getInput.withArgs('issue-organization', { required: true }).returns('test-org')
    coreStub.getInput.withArgs('issue-repo', { required: true }).returns('test-repo')
    coreStub.getInput.withArgs('token', { required: true }).returns('test-token')

    await run(coreStub, githubStub)

    const addLabelsCalled = octokitStub.rest.issues.addLabels.called
    expect(addLabelsCalled).to.be.true
    const addLabelsArgs = octokitStub.rest.issues.addLabels.firstCall.args[0]
    expect(addLabelsArgs).to.deep.include({
      owner: 'test-org',
      repo: 'test-repo',
      issue_number: 123,
      labels: ['Closed: 2024-01-15']
    })
  })

  it('should remove existing "Closed:" labels before adding new one', async () => {
    coreStub.getInput.withArgs('issue-number', { required: true }).returns('123')
    coreStub.getInput.withArgs('issue-organization', { required: true }).returns('test-org')
    coreStub.getInput.withArgs('issue-repo', { required: true }).returns('test-repo')
    coreStub.getInput.withArgs('token', { required: true }).returns('test-token')

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

    await run(coreStub, githubStub)

    // Should remove existing "Closed:" labels
    const removeLabelCalled = octokitStub.rest.issues.removeLabel.called
    expect(removeLabelCalled).to.be.true
    const removeLabelArgs = octokitStub.rest.issues.removeLabel.firstCall.args[0]
    expect(removeLabelArgs).to.deep.include({
      owner: 'test-org',
      repo: 'test-repo',
      issue_number: 123,
      name: 'Closed: 2024-01-10'
    })

    // Should add new "Closed:" label
    const addLabelsCalled = octokitStub.rest.issues.addLabels.called
    expect(addLabelsCalled).to.be.true
    const addLabelsArgs = octokitStub.rest.issues.addLabels.firstCall.args[0]
    expect(addLabelsArgs).to.deep.include({
      owner: 'test-org',
      repo: 'test-repo',
      issue_number: 123,
      labels: ['Closed: 2024-01-15']
    })
  })

  it('should not add label when issue is not closed', async () => {
    coreStub.getInput.withArgs('issue-number', { required: true }).returns('123')
    coreStub.getInput.withArgs('issue-organization', { required: true }).returns('test-org')
    coreStub.getInput.withArgs('issue-repo', { required: true }).returns('test-repo')
    coreStub.getInput.withArgs('token', { required: true }).returns('test-token')

    // Mock issue as open
    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'open',
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/123',
        labels: []
      }
    })

    await run(coreStub, githubStub)

    const addLabelsCalled = octokitStub.rest.issues.addLabels.called
    expect(addLabelsCalled).to.be.false
    const removeLabelCalled = octokitStub.rest.issues.removeLabel.called
    expect(removeLabelCalled).to.be.false
  })

  it('should not add label when issue is closed but has no closed_at date', async () => {
    coreStub.getInput.withArgs('issue-number', { required: true }).returns('123')
    coreStub.getInput.withArgs('issue-organization', { required: true }).returns('test-org')
    coreStub.getInput.withArgs('issue-repo', { required: true }).returns('test-repo')
    coreStub.getInput.withArgs('token', { required: true }).returns('test-token')

    // Mock issue as closed but with no closed_at date
    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'closed',
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/123',
        labels: []
      }
    })

    await run(coreStub, githubStub)

    const addLabelsCalled = octokitStub.rest.issues.addLabels.called
    expect(addLabelsCalled).to.be.false
    const removeLabelCalled = octokitStub.rest.issues.removeLabel.called
    expect(removeLabelCalled).to.be.false
  })

  it('should handle errors gracefully', async () => {
    coreStub.getInput.throws(new Error('Test error'))

    await run(coreStub, githubStub)

    const setFailedCalled = coreStub.setFailed.called
    expect(setFailedCalled).to.be.true
    const setFailedArgs = coreStub.setFailed.firstCall.args[0]
    expect(setFailedArgs).to.include('Test error')
  })
}) 
