import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import * as fs from 'fs'
import getPackageManager from './getPackageManager'

describe('getPackageManager', () => {
  let statStub: sinon.SinonStub

  beforeEach(() => {
    statStub = sinon.stub(fs.promises, 'stat')
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
    statStub.withArgs(sinon.match('package-lock.json')).throws()
    statStub.withArgs(sinon.match('yarn.lock')).returns({})
    const result = await getPackageManager('path/to/file')

    assert.equal(result, 'yarn')
  })

  it('returns "pnpm" if pnpm-lock.yaml exists', async () => {
    statStub.withArgs(sinon.match('package-lock.json')).throws()
    statStub.withArgs(sinon.match('yarn.lock')).throws()
    statStub.withArgs(sinon.match('pnpm-lock.yaml')).returns({})
    const result = await getPackageManager('path/to/file')

    assert.equal(result, 'pnpm')
  })

  it('prefers npm over yarn and pnpm', async () => {
    statStub.withArgs(sinon.match('package-lock.json')).returns({})
    statStub.withArgs(sinon.match('yarn.lock')).returns({})
    statStub.withArgs(sinon.match('pnpm-lock.yaml')).returns({})
    const result = await getPackageManager('path/to/file')

    assert.equal(result, 'npm')
  })

  it('prefers yarn over pnpm', async () => {
    statStub.withArgs(sinon.match('package-lock.json')).throws()
    statStub.withArgs(sinon.match('yarn.lock')).returns({})
    statStub.withArgs(sinon.match('pnpm-lock.yaml')).returns({})
    const result = await getPackageManager('path/to/file')

    assert.equal(result, 'yarn')
  })

  it('returns undefined if no lock file exists', async () => {
    statStub.withArgs(sinon.match('package-lock.json')).throws()
    statStub.withArgs(sinon.match('yarn.lock')).throws()
    statStub.withArgs(sinon.match('pnpm-lock.yaml')).throws()
    const result = await getPackageManager('path/to/file')

    assert.isUndefined(result)
  })

  it('uses the passed in path', async () => {
    statStub.withArgs(sinon.match('package-lock.json')).throws()
    statStub.withArgs(sinon.match('yarn.lock')).throws()
    statStub.withArgs(sinon.match('pnpm-lock.yaml')).throws()
    await getPackageManager('path/to/file')

    assert.isTrue(statStub.calledWith('path/to/file/package-lock.json'))
    assert.isTrue(statStub.calledWith('path/to/file/yarn.lock'))
    assert.isTrue(statStub.calledWith('path/to/file/pnpm-lock.yaml'))
  })
})
