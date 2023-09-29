import { getExecOutput } from '@actions/exec'

interface Field {
  id: string
  name: string
  type: string
  options: Omit<Field, 'options' | 'type'>[]
}

export interface ProjectBoardFieldListResponse {
  fields: Field[]
  totalCount: number
}

interface GetProjectBoardFieldListArgs {
  projectNumber: number
  owner: string
}

export default async function getProjectBoardFieldList({
  projectNumber,
  owner
}: GetProjectBoardFieldListArgs): Promise<ProjectBoardFieldListResponse> {
  try {
    const { stdout: fieldList } = await getExecOutput(
      `gh project field-list ${projectNumber} --owner ${owner} --format json`
    )

    return JSON.parse(fieldList.trim()) as ProjectBoardFieldListResponse
  } catch (error) {
    throw new Error(
      `Error getting project field list: ${(error as Error).message}`
    )
  }
}
