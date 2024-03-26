'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
require('mocha')
var sinon_1 = require('sinon')
var chai_1 = require('chai')
var run_1 = require('./run')
describe('run', function () {
  var infoSpy = sinon_1.default.spy()
  var setFailedSpy = sinon_1.default.spy()
  var setOutputSpy = sinon_1.default.spy()
  var existsSyncStub = sinon_1.default.stub()
  var readFileSyncStub = sinon_1.default.stub()
  var core = {
    info: infoSpy,
    setFailed: setFailedSpy,
    setOutput: setOutputSpy
  }
  afterEach(sinon_1.default.resetHistory)
  it('should get a version from lerna.json', function () {
    var packageVersionMock = '1.0.0'
    existsSyncStub.onCall(0).returns(true).onCall(1).returns(false)
    readFileSyncStub.returns(JSON.stringify({ version: packageVersionMock }))
    ;(0, run_1.default)(core, existsSyncStub, readFileSyncStub)
    chai_1.assert.isTrue(existsSyncStub.calledOnce)
    chai_1.assert.isTrue(
      readFileSyncStub.calledOnceWithExactly('lerna.json', 'utf-8')
    )
    chai_1.assert.isTrue(
      setOutputSpy.calledOnceWithExactly('version', packageVersionMock)
    )
    chai_1.assert.isTrue(setFailedSpy.notCalled)
  })
  it('should get a version from package.json', function () {
    var packageVersionMock = '2.0.0'
    existsSyncStub.onCall(0).returns(false).onCall(1).returns(true)
    readFileSyncStub.returns(JSON.stringify({ version: packageVersionMock }))
    ;(0, run_1.default)(core, existsSyncStub, readFileSyncStub)
    chai_1.assert.isTrue(existsSyncStub.calledTwice)
    chai_1.assert.isTrue(
      readFileSyncStub.calledOnceWithExactly('package.json', 'utf-8')
    )
    chai_1.assert.isTrue(
      setOutputSpy.calledOnceWithExactly('version', packageVersionMock)
    )
    chai_1.assert.isTrue(setFailedSpy.notCalled)
  })
  it('should throw an error if a file is not found', function () {
    existsSyncStub.onCall(0).returns(false).onCall(1).returns(false)
    readFileSyncStub.returns(null)
    ;(0, run_1.default)(core, existsSyncStub, readFileSyncStub)
    chai_1.assert.isTrue(existsSyncStub.calledTwice)
    chai_1.assert.isTrue(readFileSyncStub.notCalled)
    chai_1.assert.isTrue(setOutputSpy.notCalled)
    chai_1.assert.isTrue(setFailedSpy.calledOnce)
  })
})
