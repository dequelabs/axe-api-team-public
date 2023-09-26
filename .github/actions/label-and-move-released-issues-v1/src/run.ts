import type { CommitList, Core, GitHub } from './types'
import getIssueProjectInfo from './getIssueProjectInfo'
import getProjectBoardID from './getProjectBoardID'
import getProjectFieldList from './getProjectFieldList'
import moveIssueToColumn from './moveIssueToColumn'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const commitList = core.getInput('commit-list', { required: true })
    const version = core.getInput('version', { required: true })
    const projectNumber = parseInt(core.getInput('project-number'))
    const projectBoardTitle = core.getInput('project-board-title')
    const token = core.getInput('token')

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
      await octokit.rest.issues.createLabel({
        repo,
        owner,
        name: LABEL,
        color: 'FFFFFF'
      })
    }

    const commits = JSON.parse(commitList) as CommitList[]

    core.info(`Found ${commits.length} commits`)

    for (const { id } of commits) {
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

      core.info(`Found PR #${pullRequest.number}`)

      /**
       * Unlikely that a PR will close more than one issue e.g.
       *
       * my PR body
       * closes: https://github.com/dequelabs/axe-core/issues/123
       * closes: https://github.com/dequelabs/axe-core/issues/456
       *
       * but just in case we'll loop through all the URLs and close them
       */
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

        const issueStatus = await getIssueProjectInfo({
          owner,
          repo,
          issueNumber,
          octokit
        })

        core.info(`Found stats: ${JSON.stringify(issueStatus)}`)

        const projectBoard =
          issueStatus.data.repository.issue.projectItems.nodes.find(
            n =>
              n.project.title.toLowerCase() === projectBoardTitle.toLowerCase()
          )

        if (!projectBoard) {
          core.warning(`
            Could not find the project board "${projectBoardTitle}" for issue ${issueNumber}`)
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

        const [{ id: projectID }, { fields }] = await Promise.all([
          getProjectBoardID({ projectNumber, owner }),
          getProjectFieldList({ projectNumber, owner })
        ])

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const statusColumn = fields.find(
          ({ name }) => name.toLowerCase() === 'status'
        )!

        const releaseColumn = statusColumn.options.find(
          ({ name }) => name.toLowerCase() === 'released'
        )

        if (!releaseColumn) {
          core.setFailed(
            `Could not find the "released" column in the ${projectBoardTitle} project board`
          )
          return
        }

        await moveIssueToColumn({
          issueCardID:
            issueStatus.data.repository.issue.projectItems.nodes[0].id,
          fieldID: statusColumn.id,
          fieldColumnID: releaseColumn.id,
          projectID
        })

        core.info(`Moved issue ${issueNumber} to the "released" column`)
      }
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
