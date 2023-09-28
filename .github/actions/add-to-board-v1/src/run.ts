import type { Core, Github } from './types'
import getProjectBoardID from './getProjectBoardID'
import addIssueToBoard from './addIssueToBoard'
import getProjectBoardFieldList from './getProjectBoardFieldList'
import moveIssueToColumn from './moveIssueToColumn'

export default async function run(core: Core, github: Github): Promise<void> {
  try {
    const issueUrl = core.getInput('issue-url', { required: true })
    const projectNumber = parseInt(core.getInput('project-number'))
    const columnName = core.getInput('column-name')

    if (isNaN(projectNumber)) {
      core.setFailed('`project-number` must be a number')
      return
    }

    // the issue card ID as a result of adding the issue to the project board
    const issueCardIDs: string[] = []
    const { owner } = github.context.repo
    let issueUrls = issueUrl.includes(',') ? JSON.parse(issueUrl) : issueUrl

    if (!Array.isArray(issueUrls)) {
      issueUrls = [issueUrls]
    }

    const [{ id: projectBoardID }, { fields }] = await Promise.all([
      getProjectBoardID({ projectNumber, owner }),
      getProjectBoardFieldList({ projectNumber, owner })
    ])

    for (const url of issueUrls) {
      core.info(`\nAdding issue ${url} to project board ${projectNumber}`)

      const { id: issueCardID } = await addIssueToBoard({
        projectNumber,
        owner,
        issueUrl: url
      })

      core.info(`\nReceived issue card ID ${issueCardID}`)
      issueCardIDs.push(issueCardID)
    }

    // Status is the default field name for the project board columns e.g. Backlog, In progress, Done etc
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const statusField = fields.find(
      field => field.name.toLowerCase() === 'status'
    )!

    const column = statusField.options.find(
      option => option.name.toLowerCase() === columnName.toLowerCase()
    )

    if (!column) {
      core.setFailed(
        `\nColumn ${columnName} not found in project board ${projectNumber}`
      )
      return
    }

    for (const issueCardID of issueCardIDs) {
      core.info(`\nMoving issue card ${issueCardID} to column ${columnName}`)

      await moveIssueToColumn({
        issueCardID,
        fieldID: statusField.id,
        fieldColumnID: column.id,
        projectID: projectBoardID
      })
    }

    core.info(
      `\nSuccessfully added ${issueCardIDs.length} issue(s) to project board ${projectNumber}`
    )
  } catch (error) {
    core.setFailed(
      `Error adding issue to project board: ${(error as Error).message}`
    )
  }
}
