import sinon, { type SinonFakeTimers } from 'sinon'
import { assert } from 'chai'
import run, { type Core } from './run'

describe('run', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('fails if oddWeek is not given', () => {
    const core = {
      getInput: sinon.stub(),
      setFailed: sinon.spy()
    }

    run(core as unknown as Core)
    assert.isTrue(
      core.setFailed.calledOnceWith('`oddWeek` must be "true" or "false"')
    )
  })

  it('fails if oddWeek is not either true or false', () => {
    const core = {
      getInput: sinon.stub().withArgs('oddWeek').returns('1'),
      setFailed: sinon.spy()
    }

    run(core as unknown as Core)
    assert.isTrue(
      core.setFailed.calledOnceWith('`oddWeek` must be "true" or "false"')
    )
  })

  describe('when `oddWeek` input is valid', () => {
    let clock: SinonFakeTimers
    const core = {
      getInput: sinon
        .stub()
        .withArgs('oddWeek')
        .onFirstCall()
        .returns('true')
        .onSecondCall()
        .returns('false'),
      setOutput: sinon.spy(),
      info: sinon.spy()
    }

    beforeEach(() => {
      core.getInput.resetHistory()
      core.setOutput.resetHistory()
      core.info.resetHistory()
    })

    afterEach(() => {
      clock.restore()
    })

    describe('when it is the odd week', () => {
      beforeEach(() => {
        // 2023-09-01, Week #35
        clock = sinon.useFakeTimers(new Date(2023, 8, 1))
      })

      it('sets `isReleaseWeek` output correctly based on `oddWeek` input', () => {
        run(core as unknown as Core)
        assert.isTrue(core.setOutput.calledWithExactly('isReleaseWeek', true))

        run(core as unknown as Core)
        assert.isTrue(core.setOutput.calledWith('isReleaseWeek', false))

        assert.isTrue(core.info.calledTwice)
        assert.isTrue(
          core.info.alwaysCalledWithExactly('Set isReleaseWeek output')
        )
      })
    })

    describe('when it is the even week', () => {
      beforeEach(() => {
        // 2023-09-08, Week #36
        clock = sinon.useFakeTimers(new Date(2023, 8, 8))
      })

      it('sets `isReleaseWeek` output correctly based on `oddWeek` input', () => {
        run(core as unknown as Core)
        assert.isTrue(core.setOutput.calledWithExactly('isReleaseWeek', false))

        run(core as unknown as Core)
        assert.isTrue(core.setOutput.calledWith('isReleaseWeek', true))

        assert.isTrue(core.info.calledTwice)
        assert.isTrue(
          core.info.alwaysCalledWithExactly('Set isReleaseWeek output')
        )
      })
    })
  })
})
