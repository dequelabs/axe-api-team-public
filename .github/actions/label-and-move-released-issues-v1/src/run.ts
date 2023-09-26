import getIssueProjectInfo from './getIssueProjectInfo'
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

    const LABEL = `VERSION: ${version}`
    const hasLabel = labels.data.some(label => label.name === LABEL)

    if (!hasLabel) {
      await octokit.rest.issues.createLabel({
        repo,
        owner,
        name: LABEL,
        color: 'FFFFFF'
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

      // Extract the URL after closes: and before the next space
      const issueURLs = [
        ...pullRequest.body.matchAll(/closes:\s?([^\s]+)/gi)
      ].map(match => match[1])

      if (!issueURLs.length) {
        continue
      }

      /**
       * Unlikely that a PR will close more than one issue e.g.
       *
       * my PR body
       * closes: https://github.com/dequelabs/axe-core/issues/123
       * closes: https://github.com/dequelabs/axe-core/issues/456
       *
       * but just in case we'll loop through all the URLs and close them
       */
      for (const issueURL of issueURLs) {
        const rawIssueNumber = issueURL.split('/').pop()

        if (!rawIssueNumber) {
          continue
        }
        const issueNumber = parseInt(rawIssueNumber)

        const status = await getIssueProjectInfo({
          owner,
          repo,
          issueNumber,
          octokit
        })

        const projectBoard =
          status.data.repository.issue.projectItems.nodes.find(
            n => n.project.title.toLowerCase() === 'axe api team board'
          )

        if (!projectBoard) {
          core.warning(`
            Could not find the API team project board for issue ${issueNumber}`)
          continue
        }

        const { name: columnNameStatus } = projectBoard.fieldValueByName

        // If the issue is not in the done or dev done column, skip it
        if (!['done', 'dev done'].includes(columnNameStatus.toLowerCase())) {
          continue
        }

        const { data: issue } = await octokit.rest.issues.get({
          repo,
          owner,
          issue_number: issueNumber
        })

        if (issue.state !== 'closed') {
          await octokit.rest.issues.update({
            repo,
            owner,
            issue_number: issueNumber,
            state: 'closed'
          })
        }

        await octokit.rest.issues.addLabels({
          repo,
          owner,
          issue_number: issueNumber,
          labels: [LABEL]
        })
      }
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
