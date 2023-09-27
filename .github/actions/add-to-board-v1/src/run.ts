import type { Core, Github } from './types'
import getProjectBoardID from './getProjectBoardID'
import addIssueToBoard from './addIssueToBoard'
import getProjectBoardFieldList from './getProjectBoardFieldList'
import moveIssueToColumn from './moveIssueToColumn'

export default async function run(core: Core, github: Github): Promise<void> {
  try {
    const issueUrl = core.getInput('issue-url')
    const projectNumber = parseInt(core.getInput('project-number'))
    const columnName = core.getInput('column-name')

    if (isNaN(projectNumber)) {
      core.setFailed('`project_number` must be a number')
      return
    }

    if (!issueUrl) {
      core.setFailed('`issue_url` must be provided')
      return
    }

    // the issue card ID as a result of adding the issue to the project board
    const issueCardIDs: string[] = []
    const { owner } = github.context.repo
    let issueUrls = JSON.parse(issueUrl) as string | string[]

    if (!Array.isArray(issueUrls)) {
      issueUrls = [issueUrls]
    }

    const [{ id: projectBoardID }, { fields }] = await Promise.all([
      getProjectBoardID({ projectNumber, owner }),
      getProjectBoardFieldList({ projectNumber, owner }),
      issueUrls.map(async issueUrl => {
        const { id: issueCardID } = await addIssueToBoard({
          projectNumber,
          owner,
          issueUrl
        })

        issueCardIDs.push(issueCardID)
      })
    ])

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
        `Column ${columnName} not found in project board ${projectNumber}`
      )
      return
    }

    await Promise.all(
      issueCardIDs.map(async issueCardID => {
        await moveIssueToColumn({
          issueCardID,
          fieldID: statusField.id,
          fieldColumnID: column.id,
          projectID: projectBoardID
        })

        core.info(`Moved issue card ${issueCardID} to column ${columnName}`)
      })
    )

    core.info(
      `Successfully added ${issueCardIDs.length} issue(s) to project board ${projectNumber}`
    )
  } catch (error) {
    core.setFailed(
      `Error adding issue to project board: ${(error as Error).message}`
    )
  }
}
