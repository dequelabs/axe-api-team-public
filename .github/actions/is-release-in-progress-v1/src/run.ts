import type { Core, Github, PullRequest } from './types'
import isReleaseInProgress from './is-release-in-progress'

export default async function run(core: Core, github: Github) {
  try {
    const githubToken = core.getInput('github-token', { required: true })

    // Fetch open pull requests
    const octokit = github.getOctokit(githubToken)
    const { data: pullRequests } = await octokit.rest.pulls.list({
      ...github.context.repo,
      state: 'open'
    })
    const result = isReleaseInProgress(pullRequests as unknown as PullRequest[])

    // Set output
    core.setOutput('is-release-in-progress', result)
    core.info(`Set is-release-in-progress output: ${result}`)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
