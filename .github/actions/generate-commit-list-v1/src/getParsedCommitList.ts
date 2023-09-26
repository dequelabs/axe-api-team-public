import getCommitType from './getCommitType'
import getFallbackID from './getFallbackID'
import { GetParsedCommitListParams, ParsedCommitList } from './types'

/**
 * Parses the raw commit list into an array of commit objects.
 * @param {object} GetParsedCommitListParams Raw commit list and repository URL.
 * @returns An array of parsed commits.
 */

export default async function getParsedCommitList({
  rawCommitList,
  repository
}: GetParsedCommitListParams): Promise<Array<ParsedCommitList>> {
  const parsedCommits: Array<ParsedCommitList> = []

  for (const commit of rawCommitList) {
    /**
     * The SHA generated from `git log` isn't always 7 characters,
     * it will grow as the repo grows to keep it unique.
     * @see https://git-scm.com/book/en/v2/Git-Tools-Revision-Selection#Short-SHA-1
     */
    //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const shaAndTitle = commit.match(/^([0-9a-f]+) (.+?)(?:\s\(#\d+\))?$/)!
    const sha = shaAndTitle[1]
    const title = shaAndTitle[2]
    const type = getCommitType(title)
    const id = commit.match(/\(#(\d+)\)$/)?.[1] || (await getFallbackID(sha))
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
