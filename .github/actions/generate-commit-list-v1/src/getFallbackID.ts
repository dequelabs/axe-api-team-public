import { getExecOutput } from '@actions/exec'

/**
 * Fallback method to get the PR ID from the short SHA.
 *
 * @param sha the short SHA of the commit attempt to find the PR ID for
 * @returns the PR ID if found, otherwise null
 */

export default async function getFallbackID(
  sha: string
): Promise<string | null> {
  try {
    const { stdout: fallbackID } = await getExecOutput('git', [
      'ls-remote',
      'origin',
      `pull/*/head | grep ${sha} |  awk -F'/' '{print $3}'`
    ])

    const trimmedFallbackID = fallbackID.trim()
    return trimmedFallbackID ? trimmedFallbackID : null
  } catch (error) {
    /**
     * If the fallback method fails, we don't want to fail the action.
     * Instead, we'll just return null.
     */
    return null
  }
}
