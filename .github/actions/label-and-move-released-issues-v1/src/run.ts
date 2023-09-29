import type { CommitList, Core, GitHub } from './types'
import getIssueProjectInfo from './getIssueProjectInfo'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const commitList = core.getInput('commit-list', { required: true })
    const version = core.getInput('version', { required: true })
    const token = core.getInput('github-token', { required: true })
    const projectNumber = parseInt(core.getInput('project-number'))

    if (isNaN(projectNumber)) {
      core.setFailed('`project-number` must be a number')
      return
    }

    const octokit = github.getOctokit(token)
    const { repo, owner } = github.context.repo
    const labels = await octokit.rest.issues.listLabelsForRepo({
      repo,
      owner
    })

    core.info(`Found ${labels.data.length} labels`)

    const LABEL = `VERSION: ${version}`
    const hasLabel = labels.data.some(label => label.name === LABEL)

    if (!hasLabel) {
      core.info(`Label "${LABEL}" does not exist, creating...`)
      await octokit.rest.issues.createLabel({
        repo,
        owner,
        name: LABEL,
        color: 'FFFFFF'
      })
    }

    /**
     * Each confirmed issue URL will be stored here. We'll use this to
     * update the issue column in add-to-board action via composite run steps
     */
    const issueURLs: string[] = []

    const commits = JSON.parse(commitList) as CommitList[]
    core.info(`Found ${commits.length} commits`)

    for (const { id } of commits) {
      if (!id) {
        core.info('\nNo PR found for commit, moving on...')
        continue
      }

      const { data: pullRequest } = await octokit.rest.pulls.get({
        repo,
        owner,
        pull_number: parseInt(id)
      })

      if (!pullRequest.body) {
        core.info(
          `\nNo PR body found for PR #${pullRequest.number}, moving on...`
        )
        continue
      }

      core.info(`Found PR #${pullRequest.number}`)

      /**
       * Just in case the PR body has multiple URLs like:
       *
       * my PR body
       * closes: https://github.com/dequelabs/axe-core/issues/123
       * closes: https://github.com/dequelabs/axe-core/issues/456
       *
       * We'll get all the closed URLS.
       */
      const issueURLsMatched = [
        ...pullRequest.body.matchAll(/closes:\s?([^\s]+)/gi)
      ].map(match => match[1])

      if (!issueURLsMatched.length) {
        core.info(`\nNo issues found in PR body, moving on...`)
        continue
      }

      for (const issueURL of issueURLsMatched) {
        const rawIssueNumber = issueURL.split('/').pop()

        if (!rawIssueNumber) {
          core.info(
            `\nCould not find issue number in URL: ${issueURL}, moving on...`
          )
          continue
        }
        const issueNumber = parseInt(rawIssueNumber)
        core.info(
          `\nFetching project board info for: ${owner}, ${repo}, issue: ${issueNumber} for project: ${projectNumber}`
        )

        const issueStatus = await getIssueProjectInfo({
          owner,
          repo,
          issueNumber,
          octokit
        })

        core.info(`Found stats: ${JSON.stringify(issueStatus)}`)

        const projectBoard =
          issueStatus.repository.issue.projectItems.nodes.find(
            n => n.project.number === projectNumber
          )

        if (!projectBoard) {
          core.warning(`
            Could not find the project board "${projectNumber}" for issue ${issueNumber}, moving on...`)
          continue
        }

        const { name: columnNameStatus } = projectBoard.fieldValueByName

        // If the issue is not in the done or dev done column, move on
        if (!['done', 'dev done'].includes(columnNameStatus.toLowerCase())) {
          core.info(
            `\nIssue ${issueNumber} is not in the "done" or "dev done" column, moving on...`
          )
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

        octokit.rest.issues.addLabels({
          repo,
          owner,
          issue_number: issueNumber,
          labels: [LABEL]
        })

        issueURLs.push(issue.html_url)
      }
    }

    core.info(`\n Setting issue-urls output to: ${JSON.stringify(issueURLs)}`)
    core.setOutput('issue-urls', issueURLs.join(','))
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
