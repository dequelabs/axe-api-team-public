import { getExecOutput } from '@actions/exec'

/**
 * Checks if a branch exists in the current git repository.
 * @param branchName The name of the branch to check.
 * @returns A promise that resolves to a boolean indicating whether the branch exists.
 */

export default async function doesBranchExist(
  branchName: string
): Promise<boolean> {
  try {
    await getExecOutput('git', [
      'rev-parse',
      '--verify',
      `origin/${branchName}`
    ])
    return true
  } catch (error) {
    /**
     * If the branch does not exist, git will return a non-zero exit code.
     * We can catch that error and return false to indicate that the branch
     * does not exist.
     */
    return false
  }
}
