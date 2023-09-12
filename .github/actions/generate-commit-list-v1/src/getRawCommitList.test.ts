import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import dedent from 'dedent'
import * as exec from '@actions/exec'
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
        stdout: dedent`
          061acd5 refactor(integrations/javascript): some refactor (#664)
          4d6220e chore: Update dependencies (#680)
        `,
        stderr: ''
      })

      const rawCommitList = await getRawCommitList({
        base: 'base-branch',
        head: 'head-branch'
      })

      assert.lengthOf(rawCommitList, 2)
      const [firstCommit, secondCommit] = rawCommitList
      assert.include(firstCommit, '061acd5')
      assert.include(secondCommit, '4d6220e')
    })
  })

  describe('when the raw commit list cannot be retrieved', () => {
    it('throws an error', async () => {
      getExecOutputStub.throws({
        exitCode: 1,
        stdout: '',
        stderr: 'fatal: welp, guess something went wrong'
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
