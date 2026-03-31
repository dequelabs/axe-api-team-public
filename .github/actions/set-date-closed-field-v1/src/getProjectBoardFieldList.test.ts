import 'mocha'
import sinon from 'sinon'
import { assert } from 'chai'
import { getOctokit } from '@actions/github'
import getProjectBoardFieldList, {
  ProjectFieldNode
} from './getProjectBoardFieldList'

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
  let octokit: ReturnType<typeof getOctokit>
  let graphql: sinon.SinonStub

  beforeEach(() => {
    octokit = getOctokit('token')
    graphql = sinon.stub(octokit, 'graphql')
  })

  afterEach(sinon.restore)

  it('should return all fields from a single page', async () => {
    graphql.resolves(SINGLE_PAGE_RESPONSE)

    const result = await getProjectBoardFieldList({
      octokit,
      projectNumber,
      owner
    })

    assert.deepEqual(result, FIRST_PAGE_FIELDS)
    assert.isTrue(graphql.calledOnce)
  })

  it('should paginate and return all fields from multiple pages', async () => {
    graphql.onCall(0).resolves(FIRST_PAGE_RESPONSE)
    graphql.onCall(1).resolves(SECOND_PAGE_RESPONSE)

    const result = await getProjectBoardFieldList({
      octokit,
      projectNumber,
      owner
    })

    assert.deepEqual(result, [...FIRST_PAGE_FIELDS, ...SECOND_PAGE_FIELDS])
    assert.isTrue(graphql.calledTwice)
  })

  it('should pass cursor to subsequent graphql calls', async () => {
    graphql.onCall(0).resolves(FIRST_PAGE_RESPONSE)
    graphql.onCall(1).resolves(SECOND_PAGE_RESPONSE)

    await getProjectBoardFieldList({
      octokit,
      projectNumber,
      owner
    })

    const secondCallArgs = graphql.secondCall.args[1]
    assert.equal(secondCallArgs.cursor, 'cursor_page_1')
  })

  it('should throw an error with correct message when graphql fails', async () => {
    const errorMessage = 'GraphQL error'
    graphql.rejects(new Error(errorMessage))

    try {
      await getProjectBoardFieldList({
        octokit,
        projectNumber,
        owner
      })
      assert.fail('Expected error to be thrown')
    } catch (err) {
      const error = err as Error
      assert.include(error.message, 'Error getting project field list:')
      assert.include(error.message, errorMessage)
    }
  })
})
