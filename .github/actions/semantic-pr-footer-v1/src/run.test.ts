import sinon from 'sinon';
import { assert } from 'chai'
import run, { type Core } from './run'

describe('run', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('fails if pr does not have body', () => {
    const core = {
      setFailed: sinon.spy()
    }
    run(core as unknown as Core)

    assert.isTrue(core.setFailed.calledOnce)
    assert.isTrue(core.setFailed.calledWith('PR does not have a body'))
  })

  it('fails if pr has empty body', () => {
    const core = {
      setFailed: sinon.spy()
    }
    const payload = {
      pull_request: {
        number: 1,
        body: ''
      }
    }
    run(core as unknown as Core, payload)

    assert.isTrue(core.setFailed.calledOnce)
    assert.isTrue(core.setFailed.calledWith('PR does not have a body'))
  })

  it('logs the pr footer', () => {
    const core = {
      info: sinon.spy()
    }
    const payload = {
      pull_request: {
        number: 1,
        body: 'This pr does some things.\n\ncloses: #1'
      }
    }
    run(core as unknown as Core, payload)

    assert.isTrue(core.info.calledWith('Validating PR footer: "closes: #1"'))
  })

  it('passes if pr footer is valid', () => {
    const core = {
      info: sinon.spy()
    }
    const payload = {
      pull_request: {
        number: 1,
        body: 'closes: #1'
      }
    }
    run(core as unknown as Core, payload)

    assert.isTrue(core.info.calledWith('Footer matches team policy'))
  })

  it('fails if pr footer is not valid', () => {
    const core = {
      setFailed: sinon.spy(),
      info: sinon.spy()
    }
    const payload = {
      pull_request: {
        number: 1,
        body: 'nothing to close'
      }
    }
    run(core as Core, payload)

    assert.isTrue(core.setFailed.calledOnce)
    assert.isTrue(core.setFailed.calledWith(sinon.match('PR footer does not close an issue')))
  })

  it('fails if anything throws', () => {
    const core = {
      setFailed: sinon.spy(),
      info() { throw new Error('failure!') }
    }
    const payload = {
      pull_request: {
        number: 1,
        body: 'nothing to close'
      }
    }
    run(core as unknown as Core, payload)

    assert.isTrue(core.setFailed.calledWith('failure!'))
  })
})