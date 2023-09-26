import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import * as exec from '@actions/exec'
import { expectedRawCommitList, rawCommitList } from './test-utils'
import getRawCommitList from './getRawCommitList'

describe('getRawCommitList', () => {
  let getExecOutputStub: sinon.SinonStub

  beforeEach(() => {
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(() => {
    getExecOutputStub.restore()
  })

  describe('when the raw commit list is successfully retrieved', () => {
    it('returns the raw commit list', async () => {
      getExecOutputStub.resolves({
        exitCode: 0,
        stdout: rawCommitList,
        stderr: ''
      })

      const rawCommitListParsed = await getRawCommitList({
        base: 'base-branch',
        head: 'head-branch'
      })

      assert.deepEqual(rawCommitListParsed, expectedRawCommitList)
    })
  })

  describe('when the raw commit list cannot be retrieved', () => {
    it('throws an error', async () => {
      getExecOutputStub.throws({
        exitCode: 1,
        stdout: '',
        stderr: 'welp, guess something went wrong'
      })

      let error: Error | null = null
      try {
        await getRawCommitList({
          base: 'base-branch',
          head: 'head-branch'
        })
      } catch (e) {
        error = e as Error
      }

      assert.isNotNull(error)
      assert.include(error?.message, 'Unable to get raw commit list')
    })
  })
})
