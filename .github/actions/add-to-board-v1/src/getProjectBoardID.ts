import { getExecOutput } from '@actions/exec'

interface GetProjectBoardIDResponse {
  id: string
}

interface GetProjectBoardIDArgs {
  projectNumber: number
  owner: string
}

export default async function getProjectBoardID({
  projectNumber,
  owner
}: GetProjectBoardIDArgs): Promise<GetProjectBoardIDResponse> {
  try {
    const { stdout: projectBoardID } = await getExecOutput(
      `gh project view ${projectNumber} --owner ${owner} --format json`
    )

    return JSON.parse(projectBoardID.trim()) as GetProjectBoardIDResponse
  } catch (error) {
    throw new Error(
      `Error getting project board ID: ${(error as Error).message}`
    )
  }
}
