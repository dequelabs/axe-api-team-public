import 'mocha'
import { assert } from 'chai'
import * as exec from '@actions/exec'
import sinon from 'sinon'
import getProjectFieldList, {
  type ProjectFieldListResponse
} from './getProjectFieldList'

export const MOCK_FIELD_LIST: ProjectFieldListResponse = {
  fields: [
    {
      id: '123',
      name: 'Status',
      type: 'ProjectV2',
      options: [
        {
          id: '456',
          name: 'Backlog'
        }
      ]
    }
  ],
  totalCount: 1
}

describe('getProjectFieldList', () => {
  let getExecOutput: sinon.SinonStub

  beforeEach(() => {
    getExecOutput = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(sinon.restore)

  describe('when given a valid project number and owner', () => {
    it('returns the project field list', async () => {
      getExecOutput.resolves({
        stdout: JSON.stringify(MOCK_FIELD_LIST),
        stderr: '',
        exitCode: 0
      })

      const projectFieldList = await getProjectFieldList({
        projectNumber: 66,
        owner: 'owner'
      })

      assert.deepEqual(projectFieldList, MOCK_FIELD_LIST)
    })
  })

  describe('when getting the project field list fails', () => {
    it('throws an error', async () => {
      getExecOutput.rejects(new Error('Error getting project field list'))
      let error: Error | null = null

      try {
        await getProjectFieldList({
          projectNumber: 66,
          owner: 'owner'
        })
      } catch (err) {
        error = err as Error
      }

      assert.isNotNull(error)
      assert.include(error?.message, 'Error getting project field list')
    })
  })
})
