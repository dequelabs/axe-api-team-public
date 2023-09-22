import type { CommitList, Core, GitHub } from './types'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const commitList = core.getInput('commit-list', { required: true })
    const version = core.getInput('version', { required: true })

    const octokit = github.getOctokit(process.env.GITHUB_TOKEN as string)
    const { repo, owner } = github.context.repo
    const labels = await octokit.rest.issues.listLabelsForRepo({
      repo,
      owner
    })

    const labelPrefix = 'VERSION:'
    const hasLabel = labels.data.some(
      label => label.name === `${labelPrefix} ${version}`
    )

    if (!hasLabel) {
      await octokit.rest.issues.createLabel({
        repo,
        owner,
        name: `${labelPrefix} ${version}`,
        // TODO: ask Jennnnn or Steve about the colour
        color: '0366d6'
      })
    }

    const commmits = JSON.parse(commitList) as CommitList[]

    for (const { id } of commmits) {
      if (!id) {
        continue
      }

      const { data: pullRequest } = await octokit.rest.pulls.get({
        repo,
        owner,
        pull_number: parseInt(id)
      })

      if (!pullRequest.body) {
        continue
      }

      // Extract the issue URL from the body
      const issueURLs = [
        ...pullRequest.body.matchAll(/closes:\s?([^\s]+)/gi)
      ].map(match => match[1])

      if (!issueURLs.length) {
        continue
      }

      for (const issueURL of issueURLs) {
        const rawIssueNumber = issueURL.split('/').pop()

        if (!rawIssueNumber) {
          continue
        }

        const issueNumber = parseInt(rawIssueNumber)
        const { data: issue } = await octokit.rest.issues.get({
          repo,
          owner,
          issue_number: issueNumber
        })

        if (issue.state !== 'closed') {
          continue
        }

        await octokit.rest.issues.addLabels({
          repo,
          owner,
          issue_number: issueNumber,
          labels: [`${labelPrefix} ${version}`]
        })

        // call move issue to column here (code already done just need merged)
      }
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
