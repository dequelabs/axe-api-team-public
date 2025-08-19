import { getExecOutput } from '@actions/exec'

export interface UpdateDateClosedFieldArgs {
  projectItemId: string
  fieldId: string
  date: string
  projectId: string
}

export default async function updateDateClosedField({
  projectItemId,
  fieldId,
  date,
  projectId
}: UpdateDateClosedFieldArgs): Promise<void> {
  try {
    if (!process.env.GH_TOKEN) {
      throw new Error('GH_TOKEN environment variable is required')
    }

    await getExecOutput(
      `gh project item-edit --id ${projectItemId} --field-id ${fieldId} --date ${date} --project-id ${projectId} --format json`,
      [],
      {
        env: {
          ...process.env,
          GH_TOKEN: process.env.GH_TOKEN
        }
      }
    )
  } catch (error) {
    throw new Error(
      `Failed to update DateClosed field: ${(error as Error).message}`
    )
  }
}
