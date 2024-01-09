import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import * as glob from 'glob'
import getPackageManager from './getPackageManager'

describe('getPackageManager', () => {
  let statStub: sinon.SinonStub

  beforeEach(() => {
    statStub = sinon.stub(glob, 'glob')
  })

  afterEach(() => {
    statStub.restore()
  })

  it('returns "npm" if package-lock.json exists', async () => {
    statStub.withArgs(sinon.match('package-lock.json')).returns({})
    const result = await getPackageManager('path/to/file')

    assert.equal(result, 'npm')
  })

  it('returns "yarn" if yarn.lock exists', async () => {
    statStub.withArgs(sinon.match('yarn.lock')).returns({})
    const result = await getPackageManager('path/to/file')

    assert.equal(result, 'yarn')
  })

  it('returns undefined if neither exists', async () => {
    const result = await getPackageManager('path/to/file')

    assert.isUndefined(result)
  })

  it('uses the passed in path', async () => {
    statStub.withArgs(sinon.match('package-lock.json'))
    statStub.withArgs(sinon.match('yarn.lock'))
    await getPackageManager('path/to/file')

    assert.isTrue(statStub.calledWith('path/to/file/package-lock.json'))
    assert.isTrue(statStub.calledWith('path/to/file/yarn.lock'))
  })
})
