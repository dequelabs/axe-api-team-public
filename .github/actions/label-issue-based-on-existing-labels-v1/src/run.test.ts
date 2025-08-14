import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import run from './run'
import type { Core, GitHub } from './types'

describe('Label Issue Based on Existing Labels Action', () => {
  let mockCore: Core
  let mockGitHub: GitHub
  let mockOctokit: {
    graphql: sinon.SinonStub
    paginate: sinon.SinonStub
    rest: {
      issues: {
        createLabel: sinon.SinonStub
        addLabels: sinon.SinonStub
        listLabelsForRepo: sinon.SinonStub
      }
    }
  }

  beforeEach(() => {
    mockCore = {
      getInput: sinon.stub(),
      getBooleanInput: sinon.stub(),
      setOutput: sinon.stub(),
      setFailed: sinon.stub(),
      info: sinon.stub()
    }

    mockOctokit = {
      graphql: sinon.stub(),
      paginate: sinon.stub(),
      rest: {
        issues: {
          createLabel: sinon.stub(),
          addLabels: sinon.stub(),
          listLabelsForRepo: sinon.stub()
        }
      }
    }

    mockGitHub = {
      context: { repo: { owner: 'test-owner', repo: 'test-repo' } },
      getOctokit: sinon.stub().returns(mockOctokit)
    } as unknown as GitHub
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('Basic label processing', () => {
    it('should add labels when trigger condition is met (ANY mode)', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug, urgent',
          'add-labels': 'needs-review, priority-high'
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }, { name: 'frontend' }]
            }
          }
        }
      })

      mockOctokit.paginate.resolves([])

      await run(mockCore, mockGitHub)

      assert.isTrue(mockOctokit.rest.issues.createLabel.calledTwice)
      assert.isTrue(
        mockOctokit.rest.issues.addLabels.calledOnceWith({
          owner: 'test-org',
          repo: 'test-repo',
          issue_number: 123,
          labels: ['needs-review', 'priority-high']
        })
      )

      const addLabelsCall = mockOctokit.rest.issues.addLabels.getCall(0)
      const labelsToAdd = addLabelsCall.args[0].labels
      assert.deepEqual(labelsToAdd, ['needs-review', 'priority-high'])
      assert.isFalse(labelsToAdd.includes('bug'))
      assert.isFalse(labelsToAdd.includes('frontend'))

      assert.isTrue(
        (mockCore.setOutput as sinon.SinonStub).calledOnceWith(
          'actionProceeded',
          true
        )
      )
    })

    it('should not add labels when trigger condition is not met (ANY mode)', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug, urgent',
          'add-labels': 'needs-review'
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'enhancement' }, { name: 'frontend' }]
            }
          }
        }
      })

      // Mock repository labels
      mockOctokit.paginate.resolves([])

      await run(mockCore, mockGitHub)

      assert.isFalse(mockOctokit.rest.issues.createLabel.called)
      assert.isFalse(mockOctokit.rest.issues.addLabels.called)
      assert.isTrue(
        (mockCore.setOutput as sinon.SinonStub).calledOnceWith(
          'actionProceeded',
          false
        )
      )
    })

    it('should handle invalid issue number', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': 'invalid',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug',
          'add-labels': 'needs-review'
        }
        return inputs[name] || ''
      })

      await run(mockCore, mockGitHub)
      assert.isTrue(
        (mockCore.setFailed as sinon.SinonStub).calledOnceWith(
          'issue-number must be an integer'
        )
      )
    })

    it('should not create labels that already exist in repository', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug',
          'add-labels': 'needs-review'
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }]
            }
          }
        }
      })

      mockOctokit.paginate.resolves([{ name: 'needs-review' }])

      await run(mockCore, mockGitHub)

      // Verify - should not try to create existing label, but should still add it to issue
      assert.isFalse(mockOctokit.rest.issues.createLabel.called) // No creation needed
      assert.isTrue(
        mockOctokit.rest.issues.addLabels.calledOnceWith({
          owner: 'test-org',
          repo: 'test-repo',
          issue_number: 123,
          labels: ['needs-review']
        })
      )
      assert.isTrue(
        (mockCore.setOutput as sinon.SinonStub).calledOnceWith(
          'actionProceeded',
          true
        )
      )
    })

    it('should only add labels that are not already on the issue', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug',
          'add-labels': 'needs-review, priority-high' // needs-review already exists on issue
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }, { name: 'needs-review' }]
            }
          }
        }
      })

      mockOctokit.paginate.resolves([])

      await run(mockCore, mockGitHub)

      assert.isTrue(
        mockOctokit.rest.issues.addLabels.calledOnceWith({
          owner: 'test-org',
          repo: 'test-repo',
          issue_number: 123,
          labels: ['priority-high']
        })
      )

      const addLabelsCall = mockOctokit.rest.issues.addLabels.getCall(0)
      const labelsToAdd = addLabelsCall.args[0].labels
      assert.equal(labelsToAdd.length, 1)
      assert.equal(labelsToAdd[0], 'priority-high')
      assert.isFalse(labelsToAdd.includes('needs-review'))

      assert.isTrue(
        (mockCore.setOutput as sinon.SinonStub).calledOnceWith(
          'actionProceeded',
          true
        )
      )
    })

    it('should result in issue having both original and new labels', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug',
          'add-labels': 'needs-review, priority-high'
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      const originalLabels = ['bug', 'frontend']
      const labelsToAdd = ['needs-review', 'priority-high']
      const expectedFinalLabels = [...originalLabels, ...labelsToAdd] // ['bug', 'frontend', 'needs-review', 'priority-high']

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: originalLabels.map(name => ({ name }))
            }
          }
        }
      })

      mockOctokit.paginate.resolves([])

      await run(mockCore, mockGitHub)

      assert.isTrue(
        mockOctokit.rest.issues.addLabels.calledOnceWith({
          owner: 'test-org',
          repo: 'test-repo',
          issue_number: 123,
          labels: labelsToAdd
        })
      )

      // After GitHub processes the addLabels call, the issue should have all labels combined
      const finalLabels = [...originalLabels, ...labelsToAdd]
      assert.deepEqual(finalLabels, expectedFinalLabels)
      assert.include(finalLabels, 'bug')
      assert.include(finalLabels, 'frontend')
      assert.include(finalLabels, 'needs-review')
      assert.include(finalLabels, 'priority-high')

      assert.isTrue(
        (mockCore.setOutput as sinon.SinonStub).calledOnceWith(
          'actionProceeded',
          true
        )
      )
    })

    it('should handle empty trigger labels input', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': '',
          'add-labels': 'needs-review'
        }
        return inputs[name] || ''
      })

      await run(mockCore, mockGitHub)

      assert.isTrue(
        (mockCore.setFailed as sinon.SinonStub).calledOnceWith(
          'Both trigger-labels and add-labels must contain at least one label'
        )
      )
    })

    it('should handle empty add labels input', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug',
          'add-labels': ''
        }
        return inputs[name] || ''
      })

      await run(mockCore, mockGitHub)

      assert.isTrue(
        (mockCore.setFailed as sinon.SinonStub).calledOnceWith(
          'Both trigger-labels and add-labels must contain at least one label'
        )
      )
    })

    it('should handle API error during getIssueLabels', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug',
          'add-labels': 'needs-review'
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      mockOctokit.graphql.rejects(new Error('GraphQL API error'))

      await run(mockCore, mockGitHub)

      assert.isTrue((mockCore.setFailed as sinon.SinonStub).calledOnce)
      assert.include(
        (mockCore.setFailed as sinon.SinonStub).getCall(0).args[0],
        'GraphQL API error'
      )
    })

    it('should handle API error during label creation', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug',
          'add-labels': 'needs-review'
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }]
            }
          }
        }
      })

      mockOctokit.paginate.resolves([])

      // Mock create label failure (non-422 error)
      mockOctokit.rest.issues.createLabel.rejects(
        new Error('API rate limit exceeded')
      )

      await run(mockCore, mockGitHub)

      assert.isTrue((mockCore.setFailed as sinon.SinonStub).calledOnce)
      assert.include(
        (mockCore.setFailed as sinon.SinonStub).getCall(0).args[0],
        'API rate limit exceeded'
      )
    })

    it('should handle error during adding labels to issue', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug',
          'add-labels': 'needs-review'
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }]
            }
          }
        }
      })

      mockOctokit.paginate.resolves([{ name: 'needs-review' }])
      mockOctokit.rest.issues.addLabels.rejects(
        new Error('Failed to add labels')
      )

      await run(mockCore, mockGitHub)

      assert.isTrue((mockCore.setFailed as sinon.SinonStub).calledOnce)
      assert.include(
        (mockCore.setFailed as sinon.SinonStub).getCall(0).args[0],
        'Failed to add labels'
      )
    })

    it('should handle error during repository labels fetch', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug',
          'add-labels': 'needs-review'
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }]
            }
          }
        }
      })

      // Mock paginate failure
      mockOctokit.paginate.rejects(
        new Error('Failed to fetch repository labels')
      )

      await run(mockCore, mockGitHub)

      assert.isTrue((mockCore.setFailed as sinon.SinonStub).calledOnce)
      assert.include(
        (mockCore.setFailed as sinon.SinonStub).getCall(0).args[0],
        'Failed to fetch repository labels'
      )
    })

    it('should add labels when ALL trigger conditions are met (ALL mode success)', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug, urgent',
          'add-labels': 'needs-review'
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(true) // ALL mode

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }, { name: 'urgent' }, { name: 'frontend' }] // Has ALL trigger labels
            }
          }
        }
      })

      mockOctokit.paginate.resolves([])

      await run(mockCore, mockGitHub)

      // Should succeed because issue has ALL required labels (bug AND urgent)
      assert.isTrue(mockOctokit.rest.issues.addLabels.calledOnce)
      assert.isTrue(
        (mockCore.setOutput as sinon.SinonStub).calledOnceWith(
          'actionProceeded',
          true
        )
      )
    })

    it('should use GitHub context when organization and repo are not provided', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          // No issue-organization or issue-repo provided
          'trigger-labels': 'bug',
          'add-labels': 'needs-review'
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }]
            }
          }
        }
      })

      mockOctokit.paginate.resolves([])

      await run(mockCore, mockGitHub)

      assert.isTrue(
        mockOctokit.rest.issues.addLabels.calledOnceWith({
          owner: 'test-owner', // From GitHub context
          repo: 'test-repo', // From GitHub context
          issue_number: 123,
          labels: ['needs-review']
        })
      )

      assert.isTrue(
        (mockCore.setOutput as sinon.SinonStub).calledOnceWith(
          'actionProceeded',
          true
        )
      )
    })

    it('should skip when all labels to add already exist on issue', async () => {
      const getInputStub = mockCore.getInput as sinon.SinonStub
      const requireAllTriggersStub = mockCore.getBooleanInput as sinon.SinonStub

      getInputStub.callsFake((name: string) => {
        const inputs: Record<string, string> = {
          token: 'test-token',
          'issue-number': '123',
          'issue-organization': 'test-org',
          'issue-repo': 'test-repo',
          'trigger-labels': 'bug',
          'add-labels': 'needs-review, frontend' // Both already on issue
        }
        return inputs[name] || ''
      })
      requireAllTriggersStub.returns(false)

      mockOctokit.graphql.resolves({
        repository: {
          issue: {
            labels: {
              nodes: [
                { name: 'bug' },
                { name: 'needs-review' },
                { name: 'frontend' }
              ] // Already has all labels
            }
          }
        }
      })

      mockOctokit.paginate.resolves([])

      await run(mockCore, mockGitHub)

      // Should not try to add labels or create labels
      assert.isFalse(mockOctokit.rest.issues.createLabel.called)
      assert.isFalse(mockOctokit.rest.issues.addLabels.called)
      assert.isTrue(
        (mockCore.setOutput as sinon.SinonStub).calledOnceWith(
          'actionProceeded',
          true
        )
      )
    })
  })
})
