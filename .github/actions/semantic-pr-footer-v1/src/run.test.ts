import sinon from 'sinon';
import { assert } from 'chai'
import run, { type Core, type PayLoad } from './run'

describe.only('run', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('should set failure if pr does not have body', () => {
    const core = {
      setFailed: sinon.spy()
    }
    run(core as unknown as Core)

    assert.isTrue(core.setFailed.calledOnce)
    assert.isTrue(core.setFailed.calledWith('PR does not have a body'))
  })

  // it('should set failure if pr has empty body', () => {
  //   const core = {
  //     setFailed: sinon.spy()
  //   }
  //   const payload: PayLoad = {
  //     pull_request: {
  //       body: ''
  //     }
  //   }
  //   run(core as unknown as CoreType, payload)

  //   assert.isTrue(core.setFailed.calledOnce)
  //   assert.isTrue(core.setFailed.calledWith('PR does not have a body'))
  // })

  // it('should log pr footer', () => {
  //   const spy = sinon.spy(core, 'info')
  //   sinon.stub(github.context, 'payload').value({
  //     pull_request: {
  //       body: 'closes: #1'
  //     }
  //   })
  //   run()

  //   assert.isTrue(spy.calledWith('Validating PR footer: "closes: #1"'))
  // })

  // it('should pass if pr footer is valid', () => {
  //   const spy = sinon.spy(core, 'info')
  //   sinon.stub(github.context, 'payload').value({
  //     pull_request: {
  //       body: 'closes: #1'
  //     }
  //   })
  //   const result = run()

  //   assert.isTrue(spy.calledWith('Footer matches team policy'))
  //   assert.isUndefined(result)
  // })

  // it('should set failure if pr footer is not valid', () => {
  //   const spy = sinon.spy(core, 'setFailed')
  //   sinon.stub(github.context, 'payload').value({
  //     pull_request: {
  //       body: 'nothing to report'
  //     }
  //   })
  //   const result = run()

  //   assert.isTrue(spy.calledWithMatch(sinon.match('PR footer does not close an issue')))
  //   assert.equal(result, 2)
  // })
})