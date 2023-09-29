import type { CommitList, Core, GitHub } from './types'
import getIssueProjectInfo from './getIssueProjectInfo'
import getReferencedClosedIssues from './getReferencedIssues'
import getProjectBoardID from '../../add-to-board-v1/src/getProjectBoardID'
import getProjectBoardFieldList from '../../add-to-board-v1/src/getProjectBoardFieldList'
import addIssueToBoard from '../../add-to-board-v1/src/addIssueToBoard'
import moveIssueToColumn from '../../add-to-board-v1/src/moveIssueToColumn'

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

      const referenceClosedIssues = await getReferencedClosedIssues({
        owner,
        repo,
        pullRequestID: parseInt(id),
        octokit
      })

      const issueIDs =
        referenceClosedIssues.repository.pullRequest.closingIssuesReferences.nodes.map(
          n => n.number
        )

      if (!issueIDs.length) {
        core.info('\nNo issues found for commit, moving on...')
        continue
      }

      for (const issueNumber of issueIDs) {
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

    const releaseColumn = 'released'
    const [{ id: projectBoardID }, { fields }] = await Promise.all([
      getProjectBoardID({ projectNumber, owner }),
      getProjectBoardFieldList({ projectNumber, owner })
    ])

    // Status is the default field name for the project board columns e.g. Backlog, In progress, Done etc
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const statusField = fields.find(
      field => field.name.toLowerCase() === 'status'
    )!

    const column = statusField.options.find(
      option => option.name.toLowerCase() === releaseColumn
    )

    if (!column) {
      core.setFailed(
        `\nColumn ${releaseColumn} not found in project board ${projectNumber}`
      )
      return
    }

    for (const issueURL of issueURLs) {
      core.info(`\nAdding issue ${issueURL} to project board ${projectNumber}`)

      const { id: issueCardID } = await addIssueToBoard({
        projectNumber,
        owner,
        issueUrl: issueURL
      })

      core.info(`\nReceived issue card ID ${issueCardID}`)

      core.info(`\nMoving issue card ${issueCardID} to column ${releaseColumn}`)

      await moveIssueToColumn({
        issueCardID,
        fieldID: statusField.id,
        fieldColumnID: column.id,
        projectID: projectBoardID
      })

      core.info(`\nSuccessfully moved issue card ${issueCardID}`)
    }

    core.info(`\n Setting issue-urls output to: ${JSON.stringify(issueURLs)}`)
    core.setOutput('issue-urls', issueURLs.join(','))
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
