import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import * as exec from '@actions/exec'
import { expectedRepositoryURL, rawRepositoryURL } from './test-utils'
import getRepositoryURL from './getRepositoryURL'

describe('getRepositoryURL', () => {
  let getExecOutputStub: sinon.SinonStub

  beforeEach(() => {
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(() => {
    getExecOutputStub.restore()
  })

  describe('when the repository URL is successfully retrieved', () => {
    it('returns the repository URL', async () => {
      getExecOutputStub.resolves({
        exitCode: 0,
        stdout: rawRepositoryURL,
        stderr: ''
      })

      const repositoryURL = await getRepositoryURL()

      assert.equal(repositoryURL, expectedRepositoryURL)
    })
  })

  describe('when the repository URL cannot be retrieved', () => {
    it('throws an error', async () => {
      getExecOutputStub.throws({
        exitCode: 1,
        stdout: '',
        stderr:
          'fatal: not a git repository (or any of the parent directories): .git'
      })

      let error: Error | null = null
      try {
        await getRepositoryURL()
      } catch (e) {
        error = e as Error
      }

      assert.isNotNull(error)
      assert.include(error?.message, 'Unable to get repository URL')
    })
  })
})
