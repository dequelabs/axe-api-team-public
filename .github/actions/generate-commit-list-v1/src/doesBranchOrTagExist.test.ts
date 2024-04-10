import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import * as exec from '@actions/exec'
import doesBranchOrTagExist from './doesBranchOrTagExist'

describe('doesBranchOrTagExist', () => {
  let getExecOutputStub: sinon.SinonStub

  beforeEach(() => {
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(() => {
    sinon.resetHistory()
    sinon.restore()
  })

  describe('when the branch exists', () => {
    it('returns true', async () => {
      const branchName: string = 'my-branch-name'

      getExecOutputStub.resolves({
        exitCode: 0,
        stdout: 'refs/heads/my-branch-name'
      })

      const branchExists = await doesBranchOrTagExist({ branchName })

      assert.isTrue(
        getExecOutputStub.calledOnceWithExactly(
          `git rev-parse --verify origin/${branchName}`
        )
      )
      assert.isTrue(branchExists)
    })
  })

  describe('when the tag exists', () => {
    it('returns true', async () => {
      const tag: string = 'my-tag-name'

      getExecOutputStub.resolves({
        exitCode: 0,
        stdout: 'refs/tags/my-tag-name'
      })

      const tagExists = await doesBranchOrTagExist({ tag })

      assert.isTrue(
        getExecOutputStub.calledOnceWithExactly(`git rev-parse --verify ${tag}`)
      )
      assert.isTrue(tagExists)
    })
  })

  describe('when the branch does not exist', () => {
    it('returns false', async () => {
      getExecOutputStub.throws({
        stdout: ''
      })

      const branchExists = await doesBranchOrTagExist({
        branchName: 'my-branch-name'
      })

      assert.isFalse(branchExists)
    })
  })

  describe('when the tag does not exist', () => {
    it('returns false', async () => {
      getExecOutputStub.throws({
        stdout: ''
      })

      const tagExists = await doesBranchOrTagExist({ tag: 'my-tag-name' })

      assert.isFalse(tagExists)
    })
  })
})
