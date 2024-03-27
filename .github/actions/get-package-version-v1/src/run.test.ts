import 'mocha'
import sinon from 'sinon'
import { assert } from 'chai'
import run from './run'
import type { Core } from './types'

describe('run', () => {
  const infoSpy: sinon.SinonSpy = sinon.spy()
  const setFailedSpy: sinon.SinonSpy = sinon.spy()
  const setOutputSpy: sinon.SinonSpy = sinon.spy()
  const existsSyncStub: sinon.SinonStub = sinon.stub()
  const readFileSyncStub: sinon.SinonStub = sinon.stub()

  const core = {
    info: infoSpy,
    setFailed: setFailedSpy,
    setOutput: setOutputSpy
  } as unknown as Core

  afterEach(sinon.resetHistory)

  it('should get a version from lerna.json', () => {
    const packageVersionMock: string = '1.0.0'

    existsSyncStub.onCall(0).returns(true).onCall(1).returns(false)
    readFileSyncStub.returns(JSON.stringify({ version: packageVersionMock }))

    run(core, existsSyncStub, readFileSyncStub)

    assert.isTrue(existsSyncStub.calledOnce)
    assert.isTrue(readFileSyncStub.calledOnceWithExactly('lerna.json', 'utf-8'))
    assert.isTrue(
      setOutputSpy.calledOnceWithExactly('version', packageVersionMock)
    )
    assert.isTrue(setFailedSpy.notCalled)
  })

  it('should get a version from package.json', () => {
    const packageVersionMock: string = '2.0.0'

    existsSyncStub.onCall(0).returns(false).onCall(1).returns(true)
    readFileSyncStub.returns(JSON.stringify({ version: packageVersionMock }))

    run(core, existsSyncStub, readFileSyncStub)

    assert.isTrue(existsSyncStub.calledTwice)
    assert.isTrue(
      readFileSyncStub.calledOnceWithExactly('package.json', 'utf-8')
    )
    assert.isTrue(
      setOutputSpy.calledOnceWithExactly('version', packageVersionMock)
    )
    assert.isTrue(setFailedSpy.notCalled)
  })

  it('should throw an error if a file is not found', () => {
    existsSyncStub.onCall(0).returns(false).onCall(1).returns(false)
    readFileSyncStub.returns(null)

    run(core, existsSyncStub, readFileSyncStub)

    assert.isTrue(existsSyncStub.calledTwice)
    assert.isTrue(readFileSyncStub.notCalled)
    assert.isTrue(setOutputSpy.notCalled)
    assert.isTrue(setFailedSpy.calledOnce)
  })
})
