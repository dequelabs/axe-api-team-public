import { execFileSync } from 'child_process'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { expect } from 'chai'
import { resolve } from 'path'

const script = resolve(__dirname, 'index.ts')
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
  const fixturePath = resolve(__dirname, 'test-pnpm-lock.yaml')
  const outputPath = resolve(__dirname, 'package-lock.json')

  beforeEach(() => {
    writeFileSync(fixturePath, fixtureContent)
  })

  afterEach(() => {
    if (existsSync(fixturePath)) unlinkSync(fixturePath)
    if (existsSync(outputPath)) unlinkSync(outputPath)
  })

  it('converts pnpm-lock.yaml to package-lock.json', () => {
    execFileSync(
      process.execPath,
      ['-r', 'ts-node/register', script, 'test-pnpm-lock.yaml'],
      { cwd: __dirname }
    )

    expect(existsSync(outputPath)).to.equal(true)
    const lockfile = JSON.parse(readFileSync(outputPath, 'utf8'))
    expect(lockfile).to.have.property('lockfileVersion')
    expect(lockfile).to.have.property('packages')
  })

  it('exits with code 1 when no path is provided', () => {
    try {
      execFileSync(process.execPath, ['-r', 'ts-node/register', script], {
        cwd: __dirname,
        stdio: 'pipe'
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
        { cwd: __dirname, stdio: 'pipe' }
      )
      expect.fail('should have thrown')
    } catch (err: unknown) {
      expect((err as { status: number }).status).to.equal(1)
    }
  })
})
