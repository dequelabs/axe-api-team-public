import type { Core, GitHub } from './types'
import getProjectBoardID from './getProjectBoardID'
import addIssueToBoard from './addIssueToBoard'
import getProjectFieldList from './getProjectFieldList'
import moveIssueToColumn from './moveIssueToColumn'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const token = core.getInput('github_token', { required: true })
    const title = core.getInput('title', { required: true })
    const body = core.getInput('body', { required: true })

    const repository = core.getInput('repository')
    const labels = core.getInput('labels')
    const assignees = core.getInput('assignees')
    /* default: 66 */
    const projectNumber = parseInt(core.getInput('project_number'))
    /* default: Backlog */
    const columnName = core.getInput('column_name')

    if (isNaN(projectNumber)) {
      core.setFailed('project_number must be a number')
      return
    }

    // default: `github.repository` is `owner/repo`, we just want the `repo`
    const repo = repository.split('/')
    const octokit = github.getOctokit(token)

    const { data: issueCreated } = await octokit.rest.issues.create({
      /**
       * Note: this assumes the action is running in the same repo as the action is being run on
       * if this proves to be a problem, we can add an input for the owner and default to `github.context.repo.owner`
       */
      owner: github.context.repo.owner,
      repo: repo[1] ?? repo[0],
      title,
      body,
      labels: labels ? labels.split(',').map(label => label.trim()) : undefined,
      assignees: assignees
        ? assignees.split(',').map(assignee => assignee.trim())
        : undefined
    })

    core.info(`\nCreated issue: ${issueCreated.html_url}`)

    const { id: projectID } = await getProjectBoardID({
      projectNumber,
      owner: github.context.repo.owner
    })

    core.info(`\nFound project board with ID: ${projectID}`)

    const { id: issueCardID } = await addIssueToBoard({
      projectNumber,
      owner: github.context.repo.owner,
      issueUrl: issueCreated.html_url
    })

    core.info(`\nAdded issue to project board with card ID: ${issueCardID}`)

    const { fields } = await getProjectFieldList({
      projectNumber,
      owner: github.context.repo.owner
    })

    // Status is the default field name for the project board columns e.g. Backlog, In progress, Done etc
    //@eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const statusColumn = fields.find(
      ({ name }) => name.toLowerCase() === 'status'
    )!

    const column = statusColumn.options.find(
      ({ name }) => name.toLowerCase() === columnName.toLowerCase()
    )

    if (!column) {
      core.setFailed(`Column ${columnName} not found`)
      return
    }

    core.info(`\nFound column ${columnName} with ID: ${column.id}`)

    await moveIssueToColumn({
      issueCardID,
      fieldID: statusColumn.id,
      fieldColumnID: column.id,
      projectID
    })

    core.info(`\nMoved issue to column ${columnName}`)
    core.info(`\nSettings output "issue_url" to ${issueCreated.html_url}`)
    core.setOutput('issue_url', issueCreated.html_url)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
