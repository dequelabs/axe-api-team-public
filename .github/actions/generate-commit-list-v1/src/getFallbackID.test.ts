import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import * as exec from '@actions/exec'
import getFallbackID from './getFallbackID'

describe('getFallbackID', () => {
  let getExecOutputStub: sinon.SinonStub

  beforeEach(() => {
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(sinon.restore)

  describe('when the fallback method succeeds to get a PR ID', () => {
    it('returns the ID', async () => {
      getExecOutputStub.resolves({
        exitCode: 0,
        stdout: '123',
        stderr: ''
      })

      const fallbackID = await getFallbackID('abc')

      assert.equal(fallbackID, '123')
    })
  })

  describe('when the fallback method fails to get a PR ID', () => {
    it('returns null', async () => {
      getExecOutputStub.throws({
        stdout: ''
      })

      const fallbackID = await getFallbackID('abc')

      assert.isNull(fallbackID)
    })
  })

  describe('when the fallback method throws an error', () => {
    it('returns null', async () => {
      getExecOutputStub.throws({
        stdout: ''
      })

      const fallbackID = await getFallbackID('abc')

      assert.isNull(fallbackID)
    })
  })
})
