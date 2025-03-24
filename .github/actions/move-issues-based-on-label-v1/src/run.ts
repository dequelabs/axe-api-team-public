import { getOctokit } from '@actions/github'
import type { Core, GitHub } from './types'
import getProjectBoardID from '../../add-to-board-v1/src/getProjectBoardID'
import getProjectBoardFieldList from '../../add-to-board-v1/src/getProjectBoardFieldList'
import getIssuesByProjectAndLabel, {
  IssueResult
} from './getIssuesByProjectAndLabel'
import moveIssueToColumn from '../../add-to-board-v1/src/moveIssueToColumn'

interface Field {
  id: string
  name: string
  type: string
  options: Omit<Field, 'options' | 'type'>[]
}

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const projectNumber = parseInt(
      core.getInput('project-number', { required: true })
    )
    const sourceColumn = core.getInput('source-column', { required: false })
    const targetColumn = core.getInput('target-column', { required: true })
    const teamLabel = core.getInput('team-label', { required: false })
    const labelPrefix = core.getInput('label-prefix', { required: true })
    const token = core.getInput('token', { required: true })

    if (isNaN(projectNumber)) {
      core.setFailed('`project-number` must be a number')
      return
    }

    const octokit: ReturnType<typeof getOctokit> = github.getOctokit(token)
    const { owner } = github.context.repo

    const [{ id: projectBoardID }, { fields }] = await Promise.all([
      getProjectBoardID({ projectNumber, owner }),
      getProjectBoardFieldList({ projectNumber, owner })
    ])

    // Status is the default field name for the project board columns e.g., Backlog, In progress, Done, etc.
    const statusField: Field = fields.find(
      field => field.name.toLowerCase() === 'status'
    )!

    const targetColumnData = statusField.options.find(
      option => option.name.toLowerCase() === targetColumn.toLowerCase()
    ) as Field

    if (!targetColumnData) {
      core.setFailed(
        `\nThe column "${targetColumn}" is not found in the project board "${projectNumber}"`
      )
      return
    }

    let sourceColumnData: Field | undefined

    if (sourceColumn) {
      sourceColumnData = statusField.options.find(
        option => option.name.toLowerCase() === sourceColumn.toLowerCase()
      ) as Field
    }

    const issues: IssueResult[] = await getIssuesByProjectAndLabel({
      core,
      owner,
      octokit,
      labelPrefix,
      projectNumber,
      statusFieldId: statusField.id,
      targetColumnId: targetColumnData.id,
      sourceColumnId: sourceColumnData?.id,
      sourceColumn,
      teamLabel
    })

    core.info(`\nFound ${issues.length} issues to move`)
    core.info(`\nStart moving issues to the "${targetColumn}" column...`)

    for (const issue of issues) {
      await moveIssueToColumn({
        issueCardID: issue.id,
        fieldID: statusField.id,
        fieldColumnID: targetColumnData.id,
        projectID: projectBoardID
      })

      core.info(`\nThe issue has been moved successfully: "${issue.url}"`)
    }

    core.info(`\nAll ${issues.length} issues have been moved successfully`)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
