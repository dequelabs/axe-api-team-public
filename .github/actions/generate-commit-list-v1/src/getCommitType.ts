import * as conventionalCommitsParser from 'conventional-commits-parser'

/**
 * Get the commit type from a commit title
 * @param title The commit title
 * @returns The commit type (e.g. feat, fix, chore, etc.)
 */

export default function getCommitType(title: string): string | null {
  /**
   * TODO: consolidate https://github.com/dequelabs/semantic-pr-title/blob/v1/src/validate-title.ts#L11
   * into one repository so we can use the same parser and keep things DRY
   */
  const { type } = conventionalCommitsParser.sync(title, {
    // parse merge commits
    mergePattern: /^Merge pull request #(\d+) from (.*)$/,
    mergeCorrespondence: ['id', 'source'],

    // allow comma and slash in scope
    headerPattern: /^(\w*)(?:\(([\w$.\-*,/ ]*)\))?!?: (.*)$/
  })

  // we allow merge, refactor, and release commits as
  // valid pr titles
  if (!type) {
    const firstWord = title.split(' ')[0]

    if (['Merge', 'Revert', 'Release'].includes(firstWord)) {
      return firstWord.toLowerCase()
    }

    return null
  }

  /**
   * conventional-commits-parser doesn't add a `!` to the type
   * if it exists, so we'll need to check the header for it,
   * excluding and revert commits
   */
  const hasBreakingSymbol =
    !title.toLowerCase().startsWith('revert') &&
    title.split(':')[0].includes('!')

  return `${type}${hasBreakingSymbol ? '!' : ''}`.toLowerCase()
}
