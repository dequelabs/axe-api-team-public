import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import installScript from './installScript.ts'

describe('installScript', () => {
  describe('when the package manager is npm', () => {
    it('should return the correct install script for runtime deps', () => {
      const packageManager = 'npm'
      const pinStrategy = '='
      const latestAxeCoreVersion = '4.2.1'
      const dependencyGroup = 'dependencies'
      const expected = ['i', 'axe-core@=4.2.1']
      const actual = installScript({
        packageManager,
        pinStrategy,
        latestAxeCoreVersion,
        dependencyGroup
      })
      assert.deepStrictEqual(actual, expected)
    })

    it('should return the correct install script for dev deps', () => {
      const packageManager = 'npm'
      const pinStrategy = '='
      const latestAxeCoreVersion = '4.2.1'
      const dependencyGroup = 'devDependencies'
      const expected = ['i', '-D', 'axe-core@=4.2.1']
      const actual = installScript({
        packageManager,
        pinStrategy,
        latestAxeCoreVersion,
        dependencyGroup
      })
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('when the package manager is yarn', () => {
    it('should return the correct install script for runtime deps', () => {
      const packageManager = 'yarn'
      const pinStrategy = '='
      const latestAxeCoreVersion = '4.2.1'
      const dependencyGroup = 'dependencies'
      const expected = ['add', 'axe-core@=4.2.1']
      const actual = installScript({
        packageManager,
        pinStrategy,
        latestAxeCoreVersion,
        dependencyGroup
      })
      assert.deepStrictEqual(actual, expected)
    })

    it('should return the correct install script for dev deps', () => {
      const packageManager = 'yarn'
      const pinStrategy = '='
      const latestAxeCoreVersion = '4.2.1'
      const dependencyGroup = 'devDependencies'
      const expected = ['add', '-D', 'axe-core@=4.2.1']
      const actual = installScript({
        packageManager,
        pinStrategy,
        latestAxeCoreVersion,
        dependencyGroup
      })
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('when the package manager is pnpm', () => {
    it('should return the correct install script for runtime deps', () => {
      const packageManager = 'pnpm'
      const pinStrategy = '='
      const latestAxeCoreVersion = '4.2.1'
      const dependencyGroup = 'dependencies'
      const expected = ['add', 'axe-core@=4.2.1']
      const actual = installScript({
        packageManager,
        pinStrategy,
        latestAxeCoreVersion,
        dependencyGroup
      })
      assert.deepStrictEqual(actual, expected)
    })

    it('should return the correct install script for dev deps', () => {
      const packageManager = 'pnpm'
      const pinStrategy = '='
      const latestAxeCoreVersion = '4.2.1'
      const dependencyGroup = 'devDependencies'
      const expected = ['add', '-D', 'axe-core@=4.2.1']
      const actual = installScript({
        packageManager,
        pinStrategy,
        latestAxeCoreVersion,
        dependencyGroup
      })
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('when the package manager is unsupported', () => {
    it('throws', () => {
      const packageManager = 'unknown'
      const pinStrategy = '='
      const latestAxeCoreVersion = '4.2.1'
      const dependencyGroup = 'dependencies'
      assert.throws(
        () =>
          installScript({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            packageManager: packageManager as any,
            pinStrategy,
            latestAxeCoreVersion,
            dependencyGroup
          }),
        new RegExp(`unsupported packageManager: ${packageManager}`)
      )
    })
  })
})
