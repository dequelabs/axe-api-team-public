import sinon from 'sinon'
import { assert } from 'chai'
import os from 'os'
import { promises as fs } from 'fs'
import path from 'path'
import type { Core } from './types'
import * as exec from '@actions/exec'
import run from './run'

describe('run', () => {
  let info: sinon.SinonSpy
  let setOutput: sinon.SinonSpy
  let setFailed: sinon.SinonSpy
  let getExecOutputStub: sinon.SinonStub
  let getPackageManagerStub: sinon.SinonStub
  let cwd: string
  let files: string[]

  before(async () => {
    const tmpFiles = await makeTempFiles()
    cwd = tmpFiles.cwd
    files = tmpFiles.files
  })

  beforeEach(async () => {
    info = sinon.spy()
    setOutput = sinon.spy()
    setFailed = sinon.spy()
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
    getExecOutputStub.returns({
      exitCode: 0
    })
    getExecOutputStub.onFirstCall().returns({
      exitCode: 0,
      stdout: '   4.8.1\n'
    })
    getPackageManagerStub = sinon.stub()
  })

  afterEach(() => {
    sinon.restore()
  })

  after(async () => {
    await fs.rm(cwd, { recursive: true })
  })

  it('gets latest axe-core version and trims', async () => {
    const core = { info, setOutput }
    await run(core as unknown as Core, getPackageManagerStub)

    assert.isTrue(info.calledWith('latest axe-core version 4.8.1'))
  })

  it('finds all package.json files excluding node_modules', async () => {
    const core = { info, setOutput }
    getPackageManagerStub.withArgs('./').returns('npm')
    await run(core as unknown as Core, getPackageManagerStub, cwd)

    const matchedCalls = info
      .getCalls()
      .filter(call => {
        return call.args[0].includes('package.json found in')
      })
    const pkgFiles = files.filter(path => !path.includes('node_modules'))

    assert.lengthOf(matchedCalls, 12)
    assert.equal(matchedCalls.length, pkgFiles.length)
  })

  it('skips packages without an axe-core dependency', async () => {
    const core = { info, setOutput }
    await run(
      core as unknown as Core,
      getPackageManagerStub,
      path.join(cwd, 'packages', 'no-axe-core')
    )

    assert.isTrue(info.calledWith('no axe-core dependency found, moving on...'))
  })

  it('skips packages without any dependencies', async () => {
    const core = { info, setOutput }
    await run(
      core as unknown as Core,
      getPackageManagerStub,
      path.join(cwd, 'packages', 'no-deps')
    )

    assert.isTrue(info.calledWith('no axe-core dependency found, moving on...'))
  })

  it('detects axe-core version', async () => {
    const core = { info, setOutput }
    getPackageManagerStub.withArgs('./').returns('npm')
    await run(
      core as unknown as Core,
      getPackageManagerStub,
      path.join(cwd, 'packages', 'exact-pin')
    )

    assert.isTrue(info.calledWith('current axe-core version =4.7.2'))
  })

  it('fails if anything throws', async () => {
    const core = {
      setFailed,
      info() { throw new Error('failure!') }
    }
    await run(core as unknown as Core, getPackageManagerStub)

    assert.isTrue(core.setFailed.calledWith('failure!'))
  })

  it('fails if getting axe-core version returns non-zero exit code', async () => {
    getExecOutputStub.onFirstCall().returns({
      exitCode: 1,
      stderr: 'failure!'
    })
    const core = {
      setFailed
    }
    await run(core as unknown as Core, getPackageManagerStub)

    assert.isTrue(core.setFailed.calledWith('Error getting latest axe-core version:\nfailure!'))
  })

  it('fails if axe-core install returns non-zero exit code', async () => {
    const core = { info, setFailed }
    getPackageManagerStub.withArgs('./').returns('npm')
    getExecOutputStub.onSecondCall().returns({
      exitCode: 1,
      stderr: 'failure!'
    })
    await run(
      core as unknown as Core,
      getPackageManagerStub,
      path.join(cwd, 'packages', 'exact-pin')
    )

    assert.isTrue(core.setFailed.calledWith('Error installing axe-core:\nfailure!'))
  })

  it('fails if package has an axe-core peer dependency', async () => {
    await createFile(cwd, 'packages/peer-dep/package.json', {
      peerDependencies: {
        'axe-core': '>=4.5.0'
      }
    })
    const core = { info, setFailed }
    await run(
      core as unknown as Core,
      getPackageManagerStub,
      path.join(cwd, 'packages', 'peer-dep')
    )

    assert.isTrue(core.setFailed.calledWith('axe-core peerDependencies not currently supported'))
  })

  describe('package manager', () => {
    it('gets root package manager', async () => {
      const core = { info, setOutput }
      await run(core as unknown as Core, getPackageManagerStub)

      assert.isTrue(getPackageManagerStub.calledWith('./'))
    })

    it('gets package manager from package directory', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        dirPath
      )

      assert.isTrue(getPackageManagerStub.calledWith(dirPath))
    })

    it('installs axe-core using npm in package directory', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      getPackageManagerStub.withArgs('./').returns('npm')
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        dirPath
      )

      assert.isTrue(getExecOutputStub.calledWith(
        'npm',
        [
          'i',
          '',
          sinon.match.any
        ],
        {
          cwd: dirPath
        }
      ))
    })

    it('installs axe-core using yarn in package directory', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      getPackageManagerStub.withArgs('./').returns('yarn')
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        dirPath
      )

      assert.isTrue(getExecOutputStub.calledWith(
        'yarn',
        [
          'add',
          '',
          sinon.match.any
        ],
        {
          cwd: dirPath
        }
      ))
    })

    it('uses package level package manager over root level', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      getPackageManagerStub.withArgs('./').returns('npm')
      getPackageManagerStub.withArgs(dirPath).returns('yarn')
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        dirPath
      )

      assert.isTrue(getExecOutputStub.calledWith(
        'yarn',
        [
          'add',
          '',
          sinon.match.any
        ],
        {
          cwd: dirPath
        }
      ))
    })

    it('skips packages when no package manager is detected', async () => {
      const core = { info, setOutput }
      const dirPath = path.join(cwd, 'packages', 'exact-pin')
      getPackageManagerStub.withArgs('./').returns(undefined)
      getPackageManagerStub.withArgs(dirPath).returns(undefined)
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        dirPath
      )

      assert.isTrue(info.calledWith('No package manager detected, moving on...'))
    })
  })

  describe('output', () => {
    beforeEach(() => {
      getPackageManagerStub.withArgs('./').returns('npm')
    })

    it('sets to "null" if axe-core version is up-to-date', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'latest')
      )

      assert.isTrue(info.calledWith('axe-core version is currently at latest, no update required'))
      assert.isTrue(setOutput.calledWith('commit-type', null))
    })

    it('sets to "null" if no packages contain axe-core dependencies', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'no-deps')
      )

      assert.isTrue(info.calledWith('no packages contain axe-core dependency'))
      assert.isTrue(setOutput.calledWith('commit-type', null))
    })

    it('sets to "feat" if axe-core version is major behind', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'major-behind')
      )

      assert.isTrue(setOutput.calledWith('commit-type', 'feat'))
    })

    it('sets to "feat" if axe-core version is minor behind', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'minor-behind')
      )

      assert.isTrue(setOutput.calledWith('commit-type', 'feat'))
    })

    it('sets to "fix" if axe-core version is patch behind', async () => {
      const core = { info, setOutput }
      await run(
        core as unknown as Core,
        getPackageManagerStub,
        path.join(cwd, 'packages', 'patch-behind')
      )

      assert.isTrue(setOutput.calledWith('commit-type', 'fix'))
    })
  })

  describe('matches axe-core pinning strategy', () => {
    beforeEach(() => {
      getPackageManagerStub.withArgs('./').returns('npm')
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
        await run(
          core as unknown as Core,
          getPackageManagerStub,
          dirPath
        )

        assert.isTrue(getExecOutputStub.calledWith(
          'npm',
          [
            'i',
            '',
            `axe-core@${pin}`
          ],
          {
            cwd: dirPath
          }
        ))
      })
    })
  })
})

async function makeTempFiles(): Promise<{ cwd: string, files: string[] }> {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'update-axe-core'))

  const files = []
  files.push(await createFile(cwd, 'package.json', {
    dependencies: {
      'axe-core': '^4.7.2'
    }
  }))
  files.push(await createFile(cwd, 'packages/exact-pin/package.json', {
    dependencies: {
      'axe-core': '=4.7.2'
    }
  }))
  files.push(await createFile(cwd, 'packages/exact-pin-no-equal/package.json', {
    dependencies: {
      'axe-core': '4.7.2'
    }
  }))
  files.push(await createFile(cwd, 'packages/minor-pin/package.json', {
    dependencies: {
      'axe-core': '^4.7.2'
    }
  }))
  files.push(await createFile(cwd, 'packages/patch-pin/package.json', {
    dependencies: {
      'axe-core': '~4.7.2'
    }
  }))
  files.push(await createFile(cwd, 'packages/dev-dep/package.json', {
    devDependencies: {
      'axe-core': '^4.7.2'
    }
  }))
  files.push(await createFile(cwd, 'packages/latest/package.json', {
    dependencies: {
      'axe-core': '^4.8.1'
    }
  }))
  files.push(await createFile(cwd, 'packages/patch-behind/package.json', {
    dependencies: {
      'axe-core': '^4.8.0'
    }
  }))
  files.push(await createFile(cwd, 'packages/minor-behind/package.json', {
    dependencies: {
      'axe-core': '^4.7.2'
    }
  }))
  files.push(await createFile(cwd, 'packages/major-behind/package.json', {
    dependencies: {
      'axe-core': '^3.4.7'
    }
  }))
  files.push(await createFile(cwd, 'packages/node_modules/module/package.json', {
    dependencies: {
      'axe-core': '^4.7.2'
    }
  }))
  files.push(await createFile(cwd, 'packages/exact-pin/node_modules/dep/package.json', {
    dependencies: {
      'axe-core': '^4.7.2'
    }
  }))
  files.push(await createFile(cwd, 'packages/no-axe-core/package.json', {
    dependencies: {
      'typescript': '^4.7.2'
    }
  }))
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