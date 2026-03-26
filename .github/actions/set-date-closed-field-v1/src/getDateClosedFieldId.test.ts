import 'mocha'
import sinon from 'sinon'
import { assert } from 'chai'
import { getOctokit } from '@actions/github'
import getDateClosedFieldId from './getDateClosedFieldId'
import * as getProjectBoardFieldListModule from './getProjectBoardFieldList'

const owner = 'test-org'
const projectNumber = 123

const MOCK_FIELDS = [
  { id: 'PVTF_field1', name: 'Title' },
  { id: 'PVTF_field2', name: 'Status' },
  { id: 'PVTF_field3', name: 'DateClosed' },
  { id: 'PVTF_field4', name: 'Priority' }
]

describe('getDateClosedFieldId', () => {
  let octokit: ReturnType<typeof getOctokit>
  let getProjectBoardFieldListStub: sinon.SinonStub

  beforeEach(() => {
    octokit = getOctokit('token')
    getProjectBoardFieldListStub = sinon.stub(
      getProjectBoardFieldListModule,
      'default'
    )
  })

  afterEach(sinon.restore)

  it('should return field ID when field is found', async () => {
    getProjectBoardFieldListStub.resolves(MOCK_FIELDS)

    const result = await getDateClosedFieldId({
      octokit,
      owner,
      projectNumber,
      fieldName: 'DateClosed'
    })

    assert.equal(result, 'PVTF_field3')
  })

  it('should return field ID for a custom field name', async () => {
    getProjectBoardFieldListStub.resolves(MOCK_FIELDS)

    const result = await getDateClosedFieldId({
      octokit,
      owner,
      projectNumber,
      fieldName: 'Priority'
    })

    assert.equal(result, 'PVTF_field4')
  })

  it('should return null when field is not found', async () => {
    getProjectBoardFieldListStub.resolves(MOCK_FIELDS)

    const result = await getDateClosedFieldId({
      octokit,
      owner,
      projectNumber,
      fieldName: 'NonExistentField'
    })

    assert.isNull(result)
  })

  it('should return null when fields list is empty', async () => {
    getProjectBoardFieldListStub.resolves([])

    const result = await getDateClosedFieldId({
      octokit,
      owner,
      projectNumber,
      fieldName: 'DateClosed'
    })

    assert.isNull(result)
  })

  it('should throw an error with correct message including field name', async () => {
    const errorMessage = 'API error'
    const fieldName = 'MyCustomField'
    getProjectBoardFieldListStub.rejects(new Error(errorMessage))

    try {
      await getDateClosedFieldId({
        octokit,
        owner,
        projectNumber,
        fieldName
      })
      assert.fail('Expected error to be thrown')
    } catch (err) {
      const error = err as Error
      assert.include(error.message, `Failed to get "${fieldName}" field ID:`)
      assert.include(error.message, errorMessage)
    }
  })
})
