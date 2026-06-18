import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { getOctokit } from '@actions/github'
import run from './run'
import type { Core, GitHub } from './types'

type Graphql = ReturnType<typeof getOctokit>['graphql']
type IssuesGet = ReturnType<typeof getOctokit>['rest']['issues']['get']

const MOCK_PROJECT_ITEM_ID = 'PVTI_lADOAD55W84AVmLazgJbJGI'
const MOCK_PROJECT_ID = 'PVT_123'
const MOCK_DATE_CLOSED_FIELD_ID = 'field_id_123'

const PROJECT_ITEM_RESPONSE = {
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
}

const FIELDS_RESPONSE = {
  organization: {
    projectV2: {
      fields: {
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        },
        nodes: [
          { id: 'field_id_status', name: 'Status' },
          { id: MOCK_DATE_CLOSED_FIELD_ID, name: 'DateClosed' }
        ]
      }
    }
  }
}

const UPDATE_FIELD_RESPONSE = {
  updateProjectV2ItemFieldValue: {
    projectV2Item: {
      id: MOCK_PROJECT_ITEM_ID
    }
  }
}

const DEFAULT_INPUTS: Record<string, string> = {
  token: 'test-token',
  'issue-number': '123',
  'issue-organization': 'test-org',
  'issue-repo': 'test-repo',
  'project-number': '123',
  'date-field-name': 'DateClosed'
}

describe('run', () => {
  const graphql = mock.fn<Graphql>()
  const issuesGet = mock.fn<IssuesGet>()
  const getInput = mock.fn((name: string) => DEFAULT_INPUTS[name] ?? '')
  const setFailed = mock.fn<(message: string) => void>()
  const info = mock.fn<(message: string) => void>()
  const setOutput = mock.fn()

  const octokit = {
    rest: {
      issues: {
        get: issuesGet
      }
    },
    graphql
  } as unknown as ReturnType<typeof getOctokit>

  const getOctokitMock = mock.fn(() => octokit)

  const core = {
    getInput,
    setFailed,
    info,
    setOutput
  } as unknown as Core

  const github = {
    context: {
      repo: {
        owner: 'default-owner',
        repo: 'default-repo'
      }
    },
    getOctokit: getOctokitMock
  } as unknown as GitHub

  // graphql call sequence: 0=getProjectItemId, 1=getFieldIdByName, 2=updateDateField
  let graphqlResponses: unknown[]
  let graphqlCallIndex: number

  beforeEach(() => {
    graphql.mock.resetCalls()
    issuesGet.mock.resetCalls()
    getInput.mock.resetCalls()
    setFailed.mock.resetCalls()
    info.mock.resetCalls()
    setOutput.mock.resetCalls()
    getOctokitMock.mock.resetCalls()

    getInput.mock.mockImplementation(
      (name: string) => DEFAULT_INPUTS[name] ?? ''
    )

    issuesGet.mock.mockImplementation((() =>
      Promise.resolve({
        data: {
          state: 'closed',
          state_reason: 'completed',
          closed_at: '2024-01-15T10:30:00Z',
          html_url: 'https://github.com/test/repo/issues/123',
          labels: []
        }
      })) as unknown as IssuesGet)

    graphqlResponses = [
      PROJECT_ITEM_RESPONSE,
      FIELDS_RESPONSE,
      UPDATE_FIELD_RESPONSE
    ]
    graphqlCallIndex = 0
    graphql.mock.mockImplementation((() =>
      Promise.resolve(
        graphqlResponses[graphqlCallIndex++]
      )) as unknown as Graphql)
  })

  it('should update DateClosed field when issue is closed and completed', async () => {
    await run(core, github)

    assert.strictEqual(graphql.mock.callCount(), 3)

    // Check that the update mutation was called with correct args
    const updateCallArgs = graphql.mock.calls[2].arguments[1] as {
      itemId: string
      fieldId: string
      date: string
      projectId: string
    }
    assert.strictEqual(updateCallArgs.itemId, MOCK_PROJECT_ITEM_ID)
    assert.strictEqual(updateCallArgs.fieldId, MOCK_DATE_CLOSED_FIELD_ID)
    assert.strictEqual(updateCallArgs.date, '2024-01-15')
    assert.strictEqual(updateCallArgs.projectId, MOCK_PROJECT_ID)
  })

  it('should request issue-number and project-number as required inputs', async () => {
    await run(core, github)

    const inputOptions = (name: string) =>
      (
        getInput.mock.calls.find(call => call.arguments[0] === name)
          ?.arguments as [string, { required?: boolean }?] | undefined
      )?.[1]

    // Tightening an input to required is a breaking change, so assert the
    // required option is passed for the inputs that depend on it.
    assert.strictEqual(inputOptions('issue-number')?.required, true)
    assert.strictEqual(inputOptions('project-number')?.required, true)
  })

  it('should fail when a required input is empty', async () => {
    // Mirror @actions/core.getInput, which throws when a required input is
    // empty, to prove run surfaces the failure rather than parsing ''.
    getInput.mock.mockImplementation(
      (name: string, options?: { required?: boolean }) => {
        const value =
          name === 'issue-number' ? '' : (DEFAULT_INPUTS[name] ?? '')
        if (options?.required && !value) {
          throw new Error(`Input required and not supplied: ${name}`)
        }
        return value
      }
    )

    await run(core, github)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      'Action failed: Input required and not supplied: issue-number'
    )
  })

  it('should use custom date-field-name input', async () => {
    const customFieldName = 'MyDateField'
    const customFieldId = 'field_id_custom'

    getInput.mock.mockImplementation((name: string) =>
      name === 'date-field-name'
        ? customFieldName
        : (DEFAULT_INPUTS[name] ?? '')
    )

    // Override fields response with custom field
    graphqlResponses[1] = {
      organization: {
        projectV2: {
          fields: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [
              { id: 'field_id_status', name: 'Status' },
              { id: customFieldId, name: customFieldName }
            ]
          }
        }
      }
    }

    await run(core, github)

    assert.strictEqual(graphql.mock.callCount(), 3)
    const updateCallArgs = graphql.mock.calls[2].arguments[1] as {
      fieldId: string
    }
    assert.strictEqual(updateCallArgs.fieldId, customFieldId)
  })

  it('should default date-field-name to DateClosed when not provided', async () => {
    getInput.mock.mockImplementation((name: string) =>
      name === 'date-field-name' ? '' : (DEFAULT_INPUTS[name] ?? '')
    )

    await run(core, github)

    assert.strictEqual(graphql.mock.callCount(), 3)
    const updateCallArgs = graphql.mock.calls[2].arguments[1] as {
      fieldId: string
    }
    assert.strictEqual(updateCallArgs.fieldId, MOCK_DATE_CLOSED_FIELD_ID)
  })

  it('should not update field when issue is not closed', async () => {
    getInput.mock.mockImplementation((name: string) =>
      name === 'date-field-name' ? '' : (DEFAULT_INPUTS[name] ?? '')
    )

    issuesGet.mock.mockImplementation((() =>
      Promise.resolve({
        data: {
          state: 'open',
          state_reason: null,
          closed_at: null,
          html_url: 'https://github.com/test/repo/issues/123',
          labels: []
        }
      })) as unknown as IssuesGet)

    await run(core, github)

    assert.strictEqual(graphql.mock.callCount(), 0)
  })

  it('should not update field when issue is closed but not completed', async () => {
    getInput.mock.mockImplementation((name: string) =>
      name === 'date-field-name' ? '' : (DEFAULT_INPUTS[name] ?? '')
    )

    issuesGet.mock.mockImplementation((() =>
      Promise.resolve({
        data: {
          state: 'closed',
          state_reason: 'not_planned',
          closed_at: '2024-01-15T10:30:00Z',
          html_url: 'https://github.com/test/repo/issues/123',
          labels: []
        }
      })) as unknown as IssuesGet)

    await run(core, github)

    assert.strictEqual(graphql.mock.callCount(), 0)
  })

  it('should not update field when issue is closed but has no closed_at date', async () => {
    getInput.mock.mockImplementation((name: string) =>
      name === 'date-field-name' ? '' : (DEFAULT_INPUTS[name] ?? '')
    )

    issuesGet.mock.mockImplementation((() =>
      Promise.resolve({
        data: {
          state: 'closed',
          state_reason: 'completed',
          closed_at: null,
          html_url: 'https://github.com/test/repo/issues/123',
          labels: []
        }
      })) as unknown as IssuesGet)

    await run(core, github)

    assert.strictEqual(graphql.mock.callCount(), 0)
  })

  it('should handle case when issue is not in project', async () => {
    getInput.mock.mockImplementation((name: string) =>
      name === 'date-field-name' ? '' : (DEFAULT_INPUTS[name] ?? '')
    )

    graphqlResponses[0] = {
      repository: {
        issue: {
          projectItems: {
            nodes: []
          }
        }
      }
    }

    await run(core, github)

    // Only one graphql call (getProjectItemId), no field list or update calls
    assert.strictEqual(graphql.mock.callCount(), 1)
  })

  it('should setFailed when date field is not found in project', async () => {
    // Override fields response without DateClosed
    graphqlResponses[1] = {
      organization: {
        projectV2: {
          fields: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [{ id: 'field_id_status', name: 'Status' }]
          }
        }
      }
    }

    await run(core, github)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.ok(
      setFailed.mock.calls[0].arguments[0].includes(
        '"DateClosed" field not found'
      )
    )
    // Only two graphql calls (getProjectItemId + getFieldIdByName), no update call
    assert.strictEqual(graphql.mock.callCount(), 2)
  })

  it('should fail when token is not provided', async () => {
    getInput.mock.mockImplementation((name: string) =>
      name === 'token' ? '' : (DEFAULT_INPUTS[name] ?? '')
    )

    await run(core, github)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      '`token` input is not set'
    )
  })

  it('should handle errors gracefully', async () => {
    getInput.mock.mockImplementation(() => {
      throw new Error('Test error')
    })

    await run(core, github)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.ok(setFailed.mock.calls[0].arguments[0].includes('Test error'))
  })

  it('should handle non-Error thrown values', async () => {
    issuesGet.mock.mockImplementation((() =>
      Promise.reject('string failure')) as unknown as IssuesGet)

    await run(core, github)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      'Action failed: string failure'
    )
  })

  it('should fail when issue-number is not a valid number', async () => {
    getInput.mock.mockImplementation((name: string) => {
      if (name === 'token') return 'test-token'
      if (name === 'issue-number') return 'invalid-number'
      return ''
    })

    await run(core, github)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      '`issue-number` must be a number'
    )
  })

  it('should fail when project-number is not a valid number', async () => {
    getInput.mock.mockImplementation((name: string) => {
      if (name === 'token') return 'test-token'
      if (name === 'issue-number') return '123'
      if (name === 'project-number') return 'invalid-number'
      return ''
    })

    await run(core, github)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      '`project-number` must be a number'
    )
  })

  it('should use default organization and repo from context when not provided', async () => {
    getInput.mock.mockImplementation((name: string) => {
      if (name === 'issue-organization' || name === 'issue-repo') return ''
      if (name === 'date-field-name') return ''
      return DEFAULT_INPUTS[name] ?? ''
    })

    await run(core, github)

    assert.strictEqual(graphql.mock.callCount(), 3)
  })
})
