import sinon from 'sinon'
import { assert } from 'chai'
import type { Core } from './types'
import * as exec from '@actions/exec'
import run from './run'

describe('run', () => {
  let info: sinon.SinonSpy
  let setOutput: sinon.SinonSpy
  let setFailed: sinon.SinonSpy
  let getExecOutputStub: sinon.SinonStub
  let getPackageManagerStub: sinon.SinonStub

  beforeEach(() => {
    info = sinon.spy()
    setOutput = sinon.spy()
    setFailed = sinon.spy()
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
    getExecOutputStub.onFirstCall().returns({
      exitCode: 0,
      stdout: '4.8.0'
    })
    getPackageManagerStub = sinon.stub()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('gets latest axe-core version', async () => {
    const core = { info }
    await run(core as unknown as Core, getPackageManagerStub)

    assert.isTrue(info.calledWith('latest axe-core version 4.8.0'))
  })

  it('gets root package manager', async () => {
    const core = { info }
    await run(core as unknown as Core, getPackageManagerStub)

    assert.isTrue(getPackageManagerStub.calledWith('./'))
  })
})