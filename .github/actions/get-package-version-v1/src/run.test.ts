import 'mocha'
import sinon from 'sinon'
import { assert } from 'chai'
import type { Core } from './types'
import run from './run'
import * as readFile from './readFile'

describe('run', () => {
  let core: Core
  let infoSpy: sinon.SinonSpy
  let setFailedSpy: sinon.SinonSpy
  let setOutputSpy: sinon.SinonSpy
  let readFileSyncSpy: sinon.SinonSpy
  let readOptionalFileSyncStub: sinon.SinonStub

  beforeEach(() => {
    infoSpy = sinon.spy()
    setFailedSpy = sinon.spy()
    setOutputSpy = sinon.spy()
    readFileSyncSpy = sinon.spy()
    readOptionalFileSyncStub = sinon.stub(readFile, 'readOptionalFileSync')

    core = {
      info: infoSpy,
      setFailed: setFailedSpy,
      setOutput: setOutputSpy
    } as unknown as Core
  })

  afterEach(() => {
    sinon.resetHistory()
    sinon.restore()
  })

  it('should get a version from lerna.json', () => {
    const packageVersionMock: string = '1.0.0'

    readOptionalFileSyncStub
      .onCall(0)
      .returns(JSON.stringify({ version: packageVersionMock }))

    run(core, readFileSyncSpy)

    assert.isTrue(
      readOptionalFileSyncStub.calledOnceWithExactly(
        'lerna.json',
        'utf-8',
        readFileSyncSpy
      )
    )
    assert.isTrue(
      setOutputSpy.calledOnceWithExactly('version', packageVersionMock)
    )
    assert.isTrue(setFailedSpy.notCalled)
  })

  it('should get a version from package.json', () => {
    const packageVersionMock: string = '2.0.0'

    readOptionalFileSyncStub
      .onCall(0)
      .returns(null)
      .onCall(1)
      .returns(JSON.stringify({ version: packageVersionMock }))

    run(core, readFileSyncSpy)

    assert.isTrue(readOptionalFileSyncStub.calledTwice)
    assert.isTrue(
      readOptionalFileSyncStub
        .getCall(1)
        .calledWithExactly('package.json', 'utf-8', readFileSyncSpy)
    )
    assert.isTrue(
      setOutputSpy.calledOnceWithExactly('version', packageVersionMock)
    )
    assert.isTrue(setFailedSpy.notCalled)
  })

  it('should throw an error if a file is not found', () => {
    readOptionalFileSyncStub.onCall(0).returns(null).onCall(1).returns(null)

    run(core, readFileSyncSpy)

    assert.isTrue(readOptionalFileSyncStub.calledTwice)
    assert.isTrue(setOutputSpy.notCalled)
    assert.isTrue(
      setFailedSpy.calledOnceWithExactly(
        'The file with the package version is not found'
      )
    )
  })

  it('should throw an error if something failed', () => {
    const errorMessage: string = 'some error'

    readOptionalFileSyncStub.onCall(0).throws({ message: errorMessage })

    run(core, readFileSyncSpy)

    assert.isTrue(readOptionalFileSyncStub.calledOnce)
    assert.isTrue(setOutputSpy.notCalled)
    assert.isTrue(setFailedSpy.calledOnceWithExactly(errorMessage))
  })
})
