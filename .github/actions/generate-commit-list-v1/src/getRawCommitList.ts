import { getExecOutput } from '@actions/exec'
import { GetRawCommitListParams } from './types'

/**
 * Gets the raw commit list from the current git repository.
 * @param {object} GetRawCommitListParams Base and head branch names.
 * @returns A promise that resolves to a string containing the raw commit list.
 * @throws An error if the raw commit list cannot be retrieved.
 */

export default async function getRawCommitList({
  base,
  head
}: GetRawCommitListParams): Promise<string> {
  try {
    const { stdout: rawCommitList } = await getExecOutput('git log', [
      `origin/${base}..${head}`,
      '--oneline',
      '--no-merges',
      '--abbrev-commit'
    ])

    return rawCommitList
  } catch (error) {
    throw new Error(
      `Unable to get raw commit list: \n${(error as Error).message}`
    )
  }
}
