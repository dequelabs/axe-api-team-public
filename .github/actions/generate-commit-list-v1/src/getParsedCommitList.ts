import getCommitType from './getCommitType'
import { GetParsedCommitListParams, ParsedCommitList } from './types'

/**
 * Parses the raw commit list into an array of commit objects.
 * @param {object} GetParsedCommitListParams Raw commit list and repository URL.
 * @returns An array of parsed commits.
 */

export default function getParsedCommitList({
  rawCommitList,
  repository
}: GetParsedCommitListParams): Array<ParsedCommitList> {
  const parsedCommits: Array<ParsedCommitList> = []

  for (const commit of rawCommitList) {
    // group sha and title together
    //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const shaAndTitle = commit.match(/^(.{7}) (.+?)(?:\s\(#\d+\))?$/)!
    const sha = shaAndTitle[1]
    const title = shaAndTitle[2]!
    const type = getCommitType(title)
    const id = commit.match(/#(\d+)/)?.[0].replace('#', '') || null
    const link = id ? `https://github.com/${repository}/pull/${id}` : null

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
