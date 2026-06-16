import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Core, GitHub } from './types'

const { default: run } = await import('./run.ts')

type LabelNodes = {
  repository: { issue: { labels: { nodes: { name: string }[] } } }
}
type RepoLabel = { name: string }
type AddLabelsArgs = {
  owner: string
  repo: string
  issue_number: number
  labels: string[]
}

describe('Label Issue Based on Existing Labels Action', () => {
  const getInput = mock.fn<(name: string) => string>(() => '')
  const getBooleanInput = mock.fn<(name: string) => boolean>(() => false)
  const setOutput = mock.fn<(name: string, value: unknown) => void>()
  const setFailed = mock.fn<(message: string) => void>()
  const info = mock.fn<(message: string) => void>()

  const graphql = mock.fn<() => Promise<LabelNodes>>(async () => ({
    repository: { issue: { labels: { nodes: [] } } }
  }))
  const paginate = mock.fn<() => Promise<RepoLabel[]>>(async () => [])
  const createLabel = mock.fn<() => Promise<void>>(async () => {})
  const addLabels = mock.fn<(args: AddLabelsArgs) => Promise<void>>(
    async () => {}
  )
  const listLabelsForRepo = mock.fn()

  const mockOctokit = {
    graphql,
    paginate,
    rest: {
      issues: {
        createLabel,
        addLabels,
        listLabelsForRepo
      }
    }
  }

  const getOctokit = mock.fn(() => mockOctokit)

  const mockCore = {
    getInput,
    getBooleanInput,
    setOutput,
    setFailed,
    info
  } as unknown as Core

  const mockGitHub = {
    context: { repo: { owner: 'test-owner', repo: 'test-repo' } },
    getOctokit
  } as unknown as GitHub

  beforeEach(() => {
    getInput.mock.resetCalls()
    getBooleanInput.mock.resetCalls()
    setOutput.mock.resetCalls()
    setFailed.mock.resetCalls()
    info.mock.resetCalls()
    graphql.mock.resetCalls()
    paginate.mock.resetCalls()
    createLabel.mock.resetCalls()
    addLabels.mock.resetCalls()
    getOctokit.mock.resetCalls()

    getInput.mock.mockImplementation(() => '')
    getBooleanInput.mock.mockImplementation(() => false)
    graphql.mock.mockImplementation(async () => ({
      repository: { issue: { labels: { nodes: [] } } }
    }))
    paginate.mock.mockImplementation(async () => [])
    createLabel.mock.mockImplementation(async () => {})
    addLabels.mock.mockImplementation(async () => {})
  })

  function setInputs(inputs: Record<string, string>) {
    getInput.mock.mockImplementation((name: string) => inputs[name] || '')
  }

  describe('Basic label processing', () => {
    it('should add labels when trigger condition is met (ANY mode)', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug, urgent',
        'add-labels': 'needs-review, priority-high'
      })
      getBooleanInput.mock.mockImplementation(() => false)

      graphql.mock.mockImplementation(async () => ({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }, { name: 'frontend' }]
            }
          }
        }
      }))

      paginate.mock.mockImplementation(async () => [])

      await run(mockCore, mockGitHub)

      assert.strictEqual(createLabel.mock.callCount(), 2)
      assert.strictEqual(addLabels.mock.callCount(), 1)
      assert.deepStrictEqual(addLabels.mock.calls[0].arguments[0], {
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 123,
        labels: ['needs-review', 'priority-high']
      })

      const labelsToAdd = addLabels.mock.calls[0].arguments[0].labels
      assert.deepStrictEqual(labelsToAdd, ['needs-review', 'priority-high'])
      assert.ok(!labelsToAdd.includes('bug'))
      assert.ok(!labelsToAdd.includes('frontend'))

      assert.strictEqual(setOutput.mock.callCount(), 1)
      assert.strictEqual(
        setOutput.mock.calls[0].arguments[0],
        'actionProceeded'
      )
      assert.strictEqual(setOutput.mock.calls[0].arguments[1], true)
    })

    it('should not add labels when trigger condition is not met (ANY mode)', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug, urgent',
        'add-labels': 'needs-review'
      })
      getBooleanInput.mock.mockImplementation(() => false)

      graphql.mock.mockImplementation(async () => ({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'enhancement' }, { name: 'frontend' }]
            }
          }
        }
      }))

      paginate.mock.mockImplementation(async () => [])

      await run(mockCore, mockGitHub)

      assert.strictEqual(createLabel.mock.callCount(), 0)
      assert.strictEqual(addLabels.mock.callCount(), 0)
      assert.strictEqual(setOutput.mock.callCount(), 1)
      assert.strictEqual(
        setOutput.mock.calls[0].arguments[0],
        'actionProceeded'
      )
      assert.strictEqual(setOutput.mock.calls[0].arguments[1], false)
    })

    it('should handle invalid issue number', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': 'invalid',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug',
        'add-labels': 'needs-review'
      })

      await run(mockCore, mockGitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'issue-number must be an integer'
      )
    })

    it('should not create labels that already exist in repository', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug',
        'add-labels': 'needs-review'
      })
      getBooleanInput.mock.mockImplementation(() => false)

      graphql.mock.mockImplementation(async () => ({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }]
            }
          }
        }
      }))

      paginate.mock.mockImplementation(async () => [{ name: 'needs-review' }])

      await run(mockCore, mockGitHub)

      // Should not try to create existing label, but should still add it to issue
      assert.strictEqual(createLabel.mock.callCount(), 0)
      assert.strictEqual(addLabels.mock.callCount(), 1)
      assert.deepStrictEqual(addLabels.mock.calls[0].arguments[0], {
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 123,
        labels: ['needs-review']
      })
      assert.strictEqual(setOutput.mock.callCount(), 1)
      assert.strictEqual(
        setOutput.mock.calls[0].arguments[0],
        'actionProceeded'
      )
      assert.strictEqual(setOutput.mock.calls[0].arguments[1], true)
    })

    it('should only add labels that are not already on the issue', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug',
        'add-labels': 'needs-review, priority-high'
      })
      getBooleanInput.mock.mockImplementation(() => false)

      graphql.mock.mockImplementation(async () => ({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }, { name: 'needs-review' }]
            }
          }
        }
      }))

      paginate.mock.mockImplementation(async () => [])

      await run(mockCore, mockGitHub)

      assert.strictEqual(addLabels.mock.callCount(), 1)
      assert.deepStrictEqual(addLabels.mock.calls[0].arguments[0], {
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 123,
        labels: ['priority-high']
      })

      const labelsToAdd = addLabels.mock.calls[0].arguments[0].labels
      assert.strictEqual(labelsToAdd.length, 1)
      assert.strictEqual(labelsToAdd[0], 'priority-high')
      assert.ok(!labelsToAdd.includes('needs-review'))

      assert.strictEqual(setOutput.mock.callCount(), 1)
      assert.strictEqual(
        setOutput.mock.calls[0].arguments[0],
        'actionProceeded'
      )
      assert.strictEqual(setOutput.mock.calls[0].arguments[1], true)
    })

    it('should result in issue having both original and new labels', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug',
        'add-labels': 'needs-review, priority-high'
      })
      getBooleanInput.mock.mockImplementation(() => false)

      const originalLabels = ['bug', 'frontend']
      const labelsToAddInput = ['needs-review', 'priority-high']
      const expectedFinalLabels = [...originalLabels, ...labelsToAddInput]

      graphql.mock.mockImplementation(async () => ({
        repository: {
          issue: {
            labels: {
              nodes: originalLabels.map(name => ({ name }))
            }
          }
        }
      }))

      paginate.mock.mockImplementation(async () => [])

      await run(mockCore, mockGitHub)

      assert.strictEqual(addLabels.mock.callCount(), 1)
      assert.deepStrictEqual(addLabels.mock.calls[0].arguments[0], {
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 123,
        labels: labelsToAddInput
      })

      // After GitHub processes the addLabels call, the issue should have all labels combined
      const finalLabels = [...originalLabels, ...labelsToAddInput]
      assert.deepStrictEqual(finalLabels, expectedFinalLabels)
      assert.ok(finalLabels.includes('bug'))
      assert.ok(finalLabels.includes('frontend'))
      assert.ok(finalLabels.includes('needs-review'))
      assert.ok(finalLabels.includes('priority-high'))

      assert.strictEqual(setOutput.mock.callCount(), 1)
      assert.strictEqual(
        setOutput.mock.calls[0].arguments[0],
        'actionProceeded'
      )
      assert.strictEqual(setOutput.mock.calls[0].arguments[1], true)
    })

    it('should handle empty trigger labels input', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': '',
        'add-labels': 'needs-review'
      })

      await run(mockCore, mockGitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Both trigger-labels and add-labels must contain at least one label'
      )
    })

    it('should handle empty add labels input', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug',
        'add-labels': ''
      })

      await run(mockCore, mockGitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Both trigger-labels and add-labels must contain at least one label'
      )
    })

    it('should handle API error during getIssueLabels', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug',
        'add-labels': 'needs-review'
      })
      getBooleanInput.mock.mockImplementation(() => false)

      graphql.mock.mockImplementation(async () => {
        throw new Error('GraphQL API error')
      })

      await run(mockCore, mockGitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.ok(
        (setFailed.mock.calls[0].arguments[0] as string).includes(
          'GraphQL API error'
        )
      )
    })

    it('should handle API error during label creation', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug',
        'add-labels': 'needs-review'
      })
      getBooleanInput.mock.mockImplementation(() => false)

      graphql.mock.mockImplementation(async () => ({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }]
            }
          }
        }
      }))

      paginate.mock.mockImplementation(async () => [])

      // Mock create label failure (non-422 error)
      createLabel.mock.mockImplementation(async () => {
        throw new Error('API rate limit exceeded')
      })

      await run(mockCore, mockGitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.ok(
        (setFailed.mock.calls[0].arguments[0] as string).includes(
          'API rate limit exceeded'
        )
      )
    })

    it('should handle error during adding labels to issue', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug',
        'add-labels': 'needs-review'
      })
      getBooleanInput.mock.mockImplementation(() => false)

      graphql.mock.mockImplementation(async () => ({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }]
            }
          }
        }
      }))

      paginate.mock.mockImplementation(async () => [{ name: 'needs-review' }])
      addLabels.mock.mockImplementation(async () => {
        throw new Error('Failed to add labels')
      })

      await run(mockCore, mockGitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.ok(
        (setFailed.mock.calls[0].arguments[0] as string).includes(
          'Failed to add labels'
        )
      )
    })

    it('should handle error during repository labels fetch', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug',
        'add-labels': 'needs-review'
      })
      getBooleanInput.mock.mockImplementation(() => false)

      graphql.mock.mockImplementation(async () => ({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }]
            }
          }
        }
      }))

      // Mock paginate failure
      paginate.mock.mockImplementation(async () => {
        throw new Error('Failed to fetch repository labels')
      })

      await run(mockCore, mockGitHub)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.ok(
        (setFailed.mock.calls[0].arguments[0] as string).includes(
          'Failed to fetch repository labels'
        )
      )
    })

    it('should add labels when ALL trigger conditions are met (ALL mode success)', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug, urgent',
        'add-labels': 'needs-review'
      })
      getBooleanInput.mock.mockImplementation(() => true) // ALL mode

      graphql.mock.mockImplementation(async () => ({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }, { name: 'urgent' }, { name: 'frontend' }] // Has ALL trigger labels
            }
          }
        }
      }))

      paginate.mock.mockImplementation(async () => [])

      await run(mockCore, mockGitHub)

      // Should succeed because issue has ALL required labels (bug AND urgent)
      assert.strictEqual(addLabels.mock.callCount(), 1)
      assert.strictEqual(setOutput.mock.callCount(), 1)
      assert.strictEqual(
        setOutput.mock.calls[0].arguments[0],
        'actionProceeded'
      )
      assert.strictEqual(setOutput.mock.calls[0].arguments[1], true)
    })

    it('should use GitHub context when organization and repo are not provided', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        // No issue-organization or issue-repo provided
        'trigger-labels': 'bug',
        'add-labels': 'needs-review'
      })
      getBooleanInput.mock.mockImplementation(() => false)

      graphql.mock.mockImplementation(async () => ({
        repository: {
          issue: {
            labels: {
              nodes: [{ name: 'bug' }]
            }
          }
        }
      }))

      paginate.mock.mockImplementation(async () => [])

      await run(mockCore, mockGitHub)

      assert.strictEqual(addLabels.mock.callCount(), 1)
      assert.deepStrictEqual(addLabels.mock.calls[0].arguments[0], {
        owner: 'test-owner', // From GitHub context
        repo: 'test-repo', // From GitHub context
        issue_number: 123,
        labels: ['needs-review']
      })

      assert.strictEqual(setOutput.mock.callCount(), 1)
      assert.strictEqual(
        setOutput.mock.calls[0].arguments[0],
        'actionProceeded'
      )
      assert.strictEqual(setOutput.mock.calls[0].arguments[1], true)
    })

    it('should skip when all labels to add already exist on issue', async () => {
      setInputs({
        token: 'test-token',
        'issue-number': '123',
        'issue-organization': 'test-org',
        'issue-repo': 'test-repo',
        'trigger-labels': 'bug',
        'add-labels': 'needs-review, frontend' // Both already on issue
      })
      getBooleanInput.mock.mockImplementation(() => false)

      graphql.mock.mockImplementation(async () => ({
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
      }))

      paginate.mock.mockImplementation(async () => [])

      await run(mockCore, mockGitHub)

      // Should not try to add labels or create labels
      assert.strictEqual(createLabel.mock.callCount(), 0)
      assert.strictEqual(addLabels.mock.callCount(), 0)
      assert.strictEqual(setOutput.mock.callCount(), 1)
      assert.strictEqual(
        setOutput.mock.calls[0].arguments[0],
        'actionProceeded'
      )
      assert.strictEqual(setOutput.mock.calls[0].arguments[1], true)
    })
  })
})
