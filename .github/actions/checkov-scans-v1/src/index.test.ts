import { execFileSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { strict as assert } from 'node:assert'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { join, resolve } from 'path'
import { tmpdir } from 'os'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const script = resolve(here, 'index.ts')
const nodeModules = resolve(here, '..', '..', '..', '..', 'node_modules')
// Resolve the tsx loader to an absolute URL here (the test runs from the
// workspace where tsx is installed). The subprocess runs with cwd set to a
// temp dir, so a bare `tsx` specifier would not resolve there.
const tsxLoader = import.meta.resolve('tsx')
const childEnv = {
  ...process.env,
  NODE_PATH: nodeModules
}
const fixtureContent = `lockfileVersion: '6.0'

settings:
  autoInstallPeers: true
  excludeLinksFromLockfile: false

dependencies:
  yaml:
    specifier: ^2.2.2
    version: 2.2.2

packages:
  /yaml@2.2.2:
    resolution: {integrity: sha512-CBKFWExMn46Foo4cldiChEzn7S7SRV+wqiluAb6xmueD/fQpY+8/XAt+5}
    engines: {node: '>= 14'}
    dev: false
`

describe('index', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'checkov-scans-test-'))
    writeFileSync(join(tmpDir, 'pnpm-lock.yaml'), fixtureContent)
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('converts pnpm-lock.yaml to package-lock.json', () => {
    execFileSync(
      process.execPath,
      ['--import', tsxLoader, script, 'pnpm-lock.yaml'],
      { cwd: tmpDir, env: childEnv }
    )

    const outputPath = join(tmpDir, 'package-lock.json')
    const lockfile = JSON.parse(readFileSync(outputPath, 'utf8'))
    assert.ok(Object.prototype.hasOwnProperty.call(lockfile, 'lockfileVersion'))
    assert.ok(Object.prototype.hasOwnProperty.call(lockfile, 'packages'))
  })

  it('exits with code 1 when no path is provided', () => {
    try {
      execFileSync(process.execPath, ['--import', tsxLoader, script], {
        cwd: tmpDir,
        stdio: 'pipe',
        env: childEnv
      })
      assert.fail('should have thrown')
    } catch (err: unknown) {
      assert.strictEqual((err as { status: number }).status, 1)
    }
  })

  it('exits with code 1 when file does not exist', () => {
    try {
      execFileSync(
        process.execPath,
        ['--import', tsxLoader, script, 'nonexistent.yaml'],
        { cwd: tmpDir, stdio: 'pipe', env: childEnv }
      )
      assert.fail('should have thrown')
    } catch (err: unknown) {
      assert.strictEqual((err as { status: number }).status, 1)
    }
  })
})
