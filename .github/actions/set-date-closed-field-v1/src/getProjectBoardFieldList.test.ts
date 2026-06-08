import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import { getOctokit } from '@actions/github'
import getProjectBoardFieldList, {
  ProjectFieldNode
} from './getProjectBoardFieldList'

type Graphql = ReturnType<typeof getOctokit>['graphql']

const owner = 'test-org'
const projectNumber = 123

const FIRST_PAGE_FIELDS: ProjectFieldNode[] = [
  { id: 'PVTF_field1', name: 'Title' },
  { id: 'PVTF_field2', name: 'Status' }
]

const SECOND_PAGE_FIELDS: ProjectFieldNode[] = [
  { id: 'PVTF_field3', name: 'DateClosed' },
  { id: 'PVTF_field4', name: 'Priority' }
]

const SINGLE_PAGE_RESPONSE = {
  organization: {
    projectV2: {
      fields: {
        pageInfo: {
          hasNextPage: false,
          endCursor: 'Y3Vyc29yOnYyOpKqMDAwMDAwOTQuMM4FFzvL'
        },
        nodes: FIRST_PAGE_FIELDS
      }
    }
  }
}

const FIRST_PAGE_RESPONSE = {
  organization: {
    projectV2: {
      fields: {
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor_page_1'
        },
        nodes: FIRST_PAGE_FIELDS
      }
    }
  }
}

const SECOND_PAGE_RESPONSE = {
  organization: {
    projectV2: {
      fields: {
        pageInfo: {
          hasNextPage: false,
          endCursor: 'cursor_page_2'
        },
        nodes: SECOND_PAGE_FIELDS
      }
    }
  }
}

describe('getProjectBoardFieldList', () => {
  const graphql = mock.fn<Graphql>()
  const octokit = { graphql } as unknown as ReturnType<typeof getOctokit>

  beforeEach(() => {
    graphql.mock.resetCalls()
  })

  it('should return all fields from a single page', async () => {
    graphql.mock.mockImplementation((() =>
      Promise.resolve(SINGLE_PAGE_RESPONSE)) as unknown as Graphql)

    const result = await getProjectBoardFieldList({
      octokit,
      projectNumber,
      owner
    })

    assert.deepStrictEqual(result, FIRST_PAGE_FIELDS)
    assert.strictEqual(graphql.mock.callCount(), 1)
  })

  it('should paginate and return all fields from multiple pages', async () => {
    const responses = [FIRST_PAGE_RESPONSE, SECOND_PAGE_RESPONSE]
    let callIndex = 0
    graphql.mock.mockImplementation((() =>
      Promise.resolve(responses[callIndex++])) as unknown as Graphql)

    const result = await getProjectBoardFieldList({
      octokit,
      projectNumber,
      owner
    })

    assert.deepStrictEqual(result, [
      ...FIRST_PAGE_FIELDS,
      ...SECOND_PAGE_FIELDS
    ])
    assert.strictEqual(graphql.mock.callCount(), 2)
  })

  it('should pass cursor to subsequent graphql calls', async () => {
    const responses = [FIRST_PAGE_RESPONSE, SECOND_PAGE_RESPONSE]
    let callIndex = 0
    graphql.mock.mockImplementation((() =>
      Promise.resolve(responses[callIndex++])) as unknown as Graphql)

    await getProjectBoardFieldList({
      octokit,
      projectNumber,
      owner
    })

    const secondCallArgs = graphql.mock.calls[1].arguments[1] as {
      cursor: string
    }
    assert.strictEqual(secondCallArgs.cursor, 'cursor_page_1')
  })

  it('should throw an error with correct message when graphql fails', async () => {
    const errorMessage = 'GraphQL error'
    graphql.mock.mockImplementation((() =>
      Promise.reject(new Error(errorMessage))) as unknown as Graphql)

    await assert.rejects(
      getProjectBoardFieldList({
        octokit,
        projectNumber,
        owner
      }),
      (err: Error) => {
        assert.ok(err.message.includes('Error getting project field list:'))
        assert.ok(err.message.includes(errorMessage))
        return true
      }
    )
  })
})
