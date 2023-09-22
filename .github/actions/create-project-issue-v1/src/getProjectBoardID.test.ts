import 'mocha'
import { assert } from 'chai'
import * as exec from '@actions/exec'
import sinon from 'sinon'
import getProjectBoardID from './getProjectBoardID'

export const MOCK_PROJECT_BOARD_ID = {
  id: '123'
}

describe('getProjectBoardID', () => {
  let getExecOutput: sinon.SinonStub

  beforeEach(() => {
    getExecOutput = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(sinon.restore)

  describe('when given a valid project number and owner', () => {
    it('returns the project board ID', async () => {
      getExecOutput.resolves({
        stdout: JSON.stringify(MOCK_PROJECT_BOARD_ID),
        stderr: '',
        exitCode: 0
      })

      const projectBoardID = await getProjectBoardID({
        projectNumber: 66,
        owner: 'owner'
      })

      assert.deepEqual(projectBoardID, MOCK_PROJECT_BOARD_ID)
    })
  })

  describe('when getting the project board ID fails', () => {
    it('throws an error', async () => {
      getExecOutput.rejects(new Error('Error getting project board ID'))

      try {
        await getProjectBoardID({
          projectNumber: 66,
          owner: 'owner'
        })
      } catch (error) {
        assert.include(
          (error as Error).message,
          'Error getting project board ID'
        )
      }
    })
  })
})
