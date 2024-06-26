import { getExecOutput } from '@actions/exec'

interface DoesBranchOrTagExistParams {
  branchName?: string
  tag?: string
}

/**
 * Checks if a branch or tag exists in the current git repository.
 * @param {string} branchName The name of the branch to check.
 * @param {string} tag The name of the tag to check.
 * @returns A promise that resolves to a boolean indicating whether the branch or tag exists.
 */

export default async function doesBranchOrTagExist({
  branchName,
  tag
}: DoesBranchOrTagExistParams): Promise<boolean> {
  try {
    const subCommand = tag ? tag : `origin/${branchName}`

    await getExecOutput(`git rev-parse --verify ${subCommand}`)

    return true
  } catch {
    /**
     * If the branch does not exist, git will return a non-zero exit code.
     * We can catch that error and return false to indicate that the branch
     * does not exist.
     */
    return false
  }
}
