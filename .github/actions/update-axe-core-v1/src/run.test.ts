import { describe, it, before, beforeEach, after, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import os from 'os'
import { promises as fs } from 'fs'
import path from 'path'
import { glob as realGlob } from 'glob'
import type { Core, PackageManager } from './types.ts'

type ExecResult = {
  exitCode: number
  stdout?: string
  stderr?: string
}

// Result returned for the initial `npm info axe-core version` call.
let npmInfoResult: ExecResult = { exitCode: 0, stdout: '   4.8.1\n' }
// Result returned for any install (non-`npm info`) call.
let installResult: ExecResult = { exitCode: 0 }

const getExecOutput = mock.fn<
  (command: string, args?: string[], options?: object) => ExecResult
>((_command: string, args: string[] = []) => {
  const isNpmInfo =
    args[0] === 'info' && args[1] === 'axe-core' && args[2] === 'version'
  return isNpmInfo ? npmInfoResult : installResult
})

mock.module('@actions/exec', { namedExports: { getExecOutput } })

// Default glob behavior: when a `cwd` is provided (the filesystem-based tests
// build a controlled temp tree) delegate to the real glob; when no `cwd` is
// provided, return an empty list so those tests stay deterministic instead of
// scanning the actual working directory. A single test overrides this to
// exercise the rejection path.
const defaultGlob = ((
  pattern: Parameters<typeof realGlob>[0],
  options?: { cwd?: string }
) => (options?.cwd ? realGlob(pattern, options) : Promise.resolve([]))) as (
  ...args: Parameters<typeof realGlob>
) => ReturnType<typeof realGlob>

const glob = mock.fn(defaultGlob)
mock.module('glob', { namedExports: { glob } })

const { default: run } = await import('./run.ts')

describe('run', () => {
  let info: ReturnType<typeof mock.fn>
  let setOutput: ReturnType<typeof mock.fn>
  let setFailed: ReturnType<typeof mock.fn>
  let getPackageManagerStub: ReturnType<
    typeof mock.fn<(dirPath: string) => PackageManager>
  >
  let cwd: string
  let files: string[]

  before(async () => {
    const tmpFiles = await makeTempFiles()
    cwd = tmpFiles.cwd
    files = tmpFiles.files
  })

  beforeEach(() => {
    info = mock.fn()
    setOutput = mock.fn()
    setFailed = mock.fn()
    getPackageManagerStub = mock.fn<(dirPath: string) => PackageManager>(
      async () => undefined
    )
    npmInfoResult = { exitCode: 0, stdout: '   4.8.1\n' }
    installResult = { exitCode: 0 }
    getExecOutput.mock.resetCalls()
    glob.mock.resetCalls()
    glob.mock.mockImplementation(defaultGlob)
  })

  after(async () => {
    await fs.rm(cwd, { recursive: true })
  })

  function calledWith(
    fn: ReturnType<typeof mock.fn>,
    ...expected: unknown[]
  ): boolean {
    return fn.mock.calls.some(call => {
      if (call.arguments.length < expected.length) {
        return false
      }
      return expected.every((arg, i) => deepEquals(call.arguments[i], arg))
    })
  }

  it('gets latest axe-core version and trims', async () => {
    const core = { info, setOutput }
    await run(core as unknown as Core, getPackageManagerStub)

    assert.ok(calledWith(info, 'latest axe-core version 4.8.1'))
  })

  it('finds all package.json files excluding node_modules', async () => {
    const core = { info, setOutput }
    getPackageManagerStub.mock.mockImplementation(async (dirPath: string) =>
      dirPath === './' ? 'npm' : undefined
    )
    await run(core as unknown as Core, getPackageManagerStub, cwd)

    const matchedCalls = info.mock.calls.filter(call => {
      return (call.arguments[0] as string).includes('package.json found in')
    })
    const pkgFiles = files.filter(p => !p.includes('node_modules'))

    assert.strictEqual(matchedCalls.length, 12)
    assert.strictEqual(matchedCalls.length, pkgFiles.length)
  })

  it('skips packages without an axe-core dependency', async () => {
    const core = { info, setOutput }
    await run(
      core as unknown as Core,
      getPackageManagerStub,
      path.join(cwd, 'packages', 'no-axe-core')
    )

    assert.ok(calledWith(info, 'no axe-core dependency found, moving on...'))
  })

  it('skips packages without any dependencies', async () => {
    const core = { info, setOutput }
    await run(
      core as unknown as Core,
      getPackageManagerStub,
      path.join(cwd, 'packages', 'no-deps')
    )

    assert.ok(calledWith(info, 'no axe-core dependency found, moving on...'))
  })

  it('detects axe-core version', async () => {
    const core = { info, setOutput }
    getPackageManagerStub.mock.mockImplementation(async (dirPath: string) =>
      dirPath === './' ? 'npm' : undefined
    )
    await run(
      core as unknown as Core,
      getPackageManagerStub,
      path.join(cwd, 'packages', 'exact-pin')
    )

    assert.ok(calledWith(info, 'current axe-core version =4.7.2'))
  })

  it('fails if anything throws', async () => {
    const core = {
      setFailed,
      info() {
        throw new Error('failure!')
      }
    }
    await run(core as unknown as Core, getPackageManagerStub)

    assert.ok(calledWith(setFailed, 'failure!'))
  })

  it('fails if getting axe-core version returns non-zero exit code', async () => {
    npmInfoResult = { exitCode: 1, stderr: 'failure!' }
    const core = {
      setFailed
    }
    await run(core as unknown as Core, getPackageManagerStub)

    assert.ok(
      calledWith(setFailed, 'Error getting latest axe-core version:\nfailure!')
    )
  })

  it('fails if axe-core install returns non-zero exit code', async () => {
    const core = { info, setFailed }
    getPackageManagerStub.mock.mockImplementation(async (dirPath: string) =>
      dirPath === './' ? 'npm' : undefined
    )
    installResult = { exitCode: 1, stderr: 'failure!' }
    await run(
      core as unknown as Core,
      getPackageManagerStub,
      path.join(cwd, 'packages', 'exact-pin')
    )

    assert.ok(calledWith(setFailed, 'Error installing axe-core:\nfailure!'))
  })

  it('fails if globbing for package.json files rejects', async () => {
    const core = { info, setOutput, setFailed }
    glob.mock.mockImplementation(() => Promise.reject(new Error('glob boom')))
    await run(core as unknown as Core, getPackageManagerStub)

    assert.ok(calledWith(setFailed, 'glob boom'))
  })

  describe('peerDependency handling', () => {
    it('succeeds if package has an satisfied axe-core peer dependency', async () => {
      await createFile(cwd, 'packages/peer-dep-satisfied/package.json', {
        peerDependencies: {
          'axe-core': '^4.0.0'
        }
      })
      const core = { info, setFailed, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'peer-dep-satisfied')
      )

      assert.ok(
        calledWith(
          info,
          'axe-core peerDependency ^4.0.0 is already satisfied by new version 4.8.1'
        )
      )
      assert.strictEqual(setFailed.mock.callCount(), 0)
    })

    it('fails if package has an unsatisfied axe-core peer dependency', async () => {
      await createFile(cwd, 'packages/peer-dep-unsatisfied/package.json', {
        peerDependencies: {
          'axe-core': '^3.0.0 || >=4.8.2'
        }
      })
      const core = { info, setFailed, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'peer-dep-unsatisfied')
      )

      assert.ok(
        calledWith(
          setFailed,
          'axe-core peerDependency ^3.0.0 || >=4.8.2 is not satisfied by new version 4.8.1.\nA human maintainer will need to decide how to handle this.'
        )
      )
    })
  })

  describe('package manager', () => {
    it('gets root package manager', async () => {
      const core = { info, setOutput }
      await run(core as unknown as Core, getPackageManagerStub)

      assert.ok(calledWith(getPackageManagerStub, './'))
    })

    it('gets package manager from package directory', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      await run(core as unknown as Core, getPackageManagerStub, dirPath)

      assert.ok(calledWith(getPackageManagerStub, dirPath))
    })

    it('installs axe-core using npm in package directory', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      getPackageManagerStub.mock.mockImplementation(async (p: string) =>
        p === './' ? 'npm' : undefined
      )
      await run(core as unknown as Core, getPackageManagerStub, dirPath)

      assert.ok(execCalledWith('npm', cmd => cmd[0] === 'i', dirPath))
    })

    it('installs axe-core using yarn in package directory', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      getPackageManagerStub.mock.mockImplementation(async (p: string) =>
        p === './' ? 'yarn' : undefined
      )
      await run(core as unknown as Core, getPackageManagerStub, dirPath)

      assert.ok(execCalledWith('yarn', cmd => cmd[0] === 'add', dirPath))
    })

    it('installs axe-core using pnpm in package directory', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      getPackageManagerStub.mock.mockImplementation(async (p: string) =>
        p === './' ? 'pnpm' : undefined
      )
      await run(core as unknown as Core, getPackageManagerStub, dirPath)

      assert.ok(execCalledWith('pnpm', cmd => cmd[0] === 'add', dirPath))
    })

    it('uses package level package manager over root level', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      getPackageManagerStub.mock.mockImplementation(async (p: string) => {
        if (p === './') return 'npm'
        if (p === dirPath) return 'yarn'
        return undefined
      })
      await run(core as unknown as Core, getPackageManagerStub, dirPath)

      assert.ok(execCalledWith('yarn', cmd => cmd[0] === 'add', dirPath))
    })

    it('skips packages when no package manager is detected', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      getPackageManagerStub.mock.mockImplementation(async () => undefined)
      await run(core as unknown as Core, getPackageManagerStub, dirPath)

      assert.ok(calledWith(info, 'No package manager detected, moving on...'))
    })
  })

  describe('output', () => {
    beforeEach(() => {
      getPackageManagerStub.mock.mockImplementation(async (p: string) =>
        p === './' ? 'npm' : undefined
      )
    })

    it('sets to "null" if axe-core version is up-to-date', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'latest')
      )

      assert.ok(
        calledWith(
          info,
          'axe-core version is currently at latest, no update required'
        )
      )
      assert.ok(calledWith(setOutput, 'commit-type', null))
    })

    it('sets to "null" if no packages contain axe-core dependencies', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'no-deps')
      )

      assert.ok(calledWith(info, 'no packages contain axe-core dependency'))
      assert.ok(calledWith(setOutput, 'commit-type', null))
    })

    it('sets to "feat" if axe-core version is major behind', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'major-behind')
      )

      assert.ok(calledWith(setOutput, 'commit-type', 'feat'))
    })

    it('sets to "feat" if axe-core version is minor behind', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'minor-behind')
      )

      assert.ok(calledWith(setOutput, 'commit-type', 'feat'))
    })

    it('sets to "fix" if axe-core version is patch behind', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'patch-behind')
      )

      assert.ok(calledWith(setOutput, 'commit-type', 'fix'))
    })

    it('sets version as axe-core version', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'patch-behind')
      )

      assert.ok(calledWith(setOutput, 'version', '4.8.1'))
    })
  })

  describe('matches axe-core pinning strategy', () => {
    beforeEach(() => {
      getPackageManagerStub.mock.mockImplementation(async (p: string) =>
        p === './' ? 'npm' : undefined
      )
    })

    const testCases = [
      {
        title: 'when using exact pin with "="',
        dir: 'packages/exact-pin',
        pin: '=4.8.1'
      },
      {
        title: 'when using exact pin with ""',
        dir: 'packages/exact-pin-no-equal',
        pin: '=4.8.1'
      },
      {
        title: 'when using minor pin with "^"',
        dir: 'packages/minor-pin',
        pin: '^4.8.1'
      },
      {
        title: 'when using patch pin with "~"',
        dir: 'packages/patch-pin',
        pin: '~4.8.1'
      }
    ]

    testCases.forEach(({ title, dir, pin }) => {
      it(title, async () => {
        const core = { info, setOutput }
        const dirPath = path.join(cwd, ...dir.split('/'))
        await run(core as unknown as Core, getPackageManagerStub, dirPath)

        assert.ok(
          execCalledWith(
            'npm',
            cmd => deepEquals(cmd, ['i', `axe-core@${pin}`]),
            dirPath
          )
        )
      })
    })
  })

  // Checks that getExecOutput was called with the given command, an args array
  // matching the predicate, and options { cwd: dirPath }.
  function execCalledWith(
    command: string,
    argsMatch: (args: string[]) => boolean,
    dirPath: string
  ): boolean {
    return getExecOutput.mock.calls.some(call => {
      const [cmd, args, options] = call.arguments as [
        string,
        string[] | undefined,
        { cwd?: string } | undefined
      ]
      return (
        cmd === command &&
        Array.isArray(args) &&
        argsMatch(args) &&
        options?.cwd === dirPath
      )
    })
  }
})

function deepEquals(a: unknown, b: unknown): boolean {
  try {
    assert.deepStrictEqual(a, b)
    return true
  } catch {
    return false
  }
}

async function makeTempFiles(): Promise<{ cwd: string; files: string[] }> {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'update-axe-core'))

  const files = []
  files.push(
    await createFile(cwd, 'package.json', {
      dependencies: {
        'axe-core': '^4.7.2'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/exact-pin/package.json', {
      dependencies: {
        'axe-core': '=4.7.2'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/exact-pin-no-equal/package.json', {
      dependencies: {
        'axe-core': '4.7.2'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/minor-pin/package.json', {
      dependencies: {
        'axe-core': '^4.7.2'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/patch-pin/package.json', {
      dependencies: {
        'axe-core': '~4.7.2'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/dev-dep/package.json', {
      devDependencies: {
        'axe-core': '^4.7.2'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/latest/package.json', {
      dependencies: {
        'axe-core': '^4.8.1'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/patch-behind/package.json', {
      dependencies: {
        'axe-core': '^4.8.0'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/minor-behind/package.json', {
      dependencies: {
        'axe-core': '^4.7.2'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/major-behind/package.json', {
      dependencies: {
        'axe-core': '^3.4.7'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/node_modules/module/package.json', {
      dependencies: {
        'axe-core': '^4.7.2'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/exact-pin/node_modules/dep/package.json', {
      dependencies: {
        'axe-core': '^4.7.2'
      }
    })
  )
  files.push(
    await createFile(cwd, 'packages/no-axe-core/package.json', {
      dependencies: {
        typescript: '^4.7.2'
      }
    })
  )
  files.push(await createFile(cwd, 'packages/no-deps/package.json', {}))

  return {
    cwd,
    files
  }
}

async function createFile(
  cwd: string,
  filePath: string,
  contents: string | object
): Promise<string> {
  const dirname = path.dirname(filePath)
  const name = path.basename(filePath)
  const dirPath = path.join(cwd, dirname)

  if (typeof contents !== 'string') {
    contents = JSON.stringify(contents)
  }

  await fs.mkdir(dirPath, { recursive: true })
  await fs.writeFile(path.join(dirPath, name), contents)

  return path.join(dirPath, name)
}
