import getCommitType from './getCommitType'
import { GetParsedCommitListParams, ParsedCommitList } from './types'

/**
 * Parses the raw commit list into an array of commit objects.
 * @param {object} GetParsedCommitListParams Raw commit list and repository URL.
 * @returns An array of parsed commits.
 */

export default function getParsedCommitList({
  rawCommitList,
  repositoryURL
}: GetParsedCommitListParams): Array<ParsedCommitList> {
  const parsedCommits: Array<ParsedCommitList> = []

  for (const commit of rawCommitList) {
    /**
     * Regex to group the following:
     * 1. Commit SHA (e.g. 4d6220e) 8 characters long
     * 2. Commit message (e.g. "feat: add new feature")
     * 3. Pull request ID (e.g. #1234)
     */
    const regex = /([a-z0-9]{1,8}) (.*) \((#[0-9]*)\)/
    const commitMatches = commit.match(regex)
    const [, sha, title, id] = commitMatches!
    const idParsed = id.replace('#', '')
    const type = getCommitType(title)
    const link = `${repositoryURL}/pull/${idParsed}`

    parsedCommits.push({
      commit,
      title,
      sha,
      type,
      id: idParsed,
      link
    })
  }

  return parsedCommits
}
