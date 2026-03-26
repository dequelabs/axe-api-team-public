import { expect } from 'chai'
import * as sinon from 'sinon'
import * as core from '@actions/core'
import * as github from '@actions/github'
import run from './run'

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

describe('run', () => {
  let coreStub: sinon.SinonStubbedInstance<typeof core>
  let octokitStub: {
    rest: {
      issues: {
        get: sinon.SinonStub
      }
    }
    graphql: sinon.SinonStub
  }
  let mockGitHub: any // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    coreStub = sinon.stub(core)

    mockGitHub = {
      context: {
        repo: {
          owner: 'default-owner',
          repo: 'default-repo'
        }
      },
      getOctokit: sinon.stub()
    }

    octokitStub = {
      rest: {
        issues: {
          get: sinon.stub().resolves({
            data: {
              state: 'closed',
              state_reason: 'completed',
              closed_at: '2024-01-15T10:30:00Z',
              html_url: 'https://github.com/test/repo/issues/123',
              labels: []
            }
          })
        }
      },
      graphql: sinon.stub()
    }

    // First graphql call: getProjectItemId
    octokitStub.graphql.onCall(0).resolves(PROJECT_ITEM_RESPONSE)
    // Second graphql call: getProjectBoardFieldList
    octokitStub.graphql.onCall(1).resolves(FIELDS_RESPONSE)
    // Third graphql call: updateDateField
    octokitStub.graphql.onCall(2).resolves(UPDATE_FIELD_RESPONSE)

    mockGitHub.getOctokit.returns(
      octokitStub as unknown as ReturnType<typeof github.getOctokit>
    )
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should update DateClosed field when issue is closed and completed', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('date-field-name').returns('DateClosed')

    await run(coreStub, mockGitHub)

    void expect(octokitStub.graphql.calledThrice).to.be.true

    // Check that the update mutation was called with correct args
    const updateCallArgs = octokitStub.graphql.thirdCall.args[1]
    void expect(updateCallArgs.itemId).to.equal(MOCK_PROJECT_ITEM_ID)
    void expect(updateCallArgs.fieldId).to.equal(MOCK_DATE_CLOSED_FIELD_ID)
    void expect(updateCallArgs.date).to.equal('2024-01-15')
    void expect(updateCallArgs.projectId).to.equal(MOCK_PROJECT_ID)
  })

  it('should use custom date-field-name input', async () => {
    const customFieldName = 'MyDateField'
    const customFieldId = 'field_id_custom'

    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('date-field-name').returns(customFieldName)

    // Override fields response with custom field
    octokitStub.graphql.onCall(1).resolves({
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
    })

    await run(coreStub, mockGitHub)

    void expect(octokitStub.graphql.calledThrice).to.be.true
    const updateCallArgs = octokitStub.graphql.thirdCall.args[1]
    void expect(updateCallArgs.fieldId).to.equal(customFieldId)
  })

  it('should default date-field-name to DateClosed when not provided', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('date-field-name').returns('')

    await run(coreStub, mockGitHub)

    void expect(octokitStub.graphql.calledThrice).to.be.true
    const updateCallArgs = octokitStub.graphql.thirdCall.args[1]
    void expect(updateCallArgs.fieldId).to.equal(MOCK_DATE_CLOSED_FIELD_ID)
  })

  it('should not update field when issue is not closed', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('date-field-name').returns('')

    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'open',
        state_reason: null,
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/123',
        labels: []
      }
    })

    await run(coreStub, mockGitHub)

    void expect(octokitStub.graphql.called).to.be.false
  })

  it('should not update field when issue is closed but not completed', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('date-field-name').returns('')

    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'closed',
        state_reason: 'not_planned',
        closed_at: '2024-01-15T10:30:00Z',
        html_url: 'https://github.com/test/repo/issues/123',
        labels: []
      }
    })

    await run(coreStub, mockGitHub)

    void expect(octokitStub.graphql.called).to.be.false
  })

  it('should not update field when issue is closed but has no closed_at date', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('date-field-name').returns('')

    octokitStub.rest.issues.get.resolves({
      data: {
        state: 'closed',
        state_reason: 'completed',
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/123',
        labels: []
      }
    })

    await run(coreStub, mockGitHub)

    void expect(octokitStub.graphql.called).to.be.false
  })

  it('should handle case when issue is not in project', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('date-field-name').returns('')

    octokitStub.graphql.onCall(0).resolves({
      repository: {
        issue: {
          projectItems: {
            nodes: []
          }
        }
      }
    })

    await run(coreStub, mockGitHub)

    // Only one graphql call (getProjectItemId), no field list or update calls
    void expect(octokitStub.graphql.calledOnce).to.be.true
  })

  it('should setFailed when date field is not found in project', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('test-org')
    coreStub.getInput.withArgs('issue-repo').returns('test-repo')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('date-field-name').returns('DateClosed')

    // Override fields response without DateClosed
    octokitStub.graphql.onCall(1).resolves({
      organization: {
        projectV2: {
          fields: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [{ id: 'field_id_status', name: 'Status' }]
          }
        }
      }
    })

    await run(coreStub, mockGitHub)

    void expect(coreStub.setFailed.calledOnce).to.be.true
    void expect(coreStub.setFailed.firstCall.args[0]).to.include(
      '"DateClosed" field not found'
    )
    // Only two graphql calls (getProjectItemId + getFieldIdByName), no update call
    void expect(octokitStub.graphql.calledTwice).to.be.true
  })

  it('should fail when token is not provided', async () => {
    coreStub.getInput.withArgs('token').returns('')

    await run(coreStub, mockGitHub)

    void expect(coreStub.setFailed.calledOnce).to.be.true
    void expect(coreStub.setFailed.firstCall.args[0]).to.equal(
      '`token` input is not set'
    )
  })

  it('should handle errors gracefully', async () => {
    coreStub.getInput.throws(new Error('Test error'))

    await run(coreStub, mockGitHub)

    void expect(coreStub.setFailed.calledOnce).to.be.true
    void expect(coreStub.setFailed.firstCall.args[0]).to.include('Test error')
  })

  it('should fail when issue-number is not a valid number', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('invalid-number')

    await run(coreStub, mockGitHub)

    void expect(coreStub.setFailed.calledOnce).to.be.true
    void expect(coreStub.setFailed.firstCall.args[0]).to.equal(
      '`issue-number` must be a number'
    )
  })

  it('should fail when project-number is not a valid number', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('invalid-number')

    await run(coreStub, mockGitHub)

    void expect(coreStub.setFailed.calledOnce).to.be.true
    void expect(coreStub.setFailed.firstCall.args[0]).to.equal(
      '`project-number` must be a number'
    )
  })

  it('should use default organization and repo from context when not provided', async () => {
    coreStub.getInput.withArgs('token').returns('test-token')
    coreStub.getInput
      .withArgs('issue-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('issue-organization').returns('')
    coreStub.getInput.withArgs('issue-repo').returns('')
    coreStub.getInput
      .withArgs('project-number', { required: true })
      .returns('123')
    coreStub.getInput.withArgs('date-field-name').returns('')

    await run(coreStub, mockGitHub)

    void expect(octokitStub.graphql.calledThrice).to.be.true
  })
})
