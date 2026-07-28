import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { mock } from 'node:test'
import run, { ignoredActors } from './run.ts'
import type { Core, GitHub } from './types.ts'

describe('run', () => {
  describe('github actors', () => {
    describe('given no actors', () => {
      it('uses default actor and skips validation if actor is in ignoredActors', () => {
        const info = mock.fn<(message: string) => void>()
        const core = {
          info,
          getInput: mock.fn<(name: string) => string>(() => '')
        }

        const github = {
          context: {
            actor: ignoredActors[0]
          }
        }

        run(core as unknown as Core, github as unknown as GitHub)

        assert.strictEqual(info.mock.callCount(), 1)
        assert.strictEqual(
          info.mock.calls[0].arguments[0],
          `Skipping PR footer validation for actor: ${ignoredActors[0]}`
        )
      })
    })

    describe('given additional actors', () => {
      it('skips validation', () => {
        const info = mock.fn<(message: string) => void>()
        const core = {
          info,
          // give additional actors in different ways
          getInput: mock.fn<(name: string) => string>(
            () => 'coffee[bot], ,       HaXor'
          )
        }

        const github = {
          context: {
            actor: 'haxor'
          }
        }

        run(core as unknown as Core, github as unknown as GitHub)

        assert.strictEqual(info.mock.callCount(), 1)
        assert.strictEqual(
          info.mock.calls[0].arguments[0],
          `Skipping PR footer validation for actor: haxor`
        )
      })
    })
  })

  it('fails if pr does not have body', () => {
    const setFailed = mock.fn<(message: string) => void>()
    const core = {
      setFailed,
      getInput: mock.fn<(name: string) => string>(() => '')
    }

    const github = {
      context: {
        payload: {}
      }
    }

    run(core as unknown as Core, github as unknown as GitHub)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      'PR does not have a body'
    )
  })

  it('fails if pr has empty body', () => {
    const setFailed = mock.fn<(message: string) => void>()
    const core = {
      setFailed,
      getInput: mock.fn<(name: string) => string>(() => '')
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

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      'PR does not have a body'
    )
  })

  it('logs the pr footer', () => {
    const info = mock.fn<(message: string) => void>()
    const core = {
      info,
      getInput: mock.fn<(name: string) => string>(() => '')
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

    assert.ok(
      info.mock.calls.some(
        call => call.arguments[0] === 'Validating PR footer: "closes: #1"'
      )
    )
  })

  it('passes if pr footer is valid', () => {
    const info = mock.fn<(message: string) => void>()
    const core = {
      info,
      getInput: mock.fn<(name: string) => string>(() => '')
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

    assert.ok(
      info.mock.calls.some(
        call => call.arguments[0] === 'Footer matches team policy'
      )
    )
  })

  it('ignores empty newlines as last line', () => {
    const info = mock.fn<(message: string) => void>()
    const core = {
      info,
      getInput: mock.fn<(name: string) => string>(() => '')
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

    assert.ok(
      info.mock.calls.some(
        call => call.arguments[0] === 'Footer matches team policy'
      )
    )
  })

  it('fails if pr footer is not valid', () => {
    const setFailed = mock.fn<(message: string) => void>()
    const core = {
      setFailed,
      getInput: mock.fn<(name: string) => string>(() => ''),
      info: mock.fn<(message: string) => void>()
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

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.ok(
      (setFailed.mock.calls[0].arguments[0] as string).includes(
        'PR footer does not close an issue'
      )
    )
  })

  it('fails if anything throws', () => {
    const setFailed = mock.fn<(message: string) => void>()
    const core = {
      setFailed,
      getInput: mock.fn<(name: string) => string>(() => ''),
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

    assert.ok(
      setFailed.mock.calls.some(call => call.arguments[0] === 'failure!')
    )
  })
  describe('trailing section footers', () => {
    const runWith = (body: string) => {
      const info = mock.fn<(message: string) => void>()
      const setFailed = mock.fn<(message: string) => void>()
      const core = {
        info,
        setFailed,
        getInput: mock.fn<(name: string) => string>(() => '')
      }
      const github = {
        context: { payload: { pull_request: { number: 1, body } } }
      }

      run(core as unknown as Core, github as unknown as GitHub)

      return { info, setFailed }
    }

    const passed = (info: ReturnType<typeof mock.fn>) =>
      info.mock.calls.some(
        call => call.arguments[0] === 'Footer matches team policy'
      )

    const failedWithPolicyMessage = (
      setFailed: ReturnType<typeof mock.fn>
    ): boolean =>
      setFailed.mock.calls.some(call =>
        String(call.arguments[0]).includes('PR footer does not close an issue')
      )

    it('passes given a QA notes heading with content beneath it', () => {
      const { info, setFailed } = runWith(
        'This pr does some things.\n\n## QA Notes\n\nBuild the binary, then confirm it starts.'
      )

      assert.ok(passed(info))
      assert.strictEqual(setFailed.mock.callCount(), 0)
    })

    it('passes given a lower-level heading', () => {
      const { info } = runWith('Body.\n\n#### QA notes:\n\nRun the suite.')

      assert.ok(passed(info))
    })

    it('fails given a QA notes heading with nothing beneath it', () => {
      const { setFailed } = runWith('This pr does some things.\n\n## QA Notes')

      assert.ok(failedWithPolicyMessage(setFailed))
    })

    it('fails given an unrelated trailing section', () => {
      const { setFailed } = runWith('Body.\n\n## Testing\n\nSome prose.')

      assert.ok(failedWithPolicyMessage(setFailed))
    })

    it('does not let a trailing section rescue an issue-linking keyword', () => {
      const { setFailed } = runWith('Body.\n\n## Closes\n\n#123')

      assert.ok(failedWithPolicyMessage(setFailed))
    })

    it('still prefers the single-line footer when present', () => {
      const { info } = runWith('## QA Notes\n\nSome steps.\n\ncloses: #1')

      assert.ok(
        info.mock.calls.some(
          call => call.arguments[0] === 'Validating PR footer: "closes: #1"'
        )
      )
      assert.ok(passed(info))
    })
  })
})
