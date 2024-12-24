import {
  getAnnotations,
  getImportantFilesChanged,
  getApproversCount
} from './utils'
import type { Conclusion, Core, GitHub } from './types'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    if (!github.context.payload.pull_request) {
      throw new Error(
        'This action can only be run in the context of a pull request.'
      )
    }

    const numberOfReviewers = parseInt(
      core.getInput('number-of-reviewers', { required: true }),
      10
    )
    if (isNaN(numberOfReviewers)) {
      throw new Error('number-of-reviewers input is not a number')
    }

    const token = core.getInput('token', { required: true })
    const octokit = github.getOctokit(token)
    const { owner, repo } = github.context.repo

    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: github.context.payload.pull_request.number
    })

    const changedFiles = files
      .filter(file => file.status !== 'unchanged')
      .map(file => file.filename)

    const importantFilesChanged = getImportantFilesChanged(
      core.getInput('important-files-path', {
        required: true
      }),
      changedFiles
    )

    const requiresMultipleReviewers = importantFilesChanged.length > 0
    let conclusion: Conclusion = 'neutral'

    if (requiresMultipleReviewers) {
      const { data: reviews } = await octokit.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: github.context.payload.pull_request!.number
      })

      const approvals = getApproversCount(reviews)
      conclusion = approvals < numberOfReviewers ? 'failure' : 'success'
    }

    await octokit.request('POST /repos/{owner}/{repo}/check-runs', {
      owner,
      repo,
      name: 'require-multiple-reviewers',
      head_sha: github.context.payload.pull_request!.head.sha,
      status: 'completed',
      conclusion,
      output: {
        title: 'Require Multiple Reviewers Report',
        summary: `There are important files that require ${numberOfReviewers} reviewers.`,
        text: `The following important files were changed and require at least ${numberOfReviewers} reviewers.`,
        annotations: getAnnotations(importantFilesChanged, numberOfReviewers)
      }
    })
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
