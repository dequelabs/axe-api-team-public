import 'mocha'
import { assert } from 'chai'
import installScript from './installScript'

describe('installScript', () => {
  describe('when the package manager is npm', () => {
    it('should return the correct install script', () => {
      const packageManager = 'npm'
      const pinStrategy = '='
      const latestAxeCoreVersion = '4.2.1'
      const dependencyType = ''
      const expected = ['i', 'axe-core@=4.2.1', '']
      const actual = installScript({
        packageManager,
        pinStrategy,
        latestAxeCoreVersion,
        dependencyType
      })
      assert.deepEqual(actual, expected)
    })
  })

  describe('when the package manager is yarn', () => {
    it('should return the correct install script', () => {
      const packageManager = 'yarn'
      const pinStrategy = '='
      const latestAxeCoreVersion = '4.2.1'
      const dependencyType = ''
      const expected = ['add', 'axe-core@=4.2.1']
      const actual = installScript({
        packageManager,
        pinStrategy,
        latestAxeCoreVersion,
        dependencyType
      })
      assert.deepEqual(actual, expected)
    })

    it('should return the correct install script when the dependency type is dev', () => {
      const packageManager = 'yarn'
      const pinStrategy = '='
      const latestAxeCoreVersion = '4.2.1'
      const dependencyType = '-D'
      const expected = ['add', 'axe-core@=4.2.1', '-D']
      const actual = installScript({
        packageManager,
        pinStrategy,
        latestAxeCoreVersion,
        dependencyType
      })
      assert.deepEqual(actual, expected)
    })
  })
})
