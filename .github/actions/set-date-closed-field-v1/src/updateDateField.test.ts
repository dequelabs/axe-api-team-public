import 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { getOctokit } from '@actions/github'
import updateDateField from './updateDateField'

describe('updateDateField', () => {
  let octokit: ReturnType<typeof getOctokit>
  let graphql: sinon.SinonStub

  beforeEach(() => {
    octokit = getOctokit('token')
    graphql = sinon.stub(octokit, 'graphql')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should update date field successfully', async () => {
    const mockArgs = {
      octokit,
      projectItemId: 'PVTI_lADOAD55W84AVmLazgJbJGI',
      fieldId: 'field_id_123',
      date: '2024-01-15',
      projectId: 'project_id_456'
    }

    graphql.resolves({
      updateProjectV2ItemFieldValue: {
        projectV2Item: {
          id: mockArgs.projectItemId
        }
      }
    })

    await updateDateField(mockArgs)

    void expect(graphql.calledOnce).to.be.true
    const callArgs = graphql.firstCall.args
    expect(callArgs[1]).to.deep.include({
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
    graphql.rejects(new Error(errorMessage))

    try {
      await updateDateField(mockArgs)
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect(error).to.be.instanceOf(Error)
      expect((error as Error).message).to.include('Failed to update date field')
      expect((error as Error).message).to.include(errorMessage)
    }
  })
})
