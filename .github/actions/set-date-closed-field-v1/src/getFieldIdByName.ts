import { getOctokit } from '@actions/github'
import getProjectBoardFieldList from './getProjectBoardFieldList'

interface GetFieldIdByNameArgs {
  octokit: ReturnType<typeof getOctokit>
  owner: string
  projectNumber: number
  fieldName: string
}

export default async function getFieldIdByName({
  octokit,
  owner,
  projectNumber,
  fieldName
}: GetFieldIdByNameArgs): Promise<string | null> {
  try {
    const fields = await getProjectBoardFieldList({
      octokit,
      projectNumber,
      owner
    })
    const targetField = fields.find(
      (field: { id: string; name: string }) => field.name === fieldName
    )

    return targetField?.id || null
  } catch (error) {
    throw new Error(
      `Failed to get "${fieldName}" field ID: ${(error as Error).message}`
    )
  }
}
