import { execFileSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { expect } from 'chai'
import { join, resolve } from 'path'
import { tmpdir } from 'os'

const script = resolve(__dirname, 'index.ts')
const nodeModules = resolve(__dirname, '..', '..', '..', '..', 'node_modules')
const tsconfig = resolve(__dirname, '..', 'tsconfig.json')
const childEnv = {
  ...process.env,
  NODE_PATH: nodeModules,
  TS_NODE_PROJECT: tsconfig
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
      ['-r', 'ts-node/register', script, 'pnpm-lock.yaml'],
      { cwd: tmpDir, env: childEnv }
    )

    const outputPath = join(tmpDir, 'package-lock.json')
    const lockfile = JSON.parse(readFileSync(outputPath, 'utf8'))
    expect(lockfile).to.have.property('lockfileVersion')
    expect(lockfile).to.have.property('packages')
  })

  it('exits with code 1 when no path is provided', () => {
    try {
      execFileSync(process.execPath, ['-r', 'ts-node/register', script], {
        cwd: tmpDir,
        stdio: 'pipe',
        env: childEnv
      })
      expect.fail('should have thrown')
    } catch (err: unknown) {
      expect((err as { status: number }).status).to.equal(1)
    }
  })

  it('exits with code 1 when file does not exist', () => {
    try {
      execFileSync(
        process.execPath,
        ['-r', 'ts-node/register', script, 'nonexistent.yaml'],
        { cwd: tmpDir, stdio: 'pipe', env: childEnv }
      )
      expect.fail('should have thrown')
    } catch (err: unknown) {
      expect((err as { status: number }).status).to.equal(1)
    }
  })
})
