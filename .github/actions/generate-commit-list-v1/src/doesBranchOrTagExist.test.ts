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
    getExecOutputStub.restore()
  })

  describe('when the branch exists', () => {
    it('returns true', async () => {
      getExecOutputStub.resolves({
        exitCode: 0,
        stdout: 'refs/heads/my-branch-name'
      })

      const branchExists = await doesBranchOrTagExist({
        branchName: 'my-branch-name'
      })

      assert.isTrue(branchExists)
    })
  })

  describe('when the tag exists', () => {
    it('returns true', async () => {
      getExecOutputStub.resolves({
        exitCode: 0,
        stdout: 'refs/tags/my-tag-name'
      })

      const tagExists = await doesBranchOrTagExist({ tag: 'my-tag-name' })

      assert.isTrue(tagExists)
    })
  })

  describe('when the branch does not exist', () => {
    it('returns false', async () => {
      getExecOutputStub.throws({
        exitCode: 1,
        stdout: '',
        stderr: 'welp, we tried'
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
        exitCode: 1,
        stdout: '',
        stderr: 'welp, we tried'
      })

      const tagExists = await doesBranchOrTagExist({ tag: 'my-tag-name' })

      assert.isFalse(tagExists)
    })
  })
})
