import { getExecOutput } from '@actions/exec'
import { GetRawCommitListParams } from './types'

/**
 * Gets the raw commit list from the current git repository.
 * @param {object} GetRawCommitListParams Base and head branch names.
 * @returns A promise that resolves to a string containing the raw commit list.
 * @throws An error if the raw commit list cannot be retrieved.
 */

export default async function getRawCommits({
  base,
  head
}: GetRawCommitListParams): Promise<string> {
  try {
    const { stdout: rawCommits } = await getExecOutput('git log', [
      `origin/${base}..${head}`,
      '--oneline',
      '--no-merges',
      '--graph',
      '--abbrev-commit'
    ])

    return rawCommits
  } catch (error) {
    throw new Error(
      `Unable to get raw commit list: \n${(error as Error).message}`
    )
  }
}
