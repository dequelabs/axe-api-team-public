import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Core, readFileFS } from './types.ts'
import run from './run.ts'

function makeCore() {
  const info = mock.fn()
  const setFailed = mock.fn()
  const setOutput = mock.fn()
  const core = {
    info,
    setFailed,
    setOutput
  } as unknown as Core
  return { core, info, setFailed, setOutput }
}

// The `readFileSync` function is the dependency injected into `run`. Driving
// its behavior exercises the real `readOptionalFileSync` and every branch of
// `run` without mocking the `./readFile` module (which would interfere with
// readFile.test.ts coverage of the real module).
const enoent = () => {
  throw { code: 'ENOENT' }
}

describe('run', () => {
  const readFileSync =
    mock.fn<(path: string, encoding: BufferEncoding) => string>()

  beforeEach(() => {
    readFileSync.mock.resetCalls()
    readFileSync.mock.mockImplementation(enoent)
  })

  it('should get a version from lerna.json', () => {
    const packageVersionMock: string = '1.0.0'

    readFileSync.mock.mockImplementation(() =>
      JSON.stringify({ version: packageVersionMock })
    )

    const { core, setFailed, setOutput } = makeCore()

    run(core, readFileSync as unknown as readFileFS)

    assert.strictEqual(readFileSync.mock.callCount(), 1)
    assert.deepStrictEqual(readFileSync.mock.calls[0].arguments, [
      'lerna.json',
      'utf-8'
    ])
    assert.strictEqual(setOutput.mock.callCount(), 1)
    assert.deepStrictEqual(setOutput.mock.calls[0].arguments, [
      'version',
      packageVersionMock
    ])
    assert.strictEqual(setFailed.mock.callCount(), 0)
  })

  it('should get a version from package.json', () => {
    const packageVersionMock: string = '2.0.0'

    readFileSync.mock.mockImplementation((path: string) =>
      path === 'lerna.json'
        ? enoent()
        : JSON.stringify({ version: packageVersionMock })
    )

    const { core, setFailed, setOutput } = makeCore()

    run(core, readFileSync as unknown as readFileFS)

    assert.strictEqual(readFileSync.mock.callCount(), 2)
    assert.deepStrictEqual(readFileSync.mock.calls[1].arguments, [
      'package.json',
      'utf-8'
    ])
    assert.strictEqual(setOutput.mock.callCount(), 1)
    assert.deepStrictEqual(setOutput.mock.calls[0].arguments, [
      'version',
      packageVersionMock
    ])
    assert.strictEqual(setFailed.mock.callCount(), 0)
  })

  it('should throw an error if a file is not found', () => {
    readFileSync.mock.mockImplementation(enoent)

    const { core, setFailed, setOutput } = makeCore()

    run(core, readFileSync as unknown as readFileFS)

    assert.strictEqual(readFileSync.mock.callCount(), 2)
    assert.strictEqual(setOutput.mock.callCount(), 0)
    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      'The file with the package version is not found'
    )
  })

  it('should throw an error if something failed', () => {
    const errorMessage: string = 'some error'

    readFileSync.mock.mockImplementation(() => {
      throw new Error(errorMessage)
    })

    const { core, setFailed, setOutput } = makeCore()

    run(core, readFileSync as unknown as readFileFS)

    assert.strictEqual(readFileSync.mock.callCount(), 1)
    assert.strictEqual(setOutput.mock.callCount(), 0)
    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(setFailed.mock.calls[0].arguments[0], errorMessage)
  })
})
