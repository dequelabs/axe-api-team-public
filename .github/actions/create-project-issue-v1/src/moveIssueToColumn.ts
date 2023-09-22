import { getExecOutput } from '@actions/exec'

// TODO: Refactor .github/actions/add-to-board to use this: https://github.com/dequelabs/axe-api-team/issues/369

export interface MoveIssueToColumnResponse {
  id: string
  title: string
  body: string
  type: string
  url: string
}

interface MoveIssueToColumnArgs {
  issueCardID: string
  fieldID: string
  fieldColumnID: string
  projectID: string
}

export default async function moveIssueToColumn({
  issueCardID,
  fieldID,
  fieldColumnID,
  projectID
}: MoveIssueToColumnArgs): Promise<MoveIssueToColumnResponse> {
  try {
    const { stdout: issueMoved } = await getExecOutput(
      `gh project item-edit --id ${issueCardID} --field-id ${fieldID} --single-select-option-id ${fieldColumnID} --project-id ${projectID} --format json`
    )

    return JSON.parse(issueMoved.trim()) as MoveIssueToColumnResponse
  } catch (error) {
    throw new Error(`Error moving issue to column: ${(error as Error).message}`)
  }
}
