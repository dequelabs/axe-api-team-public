import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { getOctokit } from '@actions/github'
import getFieldIdByName from './getFieldIdByName'
import type { ProjectFieldNode } from './getProjectBoardFieldList'

type Graphql = ReturnType<typeof getOctokit>['graphql']

const owner = 'test-org'
const projectNumber = 123

const MOCK_FIELDS: ProjectFieldNode[] = [
  { id: 'PVTF_field1', name: 'Title' },
  { id: 'PVTF_field2', name: 'Status' },
  { id: 'PVTF_field3', name: 'DateClosed' },
  { id: 'PVTF_field4', name: 'Priority' }
]

const fieldsResponse = (nodes: ProjectFieldNode[]) => ({
  organization: {
    projectV2: {
      fields: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes
      }
    }
  }
})

describe('getFieldIdByName', () => {
  const graphql = mock.fn<Graphql>()
  const octokit = { graphql } as unknown as ReturnType<typeof getOctokit>

  beforeEach(() => {
    graphql.mock.resetCalls()
    graphql.mock.mockImplementation((() =>
      Promise.resolve(fieldsResponse(MOCK_FIELDS))) as unknown as Graphql)
  })

  it('should return field ID when field is found', async () => {
    const result = await getFieldIdByName({
      octokit,
      owner,
      projectNumber,
      fieldName: 'DateClosed'
    })

    assert.strictEqual(result, 'PVTF_field3')
  })

  it('should return field ID for a custom field name', async () => {
    const result = await getFieldIdByName({
      octokit,
      owner,
      projectNumber,
      fieldName: 'Priority'
    })

    assert.strictEqual(result, 'PVTF_field4')
  })

  it('should return null when field is not found', async () => {
    const result = await getFieldIdByName({
      octokit,
      owner,
      projectNumber,
      fieldName: 'NonExistentField'
    })

    assert.strictEqual(result, null)
  })

  it('should return null when fields list is empty', async () => {
    graphql.mock.mockImplementation((() =>
      Promise.resolve(fieldsResponse([]))) as unknown as Graphql)

    const result = await getFieldIdByName({
      octokit,
      owner,
      projectNumber,
      fieldName: 'DateClosed'
    })

    assert.strictEqual(result, null)
  })

  it('should throw an error with correct message including field name', async () => {
    const errorMessage = 'API error'
    const fieldName = 'MyCustomField'
    graphql.mock.mockImplementation((() =>
      Promise.reject(new Error(errorMessage))) as unknown as Graphql)

    await assert.rejects(
      getFieldIdByName({
        octokit,
        owner,
        projectNumber,
        fieldName
      }),
      (err: Error) => {
        assert.ok(
          err.message.includes(`Failed to get "${fieldName}" field ID:`)
        )
        assert.ok(err.message.includes(errorMessage))
        return true
      }
    )
  })
})
