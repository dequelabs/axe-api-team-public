import 'mocha'
import { assert } from 'chai'
import {
  expectedParsedCommitList,
  expectedRawCommitList,
  expectedRepository
} from './test-utils'
import sinon from 'sinon'
import * as exec from '@actions/exec'
import getParsedCommitList from './getParsedCommitList'

describe('getParsedCommitList', () => {
  afterEach(sinon.restore)

  describe('when all commits values are available', () => {
    it('returns the parsed commit list', async () => {
      sinon
        .stub(exec, 'getExecOutput')
        .onFirstCall()
        .resolves({
          stdout: '',
          stderr: '',
          exitCode: 0
        })
        .onSecondCall()
        .resolves({
          stdout: '456',
          stderr: '',
          exitCode: 0
        })

      const parsedCommitList = await getParsedCommitList({
        rawCommitList: expectedRawCommitList,
        repository: expectedRepository
      })

      assert.deepEqual(parsedCommitList, expectedParsedCommitList)
    })
  })

  describe('when the PR ID is not available', () => {
    it('returns null for the PR ID', async () => {
      const parsedCommitList = await getParsedCommitList({
        rawCommitList: ['4d6220e feat: add new feature'],
        repository: expectedRepository
      })

      assert.deepEqual(parsedCommitList, [
        {
          commit: '4d6220e feat: add new feature',
          title: 'feat: add new feature',
          sha: '4d6220e',
          type: 'feat',
          id: null,
          link: null
        }
      ])
    })
  })
})
