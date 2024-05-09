import 'mocha'
import { assert } from 'chai'
import installScript from './installScript'

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
      assert.deepEqual(actual, expected)
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
      assert.deepEqual(actual, expected)
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
      assert.deepEqual(actual, expected)
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
      assert.deepEqual(actual, expected)
    })
  })
})
