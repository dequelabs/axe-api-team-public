import sinon from 'sinon'
import { assert } from 'chai'
import run, { ignoredActors } from './run'
import type { Core, GitHub } from './types'

describe('run', () => {
  afterEach(() => {
    sinon.restore()
  })

  describe('github actors', () => {
    describe('given no actors', () => {
      it('uses default actor and skips validation if actor is in ignoredActors', () => {
        const core = {
          info: sinon.spy(),
          getInput: sinon.stub().returns('')
        }

        const github = {
          context: {
            actor: ignoredActors[0]
          }
        }

        run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(core.info.calledOnce)
        assert.isTrue(
          core.info.calledWith(
            `Skipping PR footer validation for actor: ${ignoredActors[0]}`
          )
        )
      })
    })

    describe('given additional actors', () => {
      it('skips validation', () => {
        const core = {
          info: sinon.spy(),
          // give additional actors in different ways
          getInput: sinon.stub().returns('coffee[bot], ,       HaXor')
        }

        const github = {
          context: {
            actor: 'haxor'
          }
        }

        run(core as unknown as Core, github as unknown as GitHub)

        assert.isTrue(core.info.calledOnce)
        assert.isTrue(
          core.info.calledWith(`Skipping PR footer validation for actor: haxor`)
        )
      })
    })
  })

  it('fails if pr does not have body', () => {
    const core = {
      setFailed: sinon.spy(),
      getInput: sinon.stub().returns('')
    }

    const github = {
      context: {
        payload: {}
      }
    }

    run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(core.setFailed.calledOnce)
    assert.isTrue(core.setFailed.calledWith('PR does not have a body'))
  })

  it('fails if pr has empty body', () => {
    const core = {
      setFailed: sinon.spy(),
      getInput: sinon.stub().returns('')
    }
    const github = {
      context: {
        payload: {
          pull_request: {
            number: 1,
            body: ''
          }
        }
      }
    }
    run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(core.setFailed.calledOnce)
    assert.isTrue(core.setFailed.calledWith('PR does not have a body'))
  })

  it('logs the pr footer', () => {
    const core = {
      info: sinon.spy(),
      getInput: sinon.stub().returns('')
    }
    const github = {
      context: {
        payload: {
          pull_request: {
            number: 1,
            body: 'This pr does some things.\n\ncloses: #1'
          }
        }
      }
    }
    run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(core.info.calledWith('Validating PR footer: "closes: #1"'))
  })

  it('passes if pr footer is valid', () => {
    const core = {
      info: sinon.spy(),
      getInput: sinon.stub().returns('')
    }
    const github = {
      context: {
        payload: {
          pull_request: {
            number: 1,
            body: 'closes: #1'
          }
        }
      }
    }
    run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(core.info.calledWith('Footer matches team policy'))
  })

  it('ignores empty newlines as last line', () => {
    const core = {
      info: sinon.spy(),
      getInput: sinon.stub().returns('')
    }
    const github = {
      context: {
        payload: {
          pull_request: {
            number: 1,
            body: `closes: #1

            `
          }
        }
      }
    }
    run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(core.info.calledWith('Footer matches team policy'))
  })

  it('fails if pr footer is not valid', () => {
    const core = {
      setFailed: sinon.spy(),
      getInput: sinon.stub().returns(''),
      info: sinon.spy()
    }
    const github = {
      context: {
        payload: {
          pull_request: {
            number: 1,
            body: 'nothing to close'
          }
        }
      }
    }
    run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(core.setFailed.calledOnce)
    assert.isTrue(
      core.setFailed.calledWith(
        sinon.match('PR footer does not close an issue')
      )
    )
  })

  it('fails if anything throws', () => {
    const core = {
      setFailed: sinon.spy(),
      getInput: sinon.stub().returns(''),
      info() {
        throw new Error('failure!')
      }
    }
    const github = {
      context: {
        payload: {
          pull_request: {
            number: 1,
            body: 'nothing to close'
          }
        }
      }
    }
    run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(core.setFailed.calledWith('failure!'))
  })
})
