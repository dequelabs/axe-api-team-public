import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import * as exec from '@actions/exec'
import { expectedRawCommitList, rawCommitList } from './testUtils'
import getRawCommitList from './getRawCommitList'

describe('getRawCommitList', () => {
  let getExecOutputStub: sinon.SinonStub

  beforeEach(() => {
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(() => {
    sinon.resetHistory()
    sinon.restore()
  })

  describe('when the raw commit list is successfully retrieved', () => {
    it('returns the raw commit list from base and head branches', async () => {
      const base: string = 'base-branch'
      const head: string = 'head-branch'

      getExecOutputStub.resolves({
        exitCode: 0,
        stdout: rawCommitList,
        stderr: ''
      })

      const rawCommitListParsed = await getRawCommitList({ base, head })

      assert.isTrue(
        getExecOutputStub.calledOnceWithExactly(
          `git log origin/${base}..origin/${head} --oneline --no-merges --abbrev-commit`
        )
      )
      assert.deepEqual(rawCommitListParsed, expectedRawCommitList)
    })

    it('returns the raw commit list from a tag', async () => {
      const tag: string = 'v1.0.0'

      getExecOutputStub.resolves({
        exitCode: 0,
        stdout: rawCommitList,
        stderr: ''
      })

      const rawCommitListParsed = await getRawCommitList({ tag })

      assert.isTrue(
        getExecOutputStub.calledOnceWithExactly(
          `git log ${tag}..HEAD --oneline --no-merges --abbrev-commit`
        )
      )
      assert.deepEqual(rawCommitListParsed, expectedRawCommitList)
    })
  })

  describe('when the raw commit list cannot be retrieved', () => {
    it('throws an error', async () => {
      getExecOutputStub.throws({
        stdout: ''
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
