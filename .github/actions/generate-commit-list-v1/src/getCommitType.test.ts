import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import * as conventionalCommitsTypes from 'conventional-commit-types'
import getCommitType from './getCommitType.ts'

describe('getCommitType', () => {
  /**
   * TODO: borrowed and modified from https://github.com/dequelabs/semantic-pr-title/blob/v1/src/validate-title.test.ts#L5
   * consolidate into one repository so we can use the same parser and keep things DRY
   */
  Object.keys(conventionalCommitsTypes.types).forEach(key => {
    it(`returns true for ${key} type`, () => {
      const type = getCommitType(`${key}: pr title`)

      assert.strictEqual(type, key)
    })
  })

  it('returns true for revert commit', () => {
    const type = getCommitType(
      'Revert "fix(app): Add a Content Security Policy"'
    )

    assert.strictEqual(type, 'revert')
  })

  it('returns true for merge commit', () => {
    const type = getCommitType(
      'Merge pull request #1 from user/feature/feature-name'
    )

    assert.strictEqual(type, 'merge')
  })

  it('returns true for release commit', () => {
    const type = getCommitType('Release v4.2.1')

    assert.strictEqual(type, 'release')
  })

  it('returns true for title with scope', () => {
    const type = getCommitType('fix(scope,other): fix both')

    assert.strictEqual(type, 'fix')
  })

  it('returns true for uppercase type', () => {
    const type = getCommitType('FIX: fix uppercase')

    assert.strictEqual(type, 'fix')
  })

  it('returns false for title without a colon', () => {
    const type = getCommitType('fix a bug')

    assert.strictEqual(type, null)
  })

  it('returns false for title without a whitespace after the colon', () => {
    const type = getCommitType('fix:a bug')

    assert.strictEqual(type, null)
  })

  it('returns false for invalid type', () => {
    const type = getCommitType('fixture: a bug fix')

    assert.strictEqual(type, 'fixture')
  })

  it('returns false for merge-like title', () => {
    const type = getCommitType('merge mater into develop')

    assert.strictEqual(type, null)
  })

  it('returns false for release-like title', () => {
    const type = getCommitType('release the kraken')

    assert.strictEqual(type, null)
  })

  it('returns false for revert-like title', () => {
    const type = getCommitType('revert previous commit')

    assert.strictEqual(type, null)
  })

  it('allows comma in scope', () => {
    const type = getCommitType('fix(thing1,thing2): a bug')

    assert.strictEqual(type, 'fix')
  })

  it('allows slash in scope', () => {
    const type = getCommitType('fix(path/thing1,path/thing2): a bug')

    assert.strictEqual(type, 'fix')
  })

  describe('when the commit title contains a breaking change', () => {
    describe('and is scoped', () => {
      it('returns the type with a `!`', () => {
        const type = getCommitType('feat(scope)!: a breaking change')

        assert.strictEqual(type, 'feat!')
      })
    })

    describe('and is not scoped', () => {
      it('returns the type with a `!`', () => {
        const type = getCommitType('feat!: a breaking change')

        assert.strictEqual(type, 'feat!')
      })
    })
  })

  describe('when the commit title reverts a breaking change', () => {
    it('should not have a `!` as part of the type', () => {
      const type = getCommitType('revert: feat(scope)!: a wrench was thrown')

      assert.strictEqual(type, 'revert')
    })
  })
})
