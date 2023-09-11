import getCommitType from './getCommitType'
import { GetParsedCommitListParams, ParsedCommitList } from './types'

export default function getParsedCommitList({
  rawCommits,
  repositoryURL
}: GetParsedCommitListParams): Array<ParsedCommitList> {
  const parsedCommits: Array<ParsedCommitList> = []

  for (const rawCommit of rawCommits) {
    // Remove the first two characters (* and whitespace) from the raw commit string.
    const commit = rawCommit.slice(2)

    /**
     * Regex to group the following:
     * 1. sha (e.g. 4d6220e) 8 characters long
     * 2. commit message (e.g. "feat: add new feature")
     * 3. PR number (e.g. #1234)
     */
    const regex = /([a-z0-9]{1,8}) (.*) \((#[0-9]*)\)/

    const commitMatches = commit.match(regex)
    const [, sha, title, id] = commitMatches!
    const type = getCommitType(title)
    const link = `${repositoryURL}/pull/${id.replace('#', '')}`

    parsedCommits.push({
      commit,
      title,
      sha,
      type,
      id,
      link
    })
  }

  return parsedCommits
}
