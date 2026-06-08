import { describe, it, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import run, { type Core } from './run.ts'

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
  it('fails if oddWeek is not given', () => {
    const setFailed = mock.fn<(message: string) => void>()
    const core = {
      getInput: mock.fn(() => {
        throw new Error('oddWeek input is not given')
      }),
      setFailed
    } as unknown as Core

    run(core)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      'oddWeek input is not given'
    )
  })

  it('fails if oddWeek is not either true or false', () => {
    const setFailed = mock.fn<(message: string) => void>()
    const core = {
      getInput: mock.fn(() => '1'),
      setFailed
    } as unknown as Core

    run(core)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      '`oddWeek` must be "true" or "false"'
    )
  })

  testCases.map(({ weekType, today, cases }) => {
    describe(`when it is the ${weekType} week`, () => {
      cases.map(({ oddWeek, isReleaseWeek }) => {
        describe(`when oddWeek input is ${oddWeek}`, () => {
          it(`sets isReleaseWeek output to ${isReleaseWeek}`, t => {
            t.mock.timers.enable({ apis: ['Date'] })
            t.mock.timers.setTime(today.getTime())

            const setOutput = mock.fn<(name: string, value: boolean) => void>()
            const info = mock.fn<(message: string) => void>()
            const core = {
              getInput: mock.fn(() => oddWeek.toString()),
              setOutput,
              info
            } as unknown as Core

            run(core)

            assert.strictEqual(setOutput.mock.callCount(), 1)
            assert.strictEqual(
              setOutput.mock.calls[0].arguments[0],
              'isReleaseWeek'
            )
            assert.strictEqual(
              setOutput.mock.calls[0].arguments[1],
              isReleaseWeek
            )
            assert.strictEqual(info.mock.callCount(), 1)
            assert.strictEqual(
              info.mock.calls[0].arguments[0],
              'Set isReleaseWeek output'
            )
          })
        })
      })
    })
  })
})
