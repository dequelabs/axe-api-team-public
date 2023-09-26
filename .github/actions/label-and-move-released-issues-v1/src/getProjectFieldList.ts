import { getExecOutput } from '@actions/exec'

// TODO: Import function from once refactor https://github.com/dequelabs/axe-api-team/issues/369 is complete

interface Field {
  id: string
  name: string
  type: string
  options: Omit<Field, 'options' | 'type'>[]
}

export interface ProjectFieldListResponse {
  fields: Field[]
  totalCount: number
}

interface GetProjectFieldListArgs {
  projectNumber: number
  owner: string
}

export default async function getProjectFieldList({
  projectNumber,
  owner
}: GetProjectFieldListArgs): Promise<ProjectFieldListResponse> {
  try {
    const { stdout: fieldList } = await getExecOutput(
      `gh project field-list ${projectNumber} --owner ${owner} --format json`
    )

    return JSON.parse(fieldList.trim()) as ProjectFieldListResponse
  } catch (error) {
    throw new Error(
      `Error getting project field list: ${(error as Error).message}`
    )
  }
}
