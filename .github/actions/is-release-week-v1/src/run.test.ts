import sinon, { type SinonFakeTimers } from 'sinon'
import { assert } from 'chai'
import run, { type Core } from './run'

const testCases = [
  {
    weekType: 'odd',
    today: new Date(2023, 8, 1), // 2023-09-01, Week #35
    cases: [
      { oddWeek: true, isReleaseWeek: true },
      { oddWeek: false, isReleaseWeek: false }
    ]
  },
  {
    weekType: 'even',
    today: new Date(2023, 8, 8), // 2023-09-08, Week #36
    cases: [
      { oddWeek: true, isReleaseWeek: false },
      { oddWeek: false, isReleaseWeek: true }
    ]
  }
]

describe('run', () => {
  let clock: SinonFakeTimers

  afterEach(() => {
    sinon.restore()
  })

  it('fails if oddWeek is not given', () => {
    const core = {
      getInput: sinon
        .stub()
        .withArgs('oddWeek', { required: true })
        .throws({ message: 'oddWeek input is not given' }),
      setFailed: sinon.spy()
    }

    run(core as unknown as Core)
    assert.isTrue(core.setFailed.calledOnceWith('oddWeek input is not given'))
  })

  it('fails if oddWeek is not either true or false', () => {
    const core = {
      getInput: sinon
        .stub()
        .withArgs('oddWeek', { required: true })
        .returns('1'),
      setFailed: sinon.spy()
    }

    run(core as unknown as Core)
    assert.isTrue(
      core.setFailed.calledOnceWith('`oddWeek` must be "true" or "false"')
    )
  })

  testCases.map(({ weekType, today, cases }) => {
    describe(`when it is the ${weekType} week`, () => {
      beforeEach(() => {
        clock = sinon.useFakeTimers(today)
      })

      afterEach(() => {
        clock.restore()
      })

      cases.map(({ oddWeek, isReleaseWeek }) => {
        describe(`when oddWeek input is ${oddWeek}`, () => {
          it(`sets isReleaseWeek output to ${isReleaseWeek}`, () => {
            const core = {
              getInput: sinon
                .stub()
                .withArgs('oddWeek', { required: true })
                .returns(oddWeek.toString()),
              setOutput: sinon.spy(),
              info: sinon.spy()
            }

            run(core as unknown as Core)
            assert.isTrue(
              core.setOutput.calledOnceWith('isReleaseWeek', isReleaseWeek)
            )
            assert.isTrue(core.info.calledOnceWith('Set isReleaseWeek output'))
          })
        })
      })
    })
  })
})
