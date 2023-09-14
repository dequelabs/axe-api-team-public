import type { Core, Github } from './types'
import isReleaseInProgress from './is-release-in-progress'

export default async function run(core: Core, github: Github) {
  try {
    const githubToken = core.getInput('githubToken', { required: true })

    // Fetch open pull requests
    const octokit = github.getOctokit(githubToken)
    const { data: pullRequests } = await octokit.rest.pulls.list({
      ...github.context.repo,
      state: 'open'
    })

    // Set output
    core.setOutput('isReleaseInProgress', isReleaseInProgress(pullRequests))
    core.info('Set isReleaseInProgress output')
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}