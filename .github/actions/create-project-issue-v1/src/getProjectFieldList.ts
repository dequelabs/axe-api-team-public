import { getExecOutput } from '@actions/exec'

// TODO: Refactor .github/actions/add-to-board to use this: https://github.com/dequelabs/axe-api-team/issues/369

interface Field {
  id: string
  name: string
  type: string
  options: Omit<Field, 'options'>[]
}

interface ProjectFieldListResponse {
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
    const { stdout: fieldList } = await getExecOutput('gh', [
      'project',
      'field-list',
      `--project-number ${projectNumber}`,
      `--owner ${owner}`,
      '--format json'
    ])

    return JSON.parse(fieldList.trim()) as ProjectFieldListResponse
  } catch (error) {
    throw new Error(
      `Error getting project field list: ${(error as Error).message}`
    )
  }
}
