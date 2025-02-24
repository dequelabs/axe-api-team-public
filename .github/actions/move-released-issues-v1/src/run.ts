import type { Core, GitHub } from './types'
import getProjectBoardID from '../../add-to-board-v1/src/getProjectBoardID'
import getProjectBoardFieldList from '../../add-to-board-v1/src/getProjectBoardFieldList'
import addIssueToBoard from '../../add-to-board-v1/src/addIssueToBoard'
import moveIssueToColumn from '../../add-to-board-v1/src/moveIssueToColumn'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const issuesUrlList = core.getInput('issues-url-list', { required: true })
    const projectNumber = parseInt(
      core.getInput('project-number', { required: true })
    )
    const releaseColumn = core.getInput('release-column', { required: true })

    if (isNaN(projectNumber)) {
      core.setFailed('`project-number` must be a number')
      return
    }

    const { owner } = github.context.repo
    const [{ id: projectBoardID }, { fields }] = await Promise.all([
      getProjectBoardID({ projectNumber, owner }),
      getProjectBoardFieldList({ projectNumber, owner })
    ])

    // Status is the default field name for the project board columns e.g. Backlog, In progress, Done, etc.
    const statusField = fields.find(
      field => field.name.toLowerCase() === 'status'
    )!

    const column = statusField.options.find(
      option => option.name.toLowerCase() === releaseColumn.toLowerCase()
    )

    if (!column) {
      core.setFailed(
        `\nThe column "${releaseColumn}" is not found in the project board "${projectNumber}"`
      )
      return
    }

    for (const issueURL of JSON.parse(issuesUrlList)) {
      core.info(
        `\nAdding the issue ${issueURL} to the project board ${projectNumber}...`
      )

      const { id: issueCardID } = await addIssueToBoard({
        projectNumber,
        owner,
        issueUrl: issueURL
      })

      core.info(
        `\nMoving the issue card ${issueCardID} to the column ${releaseColumn}...`
      )

      await moveIssueToColumn({
        issueCardID,
        fieldID: statusField.id,
        fieldColumnID: column.id,
        projectID: projectBoardID
      })

      core.info(`\nSuccessfully moved issue card ${issueCardID}`)
    }

    core.info(
      `\n~~~ All issues have been successfully moved to the column  "${releaseColumn}" ~~~`
    )
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
