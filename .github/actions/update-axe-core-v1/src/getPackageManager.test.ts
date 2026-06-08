import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'

type StatResult = Record<string, never>

// Set of path substrings that should resolve (file "exists"); anything else throws.
let existing = new Set<string>()

const stat = mock.fn<(filePath: string) => Promise<StatResult>>(
  async (filePath: string) => {
    for (const fragment of existing) {
      if (filePath.includes(fragment)) {
        return {}
      }
    }
    throw new Error('ENOENT')
  }
)

mock.module('fs', { namedExports: { promises: { stat } } })

const { default: getPackageManager } = await import('./getPackageManager.ts')

describe('getPackageManager', () => {
  beforeEach(() => {
    existing = new Set<string>()
    stat.mock.resetCalls()
  })

  it('returns "npm" if package-lock.json exists', async () => {
    existing.add('package-lock.json')
    const result = await getPackageManager('path/to/file')

    assert.strictEqual(result, 'npm')
  })

  it('returns "yarn" if yarn.lock exists', async () => {
    existing.add('yarn.lock')
    const result = await getPackageManager('path/to/file')

    assert.strictEqual(result, 'yarn')
  })

  it('returns "pnpm" if pnpm-lock.yaml exists', async () => {
    existing.add('pnpm-lock.yaml')
    const result = await getPackageManager('path/to/file')

    assert.strictEqual(result, 'pnpm')
  })

  it('prefers npm over yarn and pnpm', async () => {
    existing.add('package-lock.json')
    existing.add('yarn.lock')
    existing.add('pnpm-lock.yaml')
    const result = await getPackageManager('path/to/file')

    assert.strictEqual(result, 'npm')
  })

  it('prefers yarn over pnpm', async () => {
    existing.add('yarn.lock')
    existing.add('pnpm-lock.yaml')
    const result = await getPackageManager('path/to/file')

    assert.strictEqual(result, 'yarn')
  })

  it('returns undefined if no lock file exists', async () => {
    const result = await getPackageManager('path/to/file')

    assert.strictEqual(result, undefined)
  })

  it('uses the passed in path', async () => {
    await getPackageManager('path/to/file')

    const calledArgs = stat.mock.calls.map(call => call.arguments[0])
    assert.ok(calledArgs.includes('path/to/file/package-lock.json'))
    assert.ok(calledArgs.includes('path/to/file/yarn.lock'))
    assert.ok(calledArgs.includes('path/to/file/pnpm-lock.yaml'))
  })
})
