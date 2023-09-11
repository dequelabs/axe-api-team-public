import { getExecOutput } from '@actions/exec'

/**
 * Gets the URL of the current git repository.
 * @returns A promise that resolves to a string containing the URL of the current git repository.
 * @throws An error if the repository URL cannot be retrieved.
 */

export default async function getRepositoryURL(): Promise<string> {
  try {
    const { stdout: repositoryURL } = await getExecOutput('git', [
      'config',
      '--get',
      'remote.origin.url'
    ])

    // remove .git from the end of the URL
    return repositoryURL.replace(/\.git$/, '')
  } catch (error) {
    throw new Error(
      `Unable to get repository URL: \n${(error as Error).message}`
    )
  }
}
