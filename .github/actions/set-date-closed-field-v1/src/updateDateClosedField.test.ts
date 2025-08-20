import { expect } from 'chai'
import * as sinon from 'sinon'
import * as exec from '@actions/exec'
import updateDateClosedField from './updateDateClosedField'

describe('updateDateClosedField', () => {
  let execStub: sinon.SinonStubbedInstance<typeof exec>

  beforeEach(() => {
    execStub = sinon.stub(exec)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should update DateClosed field successfully', async () => {
    // Set up environment variable
    process.env.GH_TOKEN = 'test-token'

    const mockArgs = {
      projectItemId: 'PVTI_lADOAD55W84AVmLazgJbJGI',
      fieldId: 'field_id_123',
      date: '2024-01-15',
      projectId: 'project_id_456'
    }

    execStub.getExecOutput.resolves({
      stdout: '{"id": "PVTI_lADOAD55W84AVmLazgJbJGI"}',
      stderr: '',
      exitCode: 0
    })

    await updateDateClosedField(mockArgs)

    void expect(execStub.getExecOutput.calledOnce).to.be.true
    const callArgs = execStub.getExecOutput.firstCall.args
    expect(callArgs[0]).to.include('gh project item-edit')
    expect(callArgs[0]).to.include('--id PVTI_lADOAD55W84AVmLazgJbJGI')
    expect(callArgs[0]).to.include('--field-id field_id_123')
    expect(callArgs[0]).to.include('--date 2024-01-15')
    expect(callArgs[0]).to.include('--project-id project_id_456')
  })

  it('should handle errors gracefully', async () => {
    // Set up environment variable
    process.env.GH_TOKEN = 'test-token'

    const mockArgs = {
      projectItemId: 'PVTI_lADOAD55W84AVmLazgJbJGS',
      fieldId: 'field_id_123',
      date: '2024-01-15',
      projectId: 'project_id_456'
    }

    const errorMessage = 'Command failed'
    execStub.getExecOutput.rejects(new Error(errorMessage))

    try {
      await updateDateClosedField(mockArgs)
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect(error).to.be.instanceOf(Error)
      expect((error as Error).message).to.include(
        'Failed to update DateClosed field'
      )
      expect((error as Error).message).to.include(errorMessage)
    }
  })

  it('should fail when GH_TOKEN is not set', async () => {
    // Clear environment variable
    delete process.env.GH_TOKEN

    const mockArgs = {
      projectItemId: 'PVTI_lADOAD55W84AVmLazgJbJGI',
      fieldId: 'field_id_123',
      date: '2024-01-15',
      projectId: 'project_id_456'
    }

    try {
      await updateDateClosedField(mockArgs)
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect(error).to.be.instanceOf(Error)
      expect((error as Error).message).to.equal(
        'GH_TOKEN environment variable is required'
      )
    }
  })
})
