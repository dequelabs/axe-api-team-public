import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import { getOctokit } from '@actions/github'
import updateDateField from './updateDateField'

type Graphql = ReturnType<typeof getOctokit>['graphql']

describe('updateDateField', () => {
  const graphql = mock.fn<Graphql>()
  const octokit = { graphql } as unknown as ReturnType<typeof getOctokit>

  beforeEach(() => {
    graphql.mock.resetCalls()
    graphql.mock.mockImplementation((() =>
      Promise.resolve({})) as unknown as Graphql)
  })

  it('should update date field successfully', async () => {
    const mockArgs = {
      octokit,
      projectItemId: 'PVTI_lADOAD55W84AVmLazgJbJGI',
      fieldId: 'field_id_123',
      date: '2024-01-15',
      projectId: 'project_id_456'
    }

    graphql.mock.mockImplementation((() =>
      Promise.resolve({
        updateProjectV2ItemFieldValue: {
          projectV2Item: {
            id: mockArgs.projectItemId
          }
        }
      })) as unknown as Graphql)

    await updateDateField(mockArgs)

    assert.strictEqual(graphql.mock.callCount(), 1)
    const callArgs = graphql.mock.calls[0].arguments
    assert.deepStrictEqual(callArgs[1], {
      projectId: 'project_id_456',
      itemId: 'PVTI_lADOAD55W84AVmLazgJbJGI',
      fieldId: 'field_id_123',
      date: '2024-01-15'
    })
  })

  it('should handle errors gracefully', async () => {
    const mockArgs = {
      octokit,
      projectItemId: 'PVTI_lADOAD55W84AVmLazgJbJGS',
      fieldId: 'field_id_123',
      date: '2024-01-15',
      projectId: 'project_id_456'
    }

    const errorMessage = 'GraphQL error'
    graphql.mock.mockImplementation((() =>
      Promise.reject(new Error(errorMessage))) as unknown as Graphql)

    await assert.rejects(updateDateField(mockArgs), (error: Error) => {
      assert.ok(error instanceof Error)
      assert.ok(error.message.includes('Failed to update date field'))
      assert.ok(error.message.includes(errorMessage))
      return true
    })
  })
})
