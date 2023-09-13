//@see https://www.conventionalcommits.org/en/v1.0.0/
export const validCommitTypes = [
  'build',
  'chore',
  'ci',
  'docs',
  'feat',
  'fix',
  'perf',
  'refactor',
  'revert',
  'style',
  'test',
  'BREAKING CHANGE'
] as const

/**
 * Get the commit type from a commit title
 * @param title The commit title
 * @returns The commit type (e.g. feat, fix, chore, etc.)
 */

export default function getCommitType(title: string) {
  const commitTypeRegex = new RegExp(
    `^(feat\\(?.*\\)?!|${validCommitTypes.join('|')})`
  )
  const commitType = title.match(commitTypeRegex)

  // Unlikely, as we do not accept pull requests with commit titles that do not start with a valid commit type
  if (!commitType) {
    throw new Error(
      `Unable to get commit type from title "${title}". Please make sure your commit title starts with one of the following: ${validCommitTypes.join(
        ', '
      )}`
    )
  }

  // remove any "(scope)" that may be present
  return commitType[0].replace(/\(.*\)/, '')
}
