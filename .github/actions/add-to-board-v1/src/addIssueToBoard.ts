import { getExecOutput } from '@actions/exec'

export interface AddIssueToBoardResponse {
  id: string
  title: string
  body: string
  type: string
  url: string
}

interface AddIssueToBoardArgs {
  projectNumber: number
  owner: string
  issueUrl: string
}

export default async function addIssueToBoard({
  projectNumber,
  owner,
  issueUrl
}: AddIssueToBoardArgs): Promise<AddIssueToBoardResponse> {
  try {
    const { stdout: issueAdded } = await getExecOutput(
      `gh project item-add ${projectNumber} --owner ${owner} --url ${issueUrl} --format json`
    )

    return JSON.parse(issueAdded.trim()) as AddIssueToBoardResponse
  } catch (error) {
    throw new Error(
      `Error adding issue to project board: ${(error as Error).message}`
    )
  }
}
