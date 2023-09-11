/**
 * Get the commit type from a commit title
 * @param title The commit title
 * @returns The commit type (e.g. feat, fix, chore, etc.)
 */

export default function getCommitType(title: string) {
  //@see https://www.conventionalcommits.org/en/v1.0.0/
  const validCommitTypes = [
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
    'test'
  ] as const

  const commitTypeRegex = new RegExp(`^(${validCommitTypes.join('|')})`)

  return title.match(commitTypeRegex)![0]
}
